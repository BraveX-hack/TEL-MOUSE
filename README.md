# TEL-MOUSE

**Ton téléphone devient la souris de ton ordinateur.**

TEL-MOUSE transforme l'écran de ton téléphone en pavé tactile pour ton PC, sans application à installer sur le téléphone : une simple page web, reliée à l'ordinateur par le Wi-Fi. L'accès est protégé par un code à 6 chiffres.

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![WebSocket](https://img.shields.io/badge/WebSocket-ws-2EE6E6)
![Windows](https://img.shields.io/badge/Windows-10%20%7C%2011-0078D6?logo=windows&logoColor=white)

> **Démarrage rapide** : récupère le code, puis double-clique sur **`demarrer.bat`** (Windows) ou lance **`./demarrer.sh`** (macOS / Linux). Le script installe tout et démarre le serveur. Détails dans [Installation](#installation).

---

## Sommaire

- [Fonctionnalités](#fonctionnalités)
- [Comment ça marche](#comment-ça-marche)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Utilisation](#utilisation)
- [Sécurité](#sécurité)
- [Dépannage](#dépannage)
- [Structure du projet](#structure-du-projet)
- [Créer l'installateur Windows](#créer-linstallateur-windows)
- [Technologies](#technologies)

---

## Fonctionnalités

| Geste sur le téléphone | Action sur l'ordinateur |
| --- | --- |
| Glisser un doigt | Déplacer le curseur |
| Double tape | Double-clic (ouvrir un fichier, un dossier) |
| Glisser deux doigts | Faire défiler la page |
| Bouton **Clic gauche** | Clic gauche |
| Bouton **Clic droit** | Clic droit (menu contextuel) |

- **Aucune application** à installer sur le téléphone : Android ou iPhone, n'importe quel navigateur.
- **Interface HUD animée** : les anneaux tournent, suivent le doigt et accélèrent avec la vitesse du geste.
- **Code d'accès à 6 chiffres**, différent à chaque lancement.
- **Précision sous le pixel** : les mouvements lents sont pris en compte, rien n'est perdu à l'arrondi.

---

## Comment ça marche

```
 TÉLÉPHONE (navigateur)                      ORDINATEUR (Node.js)
┌────────────────────────┐   Wi-Fi local   ┌─────────────────────────────┐
│ Page web servie par    │ ──────────────► │ Express : envoie la page    │
│ Express : pavé tactile │    WebSocket    │ WebSocket : vérifie le code │
│ (gestes → messages)    │  {dx: 4, dy:-2} │ robotjs : bouge le curseur  │
└────────────────────────┘                 └─────────────────────────────┘
```

1. Le serveur Node.js démarre sur le PC et affiche une adresse et un code d'accès.
2. Le téléphone ouvre cette adresse : Express lui envoie la page du pavé tactile.
3. Une connexion **WebSocket** reste ouverte entre les deux, et chaque geste devient un petit message JSON.
4. Le serveur vérifie le code, puis déplace le vrai curseur avec **robotjs**.

---

## Prérequis

- **Windows 10 ou 11, 64 bits** (version testée).
  - macOS : fonctionne, mais il faut autoriser le terminal dans Réglages → Confidentialité et sécurité → Accessibilité.
  - Linux : fonctionne avec une session X11, pas avec Wayland.
- **Node.js 18 ou plus récent** : [nodejs.org](https://nodejs.org) (inutile si tu passes par l'installateur).
- Le **PC et le téléphone sur le même réseau Wi-Fi**.

---

## Installation

### Option A : avec l'installateur (le plus simple)

1. Télécharge `TEL-MOUSE-Setup-x.y.z.exe` dans l'onglet [Releases](https://github.com/dovononbrave5-wq/TEL-MOUSE/releases) du dépôt.
2. Lance-le. Si Windows affiche « Windows a protégé votre ordinateur », clique sur **Informations complémentaires** puis **Exécuter quand même** (l'installateur n'est pas signé numériquement).
3. Coche les raccourcis souhaités, puis **Installer**.

L'installateur embarque Node.js et configure le pare-feu Windows automatiquement.

### Option B : un seul script, de l'installation au lancement

Idéal pour un nouvel utilisateur : un seul script vérifie Node.js, installe les dépendances et lance le serveur.

**1. Récupère le code**, au choix :

- avec Git :
  ```bash
  git clone https://github.com/dovononbrave5-wq/TEL-MOUSE.git
  cd TEL-MOUSE
  ```
- sans Git : sur la page GitHub, bouton **Code → Download ZIP**, puis décompresse le fichier.

**2. Lance le script :**

| Système | Commande |
| --- | --- |
| **Windows** | Double-clic sur **`demarrer.bat`** |
| **macOS / Linux** | `./demarrer.sh` dans un terminal (la première fois : `chmod +x demarrer.sh`) |

**Ce que fait le script :**

1. **Vérifie Node.js** (version 18 ou plus). Sous Windows, s'il est absent, il l'installe automatiquement avec `winget` ; sous macOS et Linux, il indique comment l'installer.
2. **Installe les dépendances** avec `npm install` (Express, ws, robotjs). Les fois suivantes, cette étape ne prend qu'une à deux secondes ; sans Internet, le script continue avec les modules déjà installés.
3. **Lance le serveur**, qui affiche l'adresse et le code d'accès.

Pour les utilisations suivantes, relance simplement le même script.

> **Windows bloque `demarrer.bat` ?** Si tu as téléchargé le ZIP, Windows marque ses fichiers comme « provenant d'Internet ». Avant de décompresser : clic droit sur le ZIP → **Propriétés** → coche **Débloquer** → OK. Au premier lancement, autorise aussi Node.js dans la fenêtre du pare-feu.
>
> **Linux** : robotjs a besoin de la bibliothèque X11 Test (`sudo apt install libxtst6` sur Debian et Ubuntu).

### Option C : manuellement

```bash
git clone https://github.com/dovononbrave5-wq/TEL-MOUSE.git
cd TEL-MOUSE
npm install
npm start
```

`npm install` télécharge Express, ws et robotjs. Sous Windows 64 bits, robotjs est déjà compilé : aucun compilateur C++ n'est nécessaire.

---

## Utilisation

### 1. Lancer TEL-MOUSE sur le PC

- **Version installée** : raccourci **TEL-MOUSE** du menu Démarrer ou du bureau.
- **Depuis le code source** : `demarrer.bat` (Windows) ou `./demarrer.sh` (macOS / Linux), ou bien :

```bash
npm start          # lancement normal
npm run dev        # développement : redémarre à chaque modification du code
```

La fenêtre affiche l'adresse à ouvrir et le code d'accès :

```
TEL-MOUSE est lancé. Sur ton téléphone, ouvre :
  Wi-Fi → http://192.168.1.15:3000

  Code d'accès : 482 913
```

> ⚠️ Ne lance pas directement `tel-mouse.exe` dans le dossier d'installation : c'est Node.js renommé, il ouvrirait une console vide. Utilise toujours le raccourci ou `TEL-MOUSE.bat`.

### 2. Se connecter depuis le téléphone

1. Ouvre le navigateur du téléphone et tape l'adresse **complète**, avec `http://` et `:3000`.
2. Saisis le **code d'accès** affiché sur le PC.
3. C'est prêt : glisse ton doigt, le curseur suit.

Astuce : ajoute la page à l'écran d'accueil du téléphone (dans Chrome : menu ⋮ → **Ajouter à l'écran d'accueil**). Le code est mémorisé jusqu'au prochain redémarrage de TEL-MOUSE.

### 3. Arrêter

Ferme la fenêtre de TEL-MOUSE, ou appuie sur `Ctrl + C` dans le terminal.

---

## Sécurité

- Un **nouveau code à 6 chiffres** est tiré au hasard à chaque lancement (`crypto.randomInt`).
- Tant que le code n'est pas validé, **le serveur ignore tous les messages** de l'appareil : contourner l'écran de verrouillage ne donne accès à rien.
- Après **5 codes incorrects**, l'appareil est **bloqué 5 minutes**.
- Chaque valeur reçue est vérifiée (nombres, boutons autorisés) avant d'être transmise à la souris.
- Les échanges ne sont pas chiffrés (HTTP en réseau local). Sur un Wi-Fi public, préfère le **partage de connexion** de ton téléphone.

---

## Dépannage

| Problème | Solution |
| --- | --- |
| Le téléphone n'affiche rien | Le Wi-Fi du PC est sans doute en profil **Public**. Paramètres → Réseau et Internet → Wi-Fi → ton réseau → **Type de profil réseau : Privé**. |
| « Impossible de démarrer sur le port 3000 » | TEL-MOUSE ou un autre programme tourne déjà. Ferme-le, puis relance. |
| Plusieurs adresses s'affichent | Utilise celle de la carte **Wi-Fi** (souvent `192.168.x.x`). Les autres viennent de VPN ou de machines virtuelles. |
| « Ce site est inaccessible » sur un Wi-Fi d'école, d'hôtel ou d'entreprise | Ces réseaux isolent souvent les appareils entre eux. Utilise le **partage de connexion** du téléphone et connecte le PC dessus. |
| « ACCÈS BLOQUÉ » | Trop de codes faux : attends 5 minutes. |
| Le code n'est plus accepté | TEL-MOUSE a redémarré avec un nouveau code : lis celui affiché sur le PC. |
| La page ne se met pas à jour après une modification | Le navigateur garde l'ancienne version : ajoute `?v=2` à la fin de l'adresse. |
| Le curseur se fige au-dessus de certaines fenêtres | Protection de Windows : un programme normal ne peut pas piloter une fenêtre lancée en administrateur (ex. Gestionnaire des tâches). |
| Windows bloque `TEL-MOUSE.bat` | Clic droit → Propriétés → coche **Débloquer** → OK. |

---

## Structure du projet

```
TEL-MOUSE/
├── src/
│   ├── server.js        Serveur Express + WebSocket, code d'accès, adresses réseau
│   └── mouse.js         Contrôle de la souris : déplacement, défilement, clics
├── public/
│   ├── index.html       Page du téléphone
│   ├── css/style.css    Style HUD (rouge et cyan)
│   └── js/
│       ├── hud.js       Animation des anneaux
│       ├── verrou.js    Écran de saisie du code
│       └── pad.js       Gestes tactiles → messages WebSocket
├── demarrer.bat         Installation + lancement en un clic (Windows)
├── demarrer.sh          Installation + lancement en une commande (macOS / Linux)
├── tel-mouse.iss        Script de l'installateur (Inno Setup)
├── TEL-MOUSE.bat        Lanceur Windows de la version installée
├── package.json
└── .gitignore           node_modules/, dist/, installeur/, .env
```

### Messages WebSocket (téléphone → PC)

```js
{ type: 'auth',   code: '482913' }                 // obligatoire en premier
{ type: 'move',   dx: 2.4, dy: -1.1 }              // déplacement du doigt (px)
{ type: 'scroll', dy: -6 }                         // défilement à deux doigts
{ type: 'click',  button: 'left', double: true }   // 'left' ou 'right'
```

### Réglages

| Réglage | Fichier | Valeur par défaut |
| --- | --- | --- |
| Sensibilité du curseur | `src/mouse.js` → `SENSIBILITE` | `2` |
| Vitesse de défilement | `src/mouse.js` → `SENSIBILITE_DEFILEMENT` | `5` (120 = un cran de molette) |
| Port | `src/server.js` → `PORT` | `3000` |
| Essais avant blocage / durée | `src/server.js` → `ESSAIS_MAX`, `DUREE_BLOCAGE` | `5` / 5 minutes |
| Délai de la double tape | `public/js/pad.js` → `DOUBLE_TAPE_DELAI` | `300` ms |

---

## Créer l'installateur Windows

Il faut [Inno Setup](https://jrsoftware.org/isdl.php) 6.3 ou plus récent (ou `winget install JRSoftware.InnoSetup`).

**1. Préparer le dossier `dist`** (PowerShell, depuis le dossier du projet) :

```powershell
npm install
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force dist\app | Out-Null
Copy-Item package.json, src, public, node_modules -Destination dist\app -Recurse
Copy-Item (Get-Command node).Source dist\tel-mouse.exe
Copy-Item TEL-MOUSE.bat dist\
```

**2. Compiler** : ouvre `tel-mouse.iss` dans Inno Setup, puis `Ctrl + F9`.
L'installateur est créé dans `installeur\TEL-MOUSE-Setup-x.y.z.exe`.

**Nouvelle version** : augmente `MonAppVersion` en haut de `tel-mouse.iss`, refais les étapes 1 et 2. Ne change jamais `AppId` : c'est lui qui permet la mise à jour par-dessus l'ancienne version.

> Ne commite ni `dist/` ni `installeur/` (déjà dans `.gitignore`) : `tel-mouse.exe` pèse plus de 90 Mo. Publie l'installateur dans les **Releases** GitHub.

---

## Technologies

- **[Node.js](https://nodejs.org)** et **[Express 5](https://expressjs.com)** : serveur et page web
- **[ws](https://github.com/websockets/ws)** : communication en temps réel
- **[@jitsi/robotjs](https://github.com/jitsi/robotjs)** : contrôle de la souris
- **HTML, CSS, JavaScript** sans framework : interface du téléphone
- **[Inno Setup](https://jrsoftware.org/isinfo.php)** : installateur Windows

---

## Licence

Projet publié sous licence **ISC** (déclarée dans `package.json`).

## Auteur

**DOVONON Brave** · [@dovononbrave5-wq](https://github.com/dovononbrave5-wq)
