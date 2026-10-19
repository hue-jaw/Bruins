/* BRUINS OST v1: deterministic original scores, MIDI, stereo synthesis, OGG and MP3.
   No external samples, pretrained audio or copied melodies. Not a mastered live orchestra. */
const fs=require('fs'),path=require('path'),cp=require('child_process'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),album=path.join(root,'OST');for(const d of['MP3','MIDI','Scores','WAV'])fs.mkdirSync(path.join(album,d),{recursive:true});fs.mkdirSync(path.join(root,'datafiles','music'),{recursive:true});
const rows=[
['BRUINS - Main Theme',180,96,57,'hope',[0,2,6,4,3,1,2,0]],
['A Different Timeline',160,90,62,'mystery',[0,1,4,3,6,4,2,1]],
['The Fallen Child',150,72,57,'piano',[4,2,0,-1,0,3,2,0]],
["Toriel's Memories",220,76,60,'warm',[0,3,2,4,6,5,2,0]],
['A Warm Home',170,84,65,'warm',[2,4,3,1,0,2,1,0]],
['Forgotten Ruins',180,88,57,'mystery',[0,4,3,1,2,5,3,0]],
['Something Is Watching',140,80,58,'dark',[0,-1,3,1,0,4,1,-1]],
['First Encounter',165,128,57,'battle',[0,0,4,2,6,4,3,1]],
['Echoing Forest',200,104,62,'forest',[0,2,5,4,2,3,6,4]],
['Gentle Monsters',155,108,65,'warm',[0,2,1,4,3,5,2,0]],
['The Guardian',225,120,55,'boss',[0,4,6,5,3,4,1,0]],
['Hollow City',210,102,60,'city',[2,0,3,5,4,1,2,-1]],
['Nobody Remembers',190,68,57,'piano',[4,3,1,0,-2,0,2,1]],
['The Clockmaker',260,140,62,'clock',[0,3,1,4,2,6,3,5]],
['Fractured Time',195,112,58,'clock',[0,1,5,2,4,-1,3,0]],
['Soul Archive',220,92,64,'mystery',[0,4,2,6,5,1,3,2]],
['Colors of the Soul',205,110,60,'hope',[0,2,4,6,5,3,1,4]],
['Your Other Self',270,144,57,'boss',[0,4,1,5,2,6,3,0]],
['Determination',210,132,62,'battle',[0,2,4,3,6,4,5,7]],
['Patience',175,66,65,'piano',[0,3,2,1,4,2,0,-1]],
['Bravery',195,152,60,'battle',[0,4,2,5,3,7,6,4]],
['Broken Promises',220,74,58,'dark',[4,1,0,-1,3,0,-2,-1]],
['Final Timeline',290,138,57,'boss',[0,2,6,4,7,5,3,4]],
['The World Is Empty',250,60,55,'dark',[0,-2,-1,2,0,-3,-1,0]],
['One Last Goodbye',225,70,60,'piano',[0,3,2,4,1,0,-1,0]],
['The True Ending',270,100,62,'hope',[0,2,6,4,3,5,7,4]],
['Beyond the Reset',240,94,57,'mystery',[0,2,6,1,4,3,-1,0]]];
const modes={hope:[0,2,4,5,7,9,11],warm:[0,2,4,5,7,9,11],forest:[0,2,3,5,7,9,10],city:[0,2,3,5,7,9,10],mystery:[0,2,3,5,7,8,11],dark:[0,1,3,5,7,8,10],piano:[0,2,3,5,7,8,10],battle:[0,2,3,5,7,8,10],boss:[0,2,3,5,7,8,11],clock:[0,2,3,6,7,8,11]};
const SR=22050,TABLE=4096,SINE=Float32Array.from({length:TABLE},(_,i)=>Math.sin(i*2*Math.PI/TABLE));
function degree(root,key,d){const octave=Math.floor(d/7),i=((d%7)+7)%7;return root+key[i]+octave*12;}
function score(row,index){const[title,duration,bpm,tonic,style,motif]=row,beat=60/bpm,bar=beat*4,bars=Math.floor((duration-3)/bar),notes=[],sections=[];const scale=modes[style];const roots=index%3===0?[0,5,3,4]:index%3===1?[0,3,5,4]:[0,6,3,4];
 const sectionsPlan=[['intro',.08],['A',.19],['A_variation',.16],['B',.18],['bridge',.12],['return',.17],['coda',.1]];let cursor=0;for(let i=0;i<sectionsPlan.length;i++){const[name,ratio]=sectionsPlan[i],end=i===sectionsPlan.length-1?bars:cursor+Math.max(2,Math.round(bars*ratio));sections.push({name,startBar:cursor,endBar:Math.min(bars,end)});cursor=end;}
 function add(t,d,m,v,instrument,pan=0){if(t>=duration-1||m<24||m>108)return;notes.push({t:+t.toFixed(5),d:+Math.min(d,duration-t-.1).toFixed(5),m,v,instrument,pan});}
 for(let b=0;b<bars;b++){const sec=sections.find(s=>b>=s.startBar&&b<s.endBar)||sections.at(-1),part=sec.name,local=b-sec.startBar,chord=roots[Math.floor(b/2)%4],r=degree(tonic,scale,chord),t=b*bar;const loud=['battle','boss','clock'].includes(style),quiet=['piano','dark'].includes(style),intensity=part==='intro'?.42:part==='bridge'?.52:part==='return'?1:part==='coda'?.55:.8;
  // Harmonic bed: voiced triads and suspended sevenths, with real release tails.
  if(b%2===0)for(const [j,step]of[0,2,4,6].entries())add(t,bar*1.85,degree(tonic,scale,chord+step),.075*intensity,'pad',(j-1.5)*.34);
  // Bass and independent rhythmic accompaniment.
  for(let k=0;k<(quiet?2:4);k++){const pos=k*(quiet?2:1);add(t+pos*beat,beat*(quiet?1.7:.72),r-12+(k===3?7:0),.18*intensity,'bass',-.05);}
  if(part!=='intro'&&part!=='coda')for(let k=0;k<8;k++){const step=[0,2,4,6,4,2,4,2][(k+index)%8];add(t+k*beat/2,beat*.42,degree(tonic,scale,chord+step+7),.055*intensity,style==='clock'?'bell':'pluck',k%2?.42:-.42);}
  // Main melody: eight-note two-bar phrases; variation, answer, bridge and return.
  if(b%2===0){let phrase=motif.slice();if(part==='B')phrase=phrase.map((d,i)=>motif[(i+3)%8]+(i%3===0?2:-1));if(part==='bridge')phrase=[motif[4],motif[2],motif[0],-1,1,3,2,0];if(part==='A_variation')phrase=phrase.map((d,i)=>d+(i===3?2:i===6?-1:0));if(part==='coda')phrase=[motif[0],motif[2],motif[1],0,2,1,0,0];if(part==='return'&&index!==0&&index%4===0)phrase=[0,2,6,4,3,1,2,0];
   const rhythm=style==='clock'?[0,.75,1.5,2.5,4,4.75,5.5,7]:index%2?[0,1.5,2,3,4.5,5,6,7]:[0,1,2.5,3,4,5.5,6,7];
   for(let k=0;k<8;k++){if(part==='intro'&&k%2)continue;if(style==='dark'&&part==='bridge'&&k>3)continue;const upper=part==='return'&&loud?12:0;const d=degree(tonic+12+upper,scale,phrase[k]);const len=k===7?beat*1.7:beat*(quiet?1.2:.78);add(t+rhythm[k]*beat,len,d,.17*intensity,loud?'lead':style==='forest'?'bell':'piano',-.12);if(part==='return'&&!quiet&&k%2===0)add(t+rhythm[k]*beat,beat*1.2,d-12,.065,'bell',.35);}
  }
  if(!quiet&&part!=='intro'&&part!=='coda'){for(let k=0;k<8;k++)add(t+k*beat/2,.12,42,.045*intensity,'hat',k%2?.6:-.6);for(const k of[0,2])add(t+k*beat,.25,36,.22*intensity,'kick');for(const k of[1,3])add(t+k*beat,.18,38,.12*intensity,'snare',.12);if(loud&&local%8===7)for(let k=0;k<4;k++)add(t+(3+k/4)*beat,.11,38,.07+k*.015,'snare',k%2?.4:-.4);}
 }
 const endT=(bars-1)*bar;for(const d of[0,2,4])add(endT,Math.min(6,duration-endT-.2),degree(tonic,scale,d),.09,'piano',0);
 return {version:1,index:index+1,title,duration,bpm,tonic,style,motif,sections,notes};}
function render(s){const n=Math.ceil(s.duration*SR),L=new Float32Array(n),R=new Float32Array(n);let rng=12345+s.index*991;function noise(){rng=(Math.imul(rng,1664525)+1013904223)>>>0;return rng/2147483648-1;}function sin(p){return SINE[(p|0)&4095];}
 for(const e of s.notes){const start=Math.floor(e.t*SR),count=Math.min(Math.ceil(e.d*SR),n-start),freq=440*Math.pow(2,(e.m-69)/12),inc=freq/SR*TABLE;let phase=0,env=1;const decay=Math.exp(-1/(SR*(e.instrument==='piano'?.65:e.instrument==='bell'?.9:e.instrument==='bass'?.35:.22))),left=Math.sqrt((1-e.pan)/2)*e.v,right=Math.sqrt((1+e.pan)/2)*e.v;
  for(let j=0;j<count;j++){const time=j/SR,tail=Math.min(1,(count-j)/(SR*.06)),attack=Math.min(1,j/(SR*(e.instrument==='pad'?.3:.008)));let v=0;
   switch(e.instrument){case'pad':v=(sin(phase)+.24*sin(phase*1.003)+.12*sin(phase*2))*attack*tail;break;case'lead':v=(sin(phase)+.30*sin(phase*3)+.13*sin(phase*5))*attack*tail;break;case'piano':v=(sin(phase)+.35*sin(phase*2)+.14*sin(phase*3))*env*attack*tail;break;case'bell':v=(sin(phase)+.25*sin(phase*2.76))*env*attack*tail;break;case'bass':v=(sin(phase)+.23*sin(phase*2))*env*attack*tail;break;case'kick':v=sin(TABLE*(45*time+7*(1-Math.exp(-time*28))))*Math.exp(-time*19);break;case'snare':v=(noise()*.8+sin(phase)*.2)*Math.exp(-time*25);break;case'hat':v=noise()*Math.exp(-time*65);break;default:v=(sin(phase)+.2*sin(phase*2))*env*attack*tail;}
   L[start+j]+=v*left;R[start+j]+=v*right;phase+=inc;env*=decay;
  }
 }
 const d1=Math.floor(SR*.179),d2=Math.floor(SR*.293);let peak=0,sum=0;for(let i=0;i<n;i++){const l=L[i],r=R[i];if(i>=d1){L[i]+=R[i-d1]*.12;R[i]+=L[i-d1]*.12;}if(i>=d2){L[i]+=L[i-d2]*.06;R[i]+=R[i-d2]*.06;}const fade=Math.min(1,i/(SR*.3),(n-i)/(SR*3));L[i]*=fade;R[i]*=fade;peak=Math.max(peak,Math.abs(L[i]),Math.abs(R[i]));}
 const gain=.87/Math.max(.01,peak),pcm=Buffer.alloc(n*4);let peakOut=0;for(let i=0;i<n;i++){const l=Math.round(L[i]*gain*32767),r=Math.round(R[i]*gain*32767);pcm.writeInt16LE(l,i*4);pcm.writeInt16LE(r,i*4+2);peakOut=Math.max(peakOut,Math.abs(l),Math.abs(r));sum+=l*l+r*r;}
 const h=Buffer.alloc(44);h.write('RIFF');h.writeUInt32LE(36+pcm.length,4);h.write('WAVEfmt ',8);h.writeUInt32LE(16,16);h.writeUInt16LE(1,20);h.writeUInt16LE(2,22);h.writeUInt32LE(SR,24);h.writeUInt32LE(SR*4,28);h.writeUInt16LE(4,32);h.writeUInt16LE(16,34);h.write('data',36);h.writeUInt32LE(pcm.length,40);return {wav:Buffer.concat([h,pcm]),peak:peakOut,rms:Math.sqrt(sum/(n*2))};}
function vlq(n){let out=[n&127];while((n>>=7)>0)out.unshift((n&127)|128);return out;}
function midi(s){const ppq=480,tempo=Math.round(60000000/s.bpm),events=[{t:0,b:[255,81,3,(tempo>>16)&255,(tempo>>8)&255,tempo&255]}],channels={piano:0,lead:1,pad:2,bass:3,bell:4,pluck:5,kick:9,snare:9,hat:9};for(const[ch,program]of[[0,0],[1,80],[2,89],[3,38],[4,10],[5,24]])events.push({t:0,b:[192+ch,program]});for(const n of s.notes){const ch=channels[n.instrument],on=Math.round(n.t*s.bpm/60*ppq),off=Math.round((n.t+n.d)*s.bpm/60*ppq),vel=Math.max(1,Math.min(127,Math.round(n.v*400)));events.push({t:on,b:[144+ch,n.m,vel]},{t:off,b:[128+ch,n.m,0]});}events.sort((a,b)=>a.t-b.t);let last=0,bytes=[];for(const e of events){bytes.push(...vlq(e.t-last),...e.b);last=e.t;}bytes.push(0,255,47,0);const head=Buffer.from([77,84,104,100,0,0,0,6,0,0,0,1,1,224]),track=Buffer.alloc(8);track.write('MTrk');track.writeUInt32BE(bytes.length,4);return Buffer.concat([head,track,Buffer.from(bytes)]);}
const manifest=[];
for(let i=0;i<rows.length;i++){
 const s=score(rows[i],i),stem=String(i+1).padStart(2,'0')+'_'+s.title.replace(/[^a-zA-Z0-9]+/g,'_').replace(/_$/,''),wavPath=path.join(album,'WAV',stem+'.wav'),mp3Path=path.join(album,'MP3',stem+'.mp3'),oggPath=path.join(root,'datafiles','music',stem+'.ogg');
 fs.writeFileSync(path.join(album,'Scores',stem+'.json'),JSON.stringify(s));fs.writeFileSync(path.join(album,'MIDI',stem+'.mid'),midi(s));
 const rendered=render(s);fs.writeFileSync(wavPath,rendered.wav);
 for(const [dest,args]of[[mp3Path,['-c:a','libmp3lame','-b:a','160k']],[oggPath,['-c:a','libvorbis','-q:a','5']]]){const result=cp.spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',wavPath,...args,'-metadata','title='+s.title,'-metadata','album=BRUINS - Fragments of a Broken Timeline','-metadata','artist=BRUINS original synthesized score','-metadata','track='+s.index,dest],{encoding:'utf8',windowsHide:true});if(result.status!==0)throw Error(result.stderr||'FFmpeg failed');}
 manifest.push({index:i,id:stem,title:s.title,duration:s.duration,bpm:s.bpm,path:'music/'+stem+'.ogg',mp3:'OST/MP3/'+stem+'.mp3',midi:'OST/MIDI/'+stem+'.mid',sections:s.sections,notes:s.notes.length,peak:rendered.peak,rms:Math.round(rendered.rms),sha256:crypto.createHash('sha256').update(fs.readFileSync(mp3Path)).digest('hex')});
 fs.writeFileSync(path.join(album,'manifest.json'),JSON.stringify(manifest,null,2));console.log(`${s.index}/27 ${s.title}: ${s.duration}s, ${s.notes.length} notes, MP3 + OGG + MIDI`);
}
fs.writeFileSync(path.join(root,'datafiles','tracks.json'),JSON.stringify(manifest.map(({id,title,duration,bpm,path})=>({id,title,duration,bpm,path})),null,2));
fs.writeFileSync(path.join(album,'README.md'),'# BRUINS — OST v1\n\n27 compositions originales synthétisées, avec introductions, thèmes, variations, ponts, reprises et codas. Les durées correspondent au cahier des charges. Les leitmotivs relient certains morceaux.\n\nMP3 : écoute directe. WAV : rendus stéréo PCM 22 050 Hz. MIDI et Scores : sources éditables, à réorchestrer si souhaité. OGG : versions intégrées au projet GameMaker.\n\nCe sont des arrangements synthétiques : aucun orchestre enregistré, aucun échantillon tiers. Validation technique du signal et du décodage ; écoute artistique complète et mastering restent à faire. La présence d’une piste ne signifie pas que son chapitre est déjà créé.\n');
console.log('OST render complete: '+manifest.reduce((a,t)=>a+t.duration,0)+' seconds.');
