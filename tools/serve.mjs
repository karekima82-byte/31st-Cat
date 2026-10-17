import http from 'node:http';
import {readFile,realpath} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {networkInterfaces} from 'node:os';

const root=fileURLToPath(new URL('../',import.meta.url));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.mp3':'audio/mpeg','.mp4':'video/mp4'};
const entries=new Set(['index.html','app.js','reader.js','audio.js','media.js','text-voice.js','audio-session.js','core.js','pc-effects.js','presentation.js','style.css']);
const previews=new Set(['tools/art-preview.html','tools/illustration-preview.html','tools/pc-preview.html','tools/bridge-preview.html','integration/bridge.js']);
export function publicPath(input){
 let path;try{path=decodeURIComponent(new URL(input,'http://localhost').pathname);}catch{return null;}
 if(path==='/'||path==='/index.html')return 'index.html';
 const relative=path.slice(1);
 if(relative.includes('\\')||relative.includes('\0')||relative.split('/').some(p=>p==='..'||p==='.'||p.startsWith('.')))return null;
 if(entries.has(relative)||previews.has(relative))return relative;
 if(/^(assets|data)\/[\w\-/]+\.(png|jpe?g|webp|svg|json|js|mp3|mp4)$/.test(relative))return relative;
 return null;
}
export function createHandler(directory=root){
 return async(req,res)=>{
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'}).end();return;}
  const relative=publicPath(req.url);if(!relative){res.writeHead(404).end('Not found');return;}
  try{const base=await realpath(directory),path=await realpath(resolve(directory,relative));
   if(!path.toLowerCase().startsWith((base+sep).toLowerCase())){res.writeHead(403).end();return;}
   const body=await readFile(path);res.setHeader('Content-Type',mime[extname(path)]||'application/octet-stream');res.setHeader('Accept-Ranges','bytes');
   const range=req.headers?.range;
   if(range){const span=parseRange(range,body.length);if(!span){res.setHeader('Content-Range',`bytes */${body.length}`);res.setHeader('Content-Length',0);res.writeHead(416).end();return;}const [start,end]=span;res.setHeader('Content-Range',`bytes ${start}-${end}/${body.length}`);res.setHeader('Content-Length',end-start+1);res.writeHead(206);res.end(req.method==='HEAD'?undefined:body.subarray(start,end+1));return;}
   res.setHeader('Content-Length',body.length);res.end(req.method==='HEAD'?undefined:body);
  }catch{res.writeHead(404).end('Not found');}
 };
}
export function parseRange(header,size){const match=/^bytes=(\d*)-(\d*)$/.exec(header);if(!match||!size||!match[1]&&!match[2])return null;let start,end;if(!match[1]){const length=Number(match[2]);if(!Number.isSafeInteger(length)||length<1)return null;start=Math.max(0,size-length);end=size-1;}else{start=Number(match[1]);end=match[2]?Number(match[2]):size-1;}if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>=size||end<start)return null;return [start,Math.min(end,size-1)];}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const portArgument=process.argv.indexOf('--port'),initialPort=portArgument<0?8831:Number(process.argv[portArgument+1]),lan=process.argv.includes('--lan'),host=lan?'0.0.0.0':'127.0.0.1';
 let port=initialPort;
 if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Invalid --port');
 const server=http.createServer(createHandler());
 server.on('error',error=>{
  if(error.code==='EADDRINUSE'&&port<Math.min(initialPort+20,65535)){
   console.log(`ポート${port}は使用中のため、別のポートで起動します。`);port++;server.listen(port,host);return;
  }
  console.error(`サーバーを起動できません: ${error.message}`);process.exitCode=1;
 });
 server.on('listening',()=>{

  console.log(`PC: http://127.0.0.1:${port}/`);
  if(lan){try{for(const item of Object.values(networkInterfaces()).flat())if(item.family==='IPv4'&&!item.internal&&/^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(item.address))console.log(`Smartphone: http://${item.address}:${port}/`);}catch{console.log('スマホでは、このPCのIPv4アドレスとポート8831で開いてください。');}
   console.log('PCとスマホを同じWi-Fiに接続してください。終了: Ctrl+C');}
 });
 server.listen(port,host);
}
