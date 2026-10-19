function br_battle_start(_id) {
    var e=variable_struct_get(global.db.enemies,_id);
    global.g.battle={id:_id,enemy:e,hp:e.hp,calm:0,turn:0,stage:"command",selection:0,sub:0,text:br_tr(e.intro),hx:320,hy:250,vy:0,invincible:0,energy:3,phase_time:0,spawn_time:0,bullets:[],shots:[],lasers:[],accumulator:0,aim:0,aim_dir:1,soul:br_soul(),shield:0,shot_timer:0,rail:1,secret:false,protected:false,listened:false,hold:0,rewarded:[]};
    global.g.mode="battle";br_music_play(_id=="guardian"?10:7);
}
function br_battle_turn() {
    var b=global.g.battle;b.stage="dodge";b.turn++;b.phase_time=0;b.spawn_time=0;b.bullets=[];b.lasers=[];b.shots=[];b.hx=320;b.hy=250;b.vy=0;b.invincible=.7;b.energy=3;b.accumulator=0;b.secret=false;b.hold=0;
    b.text=br_tr(global.db.souls.affinities[b.soul].hint);
}
function br_battle_end(_spared) {
    var b=global.g.battle;
    if(b.id=="mossling"){global.run.flags.enemy=true;global.run.flags.enemy_spared=_spared;}else {global.run.flags.boss=true;global.run.flags.boss_spared=_spared;}
    global.run.gold+=b.enemy.reward;
    if(_spared){global.run.spared++;br_effects({kindness:35,empathy:12,trust_toriel:2});if(global.run.flags.promise){global.run.promises_kept++;}}
    else {global.run.kills++;br_effects({chaos:18,bravery:10,trust_toriel:-4,fear_toriel:3});if(global.run.flags.promise){global.run.promises_broken++;global.run.flags.promise=false;}}
    array_push(global.run.memories,{enemy:b.id,spared:_spared,reset:global.meta.resets});
    br_music_play(br_music_area());br_dialogue(_spared?"victory_kind":"victory_kill");
}
function br_battle_step(_dt) {
    var b=global.g.battle,inp=global.input;
    if(b.stage=="command"){
        b.selection=(b.selection+inp.right-inp.left+4) mod 4;
        if(inp.ok){b.sub=0;switch(b.selection){case 0:b.stage="aim";b.aim=0;break;case 1:b.stage="act";break;case 2:b.stage="item";break;case 3:b.stage="mercy";break;}}
        return;
    }
    if(b.stage=="aim"){
        b.aim+=_dt*1.2;
        if(inp.ok||b.aim>=1){var quality=max(0,1-abs(b.aim-.5)*2),dmg=max(1,round(3+quality*9-b.enemy.defense));b.hp-=dmg;b.text=string(dmg)+br_text(" dégâts."," damage.");if(b.hp<=0)br_battle_end(false);else br_battle_turn();}return;
    }
    if(b.stage=="act"||b.stage=="item"||b.stage=="mercy"){
        var count=b.stage=="act"?array_length(b.enemy.actions):(b.stage=="item"?array_length(global.run.inventory):2);
        b.sub=clamp(b.sub+inp.down-inp.up,0,max(0,count-1));
        if(inp.back){b.stage="command";return;}
        if(!inp.ok)return;
        if(b.stage=="act"){
            var action=b.enemy.actions[b.sub];b.calm+=action.calm;
            var already=false;for(var j=0;j<array_length(b.rewarded);j++)if(b.rewarded[j]==action.id)already=true;
            if(!already){br_effects(action.effects);array_push(b.rewarded,action.id);}
            b.text=br_tr(action.response);
            if(action.id=="listen")b.listened=true;if(action.id=="protect")b.protected=true;
            b.stage="response";return;
        }
        if(b.stage=="item"){if(br_use_item(b.sub)){b.text=br_text("Le goût te ramène au présent.","The taste brings you back to the present.");b.stage="response";}return;}
        if(b.stage=="mercy"){
            if(b.sub==1){if(b.enemy.boss){b.text=br_text("La porte est encore fermée.","The door is still sealed.");b.stage="response";}else {global.g.mode="world";br_music_play(br_music_area());}return;}
            if(b.calm>=b.enemy.mercy && (!b.enemy.boss || (b.listened&&b.protected))){br_battle_end(true);return;}
            b.text=br_text("Pas encore. Écoute ce qui le retient.","Not yet. Listen to what holds them here.");b.stage="response";return;
        }
    }
    if(b.stage=="response"){if(inp.ok)br_battle_turn();return;}
    if(b.stage!="dodge")return;
    // Bounded fixed simulation steps: fast projectiles cannot tunnel on slow display frames.
    b.accumulator+=_dt;
    while(b.accumulator>=1/120&&global.g.mode=="battle"&&b.stage=="dodge"){br_battle_tick(1/120);b.accumulator-=1/120;}
}
function br_bullet(_x,_y,_dx,_dy,_kind) {array_push(global.g.battle.bullets,{px:_x,py:_y,vx:_dx,vy:_dy,kind:_kind,r:4});}
function br_battle_tick(_dt) {
    var b=global.g.battle,inp=global.input;b.phase_time+=_dt;b.invincible=max(0,b.invincible-_dt);b.shot_timer=max(0,b.shot_timer-_dt);
    var move_speed=125,dx=inp.dx,dy=inp.dy,scale=1;
    if(b.soul==1&&inp.ability&&b.energy>0){scale=.35;b.energy-=_dt;}
    if(b.soul==2)move_speed=175;
    if(b.soul==9){var flip=(floor(b.phase_time/2) mod 2)==1;dx*=flip?-1:1;move_speed=flip?180:110;}
    if(b.soul==3){b.vy+=380*_dt;if(inp.ability&&b.hy>=282)b.vy=-210;b.hy=min(282,b.hy+b.vy*_dt);b.hx+=dx*move_speed*_dt;}
    else if(b.soul==4){b.hx+=dx*move_speed*_dt;b.hold-=_dt;if(dy!=0&&b.hold<=0){b.rail=clamp(b.rail+sign(dy),0,2);b.hold=.19;}b.hy=210+b.rail*32;}
    else {var len=max(1,sqrt(dx*dx+dy*dy));b.hx+=dx/len*move_speed*_dt;b.hy+=dy/len*move_speed*_dt;}
    b.hx=clamp(b.hx,206,434);b.hy=clamp(b.hy,186,282);
    if(dx!=0||dy!=0)b.shield=point_direction(0,0,dx,dy);
    if(b.soul==6&&inp.fire&&b.shot_timer<=0){array_push(b.shots,{px:b.hx,py:b.hy});b.shot_timer=.18;}
    if(b.soul==8&&!b.secret&&point_distance(b.hx,b.hy,420,200)<15&&inp.ability){b.secret=true;b.calm+=1;global.run.hp=min(global.run.maxhp,global.run.hp+2);}
    var interval=b.enemy.boss?.42:.65;
    if(global.settings.difficulty==0)interval*=1.5;if(global.settings.difficulty==2)interval*=.8;
    b.spawn_time-=_dt;
    if(b.spawn_time<=0){
        b.spawn_time+=interval;var pattern=(b.turn-1) mod 4,vel=global.settings.difficulty==0?65:90;
        if(pattern==0){var xx=220+((floor(b.phase_time/interval)*47) mod 200);br_bullet(xx,180,0,vel,b.soul==2?1:0);}
        if(pattern==1){var angle=point_direction(320,180,b.hx,b.hy);br_bullet(320,180,lengthdir_x(vel,angle),lengthdir_y(vel,angle),b.soul==6?2:0);}
        if(pattern==2){for(var j=0;j<5;j++){var angle=j*36+10;br_bullet(320,180,lengthdir_x(vel,angle),abs(lengthdir_y(vel,angle)),0);}}
        if(pattern==3){if(array_length(b.lasers)<3)array_push(b.lasers,{px:215+((floor(b.phase_time/interval)*53) mod 210),age:0});}
    }
    for(var i=array_length(b.shots)-1;i>=0;i--){var s=b.shots[i];s.py-=230*_dt;var hit=false;for(var j=array_length(b.bullets)-1;j>=0;j--){var p=b.bullets[j];if(p.kind==2&&point_distance(s.px,s.py,p.px,p.py)<10){array_delete(b.bullets,j,1);hit=true;break;}}if(hit||s.py<180)array_delete(b.shots,i,1);}
    for(var i=array_length(b.bullets)-1;i>=0;i--){
        var p=b.bullets[i];p.px+=p.vx*_dt*scale;p.py+=p.vy*_dt*scale;
        if(p.px<190||p.px>450||p.py>298||p.py<170){array_delete(b.bullets,i,1);continue;}
        var dist=point_distance(p.px,p.py,b.hx,b.hy);
        if(b.soul==5&&inp.ability&&dist<23&&abs(angle_difference(b.shield,point_direction(b.hx,b.hy,p.px,p.py)))<60){array_delete(b.bullets,i,1);continue;}
        if(dist<7 && !(p.kind==1&&(inp.dx!=0||inp.dy!=0))){br_damage();array_delete(b.bullets,i,1);}
    }
    for(var i=array_length(b.lasers)-1;i>=0;i--){var l=b.lasers[i];l.age+=_dt;if(l.age>1.2&&l.age<1.45&&abs(b.hx-l.px)<8)br_damage();if(l.age>1.6)array_delete(b.lasers,i,1);}
    if(b.phase_time>=6.5){b.stage="command";b.soul=br_soul();b.text=br_tr(b.enemy.turn_text);if(b.calm>=b.enemy.mercy)b.text=br_text("Il hésite. MERCY devient possible.","They hesitate. MERCY may now work.");}
}
function br_damage(){
    var b=global.g.battle;if(b.invincible>0)return;
    var damage=max(1,b.enemy.attack-(global.settings.difficulty==0?1:0)-(global.settings.assist?1:0));
    if(b.soul==0&&global.run.hp<=6)damage=max(1,damage-1);
    global.run.hp=max(0,global.run.hp-damage);b.invincible=global.settings.assist?1.5:1;
    if(global.run.hp<=0){global.g.mode="dead";br_music_stop();}
}
