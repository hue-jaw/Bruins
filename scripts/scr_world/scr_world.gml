function br_enter(_area,_x,_y) {global.g.area=_area;global.g.px=_x;global.g.py=_y;global.g.mode="world";room_goto(br_room_asset(_area));br_music_play(br_music_area());}
function br_wall(_x,_y) {
    if(_x<32||_x>608||_y<42||_y>304)return true;
    var m=variable_struct_get(global.db.world,global.g.area).map;
    for(var i=0;i<2;i++)for(var j=0;j<2;j++){var tx=floor((_x+(i==0?-8:8))/32),ty=floor((_y+(j==0?-5:2))/32);if(string_char_at(m[ty],tx+1)=="#")return true;}
    return false;
}
function br_world_step(_dt) {
    global.g.message_time=max(0,global.g.message_time-_dt);
    if(global.input.menu){global.g.mode="inventory";global.g.selection=0;return;}
    if(global.input.back){global.g.mode="title";global.g.selection=0;return;}
    var dx=global.input.dx,dy=global.input.dy,len=max(1,sqrt(dx*dx+dy*dy));dx=dx/len*100*_dt;dy=dy/len*100*_dt;
    if(!br_wall(global.g.px+dx,global.g.py))global.g.px+=dx;
    if(!br_wall(global.g.px,global.g.py+dy))global.g.py+=dy;
    global.g.walking=(dx!=0||dy!=0);
    if(!global.input.ok)return;
    var entities=variable_struct_get(global.db.world,global.g.area).entities,near=-1,dist=45;
    for(var i=0;i<array_length(entities);i++){var e=entities[i],dd=point_distance(global.g.px,global.g.py,e.x,e.y);if(dd<dist){near=i;dist=dd;}}
    if(near>=0)br_interact(entities[near]);
}
function br_interact(_e) {
    var f=global.run.flags;
    switch(_e.kind){
        case "mother":
            if(!f.met){f.met=true;br_dialogue(global.meta.resets>0?"meeting_reset":"meeting");}
            else if(global.run.kills>0)br_dialogue("mother_grief");
            else if(f.boss)br_dialogue("mother_return");else if(f.promise_discussed)br_dialogue(f.promise?"promise":"honest");else {f.promise_discussed=true;br_dialogue("mother_home");}break;
        case "save":global.run.hp=global.run.maxhp;br_save();break;
        case "door":
            if(_e.to=="ruins"&&!f.met){br_notice("Parle d'abord à la gardienne.","Speak with the caretaker first.");break;}
            if(_e.to=="gate"&&!f.puzzle){br_notice("La porte attend trois notes.","The door awaits three notes.");break;}
            br_enter(_e.to,_e.px,_e.py);break;
        case "sign":br_dialogue("inscription");break;
        case "switch":
            if(f.puzzle){br_notice("L'accord est complet.","The chord is complete.");break;}
            array_push(global.g.puzzle,_e.note);
            var seq=[2,0,1],ix=array_length(global.g.puzzle)-1;
            if(global.g.puzzle[ix]!=seq[ix]){global.g.puzzle=[];br_notice("Un écho sourd. Recommence.","A dull echo. Try again.");}
            else if(ix==2){f.puzzle=true;br_effects({curiosity:12,patience:8});br_dialogue("puzzle_done");}
            else br_notice("La pierre chante.","The stone sings.");break;
        case "pickup":if(!f.candy){if(br_add_item("candy",1)){f.candy=true;br_effects({curiosity:8});br_notice("Bonbon d'écho obtenu.","Echo Candy obtained.");}}else br_notice("La boîte est vide.","The box is empty.");break;
        case "enemy":if(!f.enemy)br_battle_start("mossling");else br_dialogue(f.enemy_spared?"friend":"empty_patch");break;
        case "boss":if(!f.boss)br_battle_start("guardian");else br_dialogue(f.boss_spared?"gate_after":"empty_patch");break;
        case "cook":if(!f.cooked){if(br_add_item("pie",1)){f.cooked=true;br_effects({kindness:12,affection_toriel:3});br_dialogue("cooking");}}else br_dialogue("cooking_after");break;
        case "book":if(!f.book){f.book=true;br_effects({empathy:10,trust_toriel:2});}br_dialogue("book");break;
        case "secret":if(f.book){if(!f.secret){f.secret=true;br_add_item("shard",1);br_effects({curiosity:15,remembered_timelines:1});}br_dialogue("secret");}else br_notice("Un mur couvert de poussière.","A dusty wall.");break;
        case "shop":br_dialogue("shop");break;
        case "buy":if(global.run.gold>=5){if(br_add_item("candy",1)){global.run.gold-=5;br_notice("Merci. Un bonbon pour le chemin.","Thank you. A candy for the road.");}}else br_notice("Il faut 5 éclats.","You need 5 shards.");break;
        case "end":if(f.boss){f.chapter_end=true;br_dialogue(global.run.kills>0?"chapter_dark":"chapter_kind");}else br_notice("Le gardien ferme le passage.","The guardian blocks the passage.");break;
    }
}
