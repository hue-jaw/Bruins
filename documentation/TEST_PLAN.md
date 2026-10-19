# Protocole QA à exécuter dans GameMaker

**Aucun test ci-dessous n'a encore été exécuté.** Consigner IDE, runtime, système, résultat, logs et captures pour chaque ligne. Le rapport statique ne doit jamais être substitué à cette liste.

## Import et démarrage

1. Importer `BRUINS.yyp`. Vérifier les 20 ressources et les Included Files.
2. Compiler Windows VM ; consigner les avertissements et corriger toute erreur. Essayer YYC ensuite seulement si nécessaire.
3. Lancer : menu visible, pas de ressource manquante, lecture de l'ambiance sans doublons.
4. Tester français/anglais, paramètres persistants, fenêtre, F11, quitter, reprise sans sauvegarde et sauvegarde invalide.
5. Tester Z, Entrée, X, Échap, C, flèches et WASD dans leurs contextes respectifs.

## Parcours sans tuer

1. Nouvelle partie ; laisser défiler le texte puis l'accélérer. Choisir chacune des cinq réponses sur des parties distinctes ; vérifier réactions et scores dans le debugger.
2. Explorer les fleurs, parler à Toriel et sauvegarder. Quitter et recharger ; position, HP, scores et rencontre doivent rester cohérents.
3. Traverser les Ruines, essayer une combinaison incorrecte puis III-I-II. Vérifier la réinitialisation de la combinaison incorrecte et l'ouverture persistante.
4. Récupérer le bonbon une seule fois. Acheter un bonbon ; contrôler argent, empilement et refus sans argent. Tester inventaire vide et plein dans le debugger.
5. Mousselin : CHECK, LISTEN, WAIT, puis SPARE. Vérifier qu'il reste visible et parle après le combat. FLEE doit quitter la rencontre sans tuer ni résoudre le conflit.
6. Maison : cuisiner, lire, découvrir le mur secret, faire une promesse. Revenir sur les interactions ; aucune nouvelle tarte ni récompense de livre en boucle.
7. Gardien : LISTEN et PROTECT, résister puis SPARE. Tenter SPARE trop tôt puis FLEE pour vérifier les refus.
8. Contrôler la transformation dominante, le retour vers Toriel et la fin du contenu sans blocage de l'exploration.

## Parcours avec violence et mémoire

1. Recommencer, faire une promesse puis tuer Mousselin avec FIGHT. Vérifier bonus de timing au centre, argent, score de chaos, promesse rompue, réaction de Toriel et absence de Mousselin.
2. Dans une autre partie, épargner Mousselin puis tuer le Gardien. Mousselin doit rester vivant et son dialogue doit persister.
3. Tester les conséquences après sauvegarde et rechargement.
4. Nouvelle chronologie : compteur méta incrémenté, dialogue d'accueil différent, pistes musicales découvertes préservées. Les fichiers de sauvegarde ne doivent pas être supprimés pour un effet narratif.

## Dix comportements d'âme

Dans une copie QA, utiliser le debugger pour régler `global.g.battle.soul` de 0 à 9 au début d'une phase d'esquive. Aucun raccourci de triche n'est fourni dans le jeu.

| Index | Observation attendue |
|---|---|
| 0 | Mouvement libre ; réduction des dégâts sous 6 PV. |
| 1 | Espace ralentit les projectiles pendant au maximum 3 secondes. |
| 2 | Vitesse accrue ; les projectiles orange n'endommagent pas un cœur en mouvement. |
| 3 | Gravité et saut avec Espace au sol ; pas de sortie de boîte. |
| 4 | Trois rails ; haut/bas passe d'un rail à l'autre sans répétition excessive. |
| 5 | Bouclier orienté selon le mouvement, actif avec Espace, collision sur l'arc prévu. |
| 6 | Z détruit les projectiles jaunes lors du pattern ciblé. |
| 7 | Espace montre les trajectoires à venir. |
| 8 | Rejoindre le signe puis Espace soigne et augmente l'apaisement une fois par phase. |
| 9 | Axe horizontal inversé toutes les deux secondes, texte d'avertissement visible. |

Tester collisions aux bords, invincibilité, mort et reprise, réglages de difficulté et assistance. Essayer une baisse volontaire du framerate : la simulation limite le temps rattrapé à 50 ms par frame, ce qui peut ralentir le jeu lors de gros blocages. Les performances 60 FPS ne sont pas garanties.

## Sauvegardes et audio

1. Sur une copie QA uniquement, corrompre le fichier principal après deux sauvegardes valides ; vérifier le repli vers `.tmp` puis `.bak`. Essayer données manquantes, version inconnue et inventaire invalide ; ne pas toucher aux vraies sauvegardes du joueur.
2. Tester la persistance des pistes débloquées et le démarrage avec un fichier méta invalide.
3. Écouter les deux pistes du début à la fin ; contrôler clics, volume, qualité et boucle. Les analyses PCM ne remplacent pas l'écoute.
4. Music Room : verrouillage de la deuxième piste, découverte en combat, lecture, pause, reprise, stop, précédent/suivant, boucle, fin de piste sans boucle et redémarrage.
5. Musique à zéro : combats et signaux visuels doivent rester utilisables.

## Distribution — après corrections et validation

Exporter Windows, vérifier tous les fichiers du runtime, tester hors ligne sous compte standard et sur machine sans outils de développement. Tester l'archive portable après extraction. Un installateur demande une campagne distincte d'installation, lancement et désinstallation sans perte des sauvegardes. Ne signer ces livrables comme testés qu'après ces essais.
