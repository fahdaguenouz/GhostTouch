import 'dart:async';
import 'dart:convert';
import 'package:flutter/services.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

class WebRTCController {
  WebRTCController({required this.onPin, required this.onStatus, required this.onError, required this.signalingUrl});
  final void Function(String) onPin;
  final void Function(String) onStatus;
  final void Function(String) onError;
  static const _native = MethodChannel('com.ghosttouch/native');
  final String signalingUrl;
  RTCPeerConnection? _peer;
  RTCDataChannel? _channel;
  MediaStream? _screen;
  WebSocketChannel? _socket;
  StreamSubscription? _subscription;
  Timer? _timer;
  String? _observedIp;
  final List<RTCIceCandidate> _pendingCandidates = [];
  bool _hasRemoteDescription = false;
  bool _running = false;

  Future<void> start() async {
    await stop();
    final uri = Uri.tryParse(signalingUrl);
    if (uri == null || (uri.scheme != 'ws' && uri.scheme != 'wss') || uri.host.isEmpty) {
      onStatus('STOPPED');
      onError('Enter a valid ws:// or wss:// signaling URL first.');
      return;
    }
    _running = true;
    onStatus('REQUESTING PERMISSIONS');
    try {
      final locationGranted = await _native.invokeMethod<bool>('requestLocationPermission') ?? false;
      if (!locationGranted) onError('Location permission was not granted. Screen sharing can still work.');
      _screen = await navigator.mediaDevices.getDisplayMedia({'audio': false, 'video': {'frameRate': 24}});
      await _createPeer();
      onStatus('CONNECTING TO SIGNALING');
      _socket = WebSocketChannel.connect(uri);
      await _socket!.ready;
      _subscription = _socket!.stream.listen(_handleSignal,
        onError: (Object e) { if (_running) { onStatus('CONNECTION ERROR'); onError('Cannot reach $signalingUrl: $e'); } },
        onDone: () { if (_running) onStatus('SIGNALING DISCONNECTED'); });
      _sendSignal({'type': 'REGISTER_DEVICE'});
    } catch (e) {
      onStatus('STOPPED');
      onError('Could not start sharing: $e');
      await stop();
    }
  }

  Future<void> _createPeer() async {
    _pendingCandidates.clear();
    _hasRemoteDescription = false;
    _peer = await createPeerConnection({'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}], 'sdpSemantics': 'unified-plan'});
    for (final track in _screen!.getTracks()) { await _peer!.addTrack(track, _screen!); }
    _peer!.onIceCandidate = (candidate) {
      if (candidate.candidate != null) _sendSignal({'type': 'ICE_CANDIDATE', 'candidate': candidate.toMap()});
    };
    _peer!.onDataChannel = _attachDataChannel;
    _peer!.onConnectionState = (state) {
      if (state == RTCPeerConnectionState.RTCPeerConnectionStateConnected) {
        onStatus('CONNECTED — SHARING ACTIVE');
        _publishDeviceData();
      } else if (state == RTCPeerConnectionState.RTCPeerConnectionStateDisconnected || state == RTCPeerConnectionState.RTCPeerConnectionStateFailed) {
        onStatus('OPERATOR DISCONNECTED');
      }
    };
  }

  void _attachDataChannel(RTCDataChannel channel) {
    _channel = channel;
    channel.onMessage = _handleControlMessage;
    channel.onDataChannelState = (state) {
      if (state == RTCDataChannelState.RTCDataChannelOpen) {
        _publishDeviceData();
        _timer?.cancel();
        _timer = Timer.periodic(const Duration(seconds: 5), (_) => _publishDeviceData());
      }
    };
  }

  Future<void> _handleSignal(dynamic raw) async {
    try {
      final message = jsonDecode(raw as String) as Map<String, dynamic>;
      switch (message['type']) {
        case 'DEVICE_REGISTERED':
          _observedIp = message['observedIp'] as String?;
          onPin(message['pin'] as String);
          onStatus('WAITING FOR YOUR COMPUTER');
          break;
        case 'OPERATOR_JOINED':
          onStatus('COMPUTER CONNECTING');
          break;
        case 'OFFER':
          final description = message['description'] as Map<String, dynamic>;
          await _peer!.setRemoteDescription(RTCSessionDescription(description['sdp'], description['type']));
          _hasRemoteDescription = true;
          for (final candidate in _pendingCandidates) { await _peer!.addCandidate(candidate); }
          _pendingCandidates.clear();
          final answer = await _peer!.createAnswer();
          await _peer!.setLocalDescription(answer);
          _sendSignal({'type': 'ANSWER', 'description': answer.toMap()});
          break;
        case 'ICE_CANDIDATE':
          final candidate = message['candidate'] as Map<String, dynamic>?;
          if (candidate != null) {
            final ice = RTCIceCandidate(candidate['candidate'], candidate['sdpMid'], candidate['sdpMLineIndex']);
            if (_hasRemoteDescription) { await _peer!.addCandidate(ice); }
            else { _pendingCandidates.add(ice); }
          }
          break;
        case 'PEER_DISCONNECTED':
          _timer?.cancel();
          _timer = null;
          await _channel?.close();
          _channel = null;
          await _peer?.close();
          _peer = null;
          if (_running && _screen != null) await _createPeer();
          onStatus('WAITING FOR YOUR COMPUTER');
          break;
        case 'ERROR':
          onError(message['message']?.toString() ?? 'Signaling error');
      }
    } catch (e) { onError('Invalid signaling message: $e'); }
  }

  void _handleControlMessage(RTCDataChannelMessage message) {
    if (message.isBinary) return;
    try {
      final payload = jsonDecode(message.text) as Map<String, dynamic>;
      if (payload['type'] == 'TOUCH') {
        _native.invokeMethod('injectTouch', {'action': payload['action'], 'x': (payload['x'] as num).toDouble(), 'y': (payload['y'] as num).toDouble()});
      } else if (payload['type'] == 'SYSTEM_ACTION') {
        _native.invokeMethod('systemAction', {'action': payload['action']});
      }
    } catch (e) { onError('Ignored invalid control command: $e'); }
  }

  Future<void> _publishDeviceData() async {
    if (_channel?.state != RTCDataChannelState.RTCDataChannelOpen) return;
    try {
      final snapshot = Map<String, dynamic>.from(await _native.invokeMapMethod<String, dynamic>('getDeviceSnapshot') ?? {});
      snapshot['publicIp'] = _observedIp;
      _sendData({'type': 'TELEMETRY_UPDATE', 'payload': snapshot});
      final location = await _native.invokeMapMethod<String, dynamic>('getLocation');
      if (location != null) _sendData({'type': 'LOCATION_UPDATE', 'payload': location});
    } catch (e) { onError('Could not read device information: $e'); }
  }

  Future<void> openAccessibilitySettings() => _native.invokeMethod('openAccessibilitySettings');
  void _sendSignal(Map<String, dynamic> value) => _socket?.sink.add(jsonEncode(value));
  void _sendData(Map<String, dynamic> value) => _channel?.send(RTCDataChannelMessage(jsonEncode(value)));

  Future<void> stop() async {
    _running = false;
    _timer?.cancel(); _timer = null;
    await _subscription?.cancel(); _subscription = null;
    await _socket?.sink.close(); _socket = null;
    await _channel?.close(); _channel = null;
    await _peer?.close(); _peer = null;
    for (final track in _screen?.getTracks() ?? <MediaStreamTrack>[]) { track.stop(); }
    await _screen?.dispose(); _screen = null;
  }
}
