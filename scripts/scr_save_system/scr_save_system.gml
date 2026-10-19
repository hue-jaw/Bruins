function br_write(_path,_value) {
    var tmp=_path+".tmp", backup=_path+".bak";
    try {
        var f=file_text_open_write(tmp); file_text_write_string(f,json_stringify(_value)); file_text_close(f);
        var verify=br_read(tmp);
        if(!is_struct(verify)) return false;
        if(file_exists(_path)) { if(file_exists(backup)) file_delete(backup); file_copy(_path,backup); file_delete(_path); }
        file_rename(tmp,_path);
        return file_exists(_path);
    } catch(e) { show_debug_message("Save error: "+string(e)); return false; }
}
function br_valid_save(_s) {
    if(!is_struct(_s)) return false;
    var keys=["version","area","px","py","hp","maxhp","gold","scores","inventory","equipment","flags","memories","trust_toriel","affection_toriel","fear_toriel","remembered_timelines","promises_kept","promises_broken","kills","spared"];
    for(var i=0;i<array_length(keys);i++)if(!variable_struct_exists(_s,keys[i]))return false;
    if(_s.version!=1 || !is_array(_s.scores) || array_length(_s.scores)!=10 || !is_array(_s.inventory) || array_length(_s.inventory)>8 || !is_struct(_s.flags))return false;
    if(!variable_struct_exists(global.db.world,_s.area))return false;
    if(!is_real(_s.px)||!is_real(_s.py)||!is_real(_s.hp)||!is_real(_s.maxhp))return false;
    if(_s.px<32||_s.px>608||_s.py<32||_s.py>304||_s.maxhp<1||_s.hp<1||_s.hp>_s.maxhp)return false;
    for(var j=0;j<10;j++)if(!is_real(_s.scores[j])||_s.scores[j]<0||_s.scores[j]>100)return false;
    for(var j=0;j<array_length(_s.inventory);j++){var it=_s.inventory[j];if(!is_struct(it)||!variable_struct_exists(it,"id")||!variable_struct_exists(it,"count"))return false;if(!variable_struct_exists(global.db.items,it.id)||it.count<1)return false;}
    var expected=variable_struct_get_names(br_default_run().flags);
    for(var j=0;j<array_length(expected);j++)if(!variable_struct_exists(_s.flags,expected[j]))return false;
    return true;
}
function br_save() {
    global.run.area=global.g.area;global.run.px=global.g.px;global.run.py=global.g.py;
    var ok=br_write("save01.json",global.run);br_write("meta.json",global.meta);
    br_notice(ok?"Souvenir conservé.":"Échec de sauvegarde.",ok?"Memory preserved.":"Save failed.");return ok;
}
function br_load() {
    var files=["save01.json","save01.json.tmp","save01.json.bak"];
    for(var i=0;i<array_length(files);i++)if(file_exists(files[i])){try{var s=br_read(files[i]);if(br_valid_save(s)){global.run=s;global.g.puzzle=[];br_enter(s.area,s.px,s.py);return true;}}catch(e){show_debug_message("Invalid save candidate: "+files[i]);}}
    br_notice("Aucune sauvegarde valide.","No valid save.");return false;
}
