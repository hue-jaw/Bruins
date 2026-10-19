function br_menu_step(_dt){
    var g=global.g,inp=global.input;g.message_time=max(0,g.message_time-_dt);
    if(g.mode=="credits"){if(inp.back||inp.ok){g.mode="title";g.selection=0;}return;}
    if(g.mode=="settings"){
        g.selection=clamp(g.selection+inp.down-inp.up,0,5);var diff=inp.right-inp.left;
        if(diff!=0||inp.ok){switch(g.selection){case 0:global.settings.language=global.settings.language=="fr"?"en":"fr";break;case 1:global.settings.music=clamp(global.settings.music+(diff==0?.1:diff*.1),0,1);break;case 2:global.settings.difficulty=(global.settings.difficulty+(diff==0?1:diff)+3) mod 3;break;case 3:global.settings.assist=!global.settings.assist;break;case 4:global.settings.text_speed=clamp(global.settings.text_speed+(diff==0?10:diff*10),10,100);break;case 5:global.settings.fullscreen=!global.settings.fullscreen;window_set_fullscreen(global.settings.fullscreen);break;}br_settings_save();}
        if(inp.back){g.mode="title";g.selection=0;}return;
    }
    if(g.mode=="music"){
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
    g.selection=clamp(g.selection+inp.down-inp.up,0,6);
    if(!inp.ok)return;
    switch(g.selection){
        case 0:br_new();break;
        case 1:br_load();break;
        case 2:g.mode="music";g.selection=0;break;
        case 3:g.mode="settings";g.selection=0;break;
        case 4:g.mode="credits";break;
        case 5:global.meta.resets++;br_write("meta.json",global.meta);br_new();break;
        case 6:game_end();break;
    }
}
