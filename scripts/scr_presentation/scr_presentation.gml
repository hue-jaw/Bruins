function br_box(_x1,_y1,_x2,_y2,_color){draw_set_color(make_color_rgb(17,20,34));draw_rectangle(_x1,_y1,_x2,_y2,false);draw_set_color(_color);draw_rectangle(_x1,_y1,_x2,_y2,true);}
function br_label(_x,_y,_txt,_color){draw_set_color(_color);draw_text(_x,_y,_txt);}
function br_heart(_x,_y,_color){draw_set_color(_color);draw_rectangle(_x-4,_y-3,_x-1,_y+1,false);draw_rectangle(_x+1,_y-3,_x+4,_y+1,false);draw_triangle(_x-5,_y,_x+5,_y,_x,_y+6,false);}
function br_draw(){
    draw_clear(make_color_rgb(12,16,29));draw_set_alpha(1);draw_set_font(global.font);draw_set_halign(fa_left);draw_set_valign(fa_top);
    var mode=global.g.mode;
    if(mode=="title"||mode=="settings"||mode=="music"||mode=="credits"){br_menu_draw();return;}
    if(mode=="battle"){br_battle_draw();return;}
    if(mode=="dead"){br_label(185,120,br_text("LE FIL N'EST PAS ROMPU","THE THREAD IS NOT BROKEN"),c_white);br_label(120,180,br_text("Entrée : reprendre la dernière sauvegarde","Enter: return to the last save"),c_gray);return;}
    br_world_draw();
    if(mode=="dialogue")br_dialogue_draw();
    if(mode=="inventory")br_inventory_draw();
}
function br_world_draw(){
    var g=global.g,w=variable_struct_get(global.db.world,g.area),wall=make_color_rgb(54,47,77),floorcol=make_color_rgb(28,34,48);
    for(var yy=0;yy<10;yy++)for(var xx=0;xx<20;xx++){
        var cell_wall=string_char_at(w.map[yy],xx+1)=="#";
        draw_set_color(cell_wall?wall:floorcol);draw_rectangle(xx*32,yy*32,xx*32+31,yy*32+31,false);
        draw_set_color(cell_wall?make_color_rgb(77,65,97):make_color_rgb(35,43,58));draw_line(xx*32+3,yy*32+3,xx*32+29,yy*32+3);
        if(!cell_wall && (xx*7+yy*13) mod 9==0){draw_set_color(make_color_rgb(73,75,94));draw_point(xx*32+15,yy*32+19);draw_point(xx*32+20,yy*32+22);}
    }
    if(g.area=="intro")for(var i=0;i<28;i++){var fx=145+cos(i*2.4)*38,fy=203+sin(i*2.4)*18;draw_set_color(make_color_rgb(204,184,141));draw_circle(fx,fy,2,false);}
    for(var i=0;i<array_length(w.entities);i++){
        var e=w.entities[i];
        switch(e.kind){
            case "mother":draw_sprite_ext(spr_mother,0,e.x,e.y,2,2,0,c_white,1);break;
            case "enemy":if(!global.run.flags.enemy||global.run.flags.enemy_spared)draw_sprite_ext(spr_enemy,0,e.x,e.y,2,2,0,c_white,1);break;
            case "boss":if(!global.run.flags.boss||global.run.flags.boss_spared)draw_sprite_ext(spr_enemy,0,e.x,e.y,4,5,0,make_color_rgb(171,145,200),1);break;
            case "save":draw_set_color(make_color_rgb(118,230,211));draw_circle(e.x,e.y-10,7+sin(g.time*3)*2,true);draw_line(e.x-11,e.y-10,e.x+11,e.y-10);draw_line(e.x,e.y-21,e.x,e.y+1);break;
            case "door":case "end":draw_set_color(make_color_rgb(91,115,141));draw_rectangle(e.x-12,e.y-26,e.x+12,e.y,false);draw_set_color(make_color_rgb(17,20,34));draw_rectangle(e.x-8,e.y-22,e.x+8,e.y,false);break;
            case "switch":br_box(e.x-13,e.y-22,e.x+13,e.y,global.run.flags.puzzle?c_lime:c_gray);br_label(e.x-8,e.y-20,br_tr(e.label),c_white);break;
            default:br_box(e.x-10,e.y-17,e.x+10,e.y,make_color_rgb(155,129,108));break;
        }
        if(point_distance(g.px,g.py,e.x,e.y)<45)br_label(clamp(e.x-40,6,480),e.y+6,"Z : "+br_tr(e.label),c_white);
    }
    draw_sprite_ext(spr_child,0,round(g.px),round(g.py)+(g.walking?round(sin(g.time*16)):0),2,2,0,c_white,1);
    br_box(0,320,639,359,make_color_rgb(73,94,115));br_label(12,326,br_tr(w.name),c_white);
    br_label(12,343,"C : "+br_text("inventaire","inventory")+"    ESC : menu",c_gray);
    br_label(380,326,"HP "+string(global.run.hp)+"/"+string(global.run.maxhp)+"   "+string(global.run.gold)+br_text(" éclats"," shards"),c_white);
    br_heart(610,338,br_soul_color(br_soul()));
    if(g.message_time>0){br_box(35,280,605,314,c_gray);br_label(48,286,g.message,c_white);}
}
function br_dialogue_draw(){
    var d=global.g.dialogue,n=variable_struct_get(global.db.dialogues,d.id);
    br_box(12,100,628,353,make_color_rgb(146,164,196));
    if(n.speaker=="Toriel")draw_sprite_ext(spr_mother,0,46,143,2,2,0,c_white,1);else br_heart(46,130,br_soul_color(br_soul()));
    br_label(73,113,n.speaker,make_color_rgb(138,218,206));
    draw_set_color(c_white);draw_text_ext(30,149,string_copy(br_tr(n.text),1,floor(d.letters)),18,580);
    if(d.letters>=string_length(br_tr(n.text))){
        for(var i=0;i<array_length(n.choices);i++)br_label(32,239+i*20,(i==d.selection?"> ":"  ")+br_tr(n.choices[i].text),i==d.selection?c_yellow:c_white);
        if(array_length(n.choices)==0)br_label(510,329,"Z / Enter",c_gray);
    }
}
function br_inventory_draw(){
    br_box(25,25,615,335,c_white);br_label(43,40,br_text("INVENTAIRE","INVENTORY"),c_white);
    for(var i=0;i<array_length(global.run.inventory);i++){var it=global.run.inventory[i],def=variable_struct_get(global.db.items,it.id);br_label(43,78+i*24,(global.g.selection==i?"> ":"  ")+br_tr(def.name)+" x"+string(it.count),global.g.selection==i?c_yellow:c_white);}
    if(array_length(global.run.inventory)==0)br_label(43,78,br_text("Vide","Empty"),c_gray);
    for(var i=0;i<10;i++){br_label(350,68+i*20,br_tr(global.db.souls.affinities[i].name),br_soul_color(i));br_label(560,68+i*20,string(global.run.scores[i]),c_white);}
    var hybrid=br_hybrid();if(hybrid!="")br_label(350,275,hybrid,c_yellow);
    var sel=min(global.g.selection,array_length(global.run.inventory)-1);
    if(sel>=0){draw_set_color(c_gray);draw_text_ext(43,275,br_tr(variable_struct_get(global.db.items,global.run.inventory[sel].id).description),17,290);}
    br_label(43,315,br_text("Z : utiliser    X : retour","Z: use    X: back"),c_gray);
}
function br_battle_draw(){
    var b=global.g.battle;
    br_label(20,12,br_tr(b.enemy.name),c_white);br_label(420,12,"HP "+string(max(0,b.hp))+"/"+string(b.enemy.hp),c_gray);
    draw_sprite_ext(spr_enemy,0,320,100,4,b.enemy.boss?5:4,0,b.enemy.boss?make_color_rgb(171,145,200):c_white,1);
    draw_set_color(c_white);draw_text_ext(32,112,b.text,18,576);
    br_box(200,180,440,288,c_white);
    if(b.stage=="dodge"){
        if(b.soul==4){draw_set_color(make_color_rgb(91,65,116));for(var i=0;i<3;i++)draw_line(202,210+i*32,438,210+i*32);}
        if(b.soul==8&&!b.secret)br_label(415,190,"?",br_soul_color(8));
        if(b.soul==9)br_label(207,160,(floor(b.phase_time/2) mod 2)==1?"< INVERSE >":"< NORMAL >",br_soul_color(9));
        for(var i=0;i<array_length(b.lasers);i++){var l=b.lasers[i];draw_set_color(l.age<1.2?c_yellow:c_red);draw_rectangle(l.px-(l.age<1.2?1:5),182,l.px+(l.age<1.2?1:5),286,l.age<1.2);}
        for(var i=0;i<array_length(b.bullets);i++){var p=b.bullets[i];if(b.soul==7&&global.input.ability){draw_set_color(make_color_rgb(107,73,109));draw_line(p.px,p.py,p.px+p.vx*.4,p.py+p.vy*.4);}draw_set_color(p.kind==1?c_orange:(p.kind==2?c_yellow:c_white));draw_circle(p.px,p.py,p.r,false);}
        for(var i=0;i<array_length(b.shots);i++){var s=b.shots[i];draw_set_color(c_yellow);draw_rectangle(s.px-1,s.py-4,s.px+1,s.py,false);}
        if(b.invincible<=0||(floor(global.g.time*16) mod 2)==0)br_heart(b.hx,b.hy,br_soul_color(b.soul));
        if(b.soul==5&&global.input.ability){draw_set_color(c_lime);var sx=b.hx+lengthdir_x(17,b.shield),sy=b.hy+lengthdir_y(17,b.shield);draw_circle(sx,sy,7,true);}
        draw_set_color(br_soul_color(b.soul));draw_rectangle(202,286,202+236*(1-b.phase_time/6.5),288,false);
    }
    if(b.stage=="aim"){draw_set_color(c_gray);draw_line(210,230,430,230);draw_set_color(c_lime);draw_rectangle(308,210,332,250,true);draw_set_color(c_yellow);draw_line(210+b.aim*220,203,210+b.aim*220,258);}
    if(b.stage=="act"||b.stage=="item"||b.stage=="mercy"){
        br_box(175,176,465,291,c_gray);var list=[];
        if(b.stage=="act")for(var i=0;i<array_length(b.enemy.actions);i++)array_push(list,br_tr(b.enemy.actions[i].name));
        if(b.stage=="item")for(var i=0;i<array_length(global.run.inventory);i++)array_push(list,br_tr(variable_struct_get(global.db.items,global.run.inventory[i].id).name));
        if(b.stage=="mercy")list=["SPARE","FLEE"];
        if(array_length(list)==0)br_label(190,200,br_text("Vide. X : retour","Empty. X: back"),c_gray);
        var top=max(0,b.sub-3);for(var i=top;i<min(array_length(list),top+4);i++)br_label(190,185+(i-top)*24,(b.sub==i?"> ":"  ")+list[i],b.sub==i?c_yellow:c_white);
    }
    br_label(22,298,"CHILD  HP "+string(global.run.hp)+"/"+string(global.run.maxhp),c_white);
    draw_set_color(make_color_rgb(76,39,57));draw_rectangle(220,300,320,309,false);draw_set_color(c_yellow);draw_rectangle(220,300,220+100*global.run.hp/global.run.maxhp,309,false);
    br_label(355,298,br_tr(global.db.souls.affinities[b.soul].name),br_soul_color(b.soul));
    var labels=["FIGHT","ACT","ITEM","MERCY"];for(var i=0;i<4;i++){br_box(20+i*155,325,155+i*155,352,b.stage=="command"&&b.selection==i?c_yellow:c_gray);br_label(52+i*155,331,labels[i],b.stage=="command"&&b.selection==i?c_yellow:c_white);}
}
function br_menu_draw(){
    var g=global.g;
    for(var i=0;i<45;i++){draw_set_color(make_color_rgb(46+i mod 3*15,60,85));draw_point((i*137) mod 640,((i*71)+floor(g.time*3)) mod 360);}
    if(g.mode=="title"){
        draw_set_color(make_color_rgb(63,100,119));draw_circle(492,166,95,true);draw_circle(492,166,80,true);draw_line(492,166,492+lengthdir_x(66,g.time*8),166+lengthdir_y(66,g.time*8));
        draw_set_color(c_white);draw_text_transformed(55,28,"BRUINS",3,3,0);br_label(58,84,"Fragments of a Broken Timeline",make_color_rgb(137,198,197));
        var opts=[br_text("Nouvelle partie","New game"),br_text("Charger la sauvegarde","Load save"),"Music Room",br_text("Paramètres","Settings"),br_text("Crédits","Credits"),br_text("Nouvelle chronologie","Reset timeline"),br_text("Quitter","Quit")];
        for(var i=0;i<array_length(opts);i++)br_label(58,130+i*26,(g.selection==i?"> ":"  ")+opts[i],g.selection==i?c_yellow:c_white);
        br_label(20,338,br_text("SOURCES EN DÉVELOPPEMENT - Ruines uniquement","SOURCE BUILD IN DEVELOPMENT - Ruins only"),c_gray);
    }
    if(g.mode=="settings"){
        br_label(50,30,br_text("PARAMÈTRES","SETTINGS"),c_white);
        var opts=["Language : "+global.settings.language,"Music : "+string(round(global.settings.music*100))+"%",br_text("Difficulté : ","Difficulty: ")+string(global.settings.difficulty),br_text("Assistance : ","Assist: ")+string(global.settings.assist),br_text("Texte : ","Text speed: ")+string(global.settings.text_speed),"Fullscreen : "+string(global.settings.fullscreen)];
        for(var i=0;i<array_length(opts);i++)br_label(55,88+i*33,(g.selection==i?"> ":"  ")+opts[i],g.selection==i?c_yellow:c_white);
        br_label(50,312,br_text("Gauche/droite : modifier. X : retour. F11 : écran.","Left/right: change. X: back. F11: fullscreen."),c_gray);
    }
    if(g.mode=="music"){
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
    if(g.mode=="credits"){
        br_label(50,40,"BRUINS - Source development build",c_white);
        draw_set_color(c_gray);draw_text_ext(50,100,br_text("Code, textes, matrices pixel et esquisses musicales créés pour ce projet avec Codex.\n\nToriel appartient à Toby Fox / Undertale. Version privée non officielle. Remplacer ce personnage avant publication.\n\n27 compositions synthétiques originales sont incluses. Le jeu complet reste à produire.\n\nX : retour", "Code, writing, pixel matrices and musical sketches created for this project with Codex.\n\nToriel belongs to Toby Fox / Undertale. Unofficial private version. Replace this character before publication.\n\n27 original synthesized compositions included. The complete game remains in development.\n\nX: back"),20,540);
    }
    if(g.message_time>0)br_label(20,318,g.message,c_yellow);
}
