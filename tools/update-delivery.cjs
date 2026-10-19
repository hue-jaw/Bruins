const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'..');function put(p,s){fs.writeFileSync(path.join(root,p),s);}
const create=path.join(root,'objects','obj_game_manager','Create_0.gml');let s=fs.readFileSync(create,'utf8');s=s.replace('window_set_size(1280, 720);','var window_scale=max(1,min(floor((display_get_width()-48)/640),floor((display_get_height()-96)/360)));\nwindow_set_size(640*window_scale,360*window_scale);\nwindow_set_position(max(0,(display_get_width()-window_get_width()) div 2),max(0,(display_get_height()-window_get_height()) div 2));\nwindow_set_caption("BRUINS - Fragments of a Broken Timeline");');fs.writeFileSync(create,s);
if(fs.existsSync(path.join(root,'documentation','runtime-menu.png')))fs.copyFileSync(path.join(root,'documentation','runtime-menu.png'),path.join(root,'documentation','runtime-world.png'));
if(!fs.existsSync(path.join(root,'documentation','STATUS-initial.md')))fs.copyFileSync(path.join(root,'STATUS.md'),path.join(root,'documentation','STATUS-initial.md'));
put('README.md',`# BRUINS — Fragments of a Broken Timeline

Projet GameMaker en développement. Le RPG complet n'est pas terminé.

## Ce qui existe maintenant

- Projet source compilé avec GameMaker LTS 2026, runtime 2026.0.0.23.
- Lancement de développement via la commande officielle Windows Run ; exploration affichée et capture réelle dans documentation/runtime-world.png.
- Quatre zones, 29 dialogues FR/EN, deux rencontres, dix comportements d'âme, inventaire, sauvegarde et conséquences locales.
- OST v1 de **27 compositions synthétiques originales, 1 h 32 min 50 s**, disponible en MP3, OGG, WAV et MIDI. Les sources JSON des partitions sont conservées.
- 27 OGG inclus dans le projet ; Music Room avec défilement, déblocage, pause, arrêt, boucle, aléatoire, volume et fondu entre pistes.

## État de l'exécutable

La compilation du GML réussit. La commande officielle PackageZip refuse l'export avec « Permission Error: Unable to obtain permission to execute », Reason Code 0000002A, sous le profil GameMaker non connecté. **Aucun BRUINS.exe distribuable n'est livré.** Le démarrage dans le runner de développement n'est pas un export Windows portable.

GameMaker et le runtime ont été installés sur le PC de travail. Se connecter dans GameMaker, puis relancer l'export officiel avec le projet. Aucun mot de passe ou jeton ne doit être placé dans les sources. Le script tools/build-windows.cjs détecte une licence locale sans lire ni afficher son contenu.

## Utilisation des livrables

BRUINS_OST_MP3.zip : extraire et ouvrir un MP3 avec le lecteur habituel. Les 27 pistes sont disponibles indépendamment de la progression du jeu.

BRUINS_Source.zip : extraire, ouvrir BRUINS.yyp dans GameMaker LTS 2026. Les OGG, partitions et MIDI sont inclus ; les WAV et MP3, plus volumineux, restent dans le dossier de travail OST et sont exclus de l'archive source.

Flèches/WASD : déplacement. Z/Entrée : interaction. X/Échap : retour. C : inventaire. F11 : écran. Music Room : Z lecture/pause, S arrêt, R boucle, H aléatoire, pavé numérique +/- volume.

## Vérifications

La compilation est réelle et son journal est conservé dans documentation/compile-success.log. Le refus d'export est conservé dans documentation/export-blocked.log. Le démarrage et l'exploration ont été observés dans le runtime ; la campagne QA, les dix âmes, les sauvegardes et l'export restent à valider intégralement.

Les 27 MP3 et 27 OGG ont tous été décodés intégralement par FFmpeg : durée, stéréo, signal et intégrité vérifiés. L'écoute artistique intégrale et le mastering ne sont pas faits. Rapport : documentation/ost-validation.json.

Les phases suivantes du jeu, les 18 ennemis, les huit boss et les huit fins ne sont pas terminés. Voir STATUS.md et documentation/TEST_PLAN.md.

## Développement

Les outils Node/FFmpeg sont des outils de développement, pas des dépendances du futur jeu exporté.

    node tools/validate.cjs
    node tools/validate-ost.cjs
    node tools/build-windows.cjs Compile
    node tools/build-windows.cjs Run
    node tools/build-windows.cjs PackageZip

Les sources GML et ressources actuelles font autorité. Ne pas relancer les anciens générateurs build-project/build-content sur des ressources éditées sans sauvegarde : ils datent de l'amorçage et peuvent écraser les corrections LTS. compose-ost.cjs régénère l'album ; integrate-ost.cjs intègre les OGG.

Version fan-game privée avec Toriel ; variante publique originale non réalisée. Crédits et licences : CREDITS.md.
`);
put('STATUS.md',`# Avancement — 19 octobre 2026, mise à jour OST et compilation

## Résultats confirmés

- GameMaker LTS 2026 installé depuis le site officiel, signature YOYO GAMES LIMITED valide. Runtime 2026.0.0.23 installé.
- Ressources adaptées aux exigences du compilateur : événements avec discriminateurs GMEvent, héritage de vues des rooms, retrait de métadonnées non prises en charge, options incomplètes conservées en sauvegarde documentaire.
- Compilation GML réussie, génération réelle de BRUINS.win. Journal archivé.
- Lancement Windows Run autorisé : monde et personnage observés dans la fenêtre du runtime. Capture réelle conservée. Ce test ne valide pas l'intégralité de la séquence.
- 27 partitions originales avec sections intro, A, variation, B, pont, reprise et coda ; mélodies, basses, accords, arpèges et percussions selon le morceau.
- 27 rendus stéréo WAV 22 050 Hz, 27 MP3, 27 OGG, 27 MIDI et 27 partitions JSON. Durée totale 5 570 secondes, soit 92:50.
- 54 décodages MP3/OGG complets réussis ; durées, stéréo, signal non silencieux et fichiers distincts vérifiés. Pas d'écoute intégrale ni de mastering validé.
- Sources audio intégrées : fichiers inclus, Music Room 27 pistes, accès aux seuls morceaux découverts, migration des anciens déblocages, lecture OGG, destruction des streams, crossfade et navigation.

## Blocage de distribution

PackageZip retourne Reason Code 0000002A : Permission Error: Unable to obtain permission to execute. Profil local non connecté. Connexion GameMaker par l'utilisateur nécessaire pour poursuivre l'export officiel. Ne pas fabriquer une distribution en copiant le runner pour contourner ce refus.

Aucun BRUINS_Portable_Windows.zip ni BRUINS_Setup.exe validé n'existe. L'album MP3 et l'archive source sont de vrais livrables ; ils ne constituent pas le jeu Windows complet.

## Périmètre de jeu inchangé

Quatre zones des Ruines, 29 dialogues bilingues, deux rencontres et trois objets d'inventaire. Le reste des six chapitres, les routes complètes, huit fins, équipements, boutiques complètes, quêtes structurées, tilemaps natifs, portraits et animations avancés restent à réaliser. Les dix comportements d'âme sont écrits et compilés mais ne sont pas tous accessibles naturellement ni testés en combat.

La présence des 27 pistes n'implique pas que leurs scènes existent. Les couleurs et bonus hybrides sont partiels ; pas d'arrangements audio dynamiques par âme ni de synchronisation BPM des boss. Les compositions sont synthétiques, pas des enregistrements orchestraux.

## Tests restants

Après connexion : relancer PackageZip, extraire l'export, lancer BRUINS.exe, corriger les erreurs éventuelles, réaliser le parcours QA pacifiste/destructeur, vérifier sauvegardes, audio, performances et contrôle au clavier ; tester sur compte standard et machine sans GameMaker. Produire/tester l'installateur seulement après le portable.

Le dossier de travail est temporaire. Conserver les archives dans un emplacement durable.
`);
fs.copyFileSync(path.join(root,'README.md'),path.join(root,'documentation','README-source.md'));
for(const[from,to]of[['build/build-Compile.log','documentation/compile-success.log'],['build/build-PackageZip.log','documentation/export-blocked.log']])if(fs.existsSync(path.join(root,from)))fs.copyFileSync(path.join(root,from),path.join(root,to));
const ps=path.join(root,'tools','build-windows.ps1');fs.writeFileSync(ps,"param([ValidateSet('Compile','PackageZip','PackageNsis','Run')][string]$Action='Compile')\n& node (Join-Path $PSScriptRoot 'build-windows.cjs') $Action\nexit $LASTEXITCODE\n");
console.log('Documentation reflects real compilation, observed runtime, 27-track audio tests and the exact export block.');
