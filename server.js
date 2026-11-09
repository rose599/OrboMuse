// Zero-dependency API around the same engine the UI uses. Run: node server.js  (PORT env optional)
const http=require('http'),fs=require('fs'),path=require('path'),E=require('./engine.js');
const TYPES=['o','d','c','s'],UNDER=['warm','cool','neutral'],CLIM=['any','humid','dry','polluted'],CON=['acne','pig','dull','age','dry','red'];
function validate(b){const e=[];if(!Number.isInteger(b.tone)||b.tone<0||b.tone>6)e.push('tone must be an integer 0-6');
 if(!TYPES.includes(b.type))e.push('type must be one of '+TYPES);if(!UNDER.includes(b.under))e.push('under must be one of '+UNDER);
 if(!Array.isArray(b.concerns)||b.concerns.some(c=>!CON.includes(c)))e.push('concerns must be an array from '+CON);
 if(typeof b.budget!=='number'||b.budget<300||b.budget>5000)e.push('budget must be a number 300-5000');
 if(b.climate&&!CLIM.includes(b.climate))e.push('climate must be one of '+CLIM);return e}
function recommend(b){const u={tone:b.tone,type:b.type,under:b.under,con:new Set(b.concerns),bud:b.budget,clim:b.climate||'any'},r=E.rank(u,{stretch:b.stretch!==false});
 const routine={};E.CATS.forEach(c=>routine[c]=r[c].map(x=>({name:x.p.n,brand:x.p.b,price_inr:x.p.p,score:+x.s.total.toFixed(3),flag:x.flag||null,delta_e00:x.s.dE?+x.s.dE.toFixed(2):undefined,components:Object.fromEntries(Object.entries(x.s).filter(([k])=>k!=='total'&&k!=='dE').map(([k,v])=>[k,+v.toFixed(3)]))})));
 return{routine,warnings:E.routineCheck(r)}}
const send=(res,code,obj)=>{res.writeHead(code,{'Content-Type':'application/json','Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type'});res.end(JSON.stringify(obj))};
http.createServer((req,res)=>{
 if(req.method==='OPTIONS')return send(res,204,{});
 if(req.method==='GET'&&req.url==='/health')return send(res,200,{ok:true,products:E.CATALOG.length});
 if(req.method==='GET'&&req.url==='/catalog')return send(res,200,JSON.parse(fs.readFileSync(path.join(__dirname,'data/catalog.json'))));
 if(req.method==='POST'&&req.url==='/recommend'){let d='';req.on('data',c=>{d+=c;if(d.length>1e5)req.destroy()});req.on('end',()=>{let b;try{b=JSON.parse(d)}catch(_){return send(res,400,{errors:['invalid JSON']})}const e=validate(b);return e.length?send(res,422,{errors:e}):send(res,200,recommend(b))});return}
 if(req.method==='GET'&&(req.url==='/'||req.url==='/index.html')){res.writeHead(200,{'Content-Type':'text/html'});return res.end(fs.readFileSync(path.join(__dirname,'index.html')))}
 send(res,404,{error:'not found'})}).listen(process.env.PORT||3000,()=>console.log('Orbo Muse API on :'+(process.env.PORT||3000)));
