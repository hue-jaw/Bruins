# Avancement — 19 octobre 2026

## Statut global

Projet source initial créé. **Objectif du RPG complet non atteint.** Aucun test dans GameMaker, aucun exécutable et aucune distribution Windows testée. Ne pas présenter ce travail comme un jeu terminé, une démo validée ou une séquence de 15–20 minutes mesurée.

## Fichiers produits

- `BRUINS.yyp` et 20 ressources référencées : 9 scripts, 1 objet, 5 rooms, 3 sprites, 2 sons.
- 29 nœuds de dialogue bilingues, données de 2 adversaires, 3 objets d'inventaire, 4 cartes, 10 affinités et 5 hybrides configurables.
- Exploration, dialogue à texte progressif, commandes de combat, projectiles, lasers annoncés, précision d'attaque, soins, achat simple, relations, sauvegarde et mémoire méta écrits en GML.
- Deux fichiers WAV PCM mono 22 050 Hz : esquisses de 160 et 128 secondes, 64 mesures chacune, motifs, basse, arpèges et développement A/B. Pas une OST complète ni un mix masterisé.
- Rapport de vérification statique et protocole de test manuel.

## Vérifications réellement exécutées

11 groupes de contrôles passent : références et types de ressources, fichiers d'événements, graphe des dialogues, âmes/hybrides, cartes et accès géométriques, conditions de clémence dans les données, délimiteurs GML, définitions des fonctions internes, références littérales, PNG, PCM WAV.

Des défauts repérés à la relecture ont été corrigés : disparition d'un monstre épargné quand un autre mourait ; dialogue du gardien après sa mort ; répétition des récompenses d'affinité en combat ; répétition de la promesse ; fondu musical remplacé à chaque frame ; mauvais portrait pour les narrateurs ; reprise après fin d'une piste sans boucle ; noms de variables locaux pouvant entrer en conflit avec des variables natives.

Ces contrôles ne couvrent pas toutes les références dynamiques ni tous les cas de données corrompues. Aucun résultat FPS, test auditif, capture issue du runtime, test manette, test de compilation ou test de ZIP exécutable n'existe.

## État des phases demandées

| Phase | État honnête |
|---|---|
| 1 — Projet et exploration | Sources créées ; compilation non vérifiée. Pas de caméra mobile ni tilemaps natifs. |
| 2 — Première séquence | Contenu des Ruines écrit ; durée, jouabilité et équilibre non validés. |
| 3 — Systèmes | Implémentation partielle. Équipements, vente, quêtes structurées, conditions de dialogue génériques, pouvoirs hybrides et sauvegardes multiples absents. |
| 4 — Six chapitres | Ruines partielles seulement. Cinq autres chapitres, 16 ennemis et 7 boss supplémentaires absents. |
| 5 — Routes et fins | Conséquences locales de survie et de promesse. Pas de cinq routes complètes, pas des huit fins, pas de galerie. |
| 6 — Musique | Deux esquisses, Music Room partielle. 25 titres manquants, arrangements évolutifs, crossfade, synchronisation BPM, shuffle et SFX absents. |
| 7 — Tests | Contrôles statiques exécutés. Toute validation GameMaker et QA jouable reste à faire. |
| 8 — Distribution | Archive source seulement. Pas de portable Windows ni d'installateur. |

## Autres limites à traiter

- Art provisoire : pas de vraies animations de marche ni portraits expressifs ; le boss partage le sprite de Mousselin recoloré et agrandi.
- Affichage logique 640×360, fenêtre initiale 1280×720. Plein écran non validé, pas encore de letterboxing pixel-perfect ni sélecteur de résolution.
- Pas de remappage, manette, voix, mixage SFX ou option de réduction des effets.
- Deux conclusions locales indiquent explicitement la fin du contenu écrit ; elles ne comptent pas comme des fins du RPG.
- Les trois modes de difficulté ajustent cadence/vitesse ou dégâts partiellement ; l'équilibrage est à faire.
- Les hybrides sont détectés et affichés mais ne modifient pas encore le combat ou les dialogues.
- Les souvenirs sont stockés ; seule une partie de ces informations provoque actuellement des réactions.
- Pas de variante publique originale de Toriel encore écrite. Version privée uniquement dans cet état.
- Les fichiers sont dans un dossier temporaire : conserver l'archive source dans un emplacement durable.

## Prochaine étape concrète

Ouvrir le projet dans GameMaker, relever les éventuelles erreurs de ressources et de compilateur, les corriger, puis exécuter les deux parcours du protocole QA. Ensuite seulement, mesurer la durée des Ruines et valider les dix âmes. Ne pas construire artificiellement cinq chapitres sur une base encore non exécutée.
