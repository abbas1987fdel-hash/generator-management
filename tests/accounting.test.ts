import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {transformSync} from 'esbuild';
import {emptyData} from '../src/data';
import {financials,issueMonth,normalizeLedger,currentMonth} from '../src/accounting';
const customer={id:'s',cabinId:'c',name:'اختبار',amps:10,phone:'',roomOrHouse:'',paidAmount:0};
const receipt=(amount:number,id='t')=>({id,customerId:'s',amount,date:'2026-10-22',time:'12:00'});
const fixture=()=>({...emptyData(),settings:{...emptyData().settings,pricePerAmpere:10000},subscribers:[{...customer}]});
test('full payment preserves receipts; next month carries only outstanding balance',()=>{
 let d=issueMonth(fixture(),'2026-09');d.transactions=[receipt(100000)];
 assert.equal(financials(d,'s').remainingBalance,0);assert.equal(d.transactions.length,1);
 d=issueMonth(d,'2026-10');assert.equal(financials(d,'s').remainingBalance,100000);
 assert.deepEqual(financials(d,'s').invoices.map(i=>i.remaining),[0,100000]);
});
test('rate and amps are frozen; duplicates cannot double bill',()=>{
 let d=issueMonth(fixture(),'2026-09');d.settings.pricePerAmpere=15000;d.subscribers[0].amps=20;
 d=issueMonth(d,'2026-09');assert.equal(d.invoices.length,1);assert.equal(d.invoices[0].amount,100000);
 d=issueMonth(d,'2026-10');assert.equal(d.invoices[1].amount,300000);
 d.transactions=[receipt(150000)];assert.equal(financials(d,'s').remainingBalance,250000);
 assert.deepEqual(financials(d,'s').invoices.map(i=>i.paid),[100000,50000]);
});
test('legacy purged receipts remain opening credit and are never double counted',()=>{
 const legacy:any=fixture();delete legacy.ledgerVersion;legacy.subscribers[0].amps=20;legacy.subscribers[0].paidAmount=150000;legacy.transactions=[receipt(50000)];
 let d=normalizeLedger(legacy,'2026-10');assert.equal(d.openingCredits.s,100000);assert.equal(financials(d,'s').remainingBalance,50000);
 assert.deepEqual(normalizeLedger(d,'2026-11'),d);
 d.transactions.push(receipt(50000,'t2'));assert.equal(financials(d,'s').remainingBalance,0);assert.equal(d.transactions.length,2);
 d.transactions=d.transactions.filter(t=>t.id!=='t2');assert.equal(financials(d,'s').remainingBalance,50000);
 d.transactions[0].amount=25000;assert.equal(financials(d,'s').remainingBalance,75000);
});
test('existing receipts outweigh stale legacy aggregate without losing them',()=>{
 const legacy:any=fixture();delete legacy.ledgerVersion;legacy.subscribers[0].paidAmount=100;legacy.transactions=[receipt(50000)];
 const d=normalizeLedger(legacy,'2026-10');assert.equal(financials(d,'s').effectivePaid,50000);assert.equal(d.openingCredits.s,0);
});
test('overpayments remain credit for the next invoice; invalid months rejected',()=>{
 let d=issueMonth(fixture(),'2026-09');d.transactions=[receipt(125000)];assert.equal(financials(d,'s').credit,25000);
 d=issueMonth(d,'2026-10');assert.equal(financials(d,'s').remainingBalance,75000);
 assert.throws(()=>issueMonth(d,'2026-13'));assert.match(currentMonth(),/^\d{4}-\d{2}$/);
});
test('actual payment UI handlers retain full-payment receipt and correctly undo/edit it',()=>{
 const source=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
 const handlers=source.slice(source.indexOf('  const handleRecordPayment'),source.indexOf('  // Start editing customer'));
 const body=transformSync(handlers+'\nreturn {handleRecordPayment,handleEditTransaction,handleDeleteTransaction};',{loader:'ts'}).code;
 let d=issueMonth(fixture(),'2026-10');
 const noop=()=>{};
 const run=(amount:string,editingTransaction:any=null)=>new Function('activeProfileCustomerId','subscribers','paymentInputAmount','getCustomerFinancials','setSubscribers','setTransactions','setIsPaymentModalOpen','setPaymentInputAmount','triggerToast','editingTransaction','editInputAmount','setEditingTransaction','setEditInputAmount',body)(
   's',d.subscribers,amount,(s:any)=>financials(d,s.id),(fn:any)=>{d={...d,subscribers:fn(d.subscribers)};},(fn:any)=>{d={...d,transactions:fn(d.transactions)};},noop,noop,noop,editingTransaction,amount,noop,noop);
 const event={preventDefault:noop};
 run('100000').handleRecordPayment(event);
 assert.equal(d.transactions.length,1);assert.equal(financials(d,'s').remainingBalance,0);
 run('50000',d.transactions[0]).handleEditTransaction(event);
 assert.equal(d.transactions.length,1);assert.equal(financials(d,'s').remainingBalance,50000);
 run('').handleDeleteTransaction(d.transactions[0]);assert.equal(financials(d,'s').remainingBalance,100000);
});

test('card settlement requires confirmation, preserves history and clears the balance',()=>{
 const source=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
 const handler=source.slice(source.indexOf('  const settleAccount'),source.indexOf('  // Submit payment'));
 const body=transformSync(handler+'\nreturn settleAccount;',{loader:'ts'}).code;
 let d=issueMonth(fixture(),'2026-10');d.transactions=[receipt(25000)];d.subscribers[0].paidAmount=25000;
 let accepted=false,calls=0;
 const run=()=>new Function('data','financials','window','update','triggerToast',body)(d,financials,{confirm:()=>{calls++;return accepted;}},(fn:any)=>{d=fn(d);},()=>{})(d.subscribers[0]);
 run();assert.equal(d.transactions.length,1);assert.equal(financials(d,'s').remainingBalance,75000);
 accepted=true;run();assert.equal(d.transactions.length,2);assert.equal(d.transactions[0].amount,75000);assert.equal(financials(d,'s').remainingBalance,0);
 run();assert.equal(d.transactions.length,2);assert.equal(calls,2);
});
