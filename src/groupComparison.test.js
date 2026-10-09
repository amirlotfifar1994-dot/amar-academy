import test from 'node:test';
import assert from 'node:assert/strict';
import {parseCount,summarizeGroups,percentageCell,groupPresets} from './groupComparison.js';
test('unequal groups reverse the raw count and percentage comparison',()=>{
  const s=summarizeGroups(groupPresets.unequal.cells);
  assert.deepEqual(s.rows,[10,30]);assert.deepEqual(s.columns,[20,20]);assert.equal(s.total,40);
  assert.deepEqual(s.rates,[80,40]);assert.equal(s.difference,40);assert.ok(s.cells[1][0]>s.cells[0][0]);
  assert.deepEqual(percentageCell(s,0,0,'row'),{numerator:8,denominator:10,value:80});
  assert.deepEqual(percentageCell(s,0,0,'column'),{numerator:8,denominator:20,value:40});
  assert.deepEqual(percentageCell(s,0,0,'total'),{numerator:8,denominator:40,value:20});
});
test('row, column and overall percentages sum over their own populations',()=>{
  const s=summarizeGroups(['7','14','11','9']);
  for(const r of [0,1])assert.ok(Math.abs([0,1].reduce((n,c)=>n+percentageCell(s,r,c,'row').value,0)-100)<1e-10);
  for(const c of [0,1])assert.ok(Math.abs([0,1].reduce((n,r)=>n+percentageCell(s,r,c,'column').value,0)-100)<1e-10);
  assert.ok(Math.abs([0,1].reduce((n,r)=>n+[0,1].reduce((v,c)=>v+percentageCell(s,r,c,'total').value,0),0)-100)<1e-10);
});
test('zero denominators are undefined; real zero counts retain zero percent',()=>{
  const s=summarizeGroups(groupPresets.empty.cells);
  assert.equal(s.rates[0],null);assert.equal(s.difference,null);
  assert.equal(percentageCell(s,0,0,'row').value,null);
  assert.equal(percentageCell(s,0,0,'column').value,0);
  const noPositive=summarizeGroups(['0','10','0','20']);
  assert.equal(percentageCell(noPositive,0,0,'column').value,null);assert.deepEqual(noPositive.rates,[0,0]);
  const empty=summarizeGroups(['0','0','0','0']);
  for(const basis of ['row','column','total'])assert.equal(percentageCell(empty,0,0,basis).value,null);
});
test('Persian and Arabic counts work; blanks, decimals, exponents and invalid counts do not',()=>{
  assert.equal(parseCount(' ۱۲۳ '),123);assert.equal(parseCount('٤٥٦'),456);assert.equal(parseCount('1000000'),1000000);
  for(const input of ['', ' ', '-1','1.5','1e2','Infinity','1,000','NaN','1000001',null,4])assert.equal(parseCount(input),null,String(input));
  assert.equal(summarizeGroups(['8','','12','18']),null);assert.equal(summarizeGroups([1,2,3,4]),null);
  assert.equal(summarizeGroups(['1']),null);assert.equal(summarizeGroups(null),null);
});
test('equal rates are not mistaken for equal group sizes or counts',()=>{
  const s=summarizeGroups(groupPresets.equalRate.cells);
  assert.deepEqual(s.rows,[10,30]);assert.deepEqual(s.rates,[80,80]);assert.equal(s.difference,0);
  assert.equal(percentageCell(s,0,0,'bad'),null);assert.equal(percentageCell(s,2,0,'row'),null);
});
