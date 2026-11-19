import test from 'node:test';
import assert from 'node:assert/strict';
import {advanceFill} from './snow-fill-model.js';
test('fill grows slowly and retains exactly on leave',()=>{
 let state={fill:.2,phase:'filling',elapsed:0};
 state=advanceFill(state,1,true);assert.ok(state.fill<.23);
 assert.equal(advanceFill(state,10,false).fill,state.fill);
 assert.equal(advanceFill(state,1,true,.03).fill,state.fill+.024+.03);
});
test('full snow drains from bottom even when hover stops, then settles',()=>{
 let state=advanceFill({fill:.999,phase:'filling',elapsed:0},.1,true);
 assert.equal(state.phase,'draining');let released=0;
 for(let i=0;i<80;i++){state=advanceFill(state,.05,false);released+=state.released;}
 assert.equal(state.phase,'filling');assert.ok(Math.abs(state.fill-.08)<1e-9);
 assert.ok(Math.abs(released-.92)<1e-9);
 assert.equal(advanceFill(state,10,false).fill,state.fill);
});
