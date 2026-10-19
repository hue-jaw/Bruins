const fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'..');
function edit(p,fn){p=path.join(root,p);fs.writeFileSync(p,fn(fs.readFileSync(p,'utf8')));}
edit('scripts/scr_presentation/scr_presentation.gml',s=>s.replace(/\bsolid\b/g,'cell_wall'));
edit('scripts/scr_music_system/scr_music_system.gml',s=>s.replace('if(global.music.asset==asset&&global.music.handle!=-1)return;','if(global.music.asset==asset&&global.music.handle!=-1&&(audio_is_playing(global.music.handle)||audio_is_paused(global.music.handle)))return;').replace('if(global.music.handle==-1){br_music_play(global.g.selection);return;}','if(global.music.handle==-1||(!audio_is_playing(global.music.handle)&&!audio_is_paused(global.music.handle))){br_music_play(global.g.selection);return;}'));
// Remove the obsolete one-time repair from the packaged toolset without deleting files.
fs.writeFileSync(path.join(root,'tools','fix-source.cjs'),'// Compatibility repairs are already applied to the shipped sources.\nconsole.log("Already applied. Use build-content.cjs and build-project.cjs to regenerate assets.");\n');
fs.copyFileSync(path.join(root,'documentation','README-source.md'),path.join(root,'README.md'));
console.log('Final source review applied and README copied.');
