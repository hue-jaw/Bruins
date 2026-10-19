const fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'..');
function edit(p,fn){p=path.join(root,p);fs.writeFileSync(p,fn(fs.readFileSync(p,'utf8')));}
function replace(s,a,b){if(s.includes(b))return s;if(!s.includes(a))throw Error('Expected source missing: '+a.slice(0,80));return s.replace(a,b);}
edit('scripts/scr_core/scr_core.gml',s=>replace(replace(s,'index:0,looping:true','index:0,looping:true,gain:global.settings.music'),'enemy:false,boss:false,promise:false','enemy:false,enemy_spared:false,boss:false,boss_spared:false,promise:false,promise_discussed:false'));
edit('scripts/scr_music_system/scr_music_system.gml',s=>replace(replace(s,'global.music.index=_index;global.music.handle=','global.music.index=_index;global.music.gain=global.settings.music;global.music.handle='),'function br_music_step(_dt){if(global.music.handle!=-1)audio_sound_gain(global.music.handle,global.settings.music,100);}','function br_music_step(_dt){if(global.music.handle!=-1&&global.music.gain!=global.settings.music){global.music.gain=global.settings.music;audio_sound_gain(global.music.handle,global.settings.music,100);}}'));
edit('scripts/scr_world/scr_world.gml',s=>{
 s=replace(s,'else if(f.boss)br_dialogue("mother_return");else br_dialogue("mother_home");break;','else if(f.boss)br_dialogue("mother_return");else if(f.promise_discussed)br_dialogue(f.promise?"promise":"honest");else {f.promise_discussed=true;br_dialogue("mother_home");}break;');
 s=replace(s,'global.run.kills>0?"empty_patch":"friend"','f.enemy_spared?"friend":"empty_patch"');
 return replace(s,'else br_dialogue("gate_after");break;','else br_dialogue(f.boss_spared?"gate_after":"empty_patch");break;');
});
edit('scripts/scr_battle_system/scr_battle_system.gml',s=>{
 s=replace(s,'listened:false,hold:0','listened:false,hold:0,rewarded:[]');
 s=replace(s,'if(b.id=="mossling")global.run.flags.enemy=true;else global.run.flags.boss=true;','if(b.id=="mossling"){global.run.flags.enemy=true;global.run.flags.enemy_spared=_spared;}else {global.run.flags.boss=true;global.run.flags.boss_spared=_spared;}');
 s=replace(s,'var action=b.enemy.actions[b.sub];b.calm+=action.calm;br_effects(action.effects);b.text=br_tr(action.response);','var action=b.enemy.actions[b.sub];b.calm+=action.calm;\n            var already=false;for(var j=0;j<array_length(b.rewarded);j++)if(b.rewarded[j]==action.id)already=true;\n            if(!already){br_effects(action.effects);array_push(b.rewarded,action.id);}\n            b.text=br_tr(action.response);');
 return s;
});
edit('scripts/scr_presentation/scr_presentation.gml',s=>{
 s=replace(s,'!global.run.flags.enemy||global.run.kills==0','!global.run.flags.enemy||global.run.flags.enemy_spared');
 s=replace(s,'!global.run.flags.boss||global.run.kills==0','!global.run.flags.boss||global.run.flags.boss_spared');
 return replace(s,'    draw_sprite_ext(spr_mother,0,46,143,2,2,0,c_white,1);','    if(n.speaker=="Toriel")draw_sprite_ext(spr_mother,0,46,143,2,2,0,c_white,1);else br_heart(46,130,br_soul_color(br_soul()));');
});
// Keep punctuation inside the deliberately selected Latin-1 font atlas.
function normalize(s){return s.replace(/[‘’]/g,"'").replace(/[“”]/g,'"').replace(/…/g,'...').replace(/→/g,'>').replace(/←/g,'<').replace(/↑/g,'^').replace(/↓/g,'v');}
function strings(v){if(typeof v==='string')return normalize(v);if(Array.isArray(v))return v.map(strings);if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).map(([k,val])=>[k,strings(val)]));return v;}
for(const name of fs.readdirSync(path.join(root,'datafiles')).filter(x=>x.endsWith('.json')))edit('datafiles/'+name,s=>JSON.stringify(strings(JSON.parse(s)),null,2));
// Make the initial compatibility repair safe to run again.
edit('tools/fix-source.cjs',s=>s.replace("s=>s.replace('function br_boot() {'", "s=>s.includes('global.font=font_add')?s:s.replace('function br_boot() {'").replace("s=>s+'\\nfont_delete(global.font);\\n'", "s=>s.includes('font_delete(global.font)')?s:s+'\\nfont_delete(global.font);\\n'"));
console.log('Reviewed fixes: per-character survival, repeatable rewards, music fade, portraits, font punctuation.');
