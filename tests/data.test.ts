import assert from 'node:assert/strict';
import {test} from 'node:test';
import {emptyData,checkWrite} from '../src/data';
test('fresh account starts without sample cabins, subscribers or receipts',()=>{
 const data=emptyData();assert.deepEqual(data.cabins,[]);assert.deepEqual(data.subscribers,[]);assert.deepEqual(data.transactions,[]);assert.equal(data.settings.totalCapacityAmps,0);assert.equal(data.settings.pricePerAmpere,0);
});
test('concurrent changes cannot overwrite a newer ledger',()=>{
 assert.throws(()=>checkWrite(2,1,emptyData()));assert.doesNotThrow(()=>checkWrite(2,2,emptyData()));
});
test('oversize ledger is rejected before a cloud write',()=>{
 const data=emptyData();data.settings.secretBackdoorCode='a'.repeat(800001);assert.throws(()=>checkWrite(0,0,data));
});
