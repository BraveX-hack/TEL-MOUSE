// HUD animé : les anneaux tournent, suivent le doigt et réagissent aux gestes.
// Ce fichier ne s'occupe QUE de l'affichage. pad.js l'appelle via l'objet HUD.

const HUD = (() => {
  const pad = document.getElementById('pad');
  const hud = document.getElementById('hud');
  const halo = document.getElementById('hud-halo');
  const valeurEl = document.getElementById('hud-valeur');
  const modeEl = document.getElementById('hud-mode');
  const onde = document.getElementById('hud-onde');
  const coordEl = document.getElementById('hud-coord');
  const statusEl = document.getElementById('status');

  // Chaque couche tourne EN PERMANENCE à sa vitesse de base (degrés par seconde),
  // même quand on ne touche pas l'écran. 360 °/s = un tour par seconde.
  // « reaction » : combien elle accélère avec la vitesse du doigt. Le signe donne le sens.
  const couches = [
    { id: 'c-externe',     base: 20,  reaction: 0.06 },   // un tour en 18 s
    { id: 'c-graduations', base: -30, reaction: -0.12 },  // un tour en 12 s, sens inverse
    { id: 'c-segments',    base: 12,  reaction: 0.04 },
    { id: 'c-hachures',    base: -45, reaction: -0.30, pulse: true },
    { id: 'c-tirets',      base: 90,  reaction: 0.45 },   // un tour en 4 s
    { id: 'c-coeur',       base: -60, reaction: -0.20 }
  ].map((c) => ({ ...c, el: document.getElementById(c.id), angle: 0 }));

  const VITESSE_MAX = 1500;       // px/s : au-delà, l'énergie est à 100 %

  const pos = { x: 0, y: 0 };     // position actuelle du HUD (par rapport au centre du pavé)
  const cible = { x: 0, y: 0 };   // position vers laquelle il glisse
  let echelle = 1;
  let distanceImage = 0;          // distance parcourue par le doigt depuis la dernière image
  let vitesse = 0;                // vitesse du doigt, lissée (px/s)
  let actif = false;              // un doigt est-il posé ?
  let mode = 'PRÊT';
  let messageTemporaire = null;   // texte affiché quelques instants (ex. « CLIC GAUCHE »)
  let finMessage = 0;
  let derniereImage = performance.now();

  // Position d'un doigt (coordonnées de l'écran) → position par rapport au centre du pavé
  function versCentre(x, y) {
    const r = pad.getBoundingClientRect();
    return { x: x - (r.left + r.width / 2), y: y - (r.top + r.height / 2) };
  }

  // Rapproche « actuel » de « but » : plus k est grand, plus c'est rapide.
  // Le calcul dépend du temps écoulé (dt), donc l'animation a la même vitesse à 60 et à 120 images/s.
  function lisser(actuel, but, k, dt) {
    return actuel + (but - actuel) * (1 - Math.exp(-k * dt));
  }

  // ---------- Boucle d'animation : exécutée à chaque image (~60 fois/s) ----------
  function boucle(maintenant) {
    const dt = Math.min((maintenant - derniereImage) / 1000, 0.05); // en secondes
    derniereImage = maintenant;

    // 1. Vitesse du doigt : distance de cette image / durée de l'image, puis lissage
    const vitesseInstant = dt > 0 ? distanceImage / dt : 0;
    distanceImage = 0;
    vitesse = lisser(vitesse, vitesseInstant, 8, dt);
    const energie = Math.min(vitesse / VITESSE_MAX, 1);

    // 2. Le HUD glisse vers sa cible et rétrécit un peu quand on touche
    pos.x = lisser(pos.x, cible.x, 12, dt);
    pos.y = lisser(pos.y, cible.y, 12, dt);
    echelle = lisser(echelle, actif ? 0.88 : 1, 10, dt);
    hud.style.transform =
      `translate(-50%, -50%) translate(${pos.x.toFixed(1)}px, ${pos.y.toFixed(1)}px) scale(${echelle.toFixed(3)})`;

    // « Respiration » : une onde lente entre 0 et 1 (sinus), pour que le HUD vive même au repos
    const respiration = (1 + Math.sin(maintenant / 700)) / 2;

    // 3. Chaque couche tourne, plus vite quand le doigt va vite
    for (const c of couches) {
      c.angle = (c.angle + (c.base + c.reaction * vitesse) * dt) % 360;
      const grossir = c.pulse ? 1 + respiration * 0.02 + energie * 0.06 : 1;
      c.el.style.transform = `rotate(${c.angle.toFixed(2)}deg) scale(${grossir.toFixed(3)})`;
    }

    // 4. Le halo « respire » au repos et s'illumine avec la vitesse
    halo.style.opacity = Math.min(0.25 + respiration * 0.2 + energie * 0.6, 1).toFixed(2);

    // 5. Textes du centre
    const valeur = String(Math.min(Math.round(vitesse / 10), 999)).padStart(3, '0');
    if (valeurEl.textContent !== valeur) valeurEl.textContent = valeur;

    if (messageTemporaire && maintenant > finMessage) messageTemporaire = null;
    const texteMode = messageTemporaire || mode;
    if (modeEl.textContent !== texteMode) modeEl.textContent = texteMode;

    requestAnimationFrame(boucle);
  }
  requestAnimationFrame(boucle);

  // ---------- Fonctions appelées par pad.js ----------

  // Un doigt se pose
  function toucher(x, y) {
    actif = true;
    Object.assign(cible, versCentre(x, y));
    afficherCoordonnees(x, y);
  }

  // Le doigt bouge. type : 'move' (curseur) ou 'scroll' (défilement)
  function bouger(x, y, dx, dy, type) {
    Object.assign(cible, versCentre(x, y));
    distanceImage += Math.hypot(dx, dy);

    const defilement = type === 'scroll';
    hud.classList.toggle('mode-defilement', defilement);
    mode = defilement ? 'DÉFIL.' : 'CURSEUR'; // textes courts : ils doivent tenir dans le cercle central
    afficherCoordonnees(x, y);
  }

  // Tous les doigts sont levés : retour au centre
  function relacher() {
    actif = false;
    cible.x = 0;
    cible.y = 0;
    hud.classList.remove('mode-defilement');
    mode = 'PRÊT';
  }

  // Clic : onde de choc + message au centre
  function clic(texte) {
    // Pour rejouer une animation CSS : on retire la classe, on force le navigateur
    // à recalculer (offsetWidth), puis on remet la classe
    onde.classList.remove('active');
    void onde.offsetWidth;
    onde.classList.add('active');

    messageTemporaire = texte;
    finMessage = performance.now() + 700;
    distanceImage += 400; // petite secousse : les anneaux accélèrent un instant
  }

  // État de la connexion WebSocket
  function connexion(ok) {
    hud.classList.toggle('hors-ligne', !ok);
    statusEl.classList.toggle('ko', !ok);
    statusEl.textContent = ok ? 'Liaison active' : 'Hors ligne';
  }

  function afficherCoordonnees(x, y) {
    const r = pad.getBoundingClientRect();
    const fx = String(Math.round(x - r.left)).padStart(3, '0');
    const fy = String(Math.round(y - r.top)).padStart(3, '0');
    coordEl.textContent = `X ${fx} · Y ${fy}`;
  }

  // Seules ces fonctions sont visibles de l'extérieur
  return { toucher, bouger, relacher, clic, connexion };
})();