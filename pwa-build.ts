import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import type {Plugin,ResolvedConfig} from 'vite';
export function pwaBuild():Plugin {
  let config:ResolvedConfig;
  return {name:'generator-offline-shell',configResolved(value){config=value;},closeBundle(){
    const out=path.resolve(config.root,config.build.outDir),base=config.base;
    const version=JSON.parse(readFileSync(path.resolve(config.root,'package.json'),'utf8')).version;
    const files=(folder:string):string[]=>readdirSync(folder,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?files(path.join(folder,entry.name)):[path.join(folder,entry.name)]);
    const assets=files(out).filter(file=>!file.endsWith('sw.js')).map(file=>base+path.relative(out,file).replaceAll('\\','/'));
    const hash=createHash('sha256').update(assets.join('|')+version).digest('hex').slice(0,12);
    writeFileSync(path.join(out,'sw.js'),`
const VERSION=${JSON.stringify(version)};
const PREFIX='generator-shell-'+${JSON.stringify(encodeURIComponent(base))}+'-';
const CACHE=PREFIX+${JSON.stringify(hash)};
const ASSETS=${JSON.stringify(assets)};
const BASE=${JSON.stringify(base)};
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('message',event=>{if(event.data?.type==='ACTIVATE')self.skipWaiting();if(event.data?.type==='VERSION')event.ports[0]?.postMessage({version:VERSION});});
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin||!url.pathname.startsWith(BASE)||url.pathname.endsWith('/sw.js'))return;
 if(event.request.mode==='navigate') {event.respondWith(caches.open(CACHE).then(cache=>cache.match(BASE+'index.html')).then(cached=>cached||fetch(event.request)));return;}
 if(ASSETS.includes(url.pathname))event.respondWith(caches.open(CACHE).then(cache=>cache.match(url.pathname)).then(cached=>cached||fetch(event.request)));
});
`);
  }};
}
