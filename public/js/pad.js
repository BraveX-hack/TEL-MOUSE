// Gestes tactiles → messages envoyés à l'ordinateur.
// L'affichage est géré par hud.js (objet HUD), chargé avant ce fichier.

const pad = document.getElementById('pad');
const btnGauche = document.getElementById('btn-gauche');
const btnDroit = document.getElementById('btn-droit');

// ---------- Connexion ----------
// location.host vaut "192.168.1.15:3000" : on se connecte au serveur qui a envoyé la page
const socket = new WebSocket(`ws://${location.host}`);

socket.addEventListener('open', () => {
  HUD.connexion(true);
});

socket.addEventListener('close', () => {
  HUD.connexion(false);
});

// Envoie un message seulement si la connexion est ouverte
function send(message) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}

// ---------- Réglages des gestes ----------
const TAPE_DUREE_MAX = 250;     // ms : au-delà, ce n'est plus une tape
const TAPE_DISTANCE_MAX = 10;   // px : au-delà, le doigt a glissé
const DOUBLE_TAPE_DELAI = 300;  // ms maximum entre les deux tapes d'une double tape

// ---------- État du geste en cours ----------
let lastX = 0;
let lastY = 0;
let debutGeste = 0;    // moment où le geste a commencé
let distance = 0;      // distance totale parcourue pendant le geste
let maxDoigts = 0;     // nombre maximum de doigts posés pendant le geste
let derniereTape = 0;  // moment de la dernière tape (pour détecter la double tape)

// targetTouches = seulement les doigts posés SUR LE PAVÉ
// (e.touches compterait aussi un doigt posé sur un bouton)

pad.addEventListener('touchstart', (e) => {
  // Tous les doigts du pavé viennent d'arriver → c'est un nouveau geste
  // (changedTouches = les doigts qui viennent de se poser)
  if (e.targetTouches.length === e.changedTouches.length) {
    debutGeste = Date.now();
    distance = 0;
    maxDoigts = 0;
  }
  maxDoigts = Math.max(maxDoigts, e.targetTouches.length);

  lastX = e.targetTouches[0].clientX;
  lastY = e.targetTouches[0].clientY;
  HUD.toucher(lastX, lastY);
});

pad.addEventListener('touchmove', (e) => {
  e.preventDefault(); // empêche le navigateur de faire défiler la page
  const doigts = e.targetTouches.length;

  // Lire, calculer, mémoriser
  const x = e.targetTouches[0].clientX;
  const y = e.targetTouches[0].clientY;
  const dx = x - lastX;
  const dy = y - lastY;
  lastX = x;
  lastY = y;
  distance += Math.hypot(dx, dy);

  if (doigts === 2) {
    // Deux doigts : défilement
    send({ type: 'scroll', dy });
    HUD.bouger(x, y, dx, dy, 'scroll');
  } else if (doigts === 1 && maxDoigts === 1) {
    // Un doigt (et il n'y en a jamais eu deux pendant ce geste) : curseur
    send({ type: 'move', dx, dy });
    HUD.bouger(x, y, dx, dy, 'move');
  }
  // Un seul doigt restant après un défilement : on ignore,
  // sinon le curseur bougerait quand on lève le premier des deux doigts
}, { passive: false });

pad.addEventListener('touchend', (e) => {
  // Il reste des doigts : le geste continue, on repart de la position du doigt restant
  if (e.targetTouches.length > 0) {
    lastX = e.targetTouches[0].clientX;
    lastY = e.targetTouches[0].clientY;
    return;
  }

  HUD.relacher();

  // Tous les doigts sont levés : le geste est terminé. Était-ce une tape ?
  const duree = Date.now() - debutGeste;
  const estUneTape = maxDoigts === 1 && duree < TAPE_DUREE_MAX && distance < TAPE_DISTANCE_MAX;
  if (!estUneTape) return;

  const maintenant = Date.now();
  if (maintenant - derniereTape < DOUBLE_TAPE_DELAI) {
    send({ type: 'click', button: 'left', double: true });
    HUD.clic('DOUBLE');
    derniereTape = 0; // une 3e tape rapide ne déclenchera pas un 2e double-clic
  } else {
    derniereTape = maintenant; // 1re tape : on attend la suivante
  }
});

// Le système peut interrompre un geste (appel entrant, notification…)
pad.addEventListener('touchcancel', () => {
  HUD.relacher();
});

// ---------- Boutons ----------
btnGauche.addEventListener('click', () => {
  send({ type: 'click', button: 'left' });
  HUD.clic('CLIC G');
});

btnDroit.addEventListener('click', () => {
  send({ type: 'click', button: 'right' });
  HUD.clic('CLIC D');
});