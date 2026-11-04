@echo off
chcp 65001 >nul
title TEL-MOUSE - installation et lancement
cd /d "%~dp0"

echo.
echo  ==============================================
echo    TEL-MOUSE : installation et lancement
echo  ==============================================
echo.

rem ---- 1. Node.js est-il installé ? ----
where node >nul 2>nul
if not errorlevel 1 goto node_ok

echo [1/3] Node.js n'est pas installé.
where winget >nul 2>nul
if errorlevel 1 goto pas_de_winget
echo       Installation de Node.js LTS avec winget (Windows peut demander une autorisation)...
winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
rem Cette fenêtre ne connaît pas encore le nouveau PATH : on ajoute le dossier de Node.js
set "PATH=%ProgramFiles%\nodejs;%PATH%"
where node >nul 2>nul
if errorlevel 1 goto node_echec

:node_ok
for /f "tokens=1 delims=." %%v in ('node -v') do set "NODE_MAJ=%%v"
set "NODE_MAJ=%NODE_MAJ:v=%"
if %NODE_MAJ% LSS 18 goto node_trop_ancien
for /f %%v in ('node -v') do echo [1/3] Node.js %%v détecté.

rem ---- 2. Dépendances (rapide si elles sont déjà à jour) ----
echo [2/3] Installation des dépendances...
call npm install --no-audit --no-fund --loglevel=error
if not errorlevel 1 goto lancer
if exist node_modules\ goto deps_hors_ligne
echo       Échec de l'installation des dépendances. Vérifie ta connexion Internet.
goto fin

:deps_hors_ligne
echo       Mise à jour impossible, pas d'Internet ? On continue avec les modules déjà installés.

rem ---- 3. Lancement ----
:lancer
echo [3/3] Lancement du serveur. Pour arrêter : Ctrl+C ou ferme cette fenêtre.
echo.
call npm start
goto fin

:pas_de_winget
echo       Installe Node.js (version LTS) depuis https://nodejs.org puis relance ce script.
goto fin

:node_echec
echo       Node.js vient d'être installé, mais cette fenêtre ne le trouve pas encore.
echo       Ferme-la et relance demarrer.bat.
goto fin

:node_trop_ancien
echo [1/3] Node.js %NODE_MAJ% est trop ancien : il faut la version 18 ou plus.
echo       Mets-le à jour depuis https://nodejs.org ou avec : winget upgrade OpenJS.NodeJS.LTS
goto fin

:fin
echo.
pause
