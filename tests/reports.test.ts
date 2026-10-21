import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emptyData,storageBytes,STORAGE_LIMIT} from '../src/data';
import {issueMonth,financials} from '../src/accounting';
import {cleanupReport} from '../src/reports';
function fixture() {
 const d=emptyData();d.settings.pricePerAmpere=10000;
 d.subscribers=['a','b'].map(id=>({id,cabinId:id,name:id,amps:10,phone:'',roomOrHouse:'',paidAmount:150000}));
 let next=issueMonth(d,'2026-08');next=issueMonth(next,'2026-09');
 next.transactions=['a','b'].flatMap(id=>Array.from({length:30},(_,i)=>({id:id+i,customerId:id,amount:5000,date:'2026-08-20',time:'12:00'})));
 return next;
}
test('cleanup preserves debt and surplus, isolates cabin, reduces bytes and prevents rebilling',()=>{
 const d=fixture(),original=JSON.stringify(d);const report=cleanupReport(d,'a','2026-08','2026-10');
 assert.equal(report.customers,1);assert.equal(report.removedReceipts.length,30);
 assert.ok(report.after<report.before);assert.equal(report.after,storageBytes(report.next));
 assert.equal(financials(report.next,'a').remainingBalance,50000);
 assert.deepEqual(financials(report.next,'b'),financials(d,'b'));
 assert.equal(report.next.openingCredits.a,50000);
 assert.equal(issueMonth(report.next,'2026-08').invoices.length,report.next.invoices.length);
 assert.equal(JSON.stringify(d),original);
 assert.equal(cleanupReport(report.next,'a','2026-08','2026-10').customers,0);
});
test('unpaid and later-funded invoices cannot be purged',()=>{
 const d=fixture();assert.equal(cleanupReport(d,'a','2026-09','2026-10').customers,0);
 d.transactions=d.transactions.map(t=>({...t,date:'2026-09-01'}));
 assert.equal(cleanupReport(d,'a','2026-08','2026-10').customers,0);
 assert.throws(()=>cleanupReport(d,'a','2026-10','2026-10'));
});
test('newer receipts stay intact and credit balance survives purge',()=>{
 const d=fixture();d.transactions.push({id:'later',customerId:'a',amount:100000,date:'2026-09-20',time:'13:00'});
 const before=financials(d,'a');const after=cleanupReport(d,'a','2026-08','2026-10').next;
 assert.ok(after.transactions.some(t=>t.id==='later'));
 assert.equal(financials(after,'a').credit,before.credit);
 assert.equal(financials(after,'a').remainingBalance,before.remainingBalance);
});
test('meter counts actual UTF8 bytes, uses the same limit as writes',()=>{
 const d=emptyData();d.settings.secretBackdoorCode='عربي';
 assert.equal(storageBytes(d),Buffer.byteLength(JSON.stringify(d),'utf8'));assert.equal(STORAGE_LIMIT,800000);
});
