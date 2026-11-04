#!/usr/bin/env bash
# TEL-MOUSE : installation des dépendances et lancement du serveur (macOS / Linux)
set -u
cd "$(dirname "$0")"

echo
echo "  =============================================="
echo "    TEL-MOUSE : installation et lancement"
echo "  =============================================="
echo

# ---- 1. Node.js ----
if ! command -v node >/dev/null 2>&1; then
  echo "[1/3] Node.js n'est pas installé."
  echo "      Installe la version LTS depuis https://nodejs.org (ou : brew install node), puis relance ce script."
  exit 1
fi
NODE_MAJ=$(node -p "process.versions.node.split('.')[0]")
if [ "$NODE_MAJ" -lt 18 ]; then
  echo "[1/3] Node.js $NODE_MAJ est trop ancien : il faut la version 18 ou plus."
  exit 1
fi
echo "[1/3] Node.js $(node -v) détecté."

# ---- 2. Dépendances (rapide si elles sont déjà à jour) ----
echo "[2/3] Installation des dépendances..."
if ! npm install --no-audit --no-fund --loglevel=error; then
  if [ -d node_modules ]; then
    echo "      Mise à jour impossible (pas d'Internet ?). On continue avec les modules déjà installés."
  else
    echo "      Échec de l'installation des dépendances. Vérifie ta connexion Internet."
    exit 1
  fi
fi

# ---- 3. Lancement ----
echo "[3/3] Lancement du serveur. Pour arrêter : Ctrl+C."
echo
exec npm start
