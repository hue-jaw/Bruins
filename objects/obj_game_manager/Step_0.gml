br_input();
var dt = min(delta_time / 1000000, 0.05);
global.g.time += dt;
br_music_step(dt);
switch (global.g.mode) {
    case "title": case "settings": case "music": case "credits": br_menu_step(dt); break;
    case "world": br_world_step(dt); break;
    case "dialogue": br_dialogue_step(dt); break;
    case "battle": br_battle_step(dt); break;
    case "inventory": br_inventory_step(); break;
    case "dead": if (global.input.ok) { if (!br_load()) br_new(); } break;
}
