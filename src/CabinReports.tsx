import {useState} from 'react';
import {useGeneratorData} from './cloud';
import {currentMonth} from './accounting';
import {cleanupReport} from './reports';
import {StorageMeter,sizeLabel} from './StorageMeter';
export function CabinReports({cabinId}:{cabinId:string}) {
  const {data,update}=useGeneratorData();
  const months=[...new Set(data.invoices.filter(i=>data.subscribers.some(s=>s.id===i.customerId&&s.cabinId===cabinId)&&i.month<currentMonth()).map(i=>i.month))].sort().reverse();
  const [month,setMonth]=useState('');
  const [backup,setBackup]=useState('');
  const [message,setMessage]=useState('');
  const selected=month||months[0]||'';
  const plan=selected?cleanupReport(data,cabinId,selected):null;
  const signature=JSON.stringify(data)+selected;
  const download=()=>{
    if(!plan) return;
    const url=URL.createObjectURL(new Blob([JSON.stringify({exportedAt:new Date().toISOString(),cabinId,throughMonth:selected,data},null,2)],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download=`generator-backup-${selected}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setBackup(signature);
  };
  const clean=()=>{
    if(!plan||!plan.customers||backup!==signature) return;
    if(!window.confirm(`حذف ${plan.removedInvoices.length} فاتورة و${plan.removedReceipts.length} وصل مكتمل حتى ${selected} شاملًا؟ تأكد من حفظ النسخة؛ التفاصيل لن تبقى في النظام.`)) return;
    update(previous=>cleanupReport(previous,cabinId,selected).next);
    setMessage('تم تطبيق التصفير؛ تصبح الأرقام نهائية بعد اكتمال الحفظ السحابي.');setBackup('');setMonth('');
  };
  return <section dir="rtl" className="space-y-4">
    <h2 className="font-bold text-lg">التقارير</h2><StorageMeter data={data}/>
    <p className="text-xs text-slate-400">الدائرة تخص النظام كله. التصفير يخص هذه الكابينة فقط: الفواتير المكتملة ووصولاتها حتى الشهر المختار شاملًا. يبقى الرصيد الزائد والديون الحالية محفوظين.</p>
    {message&&<p role="status" className="text-emerald-300 text-sm">{message}</p>}
    {!months.length?<p>لا توجد أشهر سابقة للتصفير.</p>:<>
      <label className="block text-sm">تصفير المكتمل حتى شهر<select aria-label="شهر التقرير" className="block w-full bg-slate-800 p-3 rounded-xl mt-2" value={selected} onChange={e=>{setMonth(e.target.value);setBackup('');}}>{months.map(m=><option key={m}>{m}</option>)}</select></label>
      {plan&&<div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 space-y-3 text-sm">
        <p>المؤهل: {plan.customers} مشترك · {plan.removedInvoices.length} فاتورة · {plan.removedReceipts.length} وصل</p>
        <p>حسابات محمية من التصفير: {plan.blocked} (دين باقٍ أو تسديد بعد الشهر المحدد).</p>
        <p>الحجم قبل: {sizeLabel(plan.before)} · بعد: {sizeLabel(plan.after)}</p>
        <p>المساحة المتوقع توفيرها: {sizeLabel(Math.max(0,plan.before-plan.after))}</p>
        <p className="text-xs text-slate-400">يبقى ملخص صغير يمنع إعادة إصدار الأشهر المصفرّة. تنخفض المجاميع التاريخية بمقدار السجلات المحذوفة. النسخة تشمل النظام كاملًا، احتفظ بها بمكان آمن.</p>
        <button type="button" disabled={!plan.customers} onClick={download} className="block w-full bg-slate-700 rounded-xl p-3 disabled:opacity-40">1. تنزيل نسخة قبل الحذف</button>
        <button type="button" disabled={!plan.customers||backup!==signature} onClick={clean} className="block w-full bg-red-600 rounded-xl p-3 disabled:opacity-40">2. تصفير السجلات المكتملة</button>
      </div>}
    </>}
  </section>;
}
