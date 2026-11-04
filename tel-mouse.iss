; =====================================================================
;  Script Inno Setup de TEL-MOUSE  (Inno Setup 6.3 ou plus récent)
;  À placer à côté du dossier « dist », puis : Build > Compile (Ctrl+F9)
; =====================================================================

#define MonAppNom "TEL-MOUSE"
#define MonAppVersion "1.1.0"
#define MonAppEditeur "dovononbrave5-wq"
#define MonAppURL "https://github.com/dovononbrave5-wq/TEL-MOUSE"
#define MonAppExe "tel-mouse.exe"

[Setup]
; Identifiant unique de TEL-MOUSE : NE JAMAIS LE CHANGER entre deux versions,
; sinon Windows croira que c'est un autre logiciel.
; (La double accolade {{ au début est volontaire.)
AppId={{4595D8ED-D0F3-4AEA-ABA6-D046BFC69E15}
AppName={#MonAppNom}
AppVersion={#MonAppVersion}
AppPublisher={#MonAppEditeur}
AppPublisherURL={#MonAppURL}
AppSupportURL={#MonAppURL}
DefaultDirName={autopf}\{#MonAppNom}
DefaultGroupName={#MonAppNom}
DisableProgramGroupPage=yes
; Le fichier d'installation sera créé dans le dossier « installeur »
OutputDir=installeur
OutputBaseFilename=TEL-MOUSE-Setup-{#MonAppVersion}
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
; Node.js et robotjs sont compilés pour Windows 64 bits
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
; Droits administrateur : installation dans « Program Files » et règle de pare-feu
PrivilegesRequired=admin
UninstallDisplayName={#MonAppNom}
UninstallDisplayIcon={app}\{#MonAppExe}
; Facultatif : ton icône (décommente la ligne si tu as un fichier icone.ico)
; SetupIconFile=dist\icone.ico

[Languages]
Name: "french"; MessagesFile: "compiler:Languages\French.isl"

[Tasks]
Name: "bureau"; Description: "Créer un raccourci sur le bureau"; GroupDescription: "Raccourcis :"
Name: "demarrage"; Description: "Lancer TEL-MOUSE au démarrage de Windows"; GroupDescription: "Raccourcis :"; Flags: unchecked

[Files]
; Copie tout le contenu du dossier dist (Node, l'application, ses modules)
Source: "dist\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\{#MonAppNom}"; Filename: "{app}\TEL-MOUSE.bat"; WorkingDir: "{app}"; IconFilename: "{app}\{#MonAppExe}"
Name: "{group}\Désinstaller {#MonAppNom}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MonAppNom}"; Filename: "{app}\TEL-MOUSE.bat"; WorkingDir: "{app}"; IconFilename: "{app}\{#MonAppExe}"; Tasks: bureau
Name: "{commonstartup}\{#MonAppNom}"; Filename: "{app}\TEL-MOUSE.bat"; WorkingDir: "{app}"; IconFilename: "{app}\{#MonAppExe}"; Tasks: demarrage

[Run]
; 1. Supprime l'ancienne règle de pare-feu (mise à jour) pour ne pas l'avoir en double
Filename: "{sys}\netsh.exe"; Parameters: "advfirewall firewall delete rule name=""{#MonAppNom}"""; Flags: runhidden; StatusMsg: "Configuration du pare-feu..."
; 2. Autorise TEL-MOUSE à recevoir les connexions du téléphone sur TOUS les réseaux
;    (privés et publics : le code d'accès à 6 chiffres protège la souris)
;    ("" = un guillemet dans une chaîne Inno Setup)
Filename: "{sys}\netsh.exe"; Parameters: "advfirewall firewall add rule name=""{#MonAppNom}"" dir=in action=allow program=""{app}\{#MonAppExe}"" enable=yes profile=any"; Flags: runhidden; StatusMsg: "Configuration du pare-feu..."
; Case « Lancer TEL-MOUSE » sur la dernière page de l'installation
Filename: "{app}\TEL-MOUSE.bat"; WorkingDir: "{app}"; Description: "Lancer {#MonAppNom} maintenant"; Flags: postinstall nowait skipifsilent shellexec

[UninstallRun]
; Arrête TEL-MOUSE s'il tourne, sinon ses fichiers ne pourraient pas être supprimés
Filename: "{sys}\taskkill.exe"; Parameters: "/F /IM {#MonAppExe}"; Flags: runhidden; RunOnceId: "ArretTelMouse"
; Supprime la règle de pare-feu ajoutée à l'installation
Filename: "{sys}\netsh.exe"; Parameters: "advfirewall firewall delete rule name=""{#MonAppNom}"""; Flags: runhidden; RunOnceId: "SupprPareFeu"
