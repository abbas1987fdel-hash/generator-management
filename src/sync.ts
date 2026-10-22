import {checkWrite,type GeneratorData} from './data';
export interface RemoteRow {data:GeneratorData;revision:number;lastMutationId?:string}
export interface LocalLedger {format:1;base:GeneratorData;data:GeneratorData;revision:number;mutationId:string}
export interface LedgerStore {load():Promise<LocalLedger|null>;save(value:LocalLedger):Promise<void>}
export interface LedgerRemote {read():Promise<RemoteRow>;commit(value:LocalLedger):Promise<RemoteRow>}
export class ConflictError extends Error {constructor(){super('تعارض تعديل مع جهاز آخر. نسختك المحلية محفوظة ولم تُستبدل البيانات السحابية.');}}
// Firestore may return map keys in a different order from local objects.
const canonical=(value:any):any=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value;
const equal=(a:unknown,b:unknown)=>JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
export const isPending=(value:LocalLedger)=>!equal(value.base,value.data);
// Conservative three-way merge. Never choose a winner for concurrently edited
// records, or merge a historical cleanup into another device's accounting work.
export function mergeLedger(base:GeneratorData,local:GeneratorData,remote:GeneratorData):GeneratorData {
  if(equal(base,remote))return local;
  if(equal(local,remote)||equal(base,local))return remote;
  if(!equal(base.closedThrough,local.closedThrough)||!equal(base.closedThrough,remote.closedThrough))throw new ConflictError();
  const pick=(b:unknown,l:unknown,r:unknown)=>{if(equal(b,l))return r;if(equal(b,r)||equal(l,r))return l;throw new ConflictError();};
  const records=(b:any[],l:any[],r:any[])=>{
    const ids=new Set([...r,...l,...b].map(x=>x.id));
    return [...ids].map(id=>pick(b.find(x=>x.id===id),l.find(x=>x.id===id),r.find(x=>x.id===id))).filter(x=>x!==undefined);
  };
  // paidAmount is a legacy cached total; receipts and opening credit are authoritative.
  const subscriberFields=(items:GeneratorData['subscribers'])=>items.map(({paidAmount,...fields})=>fields);
  const next={...remote,settings:pick(base.settings,local.settings,remote.settings),openingCredits:pick(base.openingCredits,local.openingCredits,remote.openingCredits),cabins:records(base.cabins,local.cabins,remote.cabins),subscribers:records(subscriberFields(base.subscribers),subscriberFields(local.subscribers),subscriberFields(remote.subscribers)),invoices:records(base.invoices,local.invoices,remote.invoices),transactions:records(base.transactions,local.transactions,remote.transactions)} as GeneratorData;
  next.subscribers=next.subscribers.map(s=>({...s,paidAmount:(next.openingCredits[s.id]??0)+next.transactions.filter(t=>t.customerId===s.id).reduce((sum,t)=>sum+t.amount,0)}));
  // Identical invoice IDs must remain unique; orphaned history must never be
  // introduced by merging a deletion with a concurrent payment.
  const subscribers=new Set(next.subscribers.map(s=>s.id));
  const cabins=new Set(next.cabins.map(c=>c.id));
  if(next.subscribers.some(s=>!cabins.has(s.cabinId))||[...next.invoices,...next.transactions].some(x=>!subscribers.has(x.customerId)))throw new ConflictError();
  return next;
}
export class SyncEngine {
  value:LocalLedger|null=null;
  status='جارٍ فتح البيانات المحلية…';
  busy=false; localSaving=false; error=''; conflict=false; lastSync=0;
  private listeners=new Set<()=>void>();
  private saving:Promise<void>=Promise.resolve();
  private scheduled=false;
  constructor(private store:LedgerStore,private remote:LedgerRemote,private connected:()=>boolean=()=>navigator.onLine){}
  subscribe=(listener:()=>void)=>{this.listeners.add(listener);return()=>{this.listeners.delete(listener);};};
  private emit(){this.listeners.forEach(fn=>fn());}
  async start(){
    try {this.value=await this.store.load();this.status=this.value?'البيانات محفوظة على هذا الجهاز':'اتصل بالإنترنت لفتح النظام أول مرة';this.emit();}
    catch {this.error='تعذر فتح التخزين المحلي. فعّل تخزين الموقع قبل تعديل البيانات.';this.emit();return;}
    if(this.connected())await this.sync();
  }
  update(transform:(previous:GeneratorData)=>GeneratorData){
    if(!this.value||this.busy||this.error||this.conflict)return;
    const data=transform(this.value.data);checkWrite(this.value.revision,this.value.revision,data);
    this.value={...this.value,data,mutationId:crypto.randomUUID()};
    this.localSaving=true;this.emit();
    if(this.scheduled)return;this.scheduled=true;
    this.saving=Promise.resolve().then(async()=>{
      this.scheduled=false;
      try {await this.store.save(this.value!);this.status='محفوظ على الجهاز — بانتظار المزامنة';}
      catch {this.error='تعذر حفظ التعديل على الجهاز. نزّل نسخة قبل إغلاق الصفحة.';}
      finally {this.localSaving=false;this.emit();}
    });
    void this.saving.then(()=>{if(!this.error&&this.connected())void this.sync();});
  }
  async sync(){
    await this.saving;
    if(this.busy||this.error||this.conflict||!this.connected())return;
    this.busy=true;this.status='جارٍ المزامنة…';this.emit();
    try {
      const row=this.value&&isPending(this.value)?await this.remote.commit(this.value):await this.remote.read();
      const next:LocalLedger={format:1,base:row.data,data:row.data,revision:row.revision,mutationId:''};
      // A failed local acknowledgement leaves the previous idempotent mutation
      // on disk, so reopening safely checks the server before retrying.
      await this.store.save(next);this.value=next;this.lastSync=Date.now();this.status='تمت المزامنة — محفوظ على الجهاز والسحابة';
    }catch(error){
      if(error instanceof ConflictError){this.conflict=true;this.status=error.message;}
      else if(['permission-denied','failed-precondition','invalid-argument'].includes(String((error as {code?:string})?.code))){this.error='تعذر حفظ البيانات السحابية بسبب إعدادات الخادم. نسختك المحلية محفوظة؛ نزّل نسخة وتواصل مع مسؤول النظام.';}
      else {this.status=this.value?'البيانات المحلية محفوظة — تعذّر الاتصال، ستُعاد المحاولة':'تعذر تحميل البيانات. اتصل بالإنترنت وأعد المحاولة.';}
    }finally {this.busy=false;this.emit();}
  }
  // Only offered after exporting the local draft and explicit confirmation.
  async useCloud(){
    if(!this.connected()||this.busy)return;
    this.busy=true;this.emit();
    try {const row=await this.remote.read();const next:LocalLedger={format:1,base:row.data,data:row.data,revision:row.revision,mutationId:''};await this.store.save(next);this.value=next;this.conflict=false;this.error='';this.status='تم تحميل النسخة السحابية';}
    catch {this.status='تعذر تحميل النسخة السحابية؛ بقيت النسخة المحلية محفوظة';}
    finally{this.busy=false;this.emit();}
  }
}
