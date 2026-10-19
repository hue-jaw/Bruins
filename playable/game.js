// BRUINS — version jouable (portage fidèle du chapitre des Ruines du projet GameMaker)
// Données: window.BRUINS_DATA (injectées depuis datafiles/*.json du projet d'origine)
const D = window.BRUINS_DATA;
const cv = document.getElementById('cv'), ctx = cv.getContext('2d');
ctx.imageSmoothingEnabled = false;
const W = 640, H = 360;
const tr = v => (typeof v === 'object' ? v.fr : v);
const imgs = {};
for (const [k, src] of Object.entries({child:'../sprites/spr_child/f05122b0-96b3-4587-800e-4aa9368b536f.png', mother:'../sprites/spr_mother/d068c118-6654-485c-b071-1a39f812a26a.png', enemy:'../sprites/spr_enemy/4d73f176-e638-4b5b-935d-ceff80fba254.png'})) { const i = new Image(); i.src = src; imgs[k] = i; }

const MUS = { title:'../datafiles/music/01_BRUINS_Main_Theme.ogg', intro:'../datafiles/music/03_The_Fallen_Child.ogg', home:'../datafiles/music/05_A_Warm_Home.ogg', ruins:'../datafiles/music/06_Forgotten_Ruins.ogg', gate:'../datafiles/music/07_Something_Is_Watching.ogg', battle:'../datafiles/music/08_First_Encounter.ogg', guardian:'../datafiles/music/11_The_Guardian.ogg', toriel:'../datafiles/music/04_Toriel_s_Memories.ogg' };
const audio = new Audio(); audio.loop = true; audio.volume = .65;
let curMus = '';
function music(name){ if(curMus===name) return; curMus=name; audio.src = MUS[name]; audio.play().catch(()=>{}); }

const AFF = D.souls.affinities;
function defRun(){ return {area:'intro', px:160, py:200, hp:24, maxhp:24, gold:12,
  scores:[25,0,0,0,0,0,0,0,0,0], trust:0, affection:0, fear:0, remembered:0, kept:0, broken:0, kills:0, spared:0,
  inventory:[{id:'candy',count:2}], promise:false,
  flags:{met:false,puzzle:false,candy:false,enemy:false,enemy_spared:false,boss:false,boss_spared:false,promise:false,promise_discussed:false,cooked:false,book:false,secret:false,chapter_end:false}}; }

let S = { mode:'title', sel:0, run:defRun(), area:'intro', px:160, py:200, time:0, msg:'', msgT:0, puzzle:[], dlg:null, battle:null, walking:false };
function soulIdx(){ let b=0; for(let i=1;i<10;i++) if(S.run.scores[i]>S.run.scores[b]) b=i; return b; }
function effects(e){ if(!e) return; for(const [k,v] of Object.entries(e)){
  const i = AFF.findIndex(a=>a.id===k);
  if(i>=0) S.run.scores[i]=Math.max(0,Math.min(100,S.run.scores[i]+v));
  else if(k in S.run.flags) S.run.flags[k]=v;
  else if(k==='trust_toriel') S.run.trust+=v; else if(k==='affection_toriel') S.run.affection+=v;
  else if(k==='fear_toriel') S.run.fear+=v; else if(k==='remembered_timelines') S.run.remembered+=v;
}}
function notice(t){ S.msg=t; S.msgT=3; }
function save(){ S.run.area=S.area; S.run.px=S.px; S.run.py=S.py; localStorage.setItem('bruins_save', JSON.stringify(S.run)); notice('Souvenir conservé. (sauvegarde locale)'); }
function load(){ try{ const r=JSON.parse(localStorage.getItem('bruins_save')); if(r && r.flags){ S.run=r; enter(r.area, r.px, r.py, true); return true; } }catch(e){} return false; }

function enter(area,x,y,silent){ S.area=area; S.px=x; S.py=y; if(!silent) S.mode='world';
  music(area==='home'?'home':area==='gate'?'gate':area==='ruins'?'ruins':'intro'); }
function wall(x,y){ const m=D.world[S.area].map;
  for(const dx of [-8,8]) for(const dy of [-5,2]){ const tx=Math.floor((x+dx)/32), ty=Math.floor((y+dy)/32);
    if(tx<0||ty<0||ty>=m.length||tx>=m[0].length||m[ty][tx]==='#') return true; } return false; }

// ---------- Dialogues ----------
function startDlg(id){ const n=D.dialogues[id]; if(!n) { S.mode='world'; return; }
  S.dlg={id, node:n, shown:0, choice:0}; S.mode='dialogue';
  if(n.speaker==='Toriel') music('toriel'); }
function dlgNext(){ const n=S.dlg.node;
  if(n.choices && n.choices.length){ const c=n.choices[S.dlg.choice]; effects(c.effects); startDlg(c.next); return; }
  if(n.next) startDlg(n.next); else { S.dlg=null; S.mode='world'; music(S.area==='home'?'home':S.area==='gate'?'gate':S.area==='ruins'?'ruins':'intro'); } }

// ---------- Interactions (même logique que scr_world GML) ----------
function interact(e){ const f=S.run.flags;
  switch(e.kind){
    case 'mother':
      if(!f.met){ f.met=true; startDlg('meeting'); }
      else if(S.run.kills>0) startDlg('mother_grief');
      else if(f.boss) startDlg('mother_return');
      else if(f.promise_discussed) startDlg(f.promise?'promise':'honest');
      else { f.promise_discussed=true; startDlg('mother_home'); } break;
    case 'save': S.run.hp=S.run.maxhp; save(); break;
    case 'door':
      if(e.to==='ruins' && !f.met){ notice("Parle d'abord à la gardienne."); break; }
      if(e.to==='gate' && !f.puzzle){ notice('La porte attend trois notes (III, I, II).'); break; }
      enter(e.to, e.px, e.py); break;
    case 'sign': startDlg('inscription'); break;
    case 'switch':
      if(f.puzzle){ notice("L'accord est complet."); break; }
      S.puzzle.push(e.note); { const seq=[2,0,1], ix=S.puzzle.length-1;
        if(S.puzzle[ix]!==seq[ix]){ S.puzzle=[]; notice('Un écho sourd. Recommence : III, I, II.'); }
        else if(ix===2){ f.puzzle=true; effects({curiosity:12,patience:8}); startDlg('puzzle_done'); }
        else notice('La pierre chante.'); } break;
    case 'pickup':
      if(!f.candy){ if(addItem('candy',1)){ f.candy=true; effects({curiosity:8}); notice("Bonbon d'écho obtenu."); } }
      else notice('La boîte est vide.'); break;
    case 'enemy': if(!f.enemy) startBattle('mossling'); else startDlg(f.enemy_spared?'friend':'empty_patch'); break;
    case 'boss': if(!f.boss) startBattle('guardian'); else startDlg(f.boss_spared?'gate_after':'empty_patch'); break;
    case 'cook': if(!f.cooked){ if(addItem('pie',1)){ f.cooked=true; effects({kindness:12,affection_toriel:3}); startDlg('cooking'); } } else startDlg('cooking_after'); break;
    case 'book': if(!f.book){ f.book=true; effects({empathy:10,trust_toriel:2}); } startDlg('book'); break;
    case 'secret': if(f.book){ if(!f.secret){ f.secret=true; addItem('shard',1); effects({curiosity:15,remembered_timelines:1}); } startDlg('secret'); } else notice('Un mur couvert de poussière.'); break;
    case 'shop': startDlg('shop'); break;
    case 'buy': if(S.run.gold>=5){ if(addItem('candy',1)){ S.run.gold-=5; notice('Merci. Un bonbon pour le chemin.'); } } else notice('Il faut 5 éclats.'); break;
    case 'end': if(f.boss){ f.chapter_end=true; startDlg(S.run.kills>0?'chapter_dark':'chapter_kind'); } else notice('Le gardien ferme le passage.'); break;
  } }
function addItem(id,n){ const inv=S.run.inventory, s=inv.find(i=>i.id===id);
  if(s){ s.count+=n; return true; } if(inv.length>=8){ notice('Inventaire plein.'); return false; } inv.push({id,count:n}); return true; }
function useItem(i){ const s=S.run.inventory[i]; if(!s) return false; const it=D.items[s.id];
  if(!it.heal){ notice("Cela ne se mange pas."); return false; }
  S.run.hp=Math.min(S.run.maxhp, S.run.hp+it.heal); s.count--; if(s.count<=0) S.run.inventory.splice(i,1); return true; }

// ---------- Combat ----------
function startBattle(id){ const e=D.enemies[id];
  S.battle={id, e, hp:e.hp, calm:0, turn:0, stage:'command', sel:0, sub:0, text:tr(e.intro),
    hx:320, hy:245, inv:0, energy:3, t:0, spawn:0, bullets:[], listened:false, protected:false};
  S.mode='battle'; music(id==='guardian'?'guardian':'battle'); }
function battleEnd(spared){ const b=S.battle, f=S.run.flags;
  if(b.id==='mossling'){ f.enemy=true; f.enemy_spared=spared; } else { f.boss=true; f.boss_spared=spared; }
  S.run.gold+=b.e.reward;
  if(spared){ S.run.spared++; effects({kindness:35,empathy:12,trust_toriel:2}); if(f.promise){ S.run.kept++; } }
  else { S.run.kills++; effects({chaos:18,bravery:10,trust_toriel:-4,fear_toriel:3}); if(f.promise){ S.run.broken++; f.promise=false; } }
  S.battle=null; music(S.area==='gate'?'gate':'ruins'); startDlg(spared?'victory_kind':'victory_kill'); }
function battleTurn(){ const b=S.battle; b.stage='dodge'; b.turn++; b.t=0; b.spawn=0; b.bullets=[]; b.hx=320; b.hy=245; b.inv=.7; b.energy=3;
  b.text=tr(AFF[soulIdx()].hint); }
function damage(){ const b=S.battle; if(b.inv>0) return;
  let d=Math.max(1, b.e.attack - (soulIdx()===0 && S.run.hp<=6 ? 1:0));
  S.run.hp=Math.max(0,S.run.hp-d); b.inv=1;
  if(S.run.hp<=0){ S.mode='dead'; audio.pause(); } }

// ---------- Entrées ----------
const keys={};
addEventListener('keydown', e=>{ keys[e.key.toLowerCase()]=true;
  if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(e.key.toLowerCase())) e.preventDefault();
  press(e.key.toLowerCase()); });
addEventListener('keyup', e=> keys[e.key.toLowerCase()]=false);
const K = { ok:['enter','z'], back:['escape','x'], up:['arrowup','w'], down:['arrowdown','s'], left:['arrowleft','a'], right:['arrowright','d'] };
const hit = (...ns)=> ns.some(n=>K[n].includes(eventKey));
let eventKey='';
function press(k){ eventKey=k; musicResume();
  if(S.mode==='title'){ if(hit('down')) S.sel=(S.sel+1)%3; if(hit('up')) S.sel=(S.sel+2)%3;
    if(hit('ok')){ if(S.sel===0){ S.run=defRun(); S.puzzle=[]; enter('intro',160,200,true); startDlg('opening'); }
      else if(S.sel===1){ if(!load()) notice('Aucune sauvegarde valide.'); else S.mode='world'; }
      else notice('BRUINS — démo jouable du chapitre des Ruines.'); } return; }
  if(S.mode==='dead'){ if(hit('ok')){ if(!load()){ S.run=defRun(); enter('intro',160,200,true); } S.mode='world'; } return; }
  if(S.mode==='dialogue'){ const n=S.dlg.node;
    if(n.choices && n.choices.length){ if(hit('down')) S.dlg.choice=(S.dlg.choice+1)%n.choices.length; if(hit('up')) S.dlg.choice=(S.dlg.choice+n.choices.length-1)%n.choices.length; }
    if(hit('ok')){ if(S.dlg.shown < tr(n.text).length) S.dlg.shown=tr(n.text).length; else dlgNext(); } return; }
  if(S.mode==='inventory'){ if(hit('back','ok')) S.mode='world'; return; }
  if(S.mode==='world'){ if(k==='c'){ S.mode='inventory'; return; }
    if(hit('ok')){ const es=D.world[S.area].entities; let best=null,bd=48;
      for(const e of es){ const d=Math.hypot(S.px-e.x,S.py-e.y); if(d<bd){bd=d;best=e;} } if(best) interact(best); } return; }
  if(S.mode==='battle') battlePress();
}
function musicResume(){ if(audio.paused && curMus) audio.play().catch(()=>{}); }
function battlePress(){ const b=S.battle; if(!b) return;
  if(b.stage==='command'){ if(hit('right')) b.sel=(b.sel+1)%4; if(hit('left')) b.sel=(b.sel+3)%4;
    if(hit('ok')){ b.sub=0; b.stage=['aim','act','item','mercy'][b.sel]; if(b.stage==='aim') b.aim=0; } return; }
  if(b.stage==='aim'){ if(hit('ok')) aimFire(); return; }
  if(['act','item','mercy'].includes(b.stage)){
    const count = b.stage==='act'? b.e.actions.length : b.stage==='item'? Math.max(1,S.run.inventory.length) : 2;
    if(hit('down')) b.sub=(b.sub+1)%count; if(hit('up')) b.sub=(b.sub+count-1)%count;
    if(hit('back')){ b.stage='command'; return; }
    if(!hit('ok')) return;
    if(b.stage==='act'){ const a=b.e.actions[b.sub]; b.calm+=a.calm; effects(a.effects);
      if(a.id==='listen') b.listened=true; if(a.id==='protect') b.protected=true;
      b.text=tr(a.response); b.stage='response'; return; }
    if(b.stage==='item'){ if(useItem(b.sub)){ b.text='Le goût te ramène au présent.'; b.stage='response'; } return; }
    if(b.stage==='mercy'){ if(b.sub===1){ if(b.e.boss){ b.text='La porte est encore fermée.'; b.stage='response'; }
        else { S.battle=null; S.mode='world'; music('ruins'); } return; }
      if(b.calm>=b.e.mercy && (!b.e.boss || (b.listened&&b.protected))) battleEnd(true);
      else { b.text='Pas encore. Écoute ce qui le retient.'; b.stage='response'; } return; }
  }
  if(b.stage==='response' && hit('ok')) battleTurn();
}
function aimFire(){ const b=S.battle; const q=Math.max(0,1-Math.abs(b.aim-.5)*2);
  const dmg=Math.max(1, Math.round(3+q*9-b.e.defense)); b.hp-=dmg; b.text=dmg+' dégâts.';
  if(b.hp<=0) battleEnd(false); else battleTurn(); }

// ---------- Boucle ----------
let last=0;
function loop(ts){ const dt=Math.min(.05,(ts-last)/1000||0); last=ts; S.time+=dt;
  if(S.dlg) S.dlg.shown=Math.min(tr(S.dlg.node.text).length, S.dlg.shown+dt*45);
  S.msgT=Math.max(0,S.msgT-dt);
  if(S.mode==='world') stepWorld(dt);
  if(S.mode==='battle') stepBattle(dt);
  draw(); requestAnimationFrame(loop); }
function stepWorld(dt){ let dx=(keys['arrowright']||keys['d']?1:0)-(keys['arrowleft']||keys['a']?1:0);
  let dy=(keys['arrowdown']||keys['s']?1:0)-(keys['arrowup']||keys['w']?1:0);
  const l=Math.hypot(dx,dy)||1; dx=dx/l*105*dt; dy=dy/l*105*dt; S.walking=!!(dx||dy);
  if(!wall(S.px+dx,S.py)) S.px+=dx; if(!wall(S.px,S.py+dy)) S.py+=dy; }
function stepBattle(dt){ const b=S.battle; if(!b) return;
  if(b.stage==='aim'){ b.aim+=dt*1.2; if(b.aim>=1) aimFire(); return; }
  if(b.stage!=='dodge') return;
  b.t+=dt; b.inv=Math.max(0,b.inv-dt);
  const si=soulIdx(); let sp = si===2?175:125;
  let dx=(keys['arrowright']||keys['d']?1:0)-(keys['arrowleft']||keys['a']?1:0);
  let dy=(keys['arrowdown']||keys['s']?1:0)-(keys['arrowup']||keys['w']?1:0);
  const l=Math.hypot(dx,dy)||1;
  b.hx=Math.max(206,Math.min(434,b.hx+dx/l*sp*dt)); b.hy=Math.max(186,Math.min(282,b.hy+dy/l*sp*dt));
  const slow = si===1 && keys[' '] && b.energy>0; if(slow) b.energy-=dt;
  const bscale = slow?.35:1, interval=b.e.boss?.42:.65, vel=90;
  b.spawn-=dt;
  if(b.spawn<=0){ b.spawn+=interval; const pat=(b.turn-1)%4;
    if(pat===0) b.bullets.push({x:220+((Math.floor(b.t/interval)*47)%200), y:180, vx:0, vy:vel, kind:si===2?1:0});
    if(pat===1){ const a=Math.atan2(b.hy-180,b.hx-320); b.bullets.push({x:320,y:180,vx:Math.cos(a)*vel,vy:Math.sin(a)*vel,kind:0}); }
    if(pat===2) for(let j=0;j<5;j++){ const a=j*36+10; b.bullets.push({x:320,y:180,vx:Math.cos(a*Math.PI/180)*vel*.7,vy:Math.abs(Math.sin(a*Math.PI/180)*vel),kind:0}); }
    if(pat===3) b.bullets.push({x:215+((Math.floor(b.t/interval)*53)%210), y:180, vx:0, vy:vel*1.2, kind:0});
  }
  for(let i=b.bullets.length-1;i>=0;i--){ const p=b.bullets[i]; p.x+=p.vx*dt*bscale; p.y+=p.vy*dt*bscale;
    if(p.x<190||p.x>450||p.y>298||p.y<170){ b.bullets.splice(i,1); continue; }
    const d=Math.hypot(p.x-b.hx,p.y-b.hy);
    if(d<8 && !(p.kind===1 && (dx||dy))){ damage(); b.bullets.splice(i,1); } }
  if(b.t>=6.5){ b.stage='command'; b.text=tr(b.e.turn_text); if(b.calm>=b.e.mercy) b.text='Il hésite. MERCY devient possible.'; } }

// ---------- Rendu ----------
const PAL = { intro:['#3a3348','#57506b','#6d7c5f'], ruins:['#33304a','#4d4869','#5f6d7c'], home:['#4a3428','#6b4d38','#7c5f4d'], gate:['#2c2c3e','#45455e','#5c5c74'] };
function box(x,y,w,h,c){ ctx.fillStyle=c; ctx.fillRect(x,y,w,h); }
function txt(t,x,y,c='#fff',s=13,align='left'){ ctx.fillStyle=c; ctx.font=s+'px monospace'; ctx.textAlign=align; ctx.fillText(t,x,y); ctx.textAlign='left'; }
function wrap(t,x,y,max,c='#fff',s=13,lh=18){ ctx.fillStyle=c; ctx.font=s+'px monospace';
  let line='',yy=y; for(const w of t.split(' ')){ if(ctx.measureText(line+w).width>max){ ctx.fillText(line,x,yy); yy+=lh; line=''; } line+=w+' '; }
  ctx.fillText(line,x,yy); return yy; }
function draw(){ box(0,0,W,H,'#14101e');
  if(S.mode==='title'){ txt('B R U I N S',320,110,'#f2d38a',42,'center'); txt('Fragments of a Broken Timeline',320,140,'#bdb6d9',13,'center');
    ['NOUVELLE PARTIE','CHARGER','À PROPOS — démo jouable, chapitre des Ruines'].forEach((o,i)=>txt((S.sel===i?'> ':'  ')+o,220,200+i*32,S.sel===i?'#ffe27a':'#fff',14));
    txt('Flèches/WASD + Entrée/Z pour choisir — cliquez puis jouez au clavier',320,330,'#8f89ad',11,'center'); music('title'); return; }
  if(S.mode==='dead'){ txt('Ton âme se fissure… mais un souvenir demeure.',320,170,'#e5536e',18,'center'); txt('Entrée : revenir au dernier souvenir',320,210,'#fff',13,'center'); return; }
  // monde
  const [dk,fl,ac]=PAL[S.area], m=D.world[S.area].map;
  for(let y=0;y<m.length;y++) for(let x=0;x<m[y].length;x++){ box(x*32,y*32,32,32, m[y][x]==='#'?dk:fl);
    if(m[y][x]!=='#' && ((x*7+y*13)%9===0)) box(x*32+13,y*32+13,5,5,ac); }
  txt(tr(D.world[S.area].name),14,22,'#e8e2ff',12);
  txt('PV '+S.run.hp+'/'+S.run.maxhp+'   Or '+S.run.gold+'   Âme: '+tr(AFF[soulIdx()].name),400,22,'#ffe27a',12);
  for(const e of D.world[S.area].entities) drawEntity(e);
  const bob = S.walking? Math.round(Math.sin(S.time*16)*1.5):0;
  if(imgs.child.complete) ctx.drawImage(imgs.child, S.px-16, S.py-38+bob, 32, 40);
  txt('Z: interagir  C: inventaire',14,348,'#cfc9e8',11);
  if(S.msgT>0) txt(S.msg,320,330,'#ffe27a',13,'center');
  if(S.mode==='dialogue' && S.dlg) drawDlg();
  if(S.mode==='inventory') drawInv();
  if(S.mode==='battle') drawBattle();
}
function drawEntity(e){ const f=S.run.flags;
  if(e.kind==='enemy' && f.enemy && !f.enemy_spared) return;
  if(e.kind==='boss' && f.boss && !f.boss_spared) return;
  if(e.kind==='mother' && imgs.mother.complete){ ctx.drawImage(imgs.mother, e.x-18, e.y-40, 36, 42); }
  else if((e.kind==='enemy'||e.kind==='boss') && imgs.enemy.complete){ const s=e.kind==='boss'?2.2:1.4; ctx.drawImage(imgs.enemy, e.x-20*s, e.y-14*s-10, 40*s, 28*s); }
  else if(e.kind==='save'){ box(e.x-8,e.y-8,16,16,'#ffd94d'); txt('✦',e.x,e.y+5,'#7a5b00',14,'center'); }
  else if(e.kind==='switch'){ box(e.x-13,e.y-13,26,26,'#6d7fd9'); txt(tr(e.label),e.x,e.y+5,'#fff',13,'center'); }
  else if(e.kind==='door'||e.kind==='end'){ box(e.x-16,e.y-20,32,40,'#8a6d4f'); box(e.x-3,e.y-3,6,6,'#ffd94d'); }
  else { box(e.x-11,e.y-11,22,22,'#9a86c8'); }
  txt(tr(e.label), e.x, e.y+30, '#e8e2ff', 11, 'center'); }
function drawDlg(){ const n=S.dlg.node; box(28,238,584,104,'#0d0b16'); ctx.strokeStyle='#e8e2ff'; ctx.strokeRect(28,238,584,104);
  if(n.speaker==='Toriel' && imgs.mother.complete) ctx.drawImage(imgs.mother,42,252,54,63);
  txt(n.speaker,110,262,'#ffd94d',13);
  const shown=tr(n.text).slice(0,Math.floor(S.dlg.shown)); wrap(shown.replace(/\n/g,' '),110,284,470);
  if(S.dlg.shown>=tr(n.text).length && n.choices && n.choices.length){ box(28,238,584,104,'#0d0b16'); ctx.strokeStyle='#e8e2ff'; ctx.strokeRect(28,238,584,104); txt(n.speaker+' — choisis (↑↓ puis Z)',42,262,'#ffd94d',12); n.choices.forEach((c,i)=>txt((S.dlg.choice===i?'> ':'  ')+tr(c.text),48,282+i*13,S.dlg.choice===i?'#ffe27a':'#fff',11)); }
}
function drawInv(){ box(60,60,520,240,'#0d0b16'); ctx.strokeStyle='#fff'; ctx.strokeRect(60,60,520,240);
  txt('INVENTAIRE (C/X: fermer)',84,92,'#ffd94d',16);
  if(!S.run.inventory.length) txt('(vide)',84,130);
  S.run.inventory.forEach((s,i)=>{ const it=D.items[s.id]; txt(tr(it.name)+' x'+s.count+' — '+tr(it.description),84,130+i*24,'#fff',12); });
  txt('Âme dominante : '+tr(AFF[soulIdx()].name)+' — '+tr(AFF[soulIdx()].hint),84,268,'#bdb6d9',11); }
function drawBattle(){ const b=S.battle; box(0,0,W,H,'#0a0812');
  if(imgs.enemy.complete){ const s=b.e.boss?4:3; ctx.drawImage(imgs.enemy,320-20*s,40,40*s,28*s); }
  txt(tr(b.e.name),320,26,'#fff',15,'center'); txt('PV ennemi: '+Math.max(0,b.hp),320,150,'#e58aa0',12,'center');
  box(198,178,244,112,'#0d0b16'); ctx.strokeStyle='#fff'; ctx.strokeRect(198,178,244,112);
  for(const p of b.bullets){ ctx.fillStyle=p.kind===1?'#f69941':'#f2f2ff'; ctx.beginPath(); ctx.arc(p.x,p.y,5,0,7); ctx.fill(); }
  const c=AFF[soulIdx()].color; ctx.fillStyle=`rgb(${c[0]},${c[1]},${c[2]})`;
  if(b.inv>0 && Math.floor(S.time*16)%2) ctx.fillStyle='#ffffff';
  ctx.beginPath(); ctx.moveTo(b.hx,b.hy+7); ctx.bezierCurveTo(b.hx-9,b.hy-2,b.hx-5,b.hy-11,b.hx,b.hy-4); ctx.bezierCurveTo(b.hx+5,b.hy-11,b.hx+9,b.hy-2,b.hx,b.hy+7); ctx.fill();
  box(28,300,584,48,'#0d0b16'); ctx.strokeStyle='#e8e2ff'; ctx.strokeRect(28,300,584,48);
  if(b.stage==='command'){ ['FIGHT','ACT','ITEM','MERCY'].forEach((o,i)=>txt((b.sel===i?'> ':'  ')+o,70+i*140,330,b.sel===i?'#ffe27a':'#fff',15)); }
  else if(b.stage==='aim'){ box(120,322,400,10,'#333'); box(120+400*b.aim,318,6,18,'#ffe27a'); txt('Z au centre !',320,312,'#fff',11,'center'); }
  else if(['act','item','mercy'].includes(b.stage)){ const opts = b.stage==='act'? b.e.actions.map(a=>tr(a.name)) : b.stage==='item'? (S.run.inventory.length?S.run.inventory.map(s=>tr(D.items[s.id].name)+' x'+s.count):['(vide)']) : ['ÉPARGNER','FUIR'];
    opts.forEach((o,i)=>txt((b.sub===i?'> ':'  ')+o,60,318+i*14,'#fff',11)); }
  else wrap(b.text,44,326,550,'#fff',12);
  txt('PV '+S.run.hp+'/'+S.run.maxhp,540,22,'#ffe27a',13); }
music('title');
requestAnimationFrame(loop);
