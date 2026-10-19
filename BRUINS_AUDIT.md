# BRUINS — Audit réel (Phase A) — 2026-10-19

## Méthode et limites
Inspection du dépôt à `915b34b`, lecture des GML/JSON/logs, analyse MIDI par parseur
stdlib (`tools/analyze-midi.py`), mesures audio (RMS/crête/centroïde via soundfile+numpy).
**Aucun GameMaker/Igor dans cet environnement Linux : aucune compilation ni aucun test
runtime n'a été exécuté ici.** Ne pas confondre avec les logs Windows fournis par Codex.

## Ce qui existe réellement
- Projet GameMaker 2024.11/LTS2026 (`BRUINS.yyp`) : 1 objet persistant, 9 scripts GML
  (~490 lignes), 5 rooms, 3 sprites, 2 sons WAV intégrés, 27 OGG streamés (datafiles).
- Contenu jouable écrit : Ruines uniquement (4 zones), 29 nœuds de dialogue FR/EN,
  2 ennemis (Mousselin, Gardien creux), FIGHT/ACT/ITEM/MERCY, 10 affinités d'âme,
  inventaire 8 cases, sauvegarde JSON versionnée + mémoire des resets, Music Room
  complète (27 pistes, crossfade 650/700 ms, shuffle, repeat, volume, déblocages persistés).
- `tools/validate.cjs` : 11 contrôles statiques — **repassés avec succès après nos modifications**.
- Logs Codex : compilation Windows réussie (`build/BRUINS.win`, 13 Mo) mais
  `build-PackageZip.log` = *Permission Error*, et `build-Run.log` se termine sur une
  **erreur runtime réelle** (voir bug n°1). Aucun exécutable livré.

## Fichiers absents (signalé, non simulé)
- **Aucun `.mid`, `.mp3`, ni dossier `OST/` dans le dépôt.** Seuls les OGG dérivés et le
  générateur `tools/compose-ost.cjs` existent. Les « MIDI de Codex » ont donc été
  **reconstruits de façon déterministe et vérifiable** en ré-exécutant ce générateur
  (ffmpeg neutralisé dans un bac à sable `/tmp` pour ne pas écraser les OGG du jeu) :
  les 27 MIDI + scores JSON sont dans `BRUINS_OST_REMASTERED/MIDI_SOURCES/` et
  `MUSIC_DOCUMENTATION/scores/`. Leurs empreintes correspondent au manifeste Codex
  (`documentation/ost-validation.json` : mêmes nombres de notes, durées, BPM).
- Pas de SoundFont, pas de samples tiers, pas de ffmpeg dans le sandbox : le rendu est
  100 % synthèse numpy originale (voir BRUINS_MUSIC_REPORT.md).

## Diagnostic musical des 27 scores Codex (détail : MUSIC_DOCUMENTATION/midi-analysis.json)
Points forts conservés : motifs mélodiques de 8 degrés par morceau, progressions
modales cohérentes par style (mystery/battle/boss…), structure 7 sections
(intro/A/var/B/bridge/return/coda), leitmotiv de retour sur certains titres.
Faiblesses mesurées : instrumentation limitée à 6 timbres sinusoïdaux
(piano/lead/pad/basse/bell/pluck + kick/snare/hat bruités), basse = fondamentale
répétée, aucune guitare, batterie identique partout, rendu 22 050 Hz mono-timbral,
RMS ≈ −18 dB, centroïde ≈ 2,1 kHz (son « MIDI de démonstration »).

## Bugs et dettes confirmés
1. **Crash à la fermeture** (`build-Run.log`) : `font_delete(global.font)` avec font = −1
   dans `objects/obj_game_manager/Other_3.gml`. → **Corrigé** (garde `global.font >= 0`).
2. Sprites 12×13 / 12×15 / 12×9 px illisibles (7 couleurs). → **Redessinés** en pixel art
   16×20, 18×21, 20×14 (`tools/make-sprites.py`, GUID conservés, validate.cjs repasse).
3. Pas d'animation 4 directions, pas de tilemaps, chapitres 2–6 absents, hybrides sans
   effet gameplay, Music Room OK mais pistes = rendus sinusoïdaux. → Roadmap.
4. `OST/` et les MP3 de Codex non versionnés : risque de perte — désormais MIDI+scores archivés.

## Ce qui a été livré dans cette session (vérifiable)
- 3 arrangements complets (exploration / émotionnel / combat) : WAV 44,1 kHz PCM16,
  OGG jeu, MIDI arrangés, stems OGG du combat — intégrés au jeu (mêmes noms de fichiers,
  originaux sauvegardés dans `ORIGINAL_OGG_BACKUP/`).
- Correctif crash n°1, sprites v2, outils reproductibles, rapports.
- Non livré (honnêteté) : build Windows (pas de GameMaker ici), chapitres 2–6,
  remaster des 24 autres pistes (Phase C, en attente de validation artistique des 3 démos).
