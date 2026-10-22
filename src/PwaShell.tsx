import {useEffect,useRef,useState,type ReactNode} from 'react';
import packageInfo from '../package.json';
type InstallEvent=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:string}>};
export function PwaShell({children,canUpdate}:{children:ReactNode;canUpdate:boolean}) {
  const [install,setInstall]=useState<InstallEvent|null>(null);
  const [installed,setInstalled]=useState(()=>window.matchMedia('(display-mode: standalone)').matches||!!(navigator as any).standalone);
  const [showInstall,setShowInstall]=useState(()=>{try{return !localStorage.getItem('generator-install-skipped');}catch{return true;}});
  const [guide,setGuide]=useState('');const [waiting,setWaiting]=useState<ServiceWorker|null>(null);const [nextVersion,setNextVersion]=useState('');const [activated,setActivated]=useState(false);const [workerReady,setWorkerReady]=useState(false);
  const safe=useRef(canUpdate);safe.current=canUpdate;
  const requested=useRef(false);
  useEffect(()=>{
    const offer=(e:Event)=>{e.preventDefault();setInstall(e as InstallEvent);};
    const done=()=>{setInstalled(true);setShowInstall(false);setInstall(null);};
    window.addEventListener('beforeinstallprompt',offer);window.addEventListener('appinstalled',done);
    return()=>{window.removeEventListener('beforeinstallprompt',offer);window.removeEventListener('appinstalled',done);};
  },[]);
  useEffect(()=>{
    if(!import.meta.env.PROD||!('serviceWorker' in navigator))return;
    let disposed=false;let registration:ServiceWorkerRegistration|undefined;
    const detect=()=>{
      if(disposed||!registration?.waiting||!registration.active)return;
      setWaiting(registration.waiting);
      const channel=new MessageChannel();channel.port1.onmessage=e=>{setNextVersion(String(e.data.version??''));channel.port1.close();};
      registration.waiting.postMessage({type:'VERSION'},[channel.port2]);
    };
    const changed=()=>{setWorkerReady(true);setWaiting(null);if(requested.current&&safe.current)location.reload();else if(requested.current)setActivated(true);};
    navigator.serviceWorker.addEventListener('controllerchange',changed);
    void navigator.serviceWorker.register(import.meta.env.BASE_URL+'sw.js',{scope:import.meta.env.BASE_URL,updateViaCache:'none'}).then(reg=>{
      if(disposed)return;registration=reg;detect();
      reg.addEventListener('updatefound',()=>{reg.installing?.addEventListener('statechange',detect);});
      void navigator.serviceWorker.ready.then(()=>{if(!disposed)setWorkerReady(true);});
    }).catch(()=>setGuide('تعذر تجهيز العمل دون إنترنت. تحقق من اتصالك واسمح بتخزين الموقع ثم أعد فتحه.'));
    let lastCheck=Date.now();
    const refresh=()=>{if(navigator.onLine&&document.visibilityState==='visible'&&Date.now()-lastCheck>60000){lastCheck=Date.now();void registration?.update().catch(()=>{});}};
    const timer=setInterval(refresh,5*60*1000);
    window.addEventListener('online',refresh);document.addEventListener('visibilitychange',refresh);
    return()=>{disposed=true;clearInterval(timer);window.removeEventListener('online',refresh);document.removeEventListener('visibilitychange',refresh);navigator.serviceWorker.removeEventListener('controllerchange',changed);};
  },[]);
  const skip=()=>{setShowInstall(false);try{localStorage.setItem('generator-install-skipped','1');}catch{}};
  const doInstall=async()=>{
    if(install){try{await install.prompt();const choice=await install.userChoice;if(choice.outcome==='accepted')setShowInstall(false);setInstall(null);}catch{setGuide('تعذر فتح نافذة التثبيت. جرّب قائمة المتصفح ← تثبيت التطبيق.');}return;}
    setGuide(/iPad|iPhone|iPod/.test(navigator.userAgent)?'من Safari اضغط مشاركة ثم «إضافة إلى الشاشة الرئيسية».':'إذا ظهر رمز التثبيت في شريط العنوان اضغطه، أو افتح قائمة Chrome / Edge واختر «تثبيت التطبيق». إذا لم يظهر، افتح الرابط بالمتصفح الخارجي.');
  };
  return <>
    <div dir="rtl" className="bg-slate-950 border-b border-slate-800 text-slate-300 p-2 flex flex-wrap justify-between items-center gap-2 text-xs"><span>الإصدار {packageInfo.version} · {workerReady?'ملفات التطبيق جاهزة دون إنترنت':'تجهيز ملفات التطبيق'}</span>{!installed&&<button className="text-amber-300 underline" onClick={()=>setShowInstall(true)}>تثبيت التطبيق</button>}</div>
    {(waiting||activated)&&<section dir="rtl" role="status" className="bg-amber-200 text-slate-950 p-3 flex flex-wrap items-center justify-between gap-2 text-sm"><span>يتوفر تحديث {nextVersion} للتطبيق</span><button disabled={!canUpdate} className="rounded-lg bg-slate-950 text-white px-4 py-2 disabled:opacity-40" onClick={()=>{if(!canUpdate||!window.confirm('احفظ أي حقول مفتوحة أولًا. تطبيق التحديث سيعيد فتح النظام؛ التعديلات المحفوظة محليًا ستبقى. هل تريد المتابعة؟'))return;if(activated)location.reload();else{requested.current=true;waiting?.postMessage({type:'ACTIVATE'});}}}>تحديث الآن</button></section>}
    {children}
    {showInstall&&!installed&&<div dir="rtl" className="fixed inset-0 z-[120] bg-slate-950/95 flex items-center justify-center p-6"><section className="max-w-sm w-full bg-slate-900 border border-slate-700 rounded-3xl p-6 text-center text-slate-100 space-y-4"><img src={import.meta.env.BASE_URL+'brand.png'} alt="شعار حسن الجنابي" className="w-40 h-40 object-contain rounded-2xl mx-auto"/><h2 className="text-xl font-bold">ثبّت تطبيق المولدة</h2><p className="text-sm text-slate-400">افتحه من الشاشة الرئيسية. يلزم فتح النظام بالإنترنت أول مرة لتحميل بياناتك.</p>{guide&&<p role="status" className="text-sm text-amber-200">{guide}</p>}<button className="block w-full rounded-xl p-3 bg-amber-400 text-slate-950 font-bold" onClick={()=>void doInstall()}>تثبيت التطبيق</button><button className="block w-full rounded-xl p-3 bg-slate-800" onClick={skip}>تخطي</button></section></div>}
  </>;
}
