import assert from 'node:assert/strict';
import {test} from 'node:test';
import {emptyData} from '../src/data';
import {accessCode,validateCodeChange} from '../src/access';
import {whatsappPhone,whatsappAccountLink,whatsappGeneralLink,DEFAULT_SUBSCRIPTION_MESSAGE} from '../src/whatsapp';
import {sortByArabicName} from '../src/sorting';
import {readFileSync} from 'node:fs';
import {transformSync} from 'esbuild';
test('general message has no preset recipient and preserves Arabic and line breaks',()=>{
 assert.equal(whatsappGeneralLink(' \n '),null);
 const message='السلام عليكم\nموعد التشغيل 6:00 & 8:00';
 const url=new URL(whatsappGeneralLink(message)!);
 assert.equal(url.origin,'https://wa.me');assert.equal(url.pathname,'/');
 assert.equal(url.searchParams.get('text'),message);assert.equal(url.searchParams.has('phone'),false);
});
test('existing accounts receive the requested default; saved code takes precedence',()=>{
 const settings=emptyData().settings;
 assert.equal(accessCode(settings),'19991');
 assert.equal(accessCode({...settings,loginCode:'45678'}),'45678');
 assert.equal(validateCodeChange(settings,'19991','45678','45678'),'');
 assert.notEqual(validateCodeChange(settings,'wrong','45678','45678'),'');
 assert.notEqual(validateCodeChange(settings,'19991','45678','45679'),'');
 assert.notEqual(validateCodeChange(settings,'19991','abc','abc'),'');
 assert.equal(validateCodeChange(settings,'','',''),'');
});
test('WhatsApp accepts Iraqi local and international formats and Arabic numerals',()=>{
 for(const input of ['07801234567','7801234567','+9647801234567','009647801234567','٠٧٨٠١٢٣٤٥٦٧']) assert.equal(whatsappPhone(input),'9647801234567');
 for(const input of ['','123','9647700000000']) assert.equal(whatsappPhone(input),null);
});
test('WhatsApp targets customer number with cumulative totals and Baghdad time',()=>{
 const link=whatsappAccountLink('07801234567','علي','الكابينة الأولى',200000,50000,150000,new Date('2026-10-22T12:00:00Z'))!;
 const url=new URL(link);assert.equal(url.pathname,'/9647801234567');
 const text=url.searchParams.get('text')!;
 for(const token of ['علي','الكابينة الأولى','المجموع الكلي للحساب','المسدد','المتبقي','التاريخ والوقت']) assert.ok(text.includes(token));
 assert.equal(whatsappAccountLink('','علي','',0,0,0),null);
});
test('settings handler persists new global code while preserving other settings',()=>{
 const source=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
 const handler=source.slice(source.indexOf('  const handleSaveSettings'),source.indexOf('  const getCustomerFinancials'));
 const body=transformSync('const DEFAULT_SUBSCRIPTION_MESSAGE='+JSON.stringify(DEFAULT_SUBSCRIPTION_MESSAGE)+';\n'+handler+'\nreturn handleSaveSettings;',{loader:'ts'}).code;
 const settings={...emptyData().settings,loginCode:'19991',subscriptionMessage:'اشتراك {الاسم}'};
 let saved:any=null,error='';
 const run=(oldCode:string,confirmCode:string)=>new Function('modalForm','settings','oldCode','newCode','confirmCode','validateCodeChange','accessCode','setSettingsError','setSettings','setIsSettingsOpen','triggerToast',body)(settings,settings,oldCode,'45678',confirmCode,validateCodeChange,accessCode,(v:string)=>error=v,(v:any)=>saved=v,()=>{},()=>{})({preventDefault(){}});
 run('wrong','45678');assert.equal(saved,null);assert.ok(error);
 run('19991','45679');assert.equal(saved,null);
 run('19991','45678');assert.equal((saved as any).loginCode,'45678');assert.equal((saved as any).pricePerAmpere,settings.pricePerAmpere);assert.equal((saved as any).secretBackdoorCode,settings.secretBackdoorCode);
 assert.equal((saved as any).subscriptionMessage,'اشتراك {الاسم}');
});

test('custom subscription text resolves tokens and blank text falls back',()=>{
 const url=new URL(whatsappAccountLink('07801234567','أحمد','باب المعظم',100,20,80,new Date(),'عزيزي {الاسم}\n{الكابينة}: {المتبقي} — {الاسم}')!);
 assert.equal(url.searchParams.get('text'),'عزيزي أحمد\nباب المعظم: '+(80).toLocaleString('ar-IQ')+' د.ع — أحمد');
 assert.ok(new URL(whatsappAccountLink('07801234567','أحمد','',0,0,0,new Date(),' ')!).searchParams.get('text')?.includes('كشف حساب اشتراك المولدة'));
});
test('Arabic sorting leaves persisted order intact',()=>{
 const rows=[{name:'ياسر'},{name:'محمد'},{name:'باسم'},{name:'أحمد'},{name:'علي'}];
 assert.deepEqual(sortByArabicName(rows).map(x=>x.name),['أحمد','باسم','علي','محمد','ياسر']);
 assert.equal(rows[0].name,'ياسر');
});
