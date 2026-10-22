import type {LedgerStore,LocalLedger} from './sync';
export function createLedgerStore(name:string):LedgerStore {
  const open=()=>new Promise<IDBDatabase>((resolve,reject)=>{
    const req=indexedDB.open(name,1);
    req.onupgradeneeded=()=>req.result.createObjectStore('ledger');
    req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
  });
  return {
    async load(){const db=await open();return new Promise<LocalLedger|null>((resolve,reject)=>{const tx=db.transaction('ledger','readonly');const req=tx.objectStore('ledger').get('main');tx.oncomplete=()=>{db.close();const value=req.result;if(value&&value.format!==1){reject(new Error('Unsupported local format'));return;}resolve(value??null);};tx.onerror=()=>{db.close();reject(tx.error);};});},
    async save(value){const db=await open();return new Promise<void>((resolve,reject)=>{const tx=db.transaction('ledger','readwrite');tx.objectStore('ledger').put(value,'main');tx.oncomplete=()=>{db.close();resolve();};tx.onerror=tx.onabort=()=>{db.close();reject(tx.error);};});}
  };
}
