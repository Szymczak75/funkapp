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
// pendingIce: Map<"fromId->toId", [candidates]> – gepuffert bis Offer gesendet
const pendingIce = new Map();
// offerSent: Set<"fromId->toId"> – Offer wurde bereits gesendet
const offerSent = new Set();

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
    return true;
  }
  return false;
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

        ws.send(JSON.stringify({
          type: "joined",
          id: clientId,
          role,
          users: getRoomInfo(),
        }));

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

      case "offer": {
        if (msg.to) {
          const key = `${clientId}->${msg.to}`;
          offerSent.add(key);
          console.log(`📨 offer ${clientId.slice(0,4)} → ${msg.to.slice(0,4)}`);
          sendTo(msg.to, { ...msg, from: clientId });

          // Gepufferte ICE-Kandidaten jetzt senden
          const iceKey = `${clientId}->${msg.to}`;
          if (pendingIce.has(iceKey)) {
            const candidates = pendingIce.get(iceKey);
            console.log(`📬 Sende ${candidates.length} gepufferte ICE nach Offer`);
            candidates.forEach(c => sendTo(msg.to, { type: "ice", from: clientId, to: msg.to, candidate: c }));
            pendingIce.delete(iceKey);
          }
        } else {
          broadcast(clientId, { ...msg, from: clientId });
        }
        break;
      }

      case "answer": {
        if (msg.to) {
          console.log(`📨 answer ${clientId.slice(0,4)} → ${msg.to.slice(0,4)}`);
          sendTo(msg.to, { ...msg, from: clientId });
        }
        break;
      }

      case "ice": {
        if (msg.to) {
          const key = `${clientId}->${msg.to}`;
          if (offerSent.has(key)) {
            // Offer bereits gesendet – ICE direkt weiterleiten
            sendTo(msg.to, { ...msg, from: clientId });
          } else {
            // Offer noch nicht gesendet – puffern
            if (!pendingIce.has(key)) pendingIce.set(key, []);
            pendingIce.get(key).push(msg.candidate);
            console.log(`📦 ICE gepuffert ${clientId.slice(0,4)} → ${msg.to.slice(0,4)} (${pendingIce.get(key).length})`);
          }
        } else {
          broadcast(clientId, { ...msg, from: clientId });
        }
        break;
      }

      case "start_speaking": {
        const payload = {
          type: "speaker_start",
          from: clientId,
          name: clients.get(clientId)?.name,
          targets: msg.targets,
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
      // Gepufferte ICE und Offer-Status aufräumen
      [...pendingIce.keys()].filter(k => k.includes(clientId)).forEach(k => pendingIce.delete(k));
      [...offerSent].filter(k => k.includes(clientId)).forEach(k => offerSent.delete(k));
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
