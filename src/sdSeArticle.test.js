import test from 'node:test';
import assert from 'node:assert/strict';
import {sdSeWorkedValues,sdSeWorkedExample,sdSeExactExample,illustrativeMeanSE} from './sdSeArticle.js';
import {referenceArticles} from './referenceArticles.js';
import {referenceTopics} from './referenceTopics.js';
test('authored five-person example separates sample SD from estimated mean SE',()=>{
  assert.deepEqual(sdSeWorkedValues,[6,7,8,9,10]);
  const result=sdSeWorkedExample();assert.equal(result.n,5);assert.equal(result.mean,8);assert.equal(result.ss,10);assert.equal(result.variance,2.5);
  assert.ok(Math.abs(result.sd-Math.sqrt(2.5))<1e-12);assert.ok(Math.abs(result.se-Math.sqrt(.5))<1e-12);
});
test('all nine independent replacement draws agree with the article probability table and exact SE',()=>{
  const model=sdSeExactExample();const raw=[];
  for(const x of [2,4,6])for(const y of [2,4,6])raw.push((x+y)/2);
  assert.equal(model.total,9);
  assert.deepEqual(model.means.map(p=>[p.mean,p.count]),[[2,1],[3,2],[4,3],[5,2],[6,1]]);
  const center=raw.reduce((a,b)=>a+b,0)/9,variance=raw.reduce((sum,x)=>sum+(x-center)**2,0)/9;
  assert.equal(center,4);assert.ok(Math.abs(model.se-Math.sqrt(variance))<1e-12);assert.ok(Math.abs(model.sd-Math.sqrt(8/3))<1e-12);
});
test('fixed SD scenario halves estimated SE only when sample size quadruples and rejects invalid sizes',()=>{
  assert.equal(illustrativeMeanSE(25),.4);assert.equal(illustrativeMeanSE(100),.2);assert.equal(illustrativeMeanSE(400),.1);
  for(const n of [null,'25',NaN,Infinity,3,401,25.5])assert.equal(illustrativeMeanSE(n),null);
  assert.equal(referenceArticles.sampling.slug,'sd-se');assert.ok(referenceTopics.some(topic=>topic.id==='sampling'));
});
