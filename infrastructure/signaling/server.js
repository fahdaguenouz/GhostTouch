import { randomInt } from 'node:crypto';
import { WebSocket, WebSocketServer } from 'ws';

const port = Number(process.env.PORT || 8787);
const devices = new Map();
const peers = new Map();

const server = new WebSocketServer({ port });
server.on('error', (error) => {
  console.error('Signaling server failed:', error);
  process.exitCode = 1;
});

function send(socket, message) {
  if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
}

function clientIp(request) {
  const forwarded = request.headers['x-forwarded-for'];
  const raw = (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0]) || request.socket.remoteAddress || '';
  return raw.trim().replace(/^::ffff:/, '');
}

function newPin() {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const pin = String(randomInt(0, 1_000_000)).padStart(6, '0');
    if (!devices.has(pin)) return pin;
  }
  throw new Error('No session PIN available');
}

function detach(socket) {
  const pin = socket.pin;
  if (socket.role === 'device' && pin && devices.get(pin) === socket) {
    devices.delete(pin);
  }
  const peer = peers.get(socket);
  if (peer) {
    peers.delete(peer);
    peers.delete(socket);
    send(peer, { type: 'PEER_DISCONNECTED' });
  }
}

server.on('connection', (socket, request) => {
  socket.ip = clientIp(request);
  socket.isAlive = true;
  socket.on('pong', () => { socket.isAlive = true; });

  socket.on('message', (raw) => {
    let message;
    try { message = JSON.parse(raw.toString()); } catch { return send(socket, { type: 'ERROR', message: 'Invalid JSON' }); }

    if (message.type === 'REGISTER_DEVICE') {
      detach(socket);
      const pin = newPin();
      socket.role = 'device';
      socket.pin = pin;
      devices.set(pin, socket);
      return send(socket, { type: 'DEVICE_REGISTERED', pin, observedIp: socket.ip });
    }

    if (message.type === 'JOIN_SESSION') {
      const pin = String(message.pin || '');
      if (!/^\d{6}$/.test(pin)) return send(socket, { type: 'ERROR', code: 'INVALID_PIN', message: 'Enter a six-digit PIN.' });
      if (socket.role === 'device') return send(socket, { type: 'ERROR', message: 'A phone cannot join as an operator.' });
      if (peers.has(socket)) return send(socket, { type: 'ERROR', code: 'BUSY', message: 'Leave the current session before joining another.' });
      const device = devices.get(pin);
      if (!device || device.readyState !== WebSocket.OPEN) {
        return send(socket, { type: 'ERROR', code: 'PIN_NOT_FOUND', message: 'That PIN is not active. Check the phone and try again.' });
      }
      if (peers.has(device)) return send(socket, { type: 'ERROR', code: 'BUSY', message: 'This phone already has an active operator.' });
      socket.role = 'operator';
      socket.pin = pin;
      peers.set(socket, device);
      peers.set(device, socket);
      send(socket, { type: 'SESSION_JOINED', deviceIp: device.ip });
      return send(device, { type: 'OPERATOR_JOINED', operatorIp: socket.ip });
    }

    if (['OFFER', 'ANSWER', 'ICE_CANDIDATE'].includes(message.type)) {
      if (message.type === 'OFFER' && socket.role !== 'operator') return;
      if (message.type === 'ANSWER' && socket.role !== 'device') return;
      const peer = peers.get(socket);
      if (!peer) return send(socket, { type: 'ERROR', message: 'No paired peer' });
      return send(peer, message);
    }

    if (message.type === 'LEAVE_SESSION') detach(socket);
  });

  socket.on('close', () => detach(socket));
  socket.on('error', () => detach(socket));
});

const heartbeat = setInterval(() => {
  for (const socket of server.clients) {
    if (!socket.isAlive) { socket.terminate(); continue; }
    socket.isAlive = false;
    socket.ping();
  }
}, 30_000);

server.on('close', () => clearInterval(heartbeat));
console.log(`GhostTouch signaling listening on ws://0.0.0.0:${port}`);
