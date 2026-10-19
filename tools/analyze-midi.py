#!/usr/bin/env python3
"""Analyse honnête des MIDI reconstruits depuis tools/compose-ost.cjs (Codex).
Parseur MIDI 100% stdlib. Sortie: MUSIC_DOCUMENTATION/midi-analysis.json + résumé stdout."""
import json, struct, sys
from pathlib import Path
from collections import Counter, defaultdict

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "BRUINS_OST_REMASTERED" / "MIDI_SOURCES"
NAMES = {0:"piano",1:"square_lead(GM80)",2:"pad(GM89)",3:"bass_synth(GM38)",4:"music_box(GM10)",5:"guitar_nylon(GM24)",9:"drums_GM"}

def vlq(b,i):
    v=0
    while True:
        x=b[i]; i+=1; v=(v<<7)|(x&0x7f)
        if not x&0x80: return v,i

def parse(p):
    d=p.read_bytes(); assert d[:4]==b'MThd'
    fmt,ntrk,ppq=struct.unpack('>HHH',d[8:14]); i=14; notes=[]; tempo=500000; programs={}
    for _ in range(ntrk):
        assert d[i:i+4]==b'MTrk'; ln=struct.unpack('>I',d[i+4:i+8])[0]; end=i+8+ln; i+=8; tick=0; run=None
        while i<end:
            dt,i=vlq(d,i); tick+=dt
            st=d[i]
            if st&0x80: run=st; i+=1
            else: st=run
            hi=st&0xf0; ch=st&0x0f
            if st==0xff:
                typ=d[i]; i+=1; ln2,i=vlq(d,i)
                if typ==0x51: tempo=int.from_bytes(d[i:i+3],'big')
                i+=ln2
            elif st in (0xf0,0xf7):
                ln2,i=vlq(d,i); i+=ln2
            elif hi==0xc0: programs[ch]=d[i]; i+=1
            elif hi==0xd0: i+=1
            else:
                a,b=d[i],d[i+1]; i+=2
                if hi==0x90 and b>0: notes.append([tick,None,ch,a,b])
                elif hi in (0x80,0x90):
                    for n in reversed(notes):
                        if n[2]==ch and n[3]==a and n[1] is None: n[1]=tick; break
    bpm=60000000/tempo
    for n in notes:
        if n[1] is None: n[1]=n[0]
    sec=lambda t: t/ppq*60/bpm
    out={"file":p.name,"bpm":round(bpm,1),"ppq":ppq,"programs":programs,"notes":len(notes),
         "duration_s":round(max((sec(n[1]) for n in notes),default=0),1),"channels":{}}
    by=defaultdict(list)
    for n in notes: by[n[2]].append(n)
    for ch,ns in sorted(by.items()):
        pitches=[n[3] for n in ns]
        out["channels"][str(ch)]={"instrument":NAMES.get(ch,f"ch{ch}"),"notes":len(ns),
            "pitch_min":min(pitches),"pitch_max":max(pitches),
            "top_pitches":[list(x) for x in Counter(pitches).most_common(5)]}
    # motif de la mélodie: canal avec le plus de notes aiguës non-pad
    lead=max((c for c in by if c not in (2,9)), key=lambda c: sum(n[3] for n in by[c])/len(by[c]), default=None)
    if lead is not None:
        mel=sorted(by[lead])[:16]
        out["lead_channel"]=lead; out["lead_opening_pitches"]=[n[3] for n in mel]
    return out

def main():
    res=[parse(p) for p in sorted(SRC.glob("*.mid"))]
    dst=ROOT/"BRUINS_OST_REMASTERED"/"MUSIC_DOCUMENTATION"/"midi-analysis.json"
    dst.write_text(json.dumps(res,indent=1,ensure_ascii=False))
    for r in res:
        print(f"{r['file'][:44]:44s} bpm={r['bpm']:6} notes={r['notes']:5} dur={r['duration_s']:6}s chans={list(r['channels'])} lead={r.get('lead_opening_pitches')}")
    print("->",dst)

if __name__=="__main__": main()
