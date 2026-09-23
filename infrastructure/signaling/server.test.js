import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { test } from 'node:test';
import { WebSocket } from 'ws';

const port = 18787;
const url = `ws://127.0.0.1:${port}`;

function message(socket) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timed out waiting for WebSocket message')), 3000);
    socket.once('message', (data) => { clearTimeout(timeout); resolve(JSON.parse(String(data))); });
  });
}

async function connect() {
  const socket = new WebSocket(url);
  await once(socket, 'open');
  return socket;
}

function send(socket, value) { socket.send(JSON.stringify(value)); }

test('PIN registration, pairing, signaling relay, and disconnect', async () => {
  const server = spawn(process.execPath, ['server.js'], { cwd: import.meta.dirname, env: { ...process.env, PORT: String(port) } });
  const sockets = [];
  try {
    await new Promise((resolve, reject) => {
      server.stdout.once('data', resolve);
      server.once('error', reject);
      server.once('exit', (code) => reject(new Error(`Server exited: ${code}`)));
    });
    const phone = await connect(); sockets.push(phone);
    send(phone, { type: 'REGISTER_DEVICE' });
    const registration = await message(phone);
    assert.match(registration.pin, /^\d{6}$/);

    const wrong = await connect(); sockets.push(wrong);
    send(wrong, { type: 'JOIN_SESSION', pin: '0000000' });
    assert.equal((await message(wrong)).code, 'INVALID_PIN');

    const web = await connect(); sockets.push(web);
    send(web, { type: 'JOIN_SESSION', pin: registration.pin });
    assert.equal((await message(web)).type, 'SESSION_JOINED');
    assert.equal((await message(phone)).type, 'OPERATOR_JOINED');

    send(web, { type: 'OFFER', description: { type: 'offer', sdp: 'test-offer' } });
    assert.equal((await message(phone)).description.sdp, 'test-offer');
    send(phone, { type: 'ANSWER', description: { type: 'answer', sdp: 'test-answer' } });
    assert.equal((await message(web)).description.sdp, 'test-answer');
    send(web, { type: 'ICE_CANDIDATE', candidate: { candidate: 'test-ice' } });
    assert.equal((await message(phone)).candidate.candidate, 'test-ice');

    send(web, { type: 'LEAVE_SESSION' });
    assert.equal((await message(phone)).type, 'PEER_DISCONNECTED');
    const web2 = await connect(); sockets.push(web2);
    send(web2, { type: 'JOIN_SESSION', pin: registration.pin });
    assert.equal((await message(web2)).type, 'SESSION_JOINED');
  } finally {
    for (const socket of sockets) socket.close();
    server.kill();
  }
});
