import test from 'node:test';
import assert from 'node:assert/strict';
import {boxAnatomy,boxAnatomyReport,boxExamples,boxChecks} from './boxAnatomy.js';
import {describe,parseData} from './stats.js';
import {buildLabReport} from './labReport.js';

test('fences are computed limits, whiskers are observed values, extreme data are retained',()=>{
 const input=boxExamples.tail.values,copy=[...input],a=boxAnatomy(input);
 assert.equal(a.stats.q1,2.75);assert.equal(a.stats.q3,6.25);
 assert.equal(a.stats.lower,-2.5);assert.equal(a.stats.upper,11.5);
 assert.equal(a.stats.whiskerLow,1);assert.equal(a.stats.whiskerHigh,7);
 assert.deepEqual(a.stats.outliers,[100]);assert.equal(a.groups.at(-1).region,'high');
 assert.equal(a.insideBox,4);assert.equal(a.boxPercent,50);assert.deepEqual(input,copy);
});
test('exact upper/lower fence values are included, beyond either fence is flagged',()=>{
 const upper=boxExamples.boundary.values,a=boxAnatomy(upper);
 assert.equal(a.stats.upper,9);assert.equal(a.groups.at(-1).region,'inside');assert.equal(a.stats.whiskerHigh,9);
 const b=boxAnatomy([...upper.slice(0,-1),10]);assert.equal(b.stats.upper,9);assert.equal(b.groups.at(-1).region,'high');assert.equal(b.stats.whiskerHigh,5);
 const lower=boxAnatomy(upper.map(x=>-x));assert.equal(lower.stats.lower,-9);assert.equal(lower.groups[0].region,'inside');assert.equal(lower.stats.whiskerLow,-9);
 assert.equal(boxAnatomy([0,-1,-2,-3,-4,-5,-10]).groups[0].region,'low');
});
test('zero IQR can contain 80 percent while a different value remains flagged',()=>{
 const a=boxAnatomy(boxExamples.ties.values);assert.equal(a.stats.iqr,0);assert.equal(a.insideBox,4);assert.equal(a.boxPercent,80);
 assert.equal(a.stats.whiskerLow,0);assert.equal(a.stats.whiskerHigh,0);assert.deepEqual(a.stats.outliers,[10]);
 assert.deepEqual(a.groups[0].indices,[0,1,2,3]);assert.equal(a.groups[0].inBox,true);assert.equal(a.groups[1].inBox,false);
});
test('constant and single observations have a real box count and no spurious outlier',()=>{
 for(const values of [[7],[7,7,7,7],[0,0]]){const a=boxAnatomy(values);assert.equal(a.boxPercent,100);assert.equal(a.insideBox,values.length);assert.equal(a.stats.outliers.length,0);assert.equal(a.groups.length,1);assert.equal(a.stats.iqr,0);}
 assert.equal(boxAnatomy([7]).quartiles.every(q=>q.lo===1&&q.hi===1&&q.weight===0&&q.value===7),true);
});
test('type 7 quartile arithmetic exposes original interpolation positions and weights',()=>{
 const a=boxAnatomy([8,2,6,4]);
 assert.deepEqual(a.quartiles.map(q=>[q.position,q.lo,q.hi,q.weight,q.lower,q.upper,q.value]),[[1.75,1,2,.75,2,4,3.5],[2.5,2,3,.5,4,6,5],[3.25,3,4,.25,6,8,6.5]]);
 assert.equal(a.insideBox,2);assert.deepEqual(a.groups.map(g=>g.indices),[[1],[3],[2],[0]]);
});
test('all presets conserve raw identities, sorted positions and row classification',()=>{
 for(const preset of Object.values(boxExamples)){
  const a=boxAnatomy(preset.values);assert.equal(a.groups.reduce((n,g)=>n+g.indices.length,0),a.stats.n);
  assert.deepEqual(a.groups.flatMap(g=>g.indices).sort((x,y)=>x-y),preset.values.map((_,i)=>i));
  assert.deepEqual(a.groups.flatMap(g=>g.indices.map(()=>g.value)),a.stats.sorted);
  assert.equal(a.groups[0].start,1);assert.equal(a.groups.at(-1).end,a.stats.n);
  for(const g of a.groups){assert.equal(g.end-g.start+1,g.indices.length);assert.equal(g.region==='inside',g.value>=a.stats.lower&&g.value<=a.stats.upper);}
 }
});
test('permutations preserve box summaries and connect ties to new original rows',()=>{
 const a=boxAnatomy([10,0,0,0,0]),b=boxAnatomy([0,0,0,0,10]);assert.equal(a.boxPercent,b.boxPercent);assert.equal(a.stats.upper,b.stats.upper);
 assert.deepEqual(a.groups[0].indices,[1,2,3,4]);assert.deepEqual(a.groups[1].indices,[0]);
});
test('empty, sparse, invalid and out-of-range inputs never create anatomy',()=>{
 for(const values of [[],null,[NaN],[Infinity],['2'],[1e9+1],Array(3),Array(201).fill(0)])assert.equal(boxAnatomy(values),null);
 assert.equal(boxAnatomyReport([NaN]),'');assert.equal(parseData('۱، ،۳').error!==null,true);
 assert.deepEqual(boxAnatomy(parseData('−۲، ۰، ۲').values).groups.map(g=>g.value),[-2,0,2]);
});
test('close, subnormal and extreme valid values keep finite quartiles and intact rows',()=>{
 for(const values of [[0,Number.MIN_VALUE],[-1e9,0,1e9],[1,1+Number.EPSILON,1+2*Number.EPSILON],[1e-170,2e-170,3e-170]]){
  const a=boxAnatomy(values);assert.ok(a.quartiles.every(q=>Number.isFinite(q.value)));assert.ok(Number.isFinite(a.stats.lower));assert.ok(Number.isFinite(a.stats.upper));assert.equal(a.groups.reduce((n,g)=>n+g.indices.length,0),values.length);
 }
});
test('report adds full precision, interpolation, fence contract and original row identities',()=>{
 const values=[100,1,2,3,4,5,6,7],report=buildLabReport({mode:'box',stats:describe(values),x:values});
 assert.match(report,/انتهای سبیل‌های مشاهده‌شده: ۱ تا ۷/);assert.match(report,/۱۰۰؛ ردیف‌ها 1؛ بالاتر از کرانه/);assert.match(report,/Q1: h=۲٫۷۵/);assert.match(report,/برابری با کرانه داخل/);assert.match(report,/هیچ داده‌ای حذف/);assert.match(report,/\[100, 1, 2, 3, 4, 5, 6, 7\]/);
 assert.match(boxAnatomyReport([8.123456789,2,4]),/8\.123456789, 2, 4/);
 assert.doesNotMatch(buildLabReport({mode:'hist',stats:describe(values),x:values}),/جزئیات نمودار جعبه‌ای/);
});
test('fixed checks have complete feedback and independently verified worked answers',()=>{
 assert.equal(boxChecks.length,3);for(const q of boxChecks){assert.equal(q.options.length,q.feedback.length);assert.ok(q.correct>=0&&q.correct<q.options.length);assert.ok(q.feedback.every(Boolean));}
 assert.equal(boxAnatomy(boxExamples.tail.values).stats.whiskerHigh,7);assert.equal(boxAnatomy(boxExamples.boundary.values).groups.at(-1).region,'inside');assert.equal(boxAnatomy(boxExamples.ties.values).boxPercent,80);
});
