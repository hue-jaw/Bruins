if (instance_number(obj_game_manager) > 1) { instance_destroy(); exit; }
game_set_speed(60, gamespeed_fps);
display_set_gui_size(640, 360);
window_set_size(1280, 720);
gpu_set_texfilter(false);
randomize();
br_boot();
