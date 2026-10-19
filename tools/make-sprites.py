#!/usr/bin/env python3
"""Pixel art BRUINS v2 (originale, dessinée par matrices de caractères).
Remplace les micro-sprites 12px illisibles par des personnages reconnaissables:
enfant (cheveux bruns, pull crème/rouge), Gardienne (chèvre blanche, cornes,
robe sarcelle — palette propre à Bruins), Mousselin (créature mousse/feuille).
Met à jour dimensions/bbox/origine dans les .yy (1 frame, GUID inchangés)."""
import json, re
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent

PALETTES = {
 "child": {".": (0,0,0,0), "H": (74,44,32,255), "h": (104,66,42,255), "S": (238,196,158,255),
           "E": (30,24,28,255), "N": (206,110,118,255), "W": (246,240,226,255), "R": (172,52,52,255), "r": (128,38,44,255),
           "P": (56,64,96,255), "B": (40,32,28,255)},
 "mother": {".": (0,0,0,0), "F": (238,234,222,255), "f": (206,198,182,255), "H": (178,160,128,255),
            "E": (52,36,52,255), "N": (214,164,164,255), "D": (44,122,118,255), "d": (30,88,90,255),
            "G": (216,178,92,255), "B": (40,32,28,255)},
 "enemy": {".": (0,0,0,0), "M": (88,148,84,255), "m": (56,104,58,255), "L": (140,196,104,255),
           "E": (24,28,20,255), "W": (240,244,220,255), "F": (226,120,140,255), "S": (108,76,48,255)},
}

ART = {
"child": [
"................",
".....HHHHHH.....",
"....HHHHHHHH....",
"...HHHHHHHHHH...",
"...HHSSSSSSHH...",
"...HSSSSSSSSH...",
"....SESSSSES....",
"....SSSSSSSS....",
".....SSNNSS.....",
"....WWWWWWWW....",
"...SWRRRRRRS....".replace("N","S"),
"...SWRRRRRRS....",
"....WRRRRRW.....",
"....PPPPPPP.....",
"....PPP.PPP.....",
"....PPP.PPP.....",
"....PPP.PPP.....",
"...BBB...BBB....",
"...BBB...BBB....",
"................",
],
"mother": [
"..................",
"..HH..........HH..",
"..HHH........HHH..",
"...FF........FF...",
"...FFFFFFFFFF....",
"..FFFFFFFFFFFF...",
"..FFEFFFEFFEFF....",
"..FFFFFFFFFFF....",
"...FFFNNNNFFF.....",
"....FFFFFFFF......",
"...DDDDDDDDDD.....",
"..DDDDDDDDDDDD....",
"..FDDDGDDDDDDF....",
"..FDDDDDDDDDDF....",
"...DDDDDDDDDD.....",
"...DDDdDDdDDD.....",
"...DDDDDDDDDD.....",
"...DDDDDDDDDD.....",
"....DDD..DDD......",
"...BBB....BBB.....",
"..................",
],
"enemy": [
"....................",
".......LL...........",
"......LLLL....F.....",
".......LL....FFF....",
"....MMMMMMMMMMMM....",
"..MMMMMMMMMMMMMMMM..",
"..MMWWMMWMMMWMMWMM..".replace("WMMW","WEMM"),
"..MMMMMMMMMMMMMMMM..",
"...MMMMMMMMMMMMMM...",
"...MmMMMMMMMMmMM....",
"....MMMMMMMMMMMM....",
".....SS......SS.....",
".....SS......SS.....",
"....................",
],
}
# correction explicite des rangées délicates (yeux)
ART["child"][10] = "...SWRRRRRRS...."
ART["enemy"][6] = "..MWEEMMWMMWEEMM...."[:20]

def build(name):
    rows = ART[name]; w = max(len(r) for r in rows); h = len(rows)
    img = Image.new("RGBA", (w, h))
    pal = PALETTES[name]
    for y, row in enumerate(rows):
        for x, c in enumerate(row.ljust(w, ".")):
            img.putpixel((x, y), pal.get(c, (255, 0, 255, 255)))
    return img, w, h

SPRITES = {"child": "spr_child", "mother": "spr_mother", "enemy": "spr_enemy"}
for key, spr in SPRITES.items():
    img, w, h = build(key)
    d = ROOT / "sprites" / spr
    yy = next(d.glob("*.yy"))
    frames = [p for p in d.glob("*.png")]
    for p in frames: img.save(p)
    for layer_png in d.glob("layers/*/*.png"): img.save(layer_png)
    txt = yy.read_text()
    txt = re.sub(r'"bbox_bottom": \d+', f'"bbox_bottom": {h-1}', txt)
    txt = re.sub(r'"bbox_right": \d+', f'"bbox_right": {w-1}', txt)
    txt = re.sub(r'"height": \d+', f'"height": {h}', txt)
    txt = re.sub(r'"width": \d+', f'"width": {w}', txt)
    txt = re.sub(r'"xorigin": \d+', f'"xorigin": {w//2}', txt)
    txt = re.sub(r'"yorigin": \d+', f'"yorigin": {h-1}', txt)
    yy.write_text(txt)
    img.resize((w*10, h*10), Image.NEAREST).save(f"/tmp/{spr}_x10.png")
    print(spr, w, h)
