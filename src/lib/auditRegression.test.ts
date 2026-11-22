import {test} from 'node:test';
import assert from 'node:assert/strict';
import {setOperatorScope,clearOperatorScope,operatorStorageKey} from './sessionScope';
import {repository} from './storage';
import {loadTrips} from './tripStore';
import {importRateCsv,parseCsv} from './rateCsv';
import {convertCurrencyDeterministic,calculateLineCostAndPrice} from './pricingEngine';
const memory=new Map<string,string>();
Object.defineProperty(globalThis,'localStorage',{value:{getItem:(k:string)=>memory.get(k)??null,setItem:(k:string,v:string)=>memory.set(k,v),removeItem:(k:string)=>memory.delete(k)},configurable:true});
test('storage requires a session and isolates users/workspaces',()=>{
 clearOperatorScope();assert.throws(()=>operatorStorageKey('qde_quotes'));
 setOperatorScope('operator','a','u1');const a=operatorStorageKey('qde_quotes');
 setOperatorScope('operator','b','u1');assert.notEqual(a,operatorStorageKey('qde_quotes'));
 setOperatorScope('operator','a','u2');assert.notEqual(a,operatorStorageKey('qde_quotes'));
});
test('reading empty repositories never seeds fictional trips or supplier rates',()=>{
 memory.clear();setOperatorScope('operator','w','u');assert.deepEqual(loadTrips(),[]);assert.deepEqual(repository.getSuppliers('w'),[]);assert.deepEqual(repository.getRates('w'),[]);assert.equal(memory.size,0);
});
test('reading inquiries preserves other workspaces and real customer names',()=>{
 const key=operatorStorageKey('qde_inquiries');const data=[{id:'demo-import',workspaceId:'a',travelerName:'Elena Smith'},{id:'b',workspaceId:'b',travelerName:'Someone'}];memory.set(key,JSON.stringify(data));assert.equal(repository.getInquiries('a').length,1);assert.deepEqual(JSON.parse(memory.get(key)!),data);
});
test('invalid restores do not modify storage',()=>{const before=[...memory];assert.equal(repository.importWorkspaceBackup({users:[{role:'Owner'}]}).success,false);assert.deepEqual([...memory],before);});
test('CSV handles quotes/newlines and rejects truncated quotes',()=>{assert.deepEqual(parseCsv('a,b\n"hotel, room","line\n2"'),[['a','b'],['hotel, room','line\n2']]);assert.throws(()=>parseCsv('"unfinished'));});
const header='supplierId,serviceName,city,occupancyBasis,currency,netCost,validityStart,validityEnd\n';
const suppliers:any=[{id:'s',workspaceId:'w',name:'Real supplier',type:'Hotel'}];
test('CSV validates ownership, finite prices and real dates',()=>{
 assert.equal(importRateCsv(header+'s,Room,Cairo,double,EGP,100,2026-10-01,2026-11-01',suppliers,'w').length,1);
 for(const row of ['s,Room,Cairo,double,EGP,-100,2026-10-01,2026-11-01','s,Room,Cairo,double,EGP,100,2026-02-30,2026-11-01','s,Room,Cairo,double,XXX,100,2026-10-01,2026-11-01','other,Room,Cairo,double,EGP,100,2026-10-01,2026-11-01'])assert.throws(()=>importRateCsv(header+row,suppliers,'w'));
 assert.throws(()=>importRateCsv(header+'s,Room,Cairo,double,EGP,100,2026-10-01,2026-11-01',suppliers,'other'));
});
const snapshot:any={ratesToEgp:{EGP:1,USD:50,EUR:60},safetyBufferPercent:.03};
test('same-currency conversion has no phantom FX margin; cross-currency buffer occurs once',()=>{
 const same=convertCurrencyDeterministic(100,'USD','USD',snapshot);assert.equal(same.amountTarget,100);assert.equal(same.amountEgp,5000);
 assert.equal(convertCurrencyDeterministic(100,'USD','EUR',snapshot).amountTarget,85.83);
 assert.throws(()=>convertCurrencyDeterministic(10,'GBP','USD',snapshot));
});
test('capacity includes infants; zero-age free-child policy is valid',()=>{
 const rate:any={netCost:100,currency:'EGP',validityStart:'2026-01-01',validityEnd:'2026-12-31',maxVehiclePax:2,childFreeMaxAge:0};
 const result=calculateLineCostAndPrice(rate,1,'per_vehicle',{adults:2,children:[],infants:1},'EGP',0,0,undefined,'2026-10-01');assert.equal(result.hasBlockingRate,true);
 const free=calculateLineCostAndPrice(rate,1,'per_person',{adults:1,children:[{age:0}],infants:0},'EGP',0,0,undefined,'2026-10-01');assert.equal(free.totalCostEgp,100);
 assert.throws(()=>calculateLineCostAndPrice(rate,-1,'per_person',{adults:1,children:[],infants:0},'EGP',0));
});
