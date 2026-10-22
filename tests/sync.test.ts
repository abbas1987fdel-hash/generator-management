import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emptyData} from '../src/data';
import {issueMonth,financials} from '../src/accounting';
import {SyncEngine,isPending,mergeLedger,ConflictError,type LocalLedger,type RemoteRow} from '../src/sync';
const clone=<T>(value:T):T=>structuredClone(value);
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function fixture(){
 const data=emptyData();data.settings.pricePerAmpere=10000;data.cabins=[{id:'c',name:'test',managerName:'test',capacityAmps:100,createdAt:'2026-10-22'}];
 data.subscribers=[{id:'s',name:'test',cabinId:'c',amps:10,phone:'',roomOrHouse:'',paidAmount:0}];return issueMonth(data,'2026-10');
}
function harness(){
 let disk:LocalLedger|null=null;let cloud:RemoteRow={data:fixture(),revision:1};let online=true;let failDisk=false;let lostAck=false;let writes=0;let reads=0;
 const store={async load(){return clone(disk);},async save(value:LocalLedger){if(failDisk)throw Error('quota');disk=clone(value);}};
 const remote={async read(){reads++;if(!online)throw Error('offline');return clone(cloud);},async commit(value:LocalLedger){if(!online)throw Error('offline');if(cloud.lastMutationId===value.mutationId)return clone(cloud);cloud={data:mergeLedger(value.base,value.data,cloud.data),revision:cloud.revision+1,lastMutationId:value.mutationId};writes++;if(lostAck){lostAck=false;throw Error('ack lost');}return clone(cloud);}};
 const create=()=>new SyncEngine(store,remote,()=>online);
 return {create,get disk(){return disk;},get cloud(){return cloud;},set cloud(v){cloud=v;},get writes(){return writes;},get reads(){return reads;},set online(v:boolean){online=v;},set failDisk(v:boolean){failDisk=v;},set lostAck(v:boolean){lostAck=v;}};
}
function payment(engine:SyncEngine,amount:number,id:string){
 engine.update(d=>({...d,subscribers:d.subscribers.map(s=>({...s,paidAmount:s.paidAmount+amount}))}));
 engine.update(d=>({...d,transactions:[...d.transactions,{id,customerId:'s',amount,date:'2026-10-22',time:'12:00'}]}));
}
test('offline payments survive restart and sync once without losing receipts',async()=>{
 const h=harness();const e=h.create();await e.start();h.online=false;payment(e,40000,'t1');await tick();
 assert.equal(h.writes,0);assert.ok(isPending(h.disk!));assert.equal(financials(h.disk!.data,'s').remainingBalance,60000);
 const restarted=h.create();await restarted.start();payment(restarted,60000,'t2');await tick();assert.equal(financials(restarted.value!.data,'s').remainingBalance,0);
 h.online=true;await restarted.sync();assert.equal(h.writes,1);assert.equal(h.cloud.data.transactions.length,2);assert.equal(isPending(h.disk!),false);
 await restarted.sync();assert.equal(h.writes,1);
});
test('lost server acknowledgement retries idempotently after restart',async()=>{
 const h=harness();const e=h.create();await e.start();h.online=false;payment(e,100000,'t');await tick();h.online=true;h.lostAck=true;await e.sync();
 assert.ok(isPending(h.disk!));assert.equal(h.writes,1);
 const restarted=h.create();await restarted.start();assert.equal(h.writes,1);assert.equal(h.cloud.data.transactions.length,1);assert.equal(isPending(h.disk!),false);
});
test('conflicting customer edits retain offline data and never overwrite cloud',async()=>{
 const h=harness();const e=h.create();await e.start();h.online=false;
 e.update(d=>({...d,subscribers:d.subscribers.map(s=>({...s,name:'local'}))}));await tick();
 h.cloud={data:{...h.cloud.data,subscribers:h.cloud.data.subscribers.map(s=>({...s,name:'remote'}))},revision:2};h.online=true;await e.sync();
 assert.equal(e.conflict,true);assert.equal(h.writes,0);assert.equal(h.disk!.data.subscribers[0].name,'local');assert.equal(h.cloud.data.subscribers[0].name,'remote');
});
test('independent edits merge, but cleanup conflicts and orphaned records do not',()=>{
 const base=fixture(),local=clone(base),remote=clone(base);local.settings.pricePerAmpere=12000;remote.subscribers[0].name='remote';
 const merged=mergeLedger(base,local,remote);assert.equal(merged.settings.pricePerAmpere,12000);assert.equal(merged.subscribers[0].name,'remote');
 remote.closedThrough={s:'2026-09'};assert.throws(()=>mergeLedger(base,local,remote),ConflictError);
});
test('failed local persistence never sends the edit to the cloud',async()=>{
 const h=harness(),e=h.create();await e.start();h.failDisk=true;payment(e,1000,'t');await tick();assert.ok(e.error);assert.equal(h.writes,0);assert.equal(e.value!.data.transactions.length,1);assert.equal(h.disk!.data.transactions.length,0);
});
test('first offline visit stays empty instead of creating a fake cloud account',async()=>{
 const h=harness();h.online=false;const e=h.create();await e.start();assert.equal(e.value,null);assert.equal(h.reads,0);assert.equal(h.writes,0);
});
