// @ts-nocheck
const WebSocket = require("ws");
const http = require("http");
const Y = require("yjs");
const { setupWSConnection } = require("y-websocket/bin/utils");

const PORT = process.env.WS_PORT || 1234;
const MAX_MESSAGE_SIZE = 1024 * 1024; // 1MB

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", connections: wss.clients.size }));
    return;
  }
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("CollabDocs WebSocket Server");
});

const wss = new WebSocket.Server({
  server,
  maxPayload: MAX_MESSAGE_SIZE,
});

wss.on("connection", (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const docName = url.pathname.slice(1) || "default";
  const token = url.searchParams.get("token");

  console.log(`[WS] Connect: doc=${docName}, auth=${token ? "jwt" : "none"}`);

  let messageCount = 0;
  let lastReset = Date.now();

  ws.on("message", (data) => {
    const now = Date.now();
    if (now - lastReset > 1000) {
      messageCount = 0;
      lastReset = now;
    }

    messageCount++;
    if (messageCount > 60) {
      console.warn(`[WS] Rate limit exceeded: doc=${docName}`);
      return; 
    }

    if (data.length > MAX_MESSAGE_SIZE) {
      console.warn(`[WS] Oversized message rejected: ${data.length} bytes`);
      return;
    }
  });

  setupWSConnection(ws, req, {
    docName,
    gc: true,
  });

  ws.on("close", () => {
    console.log(`[WS] Disconnect: doc=${docName}`);
  });

  ws.on("error", (error) => {
    console.error(`[WS] Error on doc=${docName}:`, error.message);
  });
});

setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on("connection", (ws) => {
  ws.isAlive = true;
  ws.on("pong", () => {
    ws.isAlive = true;
  });
});

server.listen(PORT, () => {
  console.log(`[CollabDocs WS] Active on port ${PORT}`);
});
