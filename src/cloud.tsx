import {initializeApp} from 'firebase/app';
import {doc,getFirestore,getDocFromServer,runTransaction,serverTimestamp} from 'firebase/firestore';
import {emptyData,checkWrite} from './data';
import firebaseConfig from './firebase-config.json';
import {normalizeLedger} from './accounting';
import {createLedgerStore} from './localStore';
import {mergeLedger,SyncEngine,type RemoteRow} from './sync';
import {LedgerProvider} from './LedgerProvider';
export {useGeneratorData} from './LedgerProvider';
const firebase=initializeApp(firebaseConfig);
const db=getFirestore(firebase);
const ref=doc(db,'generator','main');
const row=(value:any):RemoteRow=>({data:normalizeLedger(value?.data??emptyData()),revision:value?.revision??0,lastMutationId:value?.lastMutationId});
const engine=new SyncEngine(createLedgerStore('generators-'+firebaseConfig.projectId),{
  async read(){return row((await getDocFromServer(ref)).data());},
  async commit(local){return runTransaction(db,async tx=>{
    const latest=row((await tx.get(ref)).data());
    if(latest.lastMutationId===local.mutationId)return latest;
    const next=mergeLedger(local.base,local.data,latest.data);
    checkWrite(latest.revision,latest.revision,next);
    const result={data:next,revision:latest.revision+1,lastMutationId:local.mutationId};
    tx.set(ref,{...result,updatedAt:serverTimestamp()});return result;
  });}
});
export function CloudProvider({children}:{children:React.ReactNode}) {return <LedgerProvider engine={engine} lockName={'generators-'+firebaseConfig.projectId}>{children}</LedgerProvider>;}
