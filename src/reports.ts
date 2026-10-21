import {currentMonth,financials} from './accounting';
import {storageBytes,type GeneratorData} from './data';

// Remove only fully settled periods funded by receipts within the cutoff.
// Carry surplus forward and keep a compact cutoff to prevent billing twice.
export function cleanupReport(data:GeneratorData,cabinId:string,month:string,today=currentMonth()) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)||month>=today) throw new Error('اختر شهرًا سابقًا؛ لا يمكن تصفير الشهر الحالي');
  const ids=new Set<string>();
  const openingCredits={...data.openingCredits};
  const closedThrough={...data.closedThrough};
  let blocked=0;
  for (const sub of data.subscribers.filter(s=>s.cabinId===cabinId)) {
    const invoices=financials(data,sub.id).invoices.filter(i=>i.month<=month);
    if (!invoices.length) continue;
    const total=invoices.reduce((n,i)=>n+i.amount,0);
    const receipts=data.transactions.filter(t=>t.customerId===sub.id&&/^\d{4}-\d{2}-\d{2}$/.test(t.date)&&t.date.slice(0,7)<=month);
    const paid=(data.openingCredits[sub.id]??0)+receipts.reduce((n,t)=>n+t.amount,0);
    if (invoices.some(i=>i.remaining>0)||paid<total) { blocked++;continue; }
    ids.add(sub.id);openingCredits[sub.id]=paid-total;closedThrough[sub.id]=month;
  }
  const removedInvoices=data.invoices.filter(i=>ids.has(i.customerId)&&i.month<=month);
  const removedReceipts=data.transactions.filter(t=>ids.has(t.customerId)&&/^\d{4}-\d{2}-\d{2}$/.test(t.date)&&t.date.slice(0,7)<=month);
  const receiptIds=new Set(removedReceipts.map(t=>t.id));
  const invoiceIds=new Set(removedInvoices.map(i=>i.id));
  const next:GeneratorData={...data,closedThrough,openingCredits,invoices:data.invoices.filter(i=>!invoiceIds.has(i.id)),transactions:data.transactions.filter(t=>!receiptIds.has(t.id)),subscribers:data.subscribers.map(s=>ids.has(s.id)?{...s,paidAmount:(openingCredits[s.id]??0)+data.transactions.filter(t=>t.customerId===s.id&&!receiptIds.has(t.id)).reduce((n,t)=>n+t.amount,0)}:s)};
  return {next,blocked,customers:ids.size,removedInvoices,removedReceipts,before:storageBytes(data),after:storageBytes(next)};
}
