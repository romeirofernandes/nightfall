import test from 'node:test';
import assert from 'node:assert/strict';
import {createBank, capacity, settle, brush, deposit} from './snow-banks.js';
test('narrow surfaces hold less snow, and edges taper to zero', () => {
 const small=createBank(44),wide=createBank(200);
 for(let n=0;n<1200;n++){settle(small,.05,()=>1);settle(wide,.05,()=>1);}
 for(const bank of [small,wide]) bank.depth.forEach((v,i)=>assert.ok(v<=capacity(bank,i)+1e-9));
 assert.ok(Math.max(...small.depth)<Math.max(...wide.depth));
 assert.equal(wide.depth[0],0);
});
test('brushing removes local snow without clearing the whole bank',()=>{
 const bank=createBank(200);bank.depth.fill(8);const removed=brush(bank,100);
 assert.ok(removed.length>0);assert.ok(bank.depth[25]<3);assert.equal(bank.depth[0],8);
 assert.ok(bank.depth.every(v=>v>=0));
});
test('landing adds snow and overloading sheds excess',()=>{
 const bank=createBank(100);assert.equal(deposit(bank,-2,1),false);
 deposit(bank,50,30);const shed=settle(bank,.05,()=>0);
 assert.ok(shed.length>0);assert.ok(bank.depth.every((v,i)=>v<=capacity(bank,i)+1e-9));
});
