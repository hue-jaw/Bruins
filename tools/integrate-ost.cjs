const parseYY=require('./yy-json.cjs').parse;
const fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'..');const tracks=parseYY(fs.readFileSync(path.join(root,'datafiles','tracks.json'),'utf8'));if(tracks.length!==27)throw Error('Incomplete album');
function edit(p,fn){p=path.join(root,p);fs.writeFileSync(p,fn(fs.readFileSync(p,'utf8')));}
function sub(s,a,b){if(s.includes(b))return s;if(!s.includes(a))throw Error('Source anchor missing '+a.slice(0,50));return s.replace(a,b);}
edit('scripts/scr_core/scr_core.gml',s=>{
 s=sub(s,'global.meta={version:1,resets:0,endings:[],tracks:[true,false]};','global.tracklist=br_read("tracks.json");\n    global.meta={version:1,resets:0,endings:[],tracks:array_create(array_length(global.tracklist),false)};global.meta.tracks[0]=true;');
 s=sub(s,'if (is_struct(m) && m.version==1 && is_array(m.tracks) && array_length(m.tracks)==2) global.meta=m;','if (is_struct(m) && m.version==1 && is_array(m.tracks)) { if(array_length(m.tracks)==2){var old=m.tracks;m.tracks=array_create(array_length(global.tracklist),false);m.tracks[0]=true;m.tracks[5]=old[0];m.tracks[7]=old[1];}if(array_length(m.tracks)==array_length(global.tracklist))global.meta=m; }');
 return sub(s,'global.music={handle:-1,asset:-1,paused:false,index:0,looping:true,gain:global.settings.music};','global.music={handle:-1,asset:-1,paused:false,index:0,looping:true,gain:global.settings.music,retiring:[],shuffle:false};');
});
fs.writeFileSync(path.join(root,'scripts','scr_music_system','scr_music_system.gml'),`function br_music_area(){switch(global.g.area){case "intro":return 2;case "home":return 4;case "gate":return 6;default:return 5;}}
function br_music_stop(){
    if(global.music.handle!=-1)audio_stop_sound(global.music.handle);
    if(global.music.asset!=-1)audio_destroy_stream(global.music.asset);
    for(var i=0;i<array_length(global.music.retiring);i++){var old=global.music.retiring[i];audio_stop_sound(old.handle);audio_destroy_stream(old.asset);}
    global.music.retiring=[];global.music.handle=-1;global.music.asset=-1;global.music.paused=false;
}
function br_music_play(_index){
    if(_index<0||_index>=array_length(global.tracklist))return;
    if(global.music.index==_index&&global.music.handle!=-1&&(audio_is_playing(global.music.handle)||audio_is_paused(global.music.handle))){if(global.music.paused){audio_resume_sound(global.music.handle);global.music.paused=false;}return;}
    var track=global.tracklist[_index];var stream=audio_create_stream(track.path);
    if(stream==-1){show_debug_message("Audio stream missing: "+track.path);return;}
    if(global.music.asset!=-1){audio_sound_gain(global.music.handle,0,650);array_push(global.music.retiring,{asset:global.music.asset,handle:global.music.handle,remaining:.7});}
    global.music.asset=stream;global.music.index=_index;global.music.paused=false;global.music.gain=global.settings.music;
    global.music.handle=audio_play_sound(stream,1,global.music.looping);audio_sound_gain(global.music.handle,0,0);audio_sound_gain(global.music.handle,global.settings.music,700);
    if(!global.meta.tracks[_index]){global.meta.tracks[_index]=true;br_write("meta.json",global.meta);}
}
function br_music_step(_dt){
    for(var i=array_length(global.music.retiring)-1;i>=0;i--){var old=global.music.retiring[i];old.remaining-=_dt;if(old.remaining<=0){audio_stop_sound(old.handle);audio_destroy_stream(old.asset);array_delete(global.music.retiring,i,1);}}
    if(global.music.handle!=-1&&global.music.gain!=global.settings.music){global.music.gain=global.settings.music;audio_sound_gain(global.music.handle,global.settings.music,100);}
    if(global.g.mode=="music"&&global.music.shuffle&&!global.music.paused&&global.music.handle!=-1&&!audio_is_playing(global.music.handle))br_music_next(1,true);
}
function br_music_pause(){if(global.music.handle==-1||(!audio_is_playing(global.music.handle)&&!audio_is_paused(global.music.handle))){br_music_play(global.g.selection);return;}global.music.paused=!global.music.paused;if(global.music.paused)audio_pause_sound(global.music.handle);else audio_resume_sound(global.music.handle);}
function br_music_position(){return global.music.handle==-1?0:audio_sound_get_track_position(global.music.handle);}
function br_music_next(_direction,_random){
    var unlocked=[];for(var i=0;i<array_length(global.tracklist);i++)if(global.meta.tracks[i])array_push(unlocked,i);
    if(array_length(unlocked)==0)return;
    var next=global.music.index;
    if(_random){if(array_length(unlocked)>1){do {next=unlocked[irandom(array_length(unlocked)-1)];}until(next!=global.music.index);}}
    else {for(var i=0;i<array_length(global.tracklist);i++){next=(next+_direction+array_length(global.tracklist)) mod array_length(global.tracklist);if(global.meta.tracks[next])break;}}
    global.g.selection=next;br_music_play(next);
}
`);
edit('scripts/scr_world/scr_world.gml',s=>sub(s,'room_goto(br_room_asset(_area));br_music_play(0);','room_goto(br_room_asset(_area));br_music_play(br_music_area());'));
edit('scripts/scr_battle_system/scr_battle_system.gml',s=>s.replace('global.meta.tracks[1]=true;br_music_play(1);','br_music_play(_id=="guardian"?10:7);').replaceAll('br_music_play(0);','br_music_play(br_music_area());'));
edit('scripts/scr_menus/scr_menus.gml',s=>{
 const start=s.indexOf('    if(g.mode=="music"){'),end=s.indexOf('    g.selection=clamp(g.selection+inp.down-inp.up,0,6);',start);if(start<0||end<0)throw Error('Music menu anchors');
 return s.slice(0,start)+`    if(g.mode=="music"){
        g.selection=clamp(g.selection+inp.down-inp.up,0,array_length(global.tracklist)-1);
        if(inp.ok&&global.meta.tracks[g.selection]){if(global.music.index==g.selection)br_music_pause();else br_music_play(g.selection);}
        if(inp.left||inp.right)br_music_next(inp.right?1:-1,false);
        if(keyboard_check_pressed(ord("S")))br_music_stop();
        if(keyboard_check_pressed(ord("R"))){global.music.looping=!global.music.looping;if(global.music.handle!=-1)audio_sound_loop(global.music.handle,global.music.looping);}
        if(keyboard_check_pressed(ord("H"))){global.music.shuffle=!global.music.shuffle;if(global.music.shuffle){global.music.looping=false;if(global.music.handle!=-1)audio_sound_loop(global.music.handle,false);}}
        if(keyboard_check_pressed(vk_add))global.settings.music=min(1,global.settings.music+.05);
        if(keyboard_check_pressed(vk_subtract))global.settings.music=max(0,global.settings.music-.05);
        if(inp.back){br_settings_save();g.mode="title";g.selection=0;br_music_play(0);}return;
    }
`+s.slice(end);
});
edit('scripts/scr_presentation/scr_presentation.gml',s=>{
 const start=s.indexOf('    if(g.mode=="music"){'),end=s.indexOf('    if(g.mode=="credits"){',start);if(start<0||end<0)throw Error('Music view anchors');
 let out=s.slice(0,start)+`    if(g.mode=="music"){
        br_label(35,18,"MUSIC ROOM - BRUINS OST",c_white);
        var top=clamp(g.selection-3,0,max(0,array_length(global.tracklist)-7));
        for(var i=top;i<min(top+7,array_length(global.tracklist));i++){var track=global.tracklist[i];var title=global.meta.tracks[i]?track.title:"???";var seconds=track.duration mod 60;var duration=string(floor(track.duration/60))+":"+(seconds<10?"0":"")+string(seconds);br_label(38,55+(i-top)*24,(g.selection==i?"> ":"  ")+string(i+1)+". "+title,g.selection==i?c_yellow:c_gray);if(global.meta.tracks[i])br_label(550,55+(i-top)*24,duration,c_gray);}
        var duration=global.tracklist[global.music.index].duration,pos=br_music_position();
        br_box(38,237,600,249,c_gray);draw_set_color(make_color_rgb(110,202,189));draw_rectangle(40,239,40+558*clamp(pos/max(1,duration),0,1),247,false);
        br_label(38,258,string(floor(pos))+" / "+string(duration)+" s   VOL "+string(round(global.settings.music*100))+"%",c_white);
        br_label(38,282,"Z: play/pause   S: stop   R: repeat "+string(global.music.looping),c_gray);
        br_label(38,304,"H: shuffle "+string(global.music.shuffle)+"   +/-: volume",c_gray);
        br_label(38,326,br_text("Gauche/droite : piste   X : retour","Left/right: track   X: back"),c_gray);
    }
`+s.slice(end);
 return out.replace("Deux esquisses WAV originales sont incluses. Le jeu complet et l'OST de 27 titres restent à produire.","27 compositions synthétiques originales sont incluses. Le jeu complet reste à produire.").replace('Two original WAV sketches included. The complete game and 27-track OST remain to be produced.','27 original synthesized compositions included. The complete game remains in development.');
});
// Add streaming OGG assets and the manifest to the real project, preserving existing resources.
const yyp=path.join(root,'BRUINS.yyp'),p=parseYY(fs.readFileSync(yyp));p.IncludedFiles=p.IncludedFiles.filter(f=>f.name!=='tracks.json'&&f.filePath!=='datafiles/music');
for(const [name,filePath]of[['tracks.json','datafiles'],...tracks.map(t=>[path.basename(t.path),'datafiles/music'])])p.IncludedFiles.push({'$GMIncludedFile':'','%Name':name,CopyToMask:-1,filePath,name,resourceType:'GMIncludedFile',resourceVersion:'2.0'});
fs.writeFileSync(yyp,JSON.stringify(p,null,2));console.log('27 OGG tracks integrated; room discovery, migrating unlocks, scrollable jukebox, shuffle, looping and stream cleanup.');
