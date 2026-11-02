const express = require('express');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { WebSocketServer } = require('ws');
const { moveCursor, scroll, click } = require('./mouse');

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, '..', 'public')));

// ---------- Code d'accès ----------
// Nouveau code à chaque démarrage : 6 chiffres tirés au hasard (000000 à 999999).
// crypto.randomInt est un vrai tirage aléatoire sécurisé, contrairement à Math.random().
const CODE_ACCES = String(crypto.randomInt(0, 1000000)).padStart(6, '0');

// Protection contre ceux qui essaieraient tous les codes un par un
const ESSAIS_MAX = 5;                   // erreurs autorisées…
const DUREE_BLOCAGE = 5 * 60 * 1000;    // …avant 5 minutes de blocage
const echecs = new Map();               // adresse IP → { nombre, bloqueJusqua }

function minutesDeBlocage(ip) {
  const e = echecs.get(ip);
  if (!e || e.bloqueJusqua <= Date.now()) return 0;
  return Math.ceil((e.bloqueJusqua - Date.now()) / 60000);
}

// Enregistre une erreur et renvoie le nombre d'essais restants (0 = bloqué)
function noterEchec(ip) {
  const e = echecs.get(ip) || { nombre: 0, bloqueJusqua: 0 };
  e.nombre += 1;
  if (e.nombre >= ESSAIS_MAX) {
    e.nombre = 0;
    e.bloqueJusqua = Date.now() + DUREE_BLOCAGE;
  }
  echecs.set(ip, e);
  return minutesDeBlocage(ip) > 0 ? 0 : ESSAIS_MAX - e.nombre;
}

function envoyer(socket, message) {
  socket.send(JSON.stringify(message));
}

// ---------- Réseau ----------
// Cartes réseau virtuelles à ignorer (WSL, VirtualBox, VPN…)
const IGNORED = /vEthernet|VirtualBox|VMware|Tailscale|Loopback/i;

// Renvoie les adresses du réseau local, ex. [{ name: 'Wi-Fi', address: '192.168.1.15' }]
function getLocalIPs() {
  const ips = [];
  for (const [name, addresses] of Object.entries(os.networkInterfaces())) {
    if (IGNORED.test(name)) continue;

    for (const net of addresses) {
      if (net.mac.startsWith('0a:00:27')) continue; // carte virtuelle VirtualBox
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
  console.log(`\n  Code d'accès : ${CODE_ACCES.slice(0, 3)} ${CODE_ACCES.slice(3)}\n`);
});

// 2. Le serveur WebSocket se branche sur ce serveur HTTP (même port)
const wss = new WebSocketServer({ server });

wss.on('connection', (socket, req) => {
  const adresse = req.socket.remoteAddress;
  let autorise = false; // chaque connexion commence VERROUILLÉE
  console.log(`Téléphone connecté : ${adresse}`);

  socket.on('message', (data) => {
    let msg; // déclaré AVANT le try pour exister après
    try {
      msg = JSON.parse(data.toString());
    } catch (err) {
      console.warn('Message invalide ignoré :', data.toString());
      return;
    }

    // ---------- Tant que le code n'est pas validé : on n'accepte QUE « auth » ----------
    // C'est le serveur qui protège la souris : même un programme qui ignorerait
    // l'écran de verrouillage du téléphone ne pourrait rien faire sans le code.
    if (!autorise) {
      if (msg?.type !== 'auth') return; // tout le reste est ignoré

      const minutes = minutesDeBlocage(adresse);
      if (minutes > 0) {
        envoyer(socket, { type: 'auth', ok: false, bloque: true, minutes });
        return;
      }

      if (typeof msg.code === 'string' && msg.code === CODE_ACCES) {
        autorise = true;
        echecs.delete(adresse);
        envoyer(socket, { type: 'auth', ok: true });
        console.log(`Accès autorisé : ${adresse}`);
      } else {
        const restants = noterEchec(adresse);
        if (restants === 0) {
          envoyer(socket, { type: 'auth', ok: false, bloque: true, minutes: minutesDeBlocage(adresse) });
          console.warn(`Accès BLOQUÉ (trop d'essais) : ${adresse}`);
        } else {
          envoyer(socket, { type: 'auth', ok: false, restants });
          console.warn(`Code incorrect : ${adresse} (encore ${restants} essai(s))`);
        }
      }
      return;
    }

    // ---------- Connexion autorisée : on pilote la souris ----------
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