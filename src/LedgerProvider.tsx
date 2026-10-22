import React,{createContext,useContext,useEffect,useState} from 'react';
import type {GeneratorData} from './data';
import {isPending,type SyncEngine} from './sync';
import {PwaShell} from './PwaShell';
type Change=<K extends keyof GeneratorData>(key:K,value:React.SetStateAction<GeneratorData[K]>)=>void;
const Context=createContext<{data:GeneratorData;change:Change;update:(fn:(data:GeneratorData)=>GeneratorData)=>void}|null>(null);
export function useGeneratorData(){const value=useContext(Context);if(!value)throw new Error('Missing ledger provider');return value;}
export function LedgerProvider({engine,lockName,children}:{engine:SyncEngine;lockName:string;children:React.ReactNode}) {
  const [,render]=useState(0);const [owner,setOwner]=useState(false);const [online,setOnline]=useState(navigator.onLine);const [exported,setExported]=useState(false);
  useEffect(()=>engine.subscribe(()=>render(n=>n+1)),[engine]);
  useEffect(()=>{
    let stopped=false;let release=()=>{};
    const start=async()=>{if(stopped)return;setOwner(true);await engine.start();};
    if(navigator.locks){void navigator.locks.request(lockName,{mode:'exclusive'},async()=>{if(stopped)return;const held=new Promise<void>(resolve=>{release=resolve;});await start();await held;});}
    else {engine.error='هذا المتصفح لا يدعم الحفظ الآمن بين التبويبات. استخدم متصفحًا حديثًا.';render(n=>n+1);}
    return()=>{stopped=true;release();};
  },[engine,lockName]);
  useEffect(()=>{
    if(!owner)return;
    const network=()=>{setOnline(navigator.onLine);if(navigator.onLine)void engine.sync();};
    const focus=()=>{if(document.visibilityState==='visible'&&Date.now()-engine.lastSync>60000)void engine.sync();};
    const interval=setInterval(()=>{if(engine.value&&isPending(engine.value)&&!engine.busy)void engine.sync();},60000);
    const guard=(e:BeforeUnloadEvent)=>{if(engine.localSaving||engine.error){e.preventDefault();e.returnValue='';}};
    window.addEventListener('online',network);window.addEventListener('offline',network);document.addEventListener('visibilitychange',focus);window.addEventListener('beforeunload',guard);
    return()=>{clearInterval(interval);window.removeEventListener('online',network);window.removeEventListener('offline',network);document.removeEventListener('visibilitychange',focus);window.removeEventListener('beforeunload',guard);};
  },[owner,engine]);
  const download=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(engine.value,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='generator-local-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setExported(true);};
  const update=(fn:(data:GeneratorData)=>GeneratorData)=>{setExported(false);try{engine.update(fn);}catch(error){engine.error=error instanceof Error?error.message:'تعذر حفظ التعديل';render(n=>n+1);}};
  const change:Change=(key,value)=>update(previous=>({...previous,[key]:typeof value==='function'?(value as Function)(previous[key]):value}));
  const data=engine.value?.data;
  const blocked=engine.localSaving||engine.busy||!!engine.error||engine.conflict;
  const button='rounded-xl bg-amber-400 text-slate-950 px-4 py-2 font-bold text-sm';
  return <PwaShell canUpdate={!engine.localSaving&&!engine.busy&&!engine.error}>
    {!owner||!data?<main dir="rtl" className="min-h-screen bg-slate-950 text-slate-100 grid place-items-center p-6"><section className="text-center space-y-4"><img src={import.meta.env.BASE_URL+'icon-192.png'} className="w-24 rounded-2xl mx-auto" alt="شعار حسن الجنابي"/><h1 className="text-xl font-bold">مولدة حسن كريم كاظم</h1><p>{engine.error||(!owner?'النظام مفتوح بتبويبة أخرى. أغلقها للمتابعة هنا.':engine.status)}</p>{owner&&<button className={button} onClick={()=>void engine.sync()}>إعادة المحاولة</button>}</section></main>:
    <Context.Provider value={{data,change,update}}>
      <div dir="rtl" className="bg-slate-900 text-xs p-2 flex flex-wrap items-center justify-between gap-2 text-slate-300"><span>{engine.localSaving?'جارٍ الحفظ على الجهاز…':!online?'أوفلاين — محفوظ على الجهاز'+(isPending(engine.value!)?'، توجد تعديلات تنتظر المزامنة':''):engine.status}</span><button disabled={blocked||!online} className="underline disabled:opacity-40" onClick={()=>void engine.sync()}>مزامنة الآن</button></div>
      {children}
      {blocked&&<div dir="rtl" className="fixed inset-0 z-[100] bg-slate-950/95 text-slate-100 flex items-center justify-center p-6"><section className="max-w-lg text-center space-y-4"><p role="alert">{engine.error||(engine.conflict?engine.status:engine.localSaving?'جارٍ حفظ العملية على الجهاز…':'جارٍ المزامنة؛ تعديلك محفوظ محليًا…')}</p>{(engine.error||engine.conflict)&&<><button className={button} onClick={download}>تنزيل النسخة المحلية</button>{engine.conflict&&<button disabled={!exported||!online} className="block mx-auto underline disabled:opacity-40" onClick={()=>{if(window.confirm('هل حفظت النسخة المحلية؟ سيتم استبدال تعديلات هذا الجهاز بالنسخة السحابية. يمكنك مراجعة النسخة المنزّلة لاسترجاع تفاصيلها يدويًا.'))void engine.useCloud();}}>اعتماد النسخة السحابية بعد النسخ الاحتياطي</button>}</>}</section></div>}
    </Context.Provider>}
  </PwaShell>;
}
