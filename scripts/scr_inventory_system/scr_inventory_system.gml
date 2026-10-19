function br_add_item(_id,_count) {
    for(var i=0;i<array_length(global.run.inventory);i++)if(global.run.inventory[i].id==_id){global.run.inventory[i].count+=_count;return true;}
    if(array_length(global.run.inventory)>=8){br_notice("Inventaire plein.","Inventory full.");return false;}
    array_push(global.run.inventory,{id:_id,count:_count});return true;
}
function br_use_item(_index) {
    if(_index<0||_index>=array_length(global.run.inventory))return false;
    var slot=global.run.inventory[_index],item=variable_struct_get(global.db.items,slot.id);
    if(item.heal<=0){br_notice("Ce souvenir ne se consomme pas.","This memory cannot be consumed.");return false;}
    global.run.hp=min(global.run.maxhp,global.run.hp+item.heal);
    slot.count--;if(slot.count<=0)array_delete(global.run.inventory,_index,1);
    return true;
}
function br_inventory_step(){
    if(global.input.back||global.input.menu){global.g.mode="world";return;}
    global.g.selection=clamp(global.g.selection+global.input.down-global.input.up,0,max(0,array_length(global.run.inventory)-1));
    if(global.input.ok)br_use_item(global.g.selection);
}
