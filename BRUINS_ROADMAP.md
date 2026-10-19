# BRUINS — Roadmap

## Fait
- [x] Phase A — Audit réel (BRUINS_AUDIT.md), MIDI Codex reconstruits et analysés (27/27).
- [x] Phase B — 3 arrangements démo : Ruines (exploration), Toriel (émotionnel),
      First Encounter (combat) + stems, intégrés au jeu.
- [x] Correctif crash `font_delete(-1)` ; sprites v2 lisibles ; validate.cjs 11/11.

## En attente de validation utilisateur
- [ ] Écoute comparative des 3 démos (originaux dans `ORIGINAL_OGG_BACKUP/`) →
      feu vert artistique avant Phase C.

## Phase C — Production musicale (après validation)
- [ ] Remaster des 24 pistes restantes avec le même moteur (configs par style :
      Frostwood = chiptune cristallin + guitare mélodique ; Emberfall = rock saturé ;
      boss 11/18/23 = double guitare ; pièces piano 03/13/20/25 sobres).
- [ ] Variantes Toriel (paisible/triste/combat/souvenir) à partir du motif de la piste 04.
- [ ] Versions boucle propre (sans fondu final) + points de boucle par piste dans tracks.json.
- [ ] Thèmes Frostwood/Emberfall dédiés (les pistes 09/12 actuelles seront réassignées).

## Phase D — Gameplay
- [ ] Compiler sous GameMaker LTS2026 (machine Windows), corriger les erreurs d'import.
- [ ] Playtest protocole `documentation/TEST_PLAN.md`, équilibrage des 2 combats.
- [ ] Pouvoirs hybrides d'âme (actuellement affichés seulement).

## Phase E — Graphismes & narration
- [ ] Animations 4 directions (étendre `tools/make-sprites.py` en frames + index animé dans `br_draw`).
- [ ] Tilemaps Ruines, portraits de dialogue expressifs.
- [ ] Chapitres 2 (Frostwood) puis 3 (Emberfall) : maps dans `world.json`, dialogues, ennemis.

## Phase F/G — Intégration & build
- [ ] Test complet sauvegarde/reset/Music Room sur build réel.
- [ ] `BRUINS_WINDOWS.zip` uniquement après compilation Windows réussie sur machine GameMaker
      (impossible dans ce sandbox Linux — ne jamais le simuler).
- [ ] `BRUINS_SOURCE_UPDATED.zip` via `tools/package-source.ps1` après validation du build.
