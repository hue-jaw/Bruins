# BRUINS — Rapport musical & diagnostic des MIDI Codex

## Provenance (important)
Le dépôt ne contenait **aucun MIDI/MP3** : uniquement 27 OGG et `tools/compose-ost.cjs`,
le générateur déterministe de Codex. Les 27 MIDI « sources » ont été régénérés à
l'identique depuis ce générateur (notes/durées/BPM concordent avec
`documentation/ost-validation.json`) et archivés dans
`BRUINS_OST_REMASTERED/MIDI_SOURCES/`. Personne n'a « écouté » de fichier absent :
toute l'analyse ci-dessous est mesurée sur ces fichiers reconstruits
(`tools/analyze-midi.py` → `MUSIC_DOCUMENTATION/midi-analysis.json`).

## Diagnostic par piste (extraits mesurés)
| Piste | BPM | Notes | Canaux GM | Verdict |
|---|---|---|---|---|
| 06 Forgotten Ruins | 88 | 1711 | piano, pad89, basse38, box10, guit.24, drums | motif Ruines solide (77-81-77-74…), basse monotone |
| 04 Toriel's Memories | 76 | 1815 | idem | thème descendant expressif (88-84-81…), idéal piano+guitare claire |
| 08 First Encounter | 128 | 2303 | + lead carré 80 | seul style « battle » avec vrai lead ; batterie basique |
| 11 The Guardian / 18 / 23 | 120-144 | 2991-4443 | boss | matière boss suffisante pour Phase C |
| 03/07/13/20/22/24/25 | 60-80 | 627-943 | sans drums | pièces piano/sombres, à garder sobres |
Les 27 motifs complets (hauteurs d'ouverture) sont dans le JSON d'analyse.

## Les 3 arrangements Phase B (`tools/remaster-ost.py`, reproductibles)
Conservation : mélodie, harmonie (pads), sections et leitmotivs Codex **inchangés**.
Ajouts : basse **mélodique** (fondamentale→quinte→octave→passage, pas un doublage),
guitare claire arpégée (Ruines/Toriel), **power chords saturés palm-mutés + lead
guitare avec bend d'attaque** (combat, synthèse harmonique + waveshaping tanh +
cabinet — pas un programme GM), arpèges chiptune carré/triangulaire, contre-mélodie
aux notes d'accord, batterie programmée par section (fills de toms toutes les 8 mesures
en combat, shaker léger aux Ruines, battement doux à la reprise Toriel), écho spatial
croisé, crête −1 dB.

| Morceau | Style | Stems (notes) | RMS avant→après | Fichiers |
|---|---|---|---|---|
| 06 Forgotten Ruins | exploration | lead 383, guitare 248, basse 256, drums 530, chip 51 | −17,7 → −16,1 dB | WAV/OGG/MIDI |
| 04 Toriel's Memories | émotionnel | lead 407, guitare 264, basse 204, drums 24 | −18,4 → −16,2 dB | WAV/OGG/MIDI |
| 08 First Encounter | combat | lead 511, guitare 936, basse 688, drums 1240, chip 240 | −17,1 → −18,4 dB* | WAV/OGG/MIDI + 7 stems OGG |

*RMS plus bas mais centroïde 2257→3618 Hz : énergie déplacée vers les guitares/charley,
dynamique de combat plus large. Mesures complètes : `MUSIC_DOCUMENTATION/remaster-report.json`.

## Intégration jeu
Les 3 OGG remasterisés remplacent `datafiles/music/{04,06,08}_*.ogg` (mêmes chemins :
aucun GML à changer pour la Music Room ni `br_music_area()`/combat). Originaux :
`BRUINS_OST_REMASTERED/ORIGINAL_OGG_BACKUP/`. Les fins gardent un fondu naturel de
2,5 s ; en jeu le streaming boucle le fichier entier (comportement existant documenté,
une vraie boucle sans fondu est prévue en Phase C avec points de boucle par piste).

## Limites assumées
Synthèse 100 % algorithmique (aucun sample de vraie guitare disponible/autorisé ici),
pas d'écoute humaine possible dans le sandbox : validation artistique = à faire par
l'utilisateur sur les 3 démos avant la Phase C (24 pistes restantes).
