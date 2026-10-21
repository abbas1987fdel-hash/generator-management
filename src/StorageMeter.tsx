import {STORAGE_LIMIT,storageBytes,type GeneratorData} from './data';
export const sizeLabel=(bytes:number)=>(bytes/1000).toLocaleString('ar-IQ',{maximumFractionDigits:2})+' كيلوبايت';
export function StorageMeter({data}:{data:GeneratorData}) {
  const used=storageBytes(data),percent=Math.min(100,used/STORAGE_LIMIT*100);
  return <section dir="rtl" className="rounded-2xl bg-slate-950 p-4 border border-slate-700 space-y-3">
    <h3 className="font-bold text-sm">استخدام تخزين النظام</h3>
    <div className="flex items-center gap-4">
      <div role="img" aria-label={`المستخدم ${percent.toFixed(2)} بالمئة`} className="w-24 h-24 shrink-0 rounded-full p-3" style={{background:`conic-gradient(#ef4444 0% ${percent}%, #fff ${percent}% 100%)`}}><div className="rounded-full bg-slate-950 h-full flex items-center justify-center text-sm" dir="ltr">{percent.toFixed(2)}%</div></div>
      <div className="text-xs space-y-2"><p className="text-red-400">● المستخدم: {sizeLabel(used)}</p><p className="text-white">● المتبقي: {sizeLabel(Math.max(0,STORAGE_LIMIT-used))}</p></div>
    </div>
    <p className="text-xs text-slate-400">من حد أمان السجل: 800 كيلوبايت. هذا حجم بيانات التطبيق بصيغة JSON، وليس إجمالي حصة Firebase.</p>
  </section>;
}
