const fs=require('fs'),path=require('path'),{parse}=require('./yy-json.cjs');const root=path.resolve(__dirname,'..'),p=path.join(root,'BRUINS.yyp');const v=parse(fs.readFileSync(p));delete v.viewState;fs.writeFileSync(p,JSON.stringify(v,null,2));
const main=path.join(root,'options','main','options_main.yy'),backup=path.join(root,'documentation','options_main_initial.json');if(fs.existsSync(main)&&!fs.existsSync(backup)){fs.renameSync(main,backup);}
console.log('Removed non-template viewState; preserved incomplete main options as documentation backup.');
