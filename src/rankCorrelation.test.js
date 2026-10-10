import test from 'node:test';
import assert from 'node:assert/strict';
import {rankValues,linearCorrelation,summarizeRankPairs,rankPresets,rankChecks,initialRankState,rankReducer,analyzeRanks,coefficientText,buildRankReport} from './rankCorrelation.js';
import {pairStats} from './stats.js';
const preset=id=>rankReducer(initialRankState(),{type:'preset',id});
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-12,`${actual} != ${expected}`);

test('average ranks retain original row identity, tie intervals and the sum of positions',()=>{
 const values=[4,2,1,2],copy=[...values],r=rankValues(values);assert.deepEqual(r.ranks,[4,2.5,1,2.5]);assert.deepEqual(values,copy);assert.equal(r.ranks.reduce((a,b)=>a+b,0),10);const group=r.groups[r.byIndex[1]];assert.deepEqual(group,{value:2,start:2,end:3,rank:2.5,indices:[1,3]});assert.equal(r.byIndex[1],r.byIndex[3]);
 assert.deepEqual(rankValues([0,-0,0]).ranks,[2,2,2]);
 for(const invalid of [[],[NaN],[Infinity],[1e10],Array(3),Array(201).fill(1)])assert.equal(rankValues(invalid),null);
});
test('linear, reversed and monotone nonlinear relationships separate Pearson and Spearman',()=>{
 const linear=analyzeRanks(initialRankState()).summary;assert.equal(linear.pearson,1);assert.equal(linear.spearman,1);
 const reverse=summarizeRankPairs([1,2,3,4],[9,7,5,3]);assert.equal(reverse.pearson,-1);assert.equal(reverse.spearman,-1);
 const monotone=analyzeRanks(preset('monotone')).summary;assert.equal(monotone.spearman,1);assert.ok(monotone.pearson>0&&monotone.pearson<.9);near(monotone.pearson,pairStats([1,2,3,4,5],[1,2,4,8,64]).r);
});
test('tie-adjusted Spearman matches independent centered-rank arithmetic, not the no-tie shortcut',()=>{
 const s=analyzeRanks(preset('ties')).summary;assert.deepEqual(s.rx.ranks,[1,2.5,2.5,4]);assert.deepEqual(s.ry.ranks,[1,3,2,4]);assert.equal(s.mean,2.5);assert.equal(s.ssX,4.5);assert.equal(s.ssY,5);assert.equal(s.cross,4.5);near(s.spearman,3/Math.sqrt(10));assert.equal(s.pearson,null);
 const shortcut=1-6*(.5**2+.5**2)/(4*(4**2-1));assert.ok(Math.abs(s.spearman-shortcut)>.001);
});
test('a U shaped relationship can have both coefficients zero while all values still vary',()=>{
 const s=analyzeRanks(preset('curved')).summary;near(s.pearson,0);near(s.spearman,0);assert.deepEqual(s.ry.ranks,[4.5,2.5,1,2.5,4.5]);assert.ok(new Set(s.x).size>1&&new Set(s.y).size>1);
});
test('constant inputs are undefined, one pair is insufficient, and mismatched or missing entries block results',()=>{
 const constant=analyzeRanks(preset('constant')).summary;assert.equal(constant.pearson,null);assert.equal(constant.spearman,null);assert.equal(constant.ssX,0);
 const s=initialRankState();for(const value of ['1','1, 2','1,,3','1, NA, 3','',Array(201).fill(1).join(',')]){const bad=analyzeRanks({...s,xtext:value});assert.equal(bad.summary,null);assert.equal(bad.scenario,null);assert.ok(bad.error);}
 const fa=analyzeRanks({...s,xtext:'۱، ۲، ۳، ۴، ۵',ytext:'٢، ٤، ٦، ٨، ١٠'});assert.equal(fa.summary.pearson,1);assert.equal(fa.summary.spearman,1);
});
test('joint permutations preserve the coefficient while independently sorting destroys pairing',()=>{
 const x=[4,1,3,2],y=[1,4,2,3],s=summarizeRankPairs(x,y),order=[2,0,3,1];near(s.spearman,-1);near(summarizeRankPairs(order.map(i=>x[i]),order.map(i=>y[i])).spearman,s.spearman);
 const falselyPaired=summarizeRankPairs([...x].sort(),[...y].sort());near(falselyPaired.spearman,1);assert.deepEqual(s.x,x);assert.deepEqual(s.y,y);
});
test('strictly increasing recoding preserves rank correlation with ties; decreasing recoding reverses sign',()=>{
 const x=[1,2,2,4],y=[1,3,2,4],s=summarizeRankPairs(x,y,'ordinal');near(summarizeRankPairs(x.map(v=>v**3+10),y.map(v=>v**2+5),'ordinal').spearman,s.spearman);near(summarizeRankPairs(x.map(v=>-v),y,'ordinal').spearman,-s.spearman);
 const quant=summarizeRankPairs(x,y,'quantitative');assert.ok(Number.isFinite(quant.pearson));assert.equal(s.pearson,null);
});
test('experimental omission preserves complete data and reranks every remaining observation',()=>{
 let state=preset('influential');const full=analyzeRanks(state).summary;assert.ok(full.pearson<0);near(full.spearman,1/7);state=rankReducer(state,{type:'omit',index:5});let a=analyzeRanks(state);assert.equal(a.summary.n,6);assert.equal(a.scenario.n,5);assert.equal(a.scenario.pearson,1);assert.equal(a.scenario.spearman,1);assert.deepEqual(a.summary.x,rankPresets.influential.x);assert.deepEqual(a.scenario.ry.ranks,[1,2,3,4,5]);
 state=rankReducer(preset('ties'),{type:'omit',index:1});a=analyzeRanks(state);assert.deepEqual(a.scenario.rx.ranks,[1,2,3]);assert.deepEqual(a.summary.rx.ranks,[1,2.5,2.5,4]);
 const two={...initialRankState(),xtext:'1,2',ytext:'3,4',omitted:0};assert.equal(analyzeRanks(two).scenario,null);assert.ok(buildRankReport(two).includes('کمتر از دو جفت'));
});
test('selection and scenario are cleared on data edits; scale switch hides raw Pearson without changing ranks',()=>{
 let s=initialRankState();s=rankReducer(s,{type:'select',index:3});s=rankReducer(s,{type:'omit',index:3});const original=structuredClone(s),ordinal=rankReducer(s,{type:'scale',value:'ordinal'});assert.equal(analyzeRanks(ordinal).summary.pearson,null);assert.deepEqual(analyzeRanks(ordinal).summary.rx,analyzeRanks(s).summary.rx);
 const changed=rankReducer(s,{type:'data',field:'ytext',value:'2,4,6,8,11'});assert.equal(changed.selected,null);assert.equal(changed.omitted,null);assert.deepEqual(s,original);assert.deepEqual(rankReducer(changed,{type:'reset'}),initialRankState());
});
test('scaled computation handles tiny, negative and shifted values without squaring raw numbers to zero',()=>{
 near(linearCorrelation([1e-200,2e-200,3e-200],[3e-200,2e-200,1e-200]),-1);near(linearCorrelation([-1e9,0,1e9],[1e9,0,-1e9]),-1);
 const x=[1,2,3,4,5],y=[2,1,4,3,5],r=linearCorrelation(x,y);near(r,.8);near(linearCorrelation(x.map(v=>100+2*v),y.map(v=>50+3*v)),r);near(linearCorrelation(x.map(v=>-v),y),-r);
 assert.equal(linearCorrelation([1],[2]),null);assert.equal(linearCorrelation([1,1],[2,3]),null);
});
test('coefficient formatting preserves undefined, real zero, sign, small differences and rounding',()=>{
 assert.equal(coefficientText(null),'تعریف‌نشده');assert.equal(coefficientText(0),'۰');assert.equal(coefficientText(-1),'−۱');assert.equal(coefficientText(1),'۱');assert.ok(coefficientText(.99999).startsWith('≈'));assert.ok(coefficientText(.000001).startsWith('مثبت'));assert.ok(coefficientText(-.000001).startsWith('منفی'));
});
test('fixed questions expose option-specific feedback and data edits do not change their example answers',()=>{
 let state=initialRankState();for(const q of rankChecks){assert.equal(q.options.length,3);assert.equal(new Set(q.feedback).size,3);for(let value=0;value<3;value++){state=rankReducer(state,{type:'answer',id:q.id,value});assert.equal(state.checked[q.id],false);state=rankReducer(state,{type:'check',id:q.id});assert.equal(state.checked[q.id],true);assert.ok(q.feedback[value]);}}
 const changed=rankReducer(state,{type:'data',field:'xtext',value:'1,2,3,4,6'});assert.deepEqual(changed.checked,state.checked);assert.deepEqual(rankReducer(changed,{type:'preset',id:'ties'}).checked,{});
});
test('reports preserve pair order and full precision, distinguish scenarios, and suppress invalid output',()=>{
 const s={...initialRankState(),xtext:'1.0000000001, 3, 2',ytext:'9, 7.123456789, 8',omitted:0},report=buildRankReport(s);assert.ok(report.includes('1,1.0000000001,9'));assert.ok(report.includes('2,3,7.123456789'));assert.ok(report.includes('سناریوی آزمایشی بدون جفت ۱'));assert.ok(report.includes('رتبه‌ها از نو محاسبه شده‌اند'));
 const ord=buildRankReport(preset('ties'));assert.ok(ord.includes('پیرسون کدها محاسبه نمی‌شود'));assert.ok(!ord.includes('پیرسون:'));const invalid=buildRankReport({...s,xtext:'1,,3'});assert.ok(invalid.includes('نتیجهٔ عددی گزارش نمی‌شود'));assert.ok(!invalid.includes('اسپیرمن:'));
});
test('bounded actions reject unknown fields and all presets keep valid complete pairs',()=>{
 const s=initialRankState();for(const action of [{type:'preset',id:'other'},{type:'data',field:'other',value:'1'},{type:'data',field:'xtext',value:'1'.repeat(10001)},{type:'scale',value:'nominal'},{type:'select',index:99},{type:'omit',index:-1},{type:'check',id:'ties'},{type:'answer',id:'ties',value:3}])assert.strictEqual(rankReducer(s,action),s);
 for(const id of Object.keys(rankPresets))assert.ok(analyzeRanks(preset(id)).summary);
 const values=Array.from({length:200},(_,i)=>i);const summary=summarizeRankPairs(values,values.map(v=>-v));near(summary.spearman,-1);assert.equal(summary.n,200);
});
