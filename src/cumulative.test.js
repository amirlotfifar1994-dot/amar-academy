import test from 'node:test';
import assert from 'node:assert/strict';
import {cumulativePresets,cumulativeChecks,cumulativeSummary,analyzeCumulative,initialCumulativeState,cumulativeReducer,buildCumulativeReport,cumulativePercent} from './cumulative.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<=1e-12*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('ties distinguish strict, inclusive and half-weight ranks with exact original identities',()=>{
 const s=analyzeCumulative(initialCumulativeState()).summary;
 assert.deepEqual([s.below,s.equal,s.above],[1,3,2]);near(s.strict,1/6);near(s.inclusive,4/6);near(s.midrank,2.5/6);
 assert.deepEqual(s.groups[1],{value:2,count:3,before:1,cumulative:4,share:.5,fraction:4/6,indices:[1,2,3]});
 assert.equal(s.discrete,2);assert.equal(s.interpolated,2);near(s.discreteFraction,4/6);
});
test('even sample separates discrete inverse quantile from interpolated median',()=>{
 const s=cumulativeSummary([2,4,6,8],5,50);assert.equal(s.discrete,4);assert.equal(s.interpolated,5);assert.equal(s.position,2);assert.deepEqual([s.lo,s.hi,s.weight],[1,2,.5]);assert.equal(s.inclusive,.5);assert.equal(s.equal,0);assert.equal(s.strict,s.midrank);
});
test('waiting-time example answers both practical questions with the stated minute values',()=>{
 const p=cumulativePresets.waiting,s=cumulativeSummary(p.values,p.threshold,p.percent);
 assert.equal(s.n,8);assert.equal(s.below+s.equal,5);assert.equal(s.inclusive,.625);assert.equal(s.discrete,12);assert.equal(s.discreteFraction,.75);assert.equal(s.interpolated,13.5);assert.equal(s.interpolatedFraction,.75);
});
test('ECDF is constant across empty gaps and only jumps at observed values',()=>{
 const data=[1,2,8,9];for(const threshold of [2,3,5,7,7.9999])assert.equal(cumulativeSummary(data,threshold,40).inclusive,.5);
 const at8=cumulativeSummary(data,8,40);assert.equal(at8.strict,.5);assert.equal(at8.inclusive,.75);assert.equal(at8.equal,1);assert.equal(at8.discrete,2);near(at8.interpolated,3.2);assert.equal(at8.interpolatedFraction,.5);
});
test('constant data and a single observation keep all three conventions explicit',()=>{
 for(const values of [[7,7,7,7],[7]]){const s=cumulativeSummary(values,7,50);assert.equal(s.strict,0);assert.equal(s.inclusive,1);assert.equal(s.midrank,.5);assert.equal(s.discrete,7);assert.equal(s.interpolated,7);assert.equal(s.groups.length,1);}
});
test('thresholds outside data have zero/one ECDF and real zeros count normally',()=>{
 const data=[0,0,1,3,5],below=cumulativeSummary(data,-1,80),above=cumulativeSummary(data,6,80),zero=cumulativeSummary(data,0,80);
 assert.equal(below.inclusive,0);assert.equal(below.above,5);assert.equal(above.inclusive,1);assert.equal(above.below,5);assert.equal(zero.equal,2);assert.equal(zero.inclusive,.4);assert.equal(zero.midrank,.2);assert.equal(zero.discrete,3);near(zero.interpolated,3.4);
});
test('all presets conserve observations, monotone counts and jump heights',()=>{
 for(const p of Object.values(cumulativePresets)){
  const s=cumulativeSummary(p.values,p.threshold,p.percent);assert.ok(s);assert.equal(s.below+s.equal+s.above,s.n);assert.equal(s.groups.reduce((sum,g)=>sum+g.count,0),s.n);assert.equal(s.groups.at(-1).fraction,1);
  assert.deepEqual(s.groups.flatMap(g=>g.indices).sort((a,b)=>a-b),p.values.map((_,i)=>i));
  for(const g of s.groups){assert.equal(g.cumulative-g.before,g.count);near(g.fraction-g.before/s.n,g.share);}
 }
});
test('quantile endpoints and decimal targets use one-based discrete positions and consistent type seven metadata',()=>{
 const data=Array.from({length:100},(_,i)=>i);
 for(const p of [1,7,29,50,58,99,100]){const s=cumulativeSummary(data,0,p);assert.equal(s.discrete,p-1);assert.equal(s.position,p);near(s.interpolated,(data.length-1)*p/100);assert.equal(s.index,(data.length-1)*(p/100));}
 const decimals=cumulativeSummary(Array.from({length:125},(_,i)=>i),0,28.8);assert.equal(decimals.position,36);assert.equal(decimals.discrete,35);
 const hundred=cumulativeSummary([2,4,6,8],0,100);assert.equal(hundred.discrete,8);assert.equal(hundred.interpolated,8);assert.equal(hundred.lo,3);assert.equal(hundred.hi,3);assert.equal(hundred.weight,0);
});
test('data and threshold validation distinguishes blanks from zero and accepts Persian decimals',()=>{
 const state={...initialCumulativeState(),xtext:'۰، ۲، ۲، ۴',threshold:'۲',percent:'۵۰٫۵'};
 const a=analyzeCumulative(state);assert.ok(a.summary);assert.equal(a.summary.percent,50.5);assert.equal(a.summary.inclusive,.75);
 for(const field of ['xtext','threshold','percent'])for(const value of ['', '0,,2','not a number','Infinity','0,2,'])assert.equal(analyzeCumulative({...state,[field]:value}).summary,null);
 for(const value of ['0','0.5','-1','100.01','101','1,2'])assert.equal(analyzeCumulative({...state,percent:value}).summary,null);
 assert.ok(analyzeCumulative({...state,threshold:'0'}).summary);
 assert.equal(analyzeCumulative({...state,threshold:'1,2'}).summary,null);
});
test('invalid arrays, sparse data, nonfinite values and unsupported bounds cannot create results',()=>{
 for(const data of [[],[,1],[NaN],[Infinity],[1e10],Array(201).fill(1)])assert.equal(cumulativeSummary(data,0,50),null);
 for(const threshold of [NaN,Infinity,-1e10,1e10])assert.equal(cumulativeSummary([1],threshold,50),null);
 for(const percent of [NaN,Infinity,0,.1,-1,100.01])assert.equal(cumulativeSummary([1],0,percent),null);
});
test('large, tiny and closely spaced accepted numbers preserve equality comparisons',()=>{
 const tiny=cumulativeSummary([-1e-200,0,1e-200],0,50);assert.deepEqual([tiny.below,tiny.equal,tiny.above],[1,1,1]);assert.equal(tiny.interpolated,0);
 const big=cumulativeSummary([-1e9,0,1e9],1e9,100);assert.equal(big.inclusive,1);assert.equal(big.interpolated,1e9);
 const close=cumulativeSummary([.3,.30000000000000004,.3000000000000001],.30000000000000004,50);assert.deepEqual([close.below,close.equal,close.above],[1,1,1]);assert.equal(close.discrete,.30000000000000004);assert.equal(close.interpolated,.30000000000000004);
 const subnormal=cumulativeSummary([0,Number.MIN_VALUE],0,50);assert.ok(Number.isFinite(subnormal.interpolated));assert.equal(subnormal.equal,1);
});
test('input order is preserved and joint reordering changes only original row identities',()=>{
 const values=[6,2,1,2,4,2],before=[...values],s=cumulativeSummary(values,2,50),reversed=cumulativeSummary([...values].reverse(),2,50);
 assert.deepEqual(values,before);assert.deepEqual(s.values,before);assert.equal(s.inclusive,reversed.inclusive);assert.equal(s.discrete,reversed.discrete);assert.equal(s.interpolated,reversed.interpolated);assert.deepEqual(s.groups[1].indices,[1,3,5]);assert.deepEqual(reversed.groups[1].indices,[0,2,4]);
});
test('selection sets threshold, quantile actions retain data and input edits clear selection',()=>{
 let state=initialCumulativeState('even');state=cumulativeReducer(state,{type:'select',index:1});assert.equal(state.threshold,'4');assert.equal(state.selected,1);assert.equal(state.percent,'50');
 const data=state.xtext;state=cumulativeReducer(state,{type:'useQuantile',method:'interpolated'});assert.equal(state.threshold,'5');assert.equal(state.xtext,data);assert.equal(state.selected,null);
 state=cumulativeReducer(state,{type:'useQuantile',method:'discrete'});assert.equal(state.threshold,'4');state=cumulativeReducer(state,{type:'select',index:2});state=cumulativeReducer(state,{type:'data',field:'percent',value:'80'});assert.equal(state.selected,null);assert.equal(state.threshold,'6');
 assert.equal(cumulativeReducer(state,{type:'select',index:1000}),state);assert.equal(cumulativeReducer(state,{type:'useQuantile',method:'unknown'}),state);
});
test('fixed checks require choice, expose specific feedback and reset separately from course progress',()=>{
 let state=initialCumulativeState();assert.equal(cumulativeReducer(state,{type:'check',id:'ties'}),state);
 for(const q of cumulativeChecks){assert.equal(q.options.length,q.feedback.length);assert.ok(q.feedback.every(Boolean));state=cumulativeReducer(state,{type:'answer',id:q.id,value:q.correct});state=cumulativeReducer(state,{type:'check',id:q.id});assert.equal(state.checked[q.id],true);}
 const edited=cumulativeReducer(state,{type:'data',field:'xtext',value:'1,2,3'});assert.deepEqual(edited.answers,state.answers);state=cumulativeReducer(edited,{type:'answer',id:'ties',value:0});assert.equal(state.checked.ties,false);
 assert.deepEqual(cumulativeReducer(state,{type:'reset'}),initialCumulativeState());assert.deepEqual(cumulativeReducer(state,{type:'preset',id:'even'}),initialCumulativeState('even'));
 for(const action of [{type:'preset',id:'constructor'},{type:'data',field:'nonsense',value:'1'},{type:'answer',id:'ties',value:9},{type:'select',index:1.5}])assert.equal(cumulativeReducer(state,action),state);
});
test('report preserves full precision, original order and both contracts while invalid data suppress numerical output',()=>{
 const state={...initialCumulativeState(),xtext:'1.0000000000000002, 0, 2',threshold:'1.0000000000000002'},report=buildCumulativeReport(state);
 assert.match(report,/1\.0000000000000002, 0, 2/);assert.match(report,/نوع ۱/);assert.match(report,/نوع ۷/);assert.match(report,/تعداد X≤t/);assert.match(report,/نصف وزن/);assert.match(report,/1\.0000000000000002 \| 1 \| 1 \| 2/);assert.ok(!/NaN|Infinity/.test(report));
 const invalid=buildCumulativeReport({...state,xtext:''});assert.match(invalid,/نتیجه محاسبه نشد/);assert.ok(!invalid.includes('تعداد معتبر:'));assert.equal(cumulativePercent(0),'۰٪');assert.equal(cumulativePercent(1),'۱۰۰٪');
});
