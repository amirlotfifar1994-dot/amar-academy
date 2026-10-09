import test from 'node:test';
import assert from 'node:assert/strict';
import {plainLessons} from './plainLessons.js';
import {parseData,describe,histogram,pairStats,percentileRank,latin} from './stats.js';
import {fmt} from './format.js';
const values=id=>parseData(plainLessons[id].data.join(' ')).values;

test('zero is a real response in the frequency story and boundary observations are counted once',()=>{
  const data=values(2);assert.equal(data.length,6);assert.ok(data.includes(0));
  assert.equal(data.filter(n=>n===2).length/data.length*100,50);
  assert.match(plainLessons[2].answer,/۳ نفر.*۵۰٪/);
  const bins=histogram(values(3),2);assert.deepEqual(bins.map(b=>b.count),[3,3]);
  assert.equal(bins[0].values.includes(6),false);assert.equal(bins[1].values.includes(8),true);
});
test('the waiting-time stories retain the stated mean, median, mode and direction of skew',()=>{
  const s=describe(values(4));assert.equal(s.mean,6);assert.equal(s.median,3);assert.deepEqual(s.modes,[3]);
  assert.match(plainLessons[4].answer,new RegExp(`میانگین ${fmt(s.mean)} دقیقه، میانه ${fmt(s.median)} دقیقه`));
  const shape=describe(values(7));assert.deepEqual(values(7),values(4));assert.ok(shape.skew>0);
});
test('the equal-center groups have genuinely different sample spread',()=>{
  const [a,b]=plainLessons[5].data.map(text=>describe(parseData(text.split(':')[1]).values));
  assert.equal(a.mean,7);assert.equal(b.mean,7);assert.equal(a.ss,2);assert.equal(b.ss,50);
  assert.equal(a.sd,1);assert.equal(b.sd,5);assert.equal(a.variance,1);assert.equal(b.variance,25);
});
test('the reference-score and type-7 interpolation examples preserve the stated calculations',()=>{
  const [score,mean,sd]=plainLessons[6].data.map(text=>Number(latin(text.split(':')[1]).trim()));
  assert.equal((score-mean)/sd,1.5);assert.match(plainLessons[6].answer,new RegExp(`z = ${fmt((score-mean)/sd)}`));
  const s=describe(values(8));assert.equal(s.q1,3.5);assert.equal(s.q3,6.5);assert.equal(s.iqr,3);
  assert.equal(percentileRank(values(8),4),37.5);assert.match(plainLessons[8].answer,new RegExp(fmt(s.q1)));
});
test('the paired story and zero-linear-correlation counterexample match their actual observations',()=>{
  const pairs=plainLessons[9].data.map(text=>latin(text).match(/\d+/g).map(Number).slice(1));
  assert.equal(pairStats(pairs.map(p=>p[0]),pairs.map(p=>p[1])).r,-1);
  assert.equal(pairStats([1,2,3],[1,0,1]).r,0);
  const retained=plainLessons[10].data.slice(0,2).map(text=>Number(latin(text.split(':')[1]).trim()));
  assert.equal(describe(retained).mean,7);assert.equal(retained.length,2);
});
