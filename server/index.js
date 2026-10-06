import './env.js';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { Room, httpError } from './room.js';
import { listProviders } from './providers/index.js';
import { PERSONA_PRESETS, TOPIC_SUGGESTIONS } from './presets.js';
import { toMarkdown } from './export.js';
import { createStore } from './store.js';

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0'; // all interfaces so phones on the LAN can connect
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const PERSIST = process.env.PERSIST !== '0';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

/** @type {Map<string, Room>} */
const rooms = new Map();

/** roomId -> Set<WebSocket> */
const subscribers = new Map();

const store = PERSIST ? createStore(path.join(DATA_DIR, 'rooms.json')) : null;
const persist = () => store?.schedule(() => ({ version: 1, rooms: [...rooms.values()].map((r) => r.toPersisted()) }));

function broadcastRoom(roomId, payload) {
  const subs = subscribers.get(roomId);
  if (!subs?.size) return;
  const data = JSON.stringify({ roomId, ...payload });
  for (const ws of subs) if (ws.readyState === WebSocket.OPEN) ws.send(data);
}

function broadcastAll(payload) {
  const data = JSON.stringify(payload);
  for (const ws of wss.clients) if (ws.readyState === WebSocket.OPEN) ws.send(data);
}

function roomList() {
  return [...rooms.values()].map((r) => r.summary()).sort((a, b) => b.createdAt - a.createdAt);
}

function registerRoom(room) {
  rooms.set(room.id, room);
  room.on('update', (state) => {
    broadcastRoom(room.id, { type: 'room', room: state });
    broadcastAll({ type: 'rooms', rooms: roomList() });
    persist();
  });
  room.on('message', (message) => {
    broadcastRoom(room.id, { type: 'message', message });
    persist();
  });
  room.on('message:start', (message) => broadcastRoom(room.id, { type: 'message:start', message }));
  room.on('message:delta', (d) => broadcastRoom(room.id, { type: 'message:delta', ...d }));
  room.on('message:end', (message) => {
    broadcastRoom(room.id, { type: 'message:end', message });
    persist();
  });
  room.on('message:remove', (d) => broadcastRoom(room.id, { type: 'message:remove', ...d }));
  room.on('reset', () => {
    broadcastRoom(room.id, { type: 'reset' });
    persist();
  });
  broadcastAll({ type: 'rooms', rooms: roomList() });
  persist();
  return room;
}

function getRoomOr404(id) {
  const room = rooms.get(id);
  if (!room) throw httpError(404, 'Room not found');
  return room;
}

// ---------------------------------------------------------------------------
// HTTP
// ---------------------------------------------------------------------------

const app = express();
app.use(express.json({ limit: '256kb' }));
app.use(express.static(PUBLIC_DIR));

app.get('/api/providers', (_req, res) => res.json(listProviders()));
app.get('/api/presets', (_req, res) => res.json({ personas: PERSONA_PRESETS, topics: TOPIC_SUGGESTIONS }));

app.get('/api/rooms', (_req, res) => res.json(roomList()));

app.post('/api/rooms', (req, res) => {
  const { name, topic, settings, agents } = req.body ?? {};
  const room = new Room({ name, topic, settings });
  if (Array.isArray(agents)) for (const spec of agents) room.addAgent(spec);
  registerRoom(room);
  res.status(201).json(room.toJSON());
});

app.get('/api/rooms/:id', (req, res) => {
  const room = getRoomOr404(req.params.id);
  res.json({ ...room.toJSON(), messages: room.messages });
});

app.patch('/api/rooms/:id', (req, res) => {
  const room = getRoomOr404(req.params.id);
  room.update(req.body ?? {});
  res.json(room.toJSON());
});

app.delete('/api/rooms/:id', (req, res) => {
  const room = getRoomOr404(req.params.id);
  room.destroy();
  rooms.delete(room.id);
  broadcastRoom(room.id, { type: 'room:deleted' });
  subscribers.delete(room.id);
  broadcastAll({ type: 'rooms', rooms: roomList() });
  persist();
  res.status(204).end();
});

app.post('/api/rooms/:id/agents', (req, res) => {
  const room = getRoomOr404(req.params.id);
  res.status(201).json(room.addAgent(req.body ?? {}));
});

app.patch('/api/rooms/:id/agents/:agentId', (req, res) => {
  const room = getRoomOr404(req.params.id);
  res.json(room.updateAgent(req.params.agentId, req.body ?? {}));
});

app.delete('/api/rooms/:id/agents/:agentId', (req, res) => {
  const room = getRoomOr404(req.params.id);
  room.removeAgent(req.params.agentId);
  res.status(204).end();
});

app.post('/api/rooms/:id/messages', (req, res) => {
  const room = getRoomOr404(req.params.id);
  res.status(201).json(room.addHumanMessage(req.body?.content));
});

app.post('/api/rooms/:id/start', (req, res) => {
  const room = getRoomOr404(req.params.id);
  room.start();
  res.json(room.toJSON());
});

app.post('/api/rooms/:id/pause', (req, res) => {
  const room = getRoomOr404(req.params.id);
  room.pause();
  res.json(room.toJSON());
});

app.post('/api/rooms/:id/step', (req, res) => {
  const room = getRoomOr404(req.params.id);
  // Validation throws synchronously; the turn itself streams over the websocket.
  room.step().catch((err) => console.error(`[room ${room.id}] step failed:`, err.message));
  res.json(room.toJSON());
});

app.post('/api/rooms/:id/reset', (req, res) => {
  const room = getRoomOr404(req.params.id);
  room.reset();
  res.json(room.toJSON());
});

app.get('/api/rooms/:id/export', (req, res) => {
  const room = getRoomOr404(req.params.id);
  const slug = room.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'room';
  if (req.query.format === 'json') {
    res.setHeader('Content-Disposition', `attachment; filename="${slug}.json"`);
    return res.json({ ...room.toJSON(), messages: room.messages });
  }
  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${slug}.md"`);
  res.send(toMarkdown(room));
});

app.get('/api/*', (_req, res) => res.status(404).json({ error: 'Not found' }));

app.use((err, _req, res, _next) => {
  const status = err.status || (err.type === 'entity.parse.failed' ? 400 : 500);
  if (status >= 500) console.error(err);
  res.status(status).json({ error: err.message || 'Internal error' });
});

// ---------------------------------------------------------------------------
// WebSocket
// ---------------------------------------------------------------------------

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
  ws.roomId = null;
  ws.isAlive = true;
  ws.on('pong', () => (ws.isAlive = true));

  ws.send(JSON.stringify({ type: 'rooms', rooms: roomList() }));

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }
    if (msg.type === 'subscribe') {
      unsubscribe(ws);
      const room = rooms.get(msg.roomId);
      if (!room) {
        ws.send(JSON.stringify({ type: 'error', error: 'Room not found', roomId: msg.roomId }));
        return;
      }
      ws.roomId = room.id;
      if (!subscribers.has(room.id)) subscribers.set(room.id, new Set());
      subscribers.get(room.id).add(ws);
      ws.send(JSON.stringify({ type: 'snapshot', roomId: room.id, room: room.toJSON(), messages: room.messages }));
    } else if (msg.type === 'unsubscribe') {
      unsubscribe(ws);
    }
  });

  ws.on('close', () => unsubscribe(ws));
});

function unsubscribe(ws) {
  if (ws.roomId && subscribers.has(ws.roomId)) subscribers.get(ws.roomId).delete(ws);
  ws.roomId = null;
}

const heartbeat = setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  }
}, 30000);
wss.on('close', () => clearInterval(heartbeat));

// ---------------------------------------------------------------------------
// Boot: restore saved rooms, or seed a demo room so the app is not empty
// ---------------------------------------------------------------------------

function seedDemoRoom() {
  const room = new Room({
    name: 'Demo: Cars in city centres',
    topic: TOPIC_SUGGESTIONS[0],
    settings: { maxTurns: 40 },
  });
  for (const preset of PERSONA_PRESETS.slice(0, 4)) {
    room.addAgent({ ...preset, providerId: 'mock', model: 'mock-1' });
  }
  registerRoom(room);
}

function restoreRooms() {
  const saved = store?.load();
  if (!saved?.rooms?.length) return 0;
  for (const data of saved.rooms) {
    try {
      registerRoom(Room.fromPersisted(data));
    } catch (err) {
      console.error(`[store] skipping corrupt room ${data?.id}: ${err.message}`);
    }
  }
  return rooms.size;
}

const restored = restoreRooms();
if (restored === 0) seedDemoRoom();

function shutdown(signal) {
  console.log(`\n${signal} received, saving…`);
  for (const room of rooms.values()) room.pause();
  store?.flush();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1000).unref();
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

function lanAddresses() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((i) => i && i.family === 'IPv4' && !i.internal)
    .map((i) => i.address);
}

server.listen(PORT, HOST, () => {
  const configured = listProviders().filter((p) => p.configured).map((p) => p.id);
  console.log(`AI Chat Room listening on http://localhost:${PORT}`);
  const lan = lanAddresses();
  if (lan.length && HOST !== '127.0.0.1' && HOST !== 'localhost') {
    console.log(`On your phone (same Wi-Fi): ${lan.map((ip) => `http://${ip}:${PORT}`).join('  or  ')}`);
  }
  console.log(`Providers ready: ${configured.join(', ')}`);
  console.log(
    store ? `Persistence: ${restored ? `restored ${restored} room(s) from` : 'saving to'} ${store.file}` : 'Persistence: disabled (PERSIST=0)',
  );
});
