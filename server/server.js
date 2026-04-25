const WebSocket = require("ws");
const http = require("http");

const PORT = process.env.PORT || 3001;
const ROOM_PASSWORD = process.env.ROOM_PASSWORD || "funk2024";

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.url === "/health") {
    res.writeHead(200);
    res.end("OK");
  } else {
    res.writeHead(200);
    res.end("Walkie-Talkie Server running");
  }
});

const wss = new WebSocket.Server({ server });

// clients: Map<id, { ws, name, role }>
const clients = new Map();

function broadcast(senderId, message) {
  const json = JSON.stringify(message);
  clients.forEach((client, id) => {
    if (id !== senderId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(json);
    }
  });
}

function sendTo(targetId, message) {
  const target = clients.get(targetId);
  if (target && target.ws.readyState === WebSocket.OPEN) {
    target.ws.send(JSON.stringify(message));
  }
}

function getRoomInfo() {
  const users = [];
  clients.forEach((client, id) => {
    users.push({ id, name: client.name, role: client.role });
  });
  return users;
}

wss.on("connection", (ws) => {
  let clientId = null;

  ws.on("message", (data) => {
    let msg;
    try {
      msg = JSON.parse(data);
    } catch {
      return;
    }

    switch (msg.type) {
      case "join": {
        if (msg.password !== ROOM_PASSWORD) {
          ws.send(JSON.stringify({ type: "error", message: "Falsches Passwort" }));
          ws.close();
          return;
        }
        clientId = msg.id;
        const role = clients.size === 0 ? "admin" : "listener";
        clients.set(clientId, { ws, name: msg.name, role });
        console.log(`✅ ${msg.name} (${clientId.slice(0,4)}) beigetreten. Alle: ${[...clients.keys()].map(k=>k.slice(0,4)).join(', ')}`);

        // Confirm join to this client
        ws.send(JSON.stringify({
          type: "joined",
          id: clientId,
          role,
          users: getRoomInfo(),
        }));

        // Notify others
        broadcast(clientId, {
          type: "user_joined",
          id: clientId,
          name: msg.name,
          role,
          users: getRoomInfo(),
        });
        break;
      }

      case "leave": {
        if (clientId) {
          clients.delete(clientId);
          broadcast(clientId, {
            type: "user_left",
            id: clientId,
            users: getRoomInfo(),
          });
        }
        break;
      }

      // WebRTC signaling
      case "offer":
      case "answer":
      case "ice": {
        if (msg.to) {
          const target = clients.get(msg.to);
          console.log(`📨 ${msg.type} von ${clientId?.slice(0,4)} → ${msg.to?.slice(0,4)} (gefunden: ${!!target})`);
          if (target) {
            sendTo(msg.to, { ...msg, from: clientId });
          } else {
            console.log(`⚠️ Ziel ${msg.to} nicht gefunden! Bekannte IDs: ${[...clients.keys()].join(', ')}`);
          }
        } else {
          broadcast(clientId, { ...msg, from: clientId });
        }
        break;
      }

      case "start_speaking": {
        // Tell specific targets (or all) that someone is about to speak
        const payload = {
          type: "speaker_start",
          from: clientId,
          name: clients.get(clientId)?.name,
          targets: msg.targets, // null = all
        };
        if (msg.targets && msg.targets.length > 0) {
          msg.targets.forEach((tid) => sendTo(tid, payload));
        } else {
          broadcast(clientId, payload);
        }
        break;
      }

      case "stop_speaking": {
        const payload = {
          type: "speaker_stop",
          from: clientId,
          name: clients.get(clientId)?.name,
        };
        broadcast(clientId, payload);
        break;
      }

      case "ping": {
        ws.send(JSON.stringify({ type: "pong", users: getRoomInfo() }));
        break;
      }
    }
  });

  ws.on("close", () => {
    if (clientId && clients.has(clientId)) {
      const name = clients.get(clientId)?.name;
      clients.delete(clientId);
      broadcast(clientId, {
        type: "user_left",
        id: clientId,
        name,
        users: getRoomInfo(),
      });
    }
  });

  ws.on("error", () => {
    if (clientId) clients.delete(clientId);
  });
});

server.listen(PORT, () => {
  console.log(`✅ Walkie-Talkie Server läuft auf Port ${PORT}`);
  console.log(`🔑 Passwort: ${ROOM_PASSWORD}`);
});
