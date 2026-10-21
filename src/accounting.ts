import type { GeneratorData } from './data';

export interface Invoice {
  id: string;
  customerId: string;
  month: string;
  amps: number;
  rate: number;
  amount: number;
  opening?: boolean;
}
export const currentMonth = () => {
  const parts=new Intl.DateTimeFormat('en', {timeZone:'Asia/Baghdad',year:'numeric',month:'2-digit'}).formatToParts(new Date());
  return parts.find(p=>p.type==='year')!.value+'-'+parts.find(p=>p.type==='month')!.value;
};

// Old releases discarded receipts. Preserve their aggregate as an explicit opening
// credit; never invent receipts or infer historical months that were not stored.
export function normalizeLedger(data: GeneratorData, month = currentMonth()): GeneratorData {
  if (data.ledgerVersion === 2) return data;
  return {...data, ledgerVersion:2,
    invoices:data.subscribers.map(s=>({id:`${s.id}:${month}`,customerId:s.id,month,amps:s.amps,rate:data.settings.pricePerAmpere,amount:s.amps*data.settings.pricePerAmpere,opening:true})),
    openingCredits:Object.fromEntries(data.subscribers.map(s=>[s.id,Math.max(0,s.paidAmount-data.transactions.filter(t=>t.customerId===s.id).reduce((n,t)=>n+t.amount,0))]))};
}
export function issueMonth(data: GeneratorData, month: string): GeneratorData {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error('اختر شهرًا صحيحًا');
  const additions=data.subscribers.filter(s=>month>(data.closedThrough?.[s.id]??'')&&!data.invoices.some(i=>i.customerId===s.id&&i.month===month)).map(s=>({id:`${s.id}:${month}`,customerId:s.id,month,amps:s.amps,rate:data.settings.pricePerAmpere,amount:s.amps*data.settings.pricePerAmpere}));
  return {...data,invoices:[...data.invoices,...additions]};
}
export function financials(data: GeneratorData, customerId: string) {
  const openingCredit=data.openingCredits[customerId]??0;
  const effectivePaid=openingCredit+data.transactions.filter(t=>t.customerId===customerId).reduce((n,t)=>n+t.amount,0);
  let available=effectivePaid;
  const invoices=data.invoices.filter(i=>i.customerId===customerId).sort((a,b)=>a.month.localeCompare(b.month)).map(i=>{
    const paid=Math.min(available,i.amount); available-=paid;
    return {...i,paid,remaining:i.amount-paid};
  });
  const totalDue=invoices.reduce((n,i)=>n+i.amount,0);
  const remainingBalance=Math.max(0,totalDue-effectivePaid);
  return {totalDue,effectivePaid,remainingBalance,isFullyPaid:remainingBalance===0,credit:Math.max(0,effectivePaid-totalDue),openingCredit,invoices};
}
