const fs=require('fs'),path=require('path');const p=path.join(__dirname,'yy-json.cjs');let s=fs.readFileSync(p,'utf8');s=s.replace('function(s){let out=', 'function(s){s=String(s);let out=');fs.writeFileSync(p,s);
const root=path.resolve(__dirname,'..');fs.mkdirSync(path.join(root,'build'),{recursive:true});console.log('Build output and YY text parser ready.');
