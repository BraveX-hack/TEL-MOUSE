// Écran de verrouillage : saisie du code à 6 chiffres affiché sur l'ordinateur.
// Ce fichier ne gère que l'affichage. pad.js lui dit quoi faire via l'objet VERROU.

const VERROU = (() => {
  const ecran = document.getElementById('verrou');
  const boite = document.getElementById('verrou-boite');
  const form = document.getElementById('verrou-form');
  const champ = document.getElementById('verrou-code');
  const bouton = document.getElementById('verrou-bouton');
  const titre = document.getElementById('verrou-titre');
  const message = document.getElementById('verrou-message');

  let quandValide = () => {}; // fonction fournie par pad.js : envoie le code au serveur

  // Le code reste en mémoire sur le téléphone : pas besoin de le retaper à chaque rechargement.
  // (try/catch : certains navigateurs bloquent localStorage, en navigation privée par exemple)
  const CLE = 'telmouse-code';
  function lireCode() {
    try { return localStorage.getItem(CLE); } catch { return null; }
  }
  function sauverCode(code) {
    try { localStorage.setItem(CLE, code); } catch { /* tant pis */ }
  }
  function oublierCode() {
    try { localStorage.removeItem(CLE); } catch { /* tant pis */ }
  }

  function changerTitre(texte, refuse) {
    titre.textContent = texte;
    titre.classList.toggle('refuse', refuse);
    boite.classList.toggle('refuse', refuse); // cadre et cadenas en rouge
  }

  // Seulement des chiffres, 6 au maximum ; envoi automatique au 6e chiffre
  champ.addEventListener('input', () => {
    champ.value = champ.value.replace(/\D/g, '').slice(0, 6);
    if (champ.value.length === 6) form.requestSubmit();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault(); // pas de rechargement de la page
    if (champ.value.length !== 6) {
      message.textContent = 'Le code contient 6 chiffres.';
      return;
    }
    bouton.disabled = true;
    message.textContent = 'Vérification…';
    quandValide(champ.value);
  });

  // ---------- Fonctions appelées par pad.js ----------

  function afficher(texte = 'Entre le code à 6 chiffres affiché sur l\'ordinateur.') {
    ecran.hidden = false;
    document.body.classList.add('verrouille');
    changerTitre('ACCÈS SÉCURISÉ', false);
    message.textContent = texte;
    bouton.disabled = false;
    champ.value = '';
    champ.focus();
  }

  function masquer() {
    ecran.hidden = true;
    document.body.classList.remove('verrouille');
    champ.blur();
  }

  // Mauvais code : « ACCÈS REFUSÉ » + secousse
  function refuser(restants) {
    ecran.hidden = false;
    changerTitre('ACCÈS REFUSÉ', true);
    message.textContent = `Code incorrect. Encore ${restants} essai${restants > 1 ? 's' : ''}.`;
    secouer();
    bouton.disabled = false;
    champ.value = '';
    champ.focus();
  }

  // Trop d'essais : le serveur refuse tout pendant quelques minutes
  function bloquer(minutes) {
    ecran.hidden = false;
    changerTitre('ACCÈS BLOQUÉ', true);
    message.textContent = `Trop d'essais. Réessaie dans ${minutes} min.`;
    secouer();
    bouton.disabled = true;
    champ.value = '';
    champ.blur();
    setTimeout(() => afficher(), minutes * 60 * 1000);
  }

  function secouer() {
    boite.classList.remove('secousse');
    void boite.offsetWidth; // force le navigateur à rejouer l'animation
    boite.classList.add('secousse');
  }

  function surValidation(fonction) {
    quandValide = fonction;
  }

  return { afficher, masquer, refuser, bloquer, surValidation, lireCode, sauverCode, oublierCode };
})();