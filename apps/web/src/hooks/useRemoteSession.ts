import { useCallback, useEffect, useRef, useState } from 'react';
import type { ControlMessage, DeviceLocation, DeviceTelemetry, PhoneIncomingMessage } from '@ghosttouch/protocol';
import type { ConnectionState } from '../components/connection/ConnectionManager';

const configuredUrl = import.meta.env.VITE_SIGNALING_URL as string | undefined;
const defaultUrl = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.hostname}:8787`;

export function useRemoteSession() {
  const [connectionState, setConnectionState] = useState<ConnectionState>('DISCONNECTED');
  const [telemetry, setTelemetry] = useState<DeviceTelemetry | null>(null);
  const [deviceLocation, setDeviceLocation] = useState<DeviceLocation | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RTCDataChannel | null>(null);
  const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);
  const intentionalClose = useRef(false);
  const sessionId = useRef(0);
  const connectionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deviceIp = useRef<string | null>(null);

  const cleanup = useCallback((notifyServer = false) => {
    sessionId.current += 1;
    intentionalClose.current = true;
    if (connectionTimer.current) clearTimeout(connectionTimer.current);
    connectionTimer.current = null;
    if (notifyServer && socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'LEAVE_SESSION' }));
    }
    channelRef.current?.close();
    peerRef.current?.close();
    socketRef.current?.close();
    channelRef.current = null;
    peerRef.current = null;
    socketRef.current = null;
    pendingCandidates.current = [];
    deviceIp.current = null;
    setStream(null);
    setTelemetry(null);
    setDeviceLocation(null);
    setConnectionState('DISCONNECTED');
  }, []);

  useEffect(() => () => cleanup(false), [cleanup]);

  const handlePhoneMessage = useCallback((raw: string) => {
    try {
      const message = JSON.parse(raw) as PhoneIncomingMessage;
      if (message.type === 'TELEMETRY_UPDATE') setTelemetry({ ...message.payload, publicIp: deviceIp.current || message.payload.publicIp });
      if (message.type === 'LOCATION_UPDATE') setDeviceLocation(message.payload);
    } catch { setError('The phone sent an unreadable data packet.'); }
  }, []);

  const connect = useCallback(async (pin: string) => {
    cleanup(false);
    intentionalClose.current = false;
    const currentSession = sessionId.current;
    setError(null);
    setConnectionState('CONNECTING');
    connectionTimer.current = setTimeout(() => {
      if (sessionId.current !== currentSession) return;
      cleanup(false);
      setError('Connection timed out. Confirm the PIN, screen permission, and that both devices can reach signaling.');
    }, 30000);

    try {
      const socket = new WebSocket(configuredUrl || defaultUrl);
      socketRef.current = socket;
      const peer = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
      peerRef.current = peer;
      peer.addTransceiver('video', { direction: 'recvonly' });
      const channel = peer.createDataChannel('ghosttouch', { ordered: true });
      channelRef.current = channel;
      channel.onmessage = (event) => handlePhoneMessage(String(event.data));
      channel.onopen = () => {
        if (sessionId.current !== currentSession) return;
        if (connectionTimer.current) clearTimeout(connectionTimer.current);
        connectionTimer.current = null;
        setConnectionState('LIVE');
      };
      channel.onclose = () => { if (sessionId.current === currentSession && !intentionalClose.current) setConnectionState('RECONNECTING'); };
      peer.ontrack = (event) => { if (sessionId.current === currentSession) setStream(event.streams[0] || new MediaStream([event.track])); };
      peer.onconnectionstatechange = () => {
        if (sessionId.current !== currentSession) return;
        if (peer.connectionState === 'connected') {
          if (connectionTimer.current) clearTimeout(connectionTimer.current);
          connectionTimer.current = null;
          setConnectionState('LIVE');
        }
        if (peer.connectionState === 'failed' || peer.connectionState === 'disconnected') {
          setConnectionState('RECONNECTING');
          setError('The peer connection was interrupted. Check both devices and reconnect.');
        }
      };
      peer.onicecandidate = (event) => {
        if (event.candidate && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'ICE_CANDIDATE', candidate: event.candidate.toJSON() }));
        }
      };

      socket.onopen = () => socket.send(JSON.stringify({ type: 'JOIN_SESSION', pin }));
      socket.onerror = () => {
        if (sessionId.current !== currentSession) return;
        cleanup(false);
        setError(`Cannot reach signaling at ${configuredUrl || defaultUrl}. Start the signaling service and check the URL.`);
      };
      socket.onclose = () => {
        if (sessionId.current === currentSession && !intentionalClose.current) {
          cleanup(false);
          setError('Signaling disconnected. Start a new session.');
        }
      };
      socket.onmessage = async (event) => {
        if (sessionId.current !== currentSession) return;
        try {
        const message = JSON.parse(String(event.data));
        if (message.type === 'ERROR') {
          cleanup(false);
          setError(message.message || 'Pairing failed.');
          return;
        }
        if (message.type === 'SESSION_JOINED') {
          deviceIp.current = typeof message.deviceIp === 'string' ? message.deviceIp : null;
          const offer = await peer.createOffer();
          await peer.setLocalDescription(offer);
          socket.send(JSON.stringify({ type: 'OFFER', description: peer.localDescription }));
        }
        if (message.type === 'ANSWER') {
          await peer.setRemoteDescription(message.description);
          for (const candidate of pendingCandidates.current) await peer.addIceCandidate(candidate);
          pendingCandidates.current = [];
        }
        if (message.type === 'ICE_CANDIDATE' && message.candidate) {
          if (peer.remoteDescription) await peer.addIceCandidate(message.candidate);
          else pendingCandidates.current.push(message.candidate);
        }
        if (message.type === 'PEER_DISCONNECTED') {
          cleanup(false);
          setError('The phone ended the session.');
        }
        } catch (reason) {
          cleanup(false);
          setError(reason instanceof Error ? reason.message : 'Invalid signaling response.');
        }
      };
    } catch (reason) {
      cleanup(false);
      setError(reason instanceof Error ? reason.message : 'Unable to start the connection.');
    }
  }, [cleanup, handlePhoneMessage]);

  const send = useCallback((message: ControlMessage) => {
    if (channelRef.current?.readyState !== 'open') return false;
    channelRef.current.send(JSON.stringify(message));
    return true;
  }, []);

  return { connectionState, telemetry, location: deviceLocation, stream, error, connect, disconnect: () => cleanup(true), send };
}
