const express = require('express');
const os = require('os');
const path = require('path');
const { WebSocketServer } = require('ws');
const { moveCursor, scroll, click } = require('./mouse');

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, '..', 'public')));

// Cartes réseau virtuelles à ignorer (WSL, VirtualBox, VPN…)
const IGNORED = /vEthernet|VirtualBox|VMware|Tailscale|Loopback/i;

// Renvoie les adresses du réseau local, ex. [{ name: 'Wi-Fi', address: '192.168.1.15' }]
function getLocalIPs() {
  const ips = [];
  for (const [name, addresses] of Object.entries(os.networkInterfaces())) {
    if (IGNORED.test(name)) continue;

    for (const net of addresses) {
      const isIPv4 = net.family === 'IPv4' || net.family === 4;
      if (isIPv4 && !net.internal) ips.push({ name, address: net.address });
    }
  }
  return ips;
}

// 1. On démarre le serveur HTTP et on garde la référence dans « server »
const server = app.listen(PORT, '0.0.0.0', (err) => {
  if (err) {
    console.error(`Impossible de démarrer sur le port ${PORT} :`, err.message);
    process.exit(1);
  }

  const ips = getLocalIPs();
  if (ips.length === 0) {
    console.log('Aucun réseau détecté : connecte ton ordinateur au Wi-Fi.');
    return;
  }
  console.log('TEL-MOUSE est lancé. Sur ton téléphone, ouvre :');
  for (const ip of ips) console.log(`  ${ip.name} → http://${ip.address}:${PORT}`);
});

// 2. Le serveur WebSocket se branche sur ce serveur HTTP (même port)
const wss = new WebSocketServer({ server });

wss.on('connection', (socket, req) => {
  const adresse = req.socket.remoteAddress;
  console.log(`Téléphone connecté : ${adresse}`);

  socket.on('message', (data) => {
    let msg; // déclaré AVANT le try pour exister après
    try {
      msg = JSON.parse(data.toString());
    } catch (err) {
      console.warn('Message invalide ignoré :', data.toString());
      return;
    }

    // On ne fait jamais confiance à ce qui arrive du réseau : on vérifie chaque valeur
    switch (msg?.type) { // ?. : pas de plantage si msg vaut null
      case 'move':
        if (Number.isFinite(msg.dx) && Number.isFinite(msg.dy)) moveCursor(msg.dx, msg.dy);
        break;

      case 'scroll':
        if (Number.isFinite(msg.dy)) scroll(msg.dy);
        break;

      case 'click':
        // robotjs lève une erreur (donc plante le serveur) si le bouton est invalide
        if (msg.button === 'left' || msg.button === 'right') {
          click(msg.button, msg.double === true);
        }
        break;

      default:
        console.warn('Type de message inconnu :', msg?.type);
    }
  });

  socket.on('close', () => {
    console.log(`Téléphone déconnecté : ${adresse}`);
  });
});