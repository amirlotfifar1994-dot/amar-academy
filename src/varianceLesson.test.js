import test from 'node:test';
import assert from 'node:assert/strict';
import {varianceSummary,variancePresets,varianceChecks,initialVariance,analyzeVariance,varianceReducer,buildVarianceReport} from './varianceLesson.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<=1e-12*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('small worked data expose signed distances, SS and both denominators',()=>{
 const a=varianceSummary([6,7,8]);assert.equal(a.mean,7);assert.deepEqual(a.rows.map(r=>r.deviation),[-1,0,1]);assert.deepEqual(a.rows.map(r=>r.square),[1,0,1]);assert.equal(a.ss,2);assert.equal(a.signedSum,0);near(a.absoluteMean,2/3);near(a.population.variance,2/3);near(a.population.sd,Math.sqrt(2/3));assert.equal(a.sample.variance,1);assert.equal(a.sample.sd,1);assert.deepEqual(a.rows.map(r=>r.share),[.5,0,.5]);
});
test('same mean does not imply same spread; shifts preserve distance and squared spread',()=>{
 const small=varianceSummary(variancePresets.small.values),wide=varianceSummary(variancePresets.wide.values),shift=varianceSummary(variancePresets.shifted.values);assert.equal(wide.mean,small.mean);assert.equal(wide.sample.sd,5);assert.equal(wide.sample.variance,25);assert.equal(shift.mean,17);assert.deepEqual(shift.rows.map(r=>r.deviation),small.rows.map(r=>r.deviation));assert.equal(shift.sample.variance,small.sample.variance);
});
test('conversion hours to minutes scales SD by 60 and variance by 3600',()=>{
 const a=varianceSummary(variancePresets.small.values),b=varianceSummary(variancePresets.minutes.values);assert.equal(b.mean,420);assert.equal(b.ss,7200);assert.equal(b.sample.sd,60);assert.equal(b.sample.variance,3600);near(b.population.sd,a.population.sd*60);near(b.population.variance,a.population.variance*3600);assert.deepEqual(b.rows.map(r=>r.share),a.rows.map(r=>r.share));
});
test('squared distance contribution is 72 percent and leaves the full data intact',()=>{
 const values=[2,4,6,20],copy=[...values],a=varianceSummary(values);assert.equal(a.mean,8);near(a.ss,200);assert.deepEqual(a.rows.map(r=>r.square),[36,16,4,144]);near(a.rows[3].share,.72);near(a.sample.variance,200/3);near(a.population.variance,50);assert.deepEqual(values,copy);assert.deepEqual(a.rows.map(r=>r.value),copy);
});
test('constant decimal values have real zero spread and undefined contribution shares',()=>{
 for(const values of [[7,7,7,7],Array(6).fill(.1),[0,0]]){const a=varianceSummary(values);assert.equal(a.scale,0);assert.equal(a.ss,0);assert.equal(a.sample.sd,0);assert.equal(a.population.sd,0);assert.equal(a.rows.every(r=>r.share===null),true);assert.equal(a.ssUnderflow,false);}
});
test('one observation distinguishes sample undefined from whole-list zero',()=>{
 const a=varianceSummary([7]);assert.deepEqual(a.sample,{denominator:0,variance:null,sd:null});assert.deepEqual(a.population,{denominator:1,variance:0,sd:0});assert.equal(a.absoluteMean,0);assert.equal(a.rows[0].share,null);
});
test('every preset conserves identities, counts and nonzero contribution shares',()=>{
 for(const p of Object.values(variancePresets)){const a=varianceSummary(p.values);assert.equal(a.n,p.values.length);assert.deepEqual(a.rows.map(r=>r.index),p.values.map((_,i)=>i));assert.deepEqual(a.rows.map(r=>r.value),p.values);if(a.scale>0)near(a.rows.reduce((sum,r)=>sum+r.share,0),1);else assert.ok(a.rows.every(r=>r.share===null));}
});
test('validation rejects missing, sparse and nonfinite values without dropping real zero',()=>{
 for(const values of [[],null,[NaN],[Infinity],['1'],Array(3),Array(201).fill(1),[1e9+1]])assert.equal(varianceSummary(values),null);
 const good=analyzeVariance({...initialVariance(),text:'−۲، ۰، ۲'});assert.deepEqual(good.data.values,[-2,0,2]);assert.equal(good.summary.mean,0);
 for(const text of ['','۱، ،۳','1,','2\n\n3','abc','Infinity'])assert.equal(analyzeVariance({...initialVariance(),text}).summary,null);
});
test('tiny positive distances retain SD and shares when squares underflow',()=>{
 const a=varianceSummary([1e-170,2e-170,3e-170]);assert.equal(a.ss,0);assert.equal(a.ssUnderflow,true);assert.ok(a.sample.sd>0);assert.ok(Math.abs(a.sample.sd/1e-170-1)<1e-14);assert.equal(a.rows[0].squareUnderflow,true);near(a.rows[0].share,.5);assert.equal(a.sample.variance,0);
 const report=buildVarianceReport({...initialVariance(),text:'1e-170,2e-170,3e-170'});assert.match(report,/کوچک‌تر از دقت عددی/);assert.doesNotMatch(report,/NaN|Infinity/);
});
test('small representable squares are not lost by squaring the scale first',()=>{
 const a=varianceSummary([-1.4e-162,1.4e-162]);assert.ok(a.ss>0);assert.ok(a.sample.variance>0);assert.ok(a.sample.sd>0);assert.equal(a.rows[0].squareUnderflow,true);near(a.rows.reduce((n,r)=>n+r.share,0),1);
});
test('a positive absolute mean below Number precision is disclosed rather than called zero',()=>{
 const a=varianceSummary([0,Number.MIN_VALUE]);assert.equal(a.absoluteMean,0);assert.equal(a.absoluteUnderflow,true);assert.match(buildVarianceReport({...initialVariance(),text:'0,5e-324'}),/میانگین فاصلهٔ مطلق از میانگین=کوچک‌تر از دقت عددی/);
});
test('close, subnormal and extreme accepted values remain finite and bounded',()=>{
 for(const values of [[0,Number.MIN_VALUE],[-1e9,0,1e9],[1e9,1e9-1e-6,1e9-2e-6],[1,1+Number.EPSILON,1+2*Number.EPSILON]]){const a=varianceSummary(values);assert.ok(Number.isFinite(a.mean));assert.ok(Number.isFinite(a.sample.sd));assert.ok(Number.isFinite(a.population.sd));assert.ok(a.mean>=Math.min(...values)&&a.mean<=Math.max(...values));assert.equal(a.rows.length,values.length);near(a.rows.reduce((n,r)=>n+(r.share??0),0),1);}
});
test('negative scaling reverses signed distances and scales squared spread by a squared factor',()=>{
 const values=[2,4,6,20],a=varianceSummary(values),b=varianceSummary(values.map(x=>-3*x+10));near(b.mean,-3*a.mean+10);near(b.sample.sd,3*a.sample.sd);near(b.sample.variance,9*a.sample.variance);for(let i=0;i<values.length;i++)near(b.rows[i].deviation,-3*a.rows[i].deviation);
});
test('data edits clear selection, preserve fixed self checks and never alter original state',()=>{
 let state=initialVariance();state=varianceReducer(state,{type:'answer',id:'signed',value:0});state=varianceReducer(state,{type:'check',id:'signed'});state=varianceReducer(state,{type:'select',index:0});const original=structuredClone(state);const edited=varianceReducer(state,{type:'data',value:'1,,3'});assert.deepEqual(state,original);assert.equal(edited.selected,null);assert.equal(edited.preset,'custom');assert.equal(edited.checked.signed,true);assert.equal(analyzeVariance(edited).summary,null);
});
test('denominator and chart switches preserve raw data, selection and all computed distances',()=>{
 let a=varianceReducer(initialVariance(),{type:'select',index:1});const b=varianceReducer(a,{type:'denominator',value:'population'}),c=varianceReducer(b,{type:'plot',value:'square'});assert.equal(c.text,a.text);assert.equal(c.selected,1);assert.deepEqual(analyzeVariance(c).summary,analyzeVariance(a).summary);assert.equal(varianceReducer(c,{type:'unit',value:'دقیقه'}).text,a.text);assert.equal(varianceReducer(c,{type:'select',index:1}).selected,null);
});
test('preset/reset restart checks; malformed or prototype actions cannot affect state',()=>{
 const a=varianceReducer(initialVariance(),{type:'answer',id:'units',value:0}),b=varianceReducer(a,{type:'preset',id:'minutes'});assert.deepEqual(b.answers,{});assert.equal(b.unit,'دقیقه');assert.deepEqual(varianceReducer(a,{type:'reset'}).answers,{});
 for(const action of [{type:'preset',id:'constructor'},{type:'denominator',value:'other'},{type:'plot',value:'line'},{type:'answer',id:'units',value:8},{type:'select',index:200},{type:'unit',value:9},{type:'data',value:'1'.repeat(8001)}])assert.deepEqual(varianceReducer(a,action),a);
});
test('reports disclose both denominators, signed units and original full precision; invalid reports suppress results',()=>{
 const state={...initialVariance(),text:'8.123456789,2,4',unit:'ساعت'},report=buildVarianceReport(state);assert.match(report,/مخرج n−۱/);assert.match(report,/مخرج n:/);assert.match(report,/ساعت مربع/);assert.match(report,/\[8\.123456789, 2, 4\]/);assert.match(report,/ردیف‌های اصلی/);assert.match(report,/MAD خام نیست/);assert.match(report,/خودکار حذف/);
 const invalid=buildVarianceReport({...state,text:'1,,3'});assert.match(invalid,/نتیجه محاسبه نشده/);assert.doesNotMatch(invalid,/n=|میانگین=|ردیف‌های اصلی:/);
});
test('all fixed choices have specific feedback and the independent numerical answers agree',()=>{
 assert.equal(varianceChecks.length,3);for(const q of varianceChecks){assert.equal(q.options.length,q.feedback.length);assert.ok(q.feedback.every(Boolean));assert.ok(q.correct>=0&&q.correct<q.options.length);}
 const a=varianceSummary([6,7,8]);assert.equal(a.ss,2);assert.equal(a.sample.variance,1);near(a.population.variance,2/3);assert.equal(varianceSummary([360,420,480]).sample.variance,3600);
});
