# BRUINS — Fragments of a Broken Timeline

**Sources GameMaker en développement. Ce livrable n'est pas le jeu complet et ne contient aucun exécutable.**

Le projet contient une première séquence des Ruines, écrite mais pas encore compilée ni testée dans GameMaker. La durée jouable n'a pas été mesurée. Le format des ressources cible GameMaker 2024.11 ; l'import dans un IDE compatible reste à valider.

## Ouvrir les sources

1. Extraire toute l'archive `BRUINS_Source.zip` dans un dossier de travail.
2. Ouvrir `BRUINS.yyp` dans GameMaker avec un runtime Windows installé.
3. Compiler et lancer avec F5. Corriger les éventuelles erreurs d'import ou de compilation avant toute distribution.
4. Suivre `documentation/TEST_PLAN.md`. Les vérifications statiques déjà exécutées figurent dans `documentation/validation-report.json`.

Les joueurs ne doivent pas recevoir cette archive comme une version portable. Aucun fichier `BRUINS.exe`, `BRUINS_Portable_Windows.zip` ou `BRUINS_Setup.exe` n'a été produit.

## Contenu écrit

- Menu, chargement d'un emplacement, paramètres, crédits et Music Room à deux pistes.
- Quatre zones : lit de fleurs, pierres chantantes, maison et cour du gardien, dans quatre rooms distinctes ; une cinquième room amorce le menu.
- 29 nœuds de dialogue en français et en anglais, cinq réponses distinctes à Toriel.
- Énigme des trois pierres, cuisine, livre, passage secret, achat de bonbons et points de sauvegarde.
- Deux rencontres : Mousselin et Gardien creux, attaques de précision, ACT, ITEM, SPARE et FLEE.
- Dix comportements d'âme écrits dans le contrôleur de combat ; les dix ne sont pas tous naturellement accessibles avec le contenu actuel. Leur fonctionnement reste à tester.
- Scores 0–100, cinq règles d'hybridation et affichage des hybrides. Pas encore de pouvoirs hybrides.
- Inventaire de huit emplacements, empilement, soins, argent, relation avec Toriel, promesse et conséquences de survie par adversaire.
- Sauvegarde JSON versionnée avec fichier temporaire et copie de secours ; mémoire séparée des resets et pistes débloquées.
- Trois sprites pixel originaux provisoires et deux esquisses musicales WAV originales, 2:40 et 2:08.

Les cartes utilisent une grille de collision et un dessin GML. Elles ne sont pas encore des tilemaps éditables. Le personnage utilise un sprite fixe avec oscillation de marche, pas une animation à quatre directions. Un seul objet persistant orchestre neuf modules GML ; la séparation en objets spécialisés reste à réaliser.

## Commandes prévues

Flèches ou WASD : mouvement ; Entrée ou Z : confirmer/interagir ; X ou Échap : retour ; C : inventaire ; F11 : plein écran. En phase d'esquive, Espace active la capacité de l'âme ; Z tire pour Justice. Les contrôles ne sont pas encore remappables.

Pour l'énigme : activer les pierres III, I puis II. La porte de la cour est à l'est. Le gardien peut être épargné après ÉCOUTER et PROTÉGER, puis MERCY > SPARE.

Nouvelle partie recommence l'aventure sans effacer le fichier de sauvegarde tant qu'aucun point n'est utilisé. Nouvelle chronologie incrémente le compteur méta puis recommence. Le menu d'effacement explicite de toute mémoire n'est pas encore implémenté. Aucun effacement automatique scénaristique n'existe.

## Compilation et distribution restantes

Une installation GameMaker, son runtime Windows et les droits d'export adéquats sont nécessaires sur la machine de développement. Aucune installation GameMaker/Igor n'a été trouvée dans le PATH, les dossiers habituels inspectés ou les entrées de désinstallation Windows consultées pendant cette session.

Après validation du projet, sélectionner une cible Windows et créer l'export via l'IDE. Conserver tous les fichiers du runtime fournis par l'export. Nommer le lancement `BRUINS.exe` dans la configuration Windows, créer `BRUINS_Portable_Windows.zip`, puis essayer cette archive extraite sous un compte standard sur une machine sans GameMaker. L'installateur doit être produit et testé séparément. Ces étapes ne sont pas réalisées.

Les appels de sauvegarde utilisent des chemins relatifs du bac à sable GameMaker (`save01.json`, `meta.json`, `settings.json`). Vérifier le dossier utilisateur réellement choisi par le runtime lors de l'export Windows ; aucun chemin administrateur n'est codé en dur.

## Développement

Les outils Node ne servent qu'à produire et contrôler les sources. Ils ne sont pas une dépendance du futur jeu exporté.

```text
node tools/build-content.cjs
node tools/build-project.cjs
node tools/review-fixes.cjs
node tools/final-fixes.cjs
node tools/validate.cjs
```

`build-content.cjs` réécrit les JSON narratifs ; modifier son contenu ou conserver les données éditées avant de le relancer. `build-project.cjs` réécrit les métadonnées et les assets. Ne pas l'exécuter après des modifications de ressources dans l'IDE sans sauvegarder celles-ci. Les sources GML sont livrées directement et restent éditables.

Le validateur contrôle les références, certains liens narratifs, l'accessibilité géométrique des interactions, les signatures et dimensions PNG, le PCM WAV et les délimiteurs GML. **Il ne compile pas le GML et ne prouve pas que le jeu démarre.**

Consulter `STATUS.md` pour l'état détaillé et `CREDITS.md` pour les attributions.
