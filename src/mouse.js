const robot = require('@jitsi/robotjs');

// Par défaut, robotjs attend 10 ms après chaque mouvement : à 60 messages/s, le retard s'accumulerait
robot.setMouseDelay(0);

// ---------- Curseur ----------
const SENSIBILITE = 2;

// Fractions de pixel pas encore appliquées : déclarées HORS de la fonction
// pour garder leur valeur d'un appel à l'autre
let resteX = 0;
let resteY = 0;

function moveCursor(dx, dy) {
  // 1. Déplacement voulu + ce qui restait du message précédent
  const totalX = dx * SENSIBILITE + resteX;
  const totalY = dy * SENSIBILITE + resteY;

  // 2. Pixels entiers à appliquer maintenant
  const pixelsX = Math.trunc(totalX);
  const pixelsY = Math.trunc(totalY);

  // 3. On mémorise les fractions pour le prochain message
  resteX = totalX - pixelsX;
  resteY = totalY - pixelsY;

  // 4. Rien à bouger : inutile d'appeler robotjs
  if (pixelsX === 0 && pixelsY === 0) return;

  // 5. Position actuelle + déplacement
  const pos = robot.getMousePos();
  robot.moveMouse(pos.x + pixelsX, pos.y + pixelsY);
}

// ---------- Défilement ----------
// Sous Windows, 120 unités = un cran de molette
const SENSIBILITE_DEFILEMENT = 5;
let resteScroll = 0;

function scroll(dy) {
  const total = dy * SENSIBILITE_DEFILEMENT + resteScroll;
  const unites = Math.trunc(total);
  resteScroll = total - unites;

  if (unites === 0) return;     // rien à faire → on s'arrête
  robot.scrollMouse(0, unites); // doigt vers le haut (dy < 0) → la page descend
}

// ---------- Clics ----------
// button : 'left' ou 'right' ; double : true pour un double-clic
function click(button, double = false) {
  robot.mouseClick(button, double);
}

module.exports = { moveCursor, scroll, click };