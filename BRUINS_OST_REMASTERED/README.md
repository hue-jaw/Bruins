# BRUINS OST Remastered
- MIDI_SOURCES/ : 27 MIDI Codex reconstruits depuis tools/compose-ost.cjs + 3 MIDI arrangés (_ARRANGED)
- WAV_MASTERS/ : 3 masters 44,1 kHz PCM 16 bits stéréo
- OGG_GAME/ : 3 OGG intégrés au jeu (copiés dans datafiles/music/)
- STEMS/ : 7 stems OGG de 08_First_Encounter
- ORIGINAL_OGG_BACKUP/ : OGG originaux avant remplacement
- MUSIC_DOCUMENTATION/ : midi-analysis.json, remaster-report.json, scores/ (partitions Codex)
Reproduire : python3 tools/analyze-midi.py && python3 tools/remaster-ost.py (numpy, soundfile, pillow)
