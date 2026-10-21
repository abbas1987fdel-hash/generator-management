import React, {createContext, useContext, useEffect, useRef, useState} from 'react';
import {initializeApp} from 'firebase/app';
import {doc, getFirestore, onSnapshot, runTransaction, serverTimestamp} from 'firebase/firestore';
import {emptyData, checkWrite, type GeneratorData} from './data';
import firebaseConfig from './firebase-config.json';
import {normalizeLedger} from './accounting';

const firebase = initializeApp(firebaseConfig);
const db = getFirestore(firebase);
const ref = doc(db, 'generator', 'main');
type Change = <K extends keyof GeneratorData>(key: K, value: React.SetStateAction<GeneratorData[K]>) => void;
const Context = createContext<{data: GeneratorData; change: Change; update: (transform: (data: GeneratorData)=>GeneratorData)=>void} | null>(null);
export function useGeneratorData() {
  const value = useContext(Context);
  if (!value) throw new Error('Missing generator provider');
  return value;
}
export function CloudProvider({children}: {children: React.ReactNode}) {
  const [data,setData] = useState<GeneratorData>(emptyData);
  const [ready,setReady] = useState(false);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const revision = useRef(0);
  const dirty = useRef(false);
  const saving = useRef(false);
  const current = useRef(data);
  const [online,setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const onlineChanged=()=>setOnline(navigator.onLine);
    window.addEventListener('online',onlineChanged); window.addEventListener('offline',onlineChanged);
    const protect=(event: BeforeUnloadEvent)=>{if(dirty.current){event.preventDefault();event.returnValue='';}};
    window.addEventListener('beforeunload',protect);
    return ()=>{window.removeEventListener('online',onlineChanged);window.removeEventListener('offline',onlineChanged);window.removeEventListener('beforeunload',protect);};
  },[]);
  useEffect(() => {
    setReady(false);
    return onSnapshot(ref, {includeMetadataChanges:true}, snapshot => {
      if (dirty.current || saving.current || snapshot.metadata.fromCache) return;
      const row=snapshot.data();
      revision.current=row?.revision ?? 0;
      current.current=normalizeLedger(row?.data ?? emptyData());
      setData(current.current); setReady(true);
    }, () => setError('تعذر تحميل البيانات. تحقق من الاتصال وصلاحيات حسابك ثم أعد المحاولة.'));
  },[]);
  const update = (transform: (data: GeneratorData)=>GeneratorData) => {
    if (!online || saving.current) return;
    current.current=transform(current.current);
    dirty.current=true; setBusy(true); setData(current.current);
  };
  const change: Change = (key,value) => {
    if (!online || saving.current) return;
    const previous=current.current;
    const next=typeof value==='function' ? (value as Function)(previous[key]) : value;
    current.current={...previous,[key]:next};
    dirty.current=true; setBusy(true); setData(current.current);
  };
  useEffect(() => {
    if (!dirty.current || saving.current) return;
    saving.current=true;
    const next=current.current;
    const expected=revision.current;
    runTransaction(db,async transaction=>{
      const snapshot=await transaction.get(ref);
      checkWrite(snapshot.data()?.revision ?? 0,expected,next);
      transaction.set(ref,{data:next,revision:expected+1,updatedAt:serverTimestamp()});
    }).then(()=>{
      revision.current=expected+1; dirty.current=false; setBusy(false);
    }).catch(()=>{
      setError('لم تُحفظ العملية. قد تكون البيانات تغيرت على جهاز آخر أو انقطع الاتصال. نزّل نسخة من التعديل قبل إعادة التحميل.');
    }).finally(()=>{saving.current=false;});
  },[data]);
  const exportDraft=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(current.current,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='generator-unsaved.json';a.click();URL.revokeObjectURL(url);};
  const panel=(content:React.ReactNode)=><main dir="rtl" className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6"><section className="max-w-md w-full rounded-3xl border border-slate-700 bg-slate-900 p-8 text-center space-y-5"><h1 className="text-2xl font-bold text-amber-400">مولدة حسن كريم كاظم</h1>{content}</section></main>;
  const button='rounded-xl bg-amber-400 text-slate-950 px-6 py-3 font-bold';
  if(!ready) return panel(<><p>{error||'جارٍ تحميل البيانات…'}</p>{error&&<button className={button} onClick={()=>location.reload()}>إعادة المحاولة</button>}</>);
  return <Context.Provider value={{data,change,update}}><div dir="rtl" className="bg-slate-900 text-xs p-2 flex justify-between text-slate-300"><span>{busy?'جارٍ الحفظ…':online?'البيانات محفوظة سحابيًا':'غير متصل — العرض فقط'}</span></div>{children}{(!online||busy||error)&&<div className="fixed inset-0 z-[100] bg-slate-950/90 flex items-center justify-center p-6" dir="rtl"><section className="max-w-lg text-center space-y-4"><p role="alert">{error||(!online?'اتصل بالإنترنت لمتابعة العمل وحفظ العمليات.':'جارٍ حفظ العملية…')}</p>{error&&<><button className={button} onClick={exportDraft}>تنزيل نسخة من التعديل</button><button className="block mx-auto underline" onClick={()=>{dirty.current=false;location.reload();}}>إعادة تحميل البيانات المحفوظة</button></>}</section></div>}</Context.Provider>;
}
