import test from 'node:test';
import assert from 'node:assert/strict';
import {describe} from './stats.js';
import {meanExamples,parseMeanNumber,summarizeWeightedMean} from './weightedMean.js';
const close=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-10,`${actual} versus ${expected}`);
test('course-unit weights give a different answer from equal shares',()=>{
  const result=summarizeWeightedMean(meanExamples.weighted.rows);
  assert.equal(result.totalWeight,6);assert.equal(result.weightedSum,98);close(result.mean,98/6);close(result.equalMean,46/3);
  close(result.rows.reduce((sum,row)=>sum+row.share,0),1);
});
test('combined group mean equals the mean of all original observations',()=>{
  const groups=[[6,10,14],[12,16,20,24,28]],raw=groups.flat();
  const rows=groups.map(values=>({value:String(describe(values).mean),weight:String(values.length)}));
  const combined=summarizeWeightedMean(rows,'pooled');
  close(combined.mean,describe(raw).mean);assert.notEqual(combined.mean,combined.equalMean);
  const example=summarizeWeightedMean(meanExamples.pooled.rows,'pooled');assert.equal(example.mean,16);assert.equal(example.equalMean,14);
});
test('scaling all weights preserves the result, including fractional weights',()=>{
  const rows=[{value:'-8.5',weight:'0.5'},{value:'12',weight:'1.5'},{value:'0',weight:'2'}];
  const before=summarizeWeightedMean(rows);
  for(const factor of [2,10,0.25]){
    const after=summarizeWeightedMean(rows.map(row=>({...row,weight:String(Number(row.weight)*factor)})));
    close(after.mean,before.mean);after.rows.forEach((row,i)=>close(row.share,before.rows[i].share));
  }
});
test('zero is a genuine value; zero-weight rows and empty groups do not contribute',()=>{
  const zero=summarizeWeightedMean([{value:'0',weight:'1'},{value:'10',weight:'1'}]);assert.equal(zero.mean,5);
  const empty=summarizeWeightedMean([{value:'',weight:'0'},{value:'18',weight:'30'}],'pooled');assert.equal(empty.mean,18);assert.equal(empty.equalMean,18);assert.equal(empty.rows[0].product,0);assert.equal(empty.rows[0].share,0);
  const excluded=summarizeWeightedMean([{value:'-999',weight:'0'},{value:'10',weight:'2'}]);assert.equal(excluded.mean,10);assert.equal(excluded.min,10);
  const allZero=summarizeWeightedMean([{value:'',weight:'0'},{value:'3',weight:'0'}]);assert.equal(allZero.mean,null);assert.equal(allZero.equalMean,null);assert.equal(allZero.rows[0].share,null);
});
test('invalid input and negative weights cannot silently become valid results',()=>{
  assert.equal(parseMeanNumber(' −۱۲٫۵ '),-12.5);assert.equal(parseMeanNumber('٣٫٢٥'),3.25);
  for(const value of ['', ' ', 'abc','NaN','Infinity','1e2','1,000','1000001','0.0000001',null,5])assert.equal(parseMeanNumber(value),null);
  for(const row of [{value:'2',weight:'-1'},{value:'2',weight:''},{value:'oops',weight:'0'},{value:'',weight:'1'}])assert.equal(summarizeWeightedMean([row]),null);
  assert.equal(summarizeWeightedMean([{value:'5',weight:'1.5'}],'pooled'),null);
  assert.equal(summarizeWeightedMean([], 'weighted'),null);assert.equal(summarizeWeightedMean(null),null);
});
test('equal weights and equal values give expected means without implying the converse',()=>{
  const equal=summarizeWeightedMean(meanExamples.weighted.rows.map(row=>({...row,weight:'1'})));close(equal.mean,equal.equalMean);
  const constant=summarizeWeightedMean([{value:'7',weight:'1'},{value:'7',weight:'9'}]);assert.equal(constant.mean,7);assert.equal(constant.equalMean,7);
});
test('nonnegative weights keep the mean between included values, including signed values',()=>{
  for(const rows of [[{value:'-10',weight:'1'},{value:'-2',weight:'3'}],[{value:'-1000000',weight:'1000000'},{value:'1000000',weight:'1'}],[{value:'1',weight:'0'},{value:'-3',weight:'0.25'},{value:'9',weight:'0.75'}]]){
    const result=summarizeWeightedMean(rows);assert.ok(result.mean>=result.min&&result.mean<=result.max);
  }
});
