#!/usr/bin/env python3
"""
BRUINS OST Remaster — Phase B (3 morceaux de démonstration).
Principe honnête: on CONSERVE les mélodies/harmonies des scores Codex
(Scores JSON régénérés par tools/compose-ost.cjs, identiques aux MIDI_SOURCES),
on AJOUTE arrangement: vraie basse mélodique, guitares (claire / saturée,
synthèse harmonique + waveshaping, PAS un simple n° de programme GM),
arpèges chiptune onde carrée/triangulaire, contre-mélodie, batterie
programmée par section, structure intro/A/B/bridge/return/coda héritée.
Rendu numpy 44,1 kHz stéréo -> WAV master, OGG jeu (libsndfile/Vorbis),
MIDI arrangé multitrack, stems pour le morceau de combat.
Aucun échantillon tiers, aucune mélodie copiée d'un autre jeu.
"""
import json, math, sys
from pathlib import Path
import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
SCORES = ROOT / "BRUINS_OST_REMASTERED" / "MUSIC_DOCUMENTATION" / "scores"
OUT = ROOT / "BRUINS_OST_REMASTERED"
SR = 44100

# ---------- utilitaires ----------
def f(m): return 440.0 * 2 ** ((m - 69) / 12)
def note_list(score, *instruments):
    return [n for n in score["notes"] if n["instrument"] in instruments]

def sections_of(score):
    return score["sections"]

def section_at(score, t, bar_s):
    bar = int(t // bar_s)
    for s in score["sections"]:
        if s["startBar"] <= bar < s["endBar"]:
            return s["name"]
    return "coda"

# ---------- synthèses (tout est généré, aucun sample) ----------
_rng = np.random.default_rng(20261019)
NOISE = _rng.standard_normal(SR * 2).astype(np.float32)

def env_ads(n, a=0.005, dcy=3.0, sus=0.0):
    t = np.arange(n) / SR
    e = np.minimum(1.0, t / max(a, 1e-4)) * (sus + (1 - sus) * np.exp(-t * dcy))
    # release doux anti-clic
    rel = int(SR * 0.03)
    if n > rel: e[-rel:] *= np.linspace(1, 0, rel)
    return e

def osc_harm(midi, dur, weights, decay=3.0, a=0.005, glide=0.0):
    """Somme d'harmoniques (piano/guitare claire/carrée selon weights)."""
    n = max(1, int(dur * SR)); freq = f(midi); t = np.arange(n) / SR
    if glide > 0:  # petit bend d'attaque guitare lead
        freq_t = freq * (1 + glide * np.exp(-t * 18))
        ph = np.cumsum(freq_t) / SR * 2 * np.pi
    else:
        ph = 2 * np.pi * freq * t
    y = np.zeros(n)
    for i, w in enumerate(weights, 1):
        y += w * np.sin(ph * i)
    return y * env_ads(n, a, decay)

def guitar_dist(midi, dur, mute=False):
    """Guitare saturée: dent de scie harmonique + tanh, jamais un 'son MIDI'."""
    n = max(1, int(dur * SR)); freq = f(midi); t = np.arange(n) / SR
    ph = 2 * np.pi * freq * t
    y = np.zeros(n)
    for i in range(1, 9): y += np.sin(ph * i) / i
    y = np.tanh(y * (1.6 if mute else 2.6))
    # lowpass 1-pôle (cabinet rudimentaire)
    alpha = 0.22; out = np.zeros(n); acc = 0.0
    # version vectorisée du 1-pôle via lissage exponentiel par blocs
    out = np.array(y); 
    for _ in range(2):
        out = np.convolve(out, np.exp(-np.arange(24) / 6.0)); out = out[:n] / 3.2
    return out * env_ads(n, 0.004, 5.0 if mute else 1.1, 0.25 if not mute else 0.0)

def chip(midi, dur, square=True):
    n = max(1, int(dur * SR)); freq = f(midi); t = np.arange(n) / SR
    if square:
        y = np.sign(np.sin(2 * np.pi * freq * t)) * 0.6 + 0.25 * np.sin(2 * np.pi * freq * t)
    else:
        ph = (freq * t) % 1.0; y = 2 * np.abs(2 * ph - 1) - 1
    e = env_ads(n, 0.003, 1.2, 0.55); return y * e

def bass_note(midi, dur, round_=False):
    n = max(1, int(dur * SR)); freq = f(midi); t = np.arange(n) / SR
    ph = 2 * np.pi * freq * t
    y = np.sin(ph) + (0.25 if round_ else 0.5) * np.sin(ph * 2) + (0.08 if round_ else 0.22) * np.sin(ph * 3)
    if not round_: y += 0.15 * np.sign(np.sin(ph)) * np.exp(-t * 8)  # attaque plectre
    return y * env_ads(n, 0.006, 1.4, 0.5)

def pad_note(midi, dur):
    n = max(1, int(dur * SR)); freq = f(midi); t = np.arange(n) / SR
    y = np.zeros(n)
    for det in (0.998, 1.002):
        ph = 2 * np.pi * freq * det * t
        y += np.sin(ph) + 0.4 * np.sin(ph * 2) + 0.15 * np.sin(ph * 3)
    e = np.minimum(1, t / 0.45) * np.minimum(1, np.maximum(0, (dur - t) / 0.4))
    return y * e * 0.6

def drum(kind, dur=0.3):
    n = max(1, int(dur * SR)); t = np.arange(n) / SR
    if kind == "kick":
        ph = 2 * np.pi * (52 * t + 26 * (1 - np.exp(-t * 30)) / 30 * 30)
        return np.sin(np.cumsum((52 + 90 * np.exp(-t * 28))) / SR * 2 * np.pi) * np.exp(-t * 16)
    if kind == "snare":
        return (NOISE[:n] * 0.75 + 0.35 * np.sin(2 * np.pi * 190 * t)) * np.exp(-t * 24)
    if kind == "hat":
        seg = NOISE[:n]; return (seg - np.convolve(seg, np.ones(6) / 6)[:n]) * np.exp(-t * 90)
    if kind == "shaker":
        seg = NOISE[:n]; return (seg - np.convolve(seg, np.ones(9) / 9)[:n]) * np.exp(-t * 22) * 0.5
    if kind in ("tom1", "tom2"):
        fr = 140 if kind == "tom1" else 95
        return np.sin(2 * np.pi * fr * t) * np.exp(-t * 11)
    return NOISE[:n] * np.exp(-t * 20)

RENDER = {
    "piano":  lambda m, d: osc_harm(m, d, [1, .42, .20, .10, .05], decay=2.6),
    "gtclean":lambda m, d: osc_harm(m, d, [1, .5, .28, .12], decay=3.4),
    "gtlead": lambda m, d: osc_harm(m, d, [1, .55, .35, .2, .1], decay=1.0, a=0.01, glide=0.03),
    "gtdist": lambda m, d: guitar_dist(m, d),
    "gtmute": lambda m, d: guitar_dist(m, d, mute=True),
    "square": lambda m, d: chip(m, d, True),
    "tri":    lambda m, d: chip(m, d, False),
    "bell":   lambda m, d: osc_harm(m, d, [1, .12, .3, .05], decay=5.0),
    "bass":   lambda m, d: bass_note(m, d),
    "bassround": lambda m, d: bass_note(m, d, round_=True),
    "pad":    lambda m, d: pad_note(m, d),
}

# ---------- arrangement ----------
class Track:
    def __init__(self, dur):
        self.dur = dur; self.stems = {}   # stem -> list (t,dur,midi,vel,pan,kind)
        self.midi_events = []             # (t,dur,midi,vel,channel,program)
    def add(self, stem, t, d, m, v, pan, kind, ch=None, prog=None):
        if t >= self.dur - 0.05 or m < 20 or m > 115: return
        self.stems.setdefault(stem, []).append((float(t), float(min(d, self.dur - t)), int(m), float(v), float(pan), kind))
        if ch is not None: self.midi_events.append((float(t), float(d), int(m), int(max(1, min(127, v * 127))), ch, prog))

def build(score, cfg):
    dur = score["duration"]; bpm = score["bpm"]; beat = 60 / bpm; bar = beat * 4
    tr = Track(dur)
    melody_src = note_list(score, "lead", "piano")
    # mélodie principale: dédoublonner les hauteurs simultanées (garder la plus aiguë)
    mel = {}
    for n in melody_src:
        k = round(n["t"], 3)
        if k not in mel or n["m"] > mel[k]["m"]: mel[k] = n
    melody = sorted(mel.values(), key=lambda n: n["t"])
    pads = note_list(score, "pad"); bass_src = note_list(score, "bass")
    chords = {}
    for n in pads:
        chords.setdefault(int(n["t"] // bar), set()).add(n["m"])
    bass_by_bar = {}
    for n in bass_src:
        bass_by_bar.setdefault(int(n["t"] // bar), []).append(n)

    for n in melody:
        sec = section_at(score, n["t"], bar)
        inten = {"intro": .55, "bridge": .8, "return": 1.0, "coda": .6}.get(sec, .9)
        tr.add("lead", n["t"], n["d"] * 1.05, n["m"], .30 * inten, -0.08, cfg["lead"],
               0, cfg["lead_prog"])
        if cfg.get("lead_double") and sec in ("A", "return", "B"):
            tr.add("lead", n["t"], n["d"], n["m"], .14 * inten, 0.22, cfg["lead_double"], 4, 10)
        # contre-mélodie: note d'accord tenue, une mesure sur deux, sections B/return
        if cfg.get("counter") and sec in ("B", "return") and int(n["t"] // bar) % 2 == 0 and abs(n["t"] / beat - round(n["t"] / beat)) < .01:
            ch_tones = sorted(chords.get(int(n["t"] // bar), []))
            if ch_tones:
                cm = ch_tones[-1] + 12
                tr.add("counter", n["t"], beat * 2, cm, .10 * inten, 0.3, cfg["counter"], 5, 24)

    # accords: pad + guitare claire arpégée / power chords selon style
    for n in pads:
        sec = section_at(score, n["t"], bar)
        tr.add("pad", n["t"], n["d"], n["m"], .055, n.get("pan", 0), "pad", 2, 89)
    nbars = int(dur // bar)
    for b in range(nbars):
        t0 = b * bar; sec = section_at(score, t0, bar); tones = sorted(chords.get(b, []))
        if not tones: continue
        root = min(tones)
        if cfg["style"] == "battle":
            if sec not in ("intro",):
                for k in range(8):  # power chords palm-mutés croches, accents temps
                    kind = "gtdist" if k in (0, 4) else "gtmute"
                    for off in (0, 7, 12):
                        tr.add("guitar", t0 + k * beat / 2, beat * .42, root - 12 + off,
                               .16 if kind == "gtdist" else .10, -0.18 if off != 7 else 0.18, kind, 3, 29)
            if sec in ("B", "return"):  # arpège chiptune rapide 16es
                for k in range(16):
                    tr.add("chip", t0 + k * beat / 4, beat / 4 * .9, tones[k % len(tones)] + 24, .055, .25 if k % 2 else -.25, "square", 1, 80)
        elif cfg["style"] in ("ruins", "emotional"):
            if sec != "intro" or b >= 2:  # arpège guitare claire
                pat = [0, 1, 2, 1] if len(tones) >= 3 else [0, 1, 0, 1]
                for k in range(8):
                    tr.add("guitar", t0 + k * beat / 2, beat * .55, tones[pat[k % len(pat)] % len(tones)] + 12,
                           .075, -.15 if k % 2 else .15, "gtclean", 3, 25)
            if cfg["style"] == "ruins" and sec in ("A", "B", "return"):  # écho chiptune triangulaire discret
                for k in (0, 3, 6):
                    tr.add("chip", t0 + k * beat / 2 + beat / 4, beat * .4, tones[(k // 3) % len(tones)] + 24, .045, .3, "tri", 1, 80)

    # BASSE MÉLODIQUE: fondamentale -> quinte -> octave -> note de passage (pas un doublage bête)
    for b, ns in sorted(bass_by_bar.items()):
        t0 = b * bar; sec = section_at(score, t0, bar)
        root = min(n["m"] for n in ns)
        if cfg["style"] == "battle":
            steps = [0, 0, 12, 0, 7, 0, 12, 10]  # groove 8es avec passage
            for k, s in enumerate(steps):
                tr.add("bass", t0 + k * beat / 2, beat * .45, root + s, .24, 0, "bass", 6, 33)
        elif cfg["style"] == "ruins":
            seq = [(0, 0), (2, 0), (4, 7), (6, 12)]
            for pos, s in seq:
                tr.add("bass", t0 + pos * beat / 2, beat * 1.5, root + s, .17, 0, "bassround", 6, 33)
        else:
            seq = [(0, 0), (4, 0), (6, 7)]
            for pos, s in seq:
                tr.add("bass", t0 + pos * beat / 2, beat * 1.7, root + s, .16, 0, "bassround", 6, 33)

    # BATTERIE programmée par section (les MIDI sources n'ont que kick/snare/hat basiques)
    for b in range(nbars):
        t0 = b * bar; sec = section_at(score, t0, bar)
        if cfg["style"] == "battle":
            if sec == "intro" and b < 2: continue
            dens = .65 if sec in ("intro", "bridge") else 1.0
            for k in range(4):
                tr.stems.setdefault("drums", []).append((t0 + k * beat, .3, 36, .5 * dens, 0, "kick"))
                if k % 2 == 1: tr.stems.setdefault("drums", []).append((t0 + k * beat, .25, 38, .32 * dens, 0, "snare"))
            for k in range(8):
                tr.stems.setdefault("drums", []).append((t0 + k * beat / 2, .12, 42, (.16 if k % 2 else .10) * dens, .2 if k % 2 else -.2, "hat"))
            if b % 8 == 7 and sec not in ("intro", "coda"):
                for k, kk in enumerate(("tom1", "tom2", "snare", "snare")):
                    tr.stems.setdefault("drums", []).append((t0 + (3 + k / 4) * beat, .18, 45, .28, 0, kk))
        elif cfg["style"] == "ruins":
            if sec in ("intro", "coda"): continue
            tr.stems.setdefault("drums", []).append((t0, .3, 36, .16, 0, "kick"))
            tr.stems.setdefault("drums", []).append((t0 + 2 * beat, .3, 36, .13, 0, "kick"))
            for k in range(8):
                tr.stems.setdefault("drums", []).append((t0 + k * beat / 2, .2, 42, .05, .15 if k % 2 else -.15, "shaker"))
        else:  # emotional: souffle + battement très doux à la reprise
            if sec == "return":
                tr.stems.setdefault("drums", []).append((t0, .3, 36, .12, 0, "kick"))
                tr.stems.setdefault("drums", []).append((t0 + 2.5 * beat, .3, 36, .09, 0, "kick"))
    return tr

def render(tr):
    n = int(tr.dur * SR)
    stems = {}
    for name, notes in tr.stems.items():
        L = np.zeros(n); R = np.zeros(n)
        for (t, d, m, v, pan, kind) in notes:
            if kind in ("kick", "snare", "hat", "shaker", "tom1", "tom2"):
                y = drum(kind, max(d, .05))
            else:
                y = RENDER[kind](m, d)
            s = int(t * SR); e = min(n, s + len(y))
            if e <= s: continue
            lg = math.sqrt((1 - pan) / 2) * v; rg = math.sqrt((1 + pan) / 2) * v
            L[s:e] += y[:e - s] * lg; R[s:e] += y[:e - s] * rg
        stems[name] = np.stack([L, R])
    mix = sum(stems.values())
    # écho spatial léger (2 taps croisés, comme un delay de salle rétro)
    for delay, g in ((int(SR * .19), .10), (int(SR * .31), .06)):
        echo = np.zeros_like(mix); echo[:, delay:] = mix[:, :-delay] * g
        mix = mix + echo[::-1]
    # fondu sortie naturel (les masters gardent la queue; l'OGG jeu garde le même fondu, documenté)
    fade = int(SR * 2.5); mix[:, -fade:] *= np.linspace(1, 0, fade)
    mix[:, :int(SR * .05)] *= np.linspace(0, 1, int(SR * .05))
    peak = np.max(np.abs(mix)) + 1e-9
    mix *= 0.89 / peak
    for k in stems: stems[k] *= 0.89 / peak
    stats = {"peak_db": round(20 * math.log10(0.89), 2),
             "rms_db": round(20 * math.log10(float(np.sqrt(np.mean(mix ** 2))) + 1e-12), 2)}
    return mix, stems, stats

# ---------- MIDI arrangé ----------
def vlq(v):
    out = [v & 127]; v >>= 7
    while v: out.append((v & 127) | 128); v >>= 7
    return bytes(reversed(out))

def write_midi(tr, path, bpm, title):
    ppq = 480; events = []
    tempo = int(60000000 / bpm)
    events.append((0, bytes([0xff, 0x51, 3]) + tempo.to_bytes(3, "big")))
    events.append((0, bytes([0xff, 0x03, len(title)]) + title.encode()))
    progs = {}
    for (t, d, m, v, ch, prog) in tr.midi_events:
        if prog is not None and progs.get(ch) != prog:
            progs[ch] = prog; events.append((0, bytes([0xc0 + ch, prog])))
        on = int(t * bpm / 60 * ppq); off = int((t + d) * bpm / 60 * ppq)
        events.append((on, bytes([0x90 + ch, m, v]))); events.append((max(off, on + 1), bytes([0x80 + ch, m, 0])))
    events.sort(key=lambda e: e[0]); last = 0; body = bytearray()
    for tick, data in events:
        body += vlq(tick - last) + data; last = tick
    body += b"\x00\xff\x2f\x00"
    hdr = b"MThd" + (6).to_bytes(4, "big") + (0).to_bytes(2, "big") + (1).to_bytes(2, "big") + ppq.to_bytes(2, "big")
    trk = b"MTrk" + len(body).to_bytes(4, "big") + bytes(body)
    path.write_bytes(hdr + trk)

CONFIGS = [
    ("06_Forgotten_Ruins", {"style": "ruins", "lead": "piano", "lead_prog": 0, "lead_double": "bell", "counter": "tri"}),
    ("04_Toriel_s_Memories", {"style": "emotional", "lead": "piano", "lead_prog": 0, "lead_double": "gtclean", "counter": "pad"}),
    ("08_First_Encounter", {"style": "battle", "lead": "gtlead", "lead_prog": 27, "lead_double": "square", "counter": "square"}),
]

def main():
    report = []
    for stem, cfg in CONFIGS:
        score = json.loads((SCORES / f"{stem}.json").read_text())
        tr = build(score, cfg)
        mix, stems, stats = render(tr)
        wav = OUT / "WAV_MASTERS" / f"{stem}_REMASTER.wav"
        ogg = OUT / "OGG_GAME" / f"{stem}.ogg"
        mid = OUT / "MIDI_SOURCES" / f"{stem}_ARRANGED.mid"
        interleaved = np.ascontiguousarray(mix.T, dtype=np.float32)
        sf.write(wav, interleaved, SR, subtype="PCM_16")
        # Écriture OGG par blocs: sf.write direct segfault (libsndfile) sur les longs buffers.
        with sf.SoundFile(ogg, mode="w", samplerate=SR, channels=2, format="OGG", subtype="VORBIS") as out:
            for i in range(0, len(interleaved), SR * 5):
                out.write(interleaved[i:i + SR * 5])
        write_midi(tr, mid, score["bpm"], score["title"] + " (BRUINS Remaster)")
        if cfg["style"] == "battle":
            for name, buf in stems.items():
                sf.write(OUT / "STEMS" / f"{stem}_{name}.wav", buf.T.astype(np.float32), SR, subtype="PCM_16")
        counts = {k: len(v) for k, v in tr.stems.items()}
        report.append({"track": stem, "title": score["title"], "bpm": score["bpm"], "duration_s": score["duration"],
                       "source_notes": len(score["notes"]), "arranged_stem_notes": counts, **stats,
                       "files": [str(wav.relative_to(ROOT)), str(ogg.relative_to(ROOT)), str(mid.relative_to(ROOT))]})
        print(stem, counts, stats)
    (OUT / "MUSIC_DOCUMENTATION" / "remaster-report.json").write_text(json.dumps(report, indent=1, ensure_ascii=False))
    print(json.dumps(report, indent=1))

if __name__ == "__main__":
    main()
