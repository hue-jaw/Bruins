function br_music_area(){switch(global.g.area){case "intro":return 2;case "home":return 4;case "gate":return 6;default:return 5;}}
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
