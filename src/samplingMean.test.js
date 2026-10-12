import test from 'node:test';
import assert from 'node:assert/strict';
import {samplingPresets,samplingChecks,parseModelPopulation,samplingModel,selectModelSample,initialSampling,analyzeSampling,samplingReducer,buildSamplingReport} from './samplingMean.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<=1e-12*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);

test('three-member model has an independently worked nine-outcome distribution',()=>{
 const m=samplingModel([2,4,6],2);assert.equal(m.total,9);assert.deepEqual(m.outcomes.map(p=>p.mean),[2,3,4,3,4,5,4,5,6]);assert.deepEqual(m.means.map(p=>[p.mean,p.count]),[[2,1],[3,2],[4,3],[5,2],[6,1]]);
 assert.equal(m.mean,4);near(m.sd,Math.sqrt(8/3));near(m.se,Math.sqrt(4/3));near(m.meanOfMeans,4);near(m.sdOfMeans,Math.sqrt(4/3));
});
test('selected sample separates s, estimated SE, known model SE and actual error',()=>{
 const m=samplingModel([2,4,6],2),{sample:s}=selectModelSample(m,'2');assert.deepEqual(s.indices,[0,1]);assert.deepEqual(s.values,[2,4]);assert.equal(s.mean,3);near(s.sd,Math.SQRT2);near(s.estimatedSE,1);assert.equal(s.error,-1);assert.equal(s.meanCount,2);near(s.meanProbability,2/9);assert.notEqual(s.estimatedSE,m.se);
});
test('n=1 has a known model SE but no estimated sample SD or SE',()=>{
 const m=samplingModel([2,4,6],1);near(m.se,m.sd);assert.deepEqual(m.individuals.map(p=>[p.mean,p.count]),m.means.map(p=>[p.mean,p.count]));const {sample}=selectModelSample(m,'2');assert.equal(sample.mean,4);assert.equal(sample.sd,null);assert.equal(sample.estimatedSE,null);assert.equal(sample.error,0);
});
test('four times as many observations halves model SE while population SD remains fixed',()=>{
 const one=samplingModel([2,4,6],1),four=samplingModel([2,4,6],4);assert.equal(four.total,81);near(four.sd,one.sd);near(four.se,one.se/2);near(four.sdOfMeans,four.se);
});
test('an equal-valued sample does not establish zero population variability',()=>{
 const m=samplingModel([2,4,6],2),{sample}=selectModelSample(m,'1');assert.deepEqual(sample.indices,[0,0]);assert.equal(sample.sd,0);assert.equal(sample.estimatedSE,0);assert.ok(m.se>0);assert.equal(sample.error,-2);
});
test('duplicate population values retain distinct equal-probability member identities',()=>{
 const m=samplingModel([2,2,6],2);assert.equal(m.N,3);assert.equal(m.total,9);assert.deepEqual(m.individuals.map(p=>[p.mean,p.count]),[[2,2],[6,1]]);assert.deepEqual(m.means.map(p=>[p.mean,p.count]),[[2,4],[4,4],[6,1]]);
 assert.deepEqual(m.outcomes[1].indices,[0,1]);assert.deepEqual(m.outcomes[3].indices,[1,0]);assert.equal(m.outcomes[1].mean,m.outcomes[3].mean);near(selectModelSample(m,'2').sample.meanProbability,4/9);
});
test('a constant population gives true zero spread for all ordered samples',()=>{
 for(const n of [1,2,3,4]){const m=samplingModel([4,4,4],n);assert.equal(m.sd,0);assert.equal(m.se,0);assert.equal(m.sdOfMeans,0);assert.equal(m.means.length,1);assert.equal(m.means[0].count,m.total);assert.equal(m.means[0].probability,1);assert.deepEqual(m.domain,[3,5]);assert.equal(selectModelSample(m,String(m.total)).sample.mean,4);}
});
test('all presets and sizes conserve probabilities and satisfy mean and variance identities',()=>{
 for(const p of Object.values(samplingPresets))for(let n=1;n<=4;n++){
  const m=samplingModel(p.values,n);assert.equal(m.outcomes.length,p.values.length**n);assert.equal(m.means.reduce((s,p)=>s+p.count,0),m.total);near(m.means.reduce((s,p)=>s+p.probability,0),1);near(m.individuals.reduce((s,p)=>s+p.probability,0),1);near(m.meanOfMeans,m.mean);near(m.sdOfMeans,m.se);
  for(const o of m.outcomes){assert.equal(o.indices.length,n);assert.ok(o.indices.every(i=>i>=0&&i<m.N));assert.equal(o.sum,o.indices.reduce((s,i)=>s+p.values[i],0));}
 }
});
test('maximum-size signed model remains exact in enumeration and finite in summaries',()=>{
 const m=samplingModel([-100,-20,0,20,50,100],4);assert.equal(m.total,1296);assert.deepEqual(m.outcomes[0].indices,[0,0,0,0]);assert.deepEqual(m.outcomes.at(-1).indices,[5,5,5,5]);assert.ok(m.means.length<=126);near(m.meanOfMeans,m.mean);near(m.sdOfMeans,m.se);assert.ok(Number.isFinite(m.se));
});
test('population permutations preserve distributions while shifts and scales transform correctly',()=>{
 const a=samplingModel([2,4,6],3),permuted=samplingModel([6,2,4],3),shifted=samplingModel([12,14,16],3),scaled=samplingModel([-4,-8,-12],3);
 assert.deepEqual(a.means.map(p=>[p.sum,p.count]),permuted.means.map(p=>[p.sum,p.count]));near(a.se,shifted.se);near(shifted.mean,a.mean+10);near(scaled.sd,2*a.sd);near(scaled.se,2*a.se);near(scaled.mean,-2*a.mean);assert.deepEqual(shifted.means.map(p=>p.count),a.means.map(p=>p.count));
});
test('validation rejects missing, malformed, fractional, oversized and sparse models',()=>{
 for(const text of ['', '2', '1,2,3,4,5,6,7','1,1.5,2','1,101','1,NaN','Infinity,2'])assert.ok(parseModelPopulation(text).error,text);
 assert.deepEqual(parseModelPopulation('−۲، ۰، ۴').values,[-2,0,4]);assert.equal(parseModelPopulation('۲ ۴ ۶').error,null);
 for(const values of [[],[1],Array(2),[NaN,2],[1,101],[1,2.5],Array(7).fill(2)])assert.equal(samplingModel(values,2),null);
 for(const n of [0,5,1.5,NaN,'2'])assert.equal(samplingModel([2,4,6],n),null);
});
test('sample numbers are one-based and invalid selection never displays a prior sample',()=>{
 const m=samplingModel([2,4,6],2);assert.equal(selectModelSample(m,'۹').sample.index,8);for(const input of ['', '0','10','1.5','1,2','bad']){const s=selectModelSample(m,input);assert.equal(s.sample,null);assert.ok(s.error);}assert.deepEqual(selectModelSample(null,'1'),{sample:null,error:null});
});
test('data and size edits preserve self-checks but safely reset the selected sample',()=>{
 let s=initialSampling();s=samplingReducer(s,{type:'answer',id:'meaning',value:0});s=samplingReducer(s,{type:'check',id:'meaning'});s=samplingReducer(s,{type:'pick',index:8});assert.equal(s.sampleText,'9');s=samplingReducer(s,{type:'size',value:1});assert.equal(s.sampleText,'1');assert.equal(s.checked.meaning,true);
 s=samplingReducer(s,{type:'data',value:'2,2,6'});assert.equal(s.preset,'custom');assert.equal(s.sampleText,'1');assert.equal(s.checked.meaning,true);const edited=samplingReducer(s,{type:'unit',value:'دقیقه'});assert.equal(edited.text,s.text);near(analyzeSampling(edited).model.se,analyzeSampling(s).model.se);
});
test('selecting a mean opens a genuine representative and recovers invalid sample number',()=>{
 const s={...initialSampling(),sampleText:'bad'},m=analyzeSampling(s).model;const p=m.means.find(p=>p.mean===4),picked=samplingReducer(s,{type:'pick',index:p.firstIndex});assert.equal(analyzeSampling(picked).sample.mean,4);assert.deepEqual(analyzeSampling(picked).sample.values,[2,6]);
 const invalid=samplingReducer(picked,{type:'data',value:''});assert.equal(analyzeSampling(invalid).model,null);assert.equal(analyzeSampling(invalid).sample,null);assert.equal(samplingReducer(invalid,{type:'pick',index:0}),invalid);
});
test('preset and reset states are independent and prototype actions are rejected',()=>{
 const s=initialSampling();for(const action of [{type:'preset',id:'toString'},{type:'size',value:5},{type:'pick',index:9},{type:'pick',index:-1},{type:'answer',id:'meaning',value:3},{type:'check',id:'meaning'}])assert.equal(samplingReducer(s,action),s);
 assert.deepEqual(initialSampling('constructor'),initialSampling());assert.deepEqual(samplingReducer({...s,sampleText:'bad'},{type:'reset'}),initialSampling());
 for(const id of Object.keys(samplingPresets)){const a=initialSampling(id);a.answers.test=1;assert.deepEqual(initialSampling(id).answers,{});assert.ok(analyzeSampling(initialSampling(id)).model);}
});
test('every fixed choice has specific feedback and valid independent worked answers',()=>{
 assert.equal(12/Math.sqrt(36),2);assert.equal(4/Math.sqrt(4),2);for(const q of samplingChecks){assert.equal(q.options.length,3);assert.equal(q.feedback.length,3);assert.ok(q.options[q.correct]);for(let value=0;value<3;value++){const s=samplingReducer(samplingReducer(initialSampling(),{type:'answer',id:q.id,value}),{type:'check',id:q.id});assert.equal(s.checked[q.id],true);assert.ok(q.feedback[value]);}}
});
test('report discloses model contract, exact counts, sample identities and limits',()=>{
 const report=buildSamplingReport(initialSampling());assert.match(report,/N\^n/);assert.match(report,/همهٔ ترتیب‌های ممکن=9/);assert.match(report,/برداشت 1: عضو 1/);assert.match(report,/برداشت 2: عضو 2/);assert.match(report,/مخرج n−۱/);assert.match(report,/SE برآوردی/);assert.match(report,/خطای دقیق/);assert.match(report,/بدون جایگذاری/);assert.match(report,/فاصلهٔ اطمینان/);assert.doesNotMatch(report,/NaN|Infinity|undefined/);
});
test('invalid model or sample reports suppress only the affected results',()=>{
 const bad=buildSamplingReport({...initialSampling(),text:''});assert.doesNotMatch(bad,/SE واقعی مدل=|نمونهٔ انتخاب‌شده:/);const selection=buildSamplingReport({...initialSampling(),sampleText:'bad'});assert.match(selection,/SE واقعی مدل=/);assert.match(selection,/نمونهٔ انتخاب‌شده محاسبه نشد/);assert.doesNotMatch(selection,/میانگین نمونه=/);
});
