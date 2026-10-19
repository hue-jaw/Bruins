function br_dialogue(_id) {
    if(!variable_struct_exists(global.db.dialogues,_id)){show_debug_message("Missing dialogue: "+_id);return;}
    global.g.mode="dialogue";global.g.dialogue={id:_id,letters:0,selection:0};
}
function br_dialogue_step(_dt) {
    var d=global.g.dialogue,node=variable_struct_get(global.db.dialogues,d.id),txt=br_tr(node.text);
    d.letters=min(string_length(txt),d.letters+global.settings.text_speed*_dt);
    if(global.input.up)d.selection=max(0,d.selection-1);
    if(global.input.down)d.selection=min(array_length(node.choices)-1,d.selection+1);
    if(!global.input.ok)return;
    if(d.letters<string_length(txt)){d.letters=string_length(txt);return;}
    if(array_length(node.choices)>0){
        var c=node.choices[d.selection];br_effects(c.effects);
        array_push(global.run.memories,{node:d.id,choice:d.selection,reset:global.meta.resets});
        if(c.next!="")br_dialogue(c.next);else global.g.mode="world";
    } else { if(variable_struct_exists(node,"effects"))br_effects(node.effects); if(node.next!="")br_dialogue(node.next);else global.g.mode="world"; }
}
