import {MessageCircle} from 'lucide-react';
import {whatsappGeneralLink} from './whatsapp';

export function CabinMessage({name,message,onChange}:{name:string;message:string;onChange:(text:string)=>void}) {
  const link=whatsappGeneralLink(message);
  return <section dir="rtl" className="space-y-4 rounded-2xl bg-slate-900 border border-slate-700 p-4">
    <h2 className="font-bold text-lg">رسالة عامة</h2>
    <p className="text-sm text-amber-300 break-words">{name}</p>
    <label className="block text-sm" htmlFor="cabin-general-message">نص الرسالة</label>
    <textarea id="cabin-general-message" rows={7} maxLength={4000} value={message} onChange={e=>onChange(e.target.value)} placeholder="اكتب الرسالة التي تريد مشاركتها…" className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm leading-relaxed focus:outline-none focus:border-emerald-400 resize-y"/>
    <p className="text-xs text-slate-400">اختَر المستلمين وأكّد الإرسال داخل واتساب. لا يتم اختيار مشتركي الكابينة تلقائيًا.</p>
    {link ? <a href={link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full rounded-xl bg-emerald-600 p-3 text-white font-bold text-sm"><MessageCircle className="w-5 h-5"/>مشاركة عبر واتساب</a> : <button disabled className="w-full rounded-xl bg-slate-800 p-3 text-slate-500 font-bold text-sm">مشاركة عبر واتساب</button>}
    <p className="text-xs text-slate-500">المسودة تبقى أثناء التنقل في هذه الجلسة فقط، ولا تُحفظ في قاعدة البيانات.</p>
  </section>;
}
