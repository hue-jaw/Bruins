const fs=require('fs'),path=require('path'),{parse}=require('./yy-json.cjs'),root=path.resolve(__dirname,'..');
for(const name of['integrate-ost.cjs','validate.cjs']){const p=path.join(__dirname,name);let s=fs.readFileSync(p,'utf8');if(!s.includes('const parseYY='))s="const parseYY=require('./yy-json.cjs').parse;\n"+s;s=s.replaceAll('JSON.parse(fs.readFileSync','parseYY(fs.readFileSync');fs.writeFileSync(p,s);}
const pp=path.join(root,'BRUINS.yyp'),p=parse(fs.readFileSync(pp,'utf8'));for(const a of p.AudioGroups)delete a.exportDir;fs.writeFileSync(pp,JSON.stringify(p,null,2));
const op=path.join(root,'options','main','options_main.yy'),o=parse(fs.readFileSync(op,'utf8'));o.option_remove_unused_assets=false;fs.writeFileSync(op,JSON.stringify(o,null,2));
console.log('Adjusted migration fields reported by the installed LTS IDE; parsers now accept GameMaker trailing commas.');
