# BRUINS — Changelog

## 2026-10-19 — Session Arena (branche `arena/9b075773-bruins`)
> La branche demandée « arena-bruins-upgrade » n'a pas été créée : la session Arena est
> liée à `arena/9b075773-bruins`, tout le travail y est fait.

### Ajouté
- `BRUINS_OST_REMASTERED/` : 27 MIDI sources reconstruits depuis le générateur Codex,
  scores JSON, analyse MIDI complète, 3 arrangements (WAV 44,1 kHz PCM16 masters,
  OGG jeu, MIDI arrangés, 7 stems OGG pour First Encounter), backup des OGG originaux.
- `tools/analyze-midi.py`, `tools/remaster-ost.py`, `tools/make-sprites.py` (reproductibles).
- `BRUINS_AUDIT.md`, `BRUINS_MUSIC_REPORT.md`, `BRUINS_ROADMAP.md`.

### Modifié
- `datafiles/music/04_Toriel_s_Memories.ogg`, `06_Forgotten_Ruins.ogg`,
  `08_First_Encounter.ogg` : remplacés par les arrangements (mêmes chemins, aucun GML touché).
- Sprites `spr_child` (16×20), `spr_mother` (18×21), `spr_enemy` (20×14) redessinés en
  pixel art lisible ; dimensions/bbox/origine des `.yy` mises à jour, GUID inchangés.

### Corrigé
- Crash runtime documenté dans `build-Run.log` : `font_delete(-1)` à la fermeture
  (`objects/obj_game_manager/Other_3.gml`) — garde ajoutée.

### Vérifié
- `node tools/validate.cjs` : 11/11 PASS après modifications.
- Audio : durées inchangées (180/220/165 s), crête −1,0 dB, décodage OGG/WAV OK.
- **Non vérifié** : compilation GameMaker et playtest (aucun GameMaker dans le sandbox).
