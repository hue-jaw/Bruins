function br_read(_path) {
    var f = file_text_open_read(_path), s = "";
    while (!file_text_eof(f)) { s += file_text_read_string(f); file_text_readln(f); }
    file_text_close(f);
    return json_parse(s);
}
function br_tr(_v) { return is_struct(_v) ? variable_struct_get(_v, global.settings.language) : _v; }
function br_text(_fr, _en) { return global.settings.language == "fr" ? _fr : _en; }
function br_pressed(_a, _b) { return keyboard_check_pressed(_a) || keyboard_check_pressed(_b); }
function br_input() {
    global.input = {ok:br_pressed(vk_enter, ord("Z")), back:br_pressed(vk_escape,ord("X")), menu:keyboard_check_pressed(ord("C")), up:br_pressed(vk_up,ord("W")), down:br_pressed(vk_down,ord("S")), left:br_pressed(vk_left,ord("A")), right:br_pressed(vk_right,ord("D")), ability:keyboard_check(vk_space), fire:keyboard_check(ord("Z")), dx:keyboard_check(vk_right)+keyboard_check(ord("D"))-keyboard_check(vk_left)-keyboard_check(ord("A")), dy:keyboard_check(vk_down)+keyboard_check(ord("S"))-keyboard_check(vk_up)-keyboard_check(ord("W"))};
    global.input.dx = clamp(global.input.dx,-1,1); global.input.dy = clamp(global.input.dy,-1,1);
    if (keyboard_check_pressed(vk_f11)) { global.settings.fullscreen=!global.settings.fullscreen; window_set_fullscreen(global.settings.fullscreen); br_settings_save(); }
}
function br_boot() {
    global.font=font_add("Consolas",12,false,false,32,255);
    global.settings = {language:"fr", music:0.65, fullscreen:false, difficulty:1, text_speed:40, assist:false};
    if (file_exists("settings.json")) { try { var cfg=br_read("settings.json"); if (is_struct(cfg) && variable_struct_exists(cfg,"language") && variable_struct_exists(cfg,"music") && variable_struct_exists(cfg,"fullscreen") && variable_struct_exists(cfg,"difficulty") && variable_struct_exists(cfg,"text_speed") && variable_struct_exists(cfg,"assist")) { if (cfg.language=="fr" || cfg.language=="en") global.settings=cfg; } } catch(e) { show_debug_message("Settings reset: " + string(e)); } }
    global.tracklist=br_read("tracks.json");
    global.meta={version:1,resets:0,endings:[],tracks:array_create(array_length(global.tracklist),false)};global.meta.tracks[0]=true;
    if (file_exists("meta.json")) { try { var m=br_read("meta.json"); if (is_struct(m) && m.version==1 && is_array(m.tracks)) { if(array_length(m.tracks)==2){var old=m.tracks;m.tracks=array_create(array_length(global.tracklist),false);m.tracks[0]=true;m.tracks[5]=old[0];m.tracks[7]=old[1];}if(array_length(m.tracks)==array_length(global.tracklist))global.meta=m; } } catch(e) { show_debug_message("Meta load failed"); } }
    global.db={dialogues:br_read("dialogues.json"),souls:br_read("souls.json"),enemies:br_read("enemies.json"),world:br_read("world.json"),items:br_read("items.json")};
    global.g={mode:"title",selection:0,time:0,message:"",message_time:0,dialogue:undefined,battle:undefined,px:160,py:200,walking:false,area:"intro",puzzle:[],intro_done:false};
    global.music={handle:-1,asset:-1,paused:false,index:0,looping:true,gain:global.settings.music,retiring:[],shuffle:false};
    global.run=br_default_run();
    window_set_fullscreen(global.settings.fullscreen);
    br_music_play(0);
}
function br_default_run() {
    return {version:1,area:"intro",px:160,py:200,hp:24,maxhp:24,gold:12,scores:[25,0,0,0,0,0,0,0,0,0],trust_toriel:0,affection_toriel:0,fear_toriel:0,remembered_timelines:0,promises_kept:0,promises_broken:0,kills:0,spared:0,inventory:[{id:"candy",count:2}],equipment:"",flags:{met:false,puzzle:false,candy:false,enemy:false,enemy_spared:false,boss:false,boss_spared:false,promise:false,promise_discussed:false,cooked:false,book:false,secret:false,chapter_end:false},memories:[]};
}
function br_new() {
    global.run=br_default_run(); global.g.puzzle=[];
    br_enter("intro",160,200); br_dialogue("opening");
}
function br_notice(_fr,_en) { global.g.message=br_text(_fr,_en); global.g.message_time=3; }
function br_effects(_effects) {
    if (!is_struct(_effects)) return;
    var keys=variable_struct_get_names(_effects);
    for (var i=0;i<array_length(keys);i++) {
        var k=keys[i],v=variable_struct_get(_effects,k),idx=-1;
        for(var j=0;j<10;j++) if(global.db.souls.affinities[j].id==k) idx=j;
        if(idx>=0) global.run.scores[idx]=clamp(global.run.scores[idx]+v,0,100);
        else if(variable_struct_exists(global.run.flags,k)) variable_struct_set(global.run.flags,k,v);
        else if(variable_struct_exists(global.run,k) && is_real(variable_struct_get(global.run,k))) variable_struct_set(global.run,k,variable_struct_get(global.run,k)+v);
    }
}
function br_soul() { var best=0; for(var i=1;i<10;i++) if(global.run.scores[i]>global.run.scores[best])best=i; return best; }
function br_hybrid() {
    var rules=global.db.souls.hybrids;
    for(var i=0;i<array_length(rules);i++){var r=rules[i],a=global.run.scores[r.a],b=global.run.scores[r.b];if(a>=r.threshold && b>=r.threshold && abs(a-b)<=r.margin)return br_tr(r.name);}
    return "";
}
function br_soul_color(_i) { var c=global.db.souls.affinities[_i].color; return make_color_rgb(c[0],c[1],c[2]); }
function br_settings_save() { br_write("settings.json",global.settings); }
function br_room_asset(_area) { switch(_area){case "intro":return rm_intro;case "ruins":return rm_ruins;case "home":return rm_home;case "gate":return rm_gate;}return rm_intro; }
