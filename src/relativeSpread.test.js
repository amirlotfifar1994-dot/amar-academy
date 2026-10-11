import test from 'node:test';
import assert from 'node:assert/strict';
import {relativePresets,relativeChecks,relativeSummary,initialRelative,analyzeRelative,relativeReducer,relativeComparison,buildRelativeReport,relativePercent,relativeCVLabel} from './relativeSpread.js';
const near=(a,b,t=1e-12)=>assert.ok(Math.abs(a-b)<=t*Math.max(Math.abs(a),Math.abs(b),1e-300),`${a} != ${b}`);
test('equal absolute spread can have different relative spread',()=>{
 const {groups:[a,b]}=analyzeRelative(initialRelative());
 assert.equal(a.n,3);near(a.mean,10);near(b.mean,20);near(a.sd,2);near(b.sd,2);near(a.cv,.2);near(b.cv,.1);assert.match(relativeComparison([a,b]),/گروه الف/);
});
test('different sample SDs can yield the same CV',()=>{
 const {groups:[a,b]}=analyzeRelative(initialRelative('sameCV'));near(a.sd,2);near(b.sd,4);near(a.cv,b.cv);assert.match(relativeComparison([a,b]),/برابر/);
});
test('sample denominator n−1 and percent representation have independent reference values',()=>{
 const g=relativeSummary([0,0,6]);near(g.mean,2);near(g.sd,Math.sqrt(12));near(g.cv,Math.sqrt(3));assert.ok(g.cv>1);assert.match(relativePercent(g.cv),/۱۷۳/);
 const two=relativeSummary([1,3]);near(two.sd,Math.SQRT2);near(two.cv,Math.SQRT1_2);
});
test('constant positive, all-zero and one observation are distinct',()=>{
 assert.equal(relativeSummary([.1,.1,.1]).cv,0);const zero=relativeSummary([0,0]);assert.equal(zero.sd,0);assert.equal(zero.cv,null);assert.equal(zero.quotient,null);assert.match(zero.reason,/میانگین صفر/);assert.equal(relativeCVLabel(zero),'تعریف‌نشده');assert.equal(relativeCVLabel(relativeSummary([8,10,12],'interval')),'قابل تفسیر نیست');
 const one=relativeSummary([7]);assert.equal(one.sd,null);assert.equal(one.cv,null);assert.match(one.reason,/دو مشاهده/);
});
test('scale meaning cannot be inferred from positive numbers',()=>{
 const interval=relativeSummary([8,10,12],'interval');near(interval.quotient,.2);assert.equal(interval.cv,null);assert.match(interval.reason,/قراردادی/);
 const codes=relativeSummary([1,2,3],'codes');assert.equal(codes.cv,null);assert.equal(codes.codes,true);assert.match(codes.reason,/کد/);
 assert.equal(relativeSummary([8,10,12],'ratio').reason,null);
});
test('signed and negative measurements do not receive CV interpretation',()=>{
 for(const v of [[-1,2],[-1,-2],[-1,1]]){const g=relativeSummary(v);assert.equal(g.cv,null);assert.ok(g.reason);}
 const {groups}=analyzeRelative(initialRelative('signed'));assert.ok(Math.abs(groups[0].quotient)>2000);assert.equal(groups[0].cv,null);assert.match(relativeComparison(groups),/رتبه‌بندی/);
});
test('multiplicative unit changes preserve CV across very different magnitudes',()=>{
 const original=relativeSummary([8,10,12]);for(const factor of [60,.001,1e-170,1e-300]){const g=relativeSummary([8,10,12].map(v=>v*factor));near(g.cv,original.cv);near(g.mean,original.mean*factor);near(g.sd,original.sd*factor);}
});
test('relative arithmetic survives subnormal SD and mean underflow',()=>{
 const g=relativeSummary([0,Number.MIN_VALUE]);assert.equal(g.meanUnderflow,true);assert.equal(g.sdUnderflow,false);near(g.cv,Math.SQRT2);assert.ok(Number.isFinite(g.cv));
 const report=buildRelativeReport({...initialRelative(),a:'0, 5e-324'});assert.match(report,/کوچک‌تر از دقت عددی/);assert.doesNotMatch(report,/NaN|Infinity/);
});
test('adding a constant changes quotient but preserves SD and original data',()=>{
 const state={...initialRelative(),offset:'10'},before=analyzeRelative(initialRelative()).groups[0],{groups,scenario}=analyzeRelative(state);
 near(scenario.summary.mean,20);near(scenario.summary.sd,2);near(scenario.summary.quotient,.1);assert.equal(scenario.summary.cv,null);assert.deepEqual(groups[0].values,[8,10,12]);near(before.cv,groups[0].cv);
 const reverse=analyzeRelative({...state,offset:'-10'}).scenario.summary;near(reverse.mean,0);assert.equal(reverse.quotient,null);
});
test('transformation keeps interval scales and category codes restricted',()=>{
 const converted=analyzeRelative({...initialRelative(),factor:60}).scenario.summary;near(converted.mean,600);near(converted.sd,120);near(converted.cv,.2);
 for(const offset of ['0','10']){assert.equal(analyzeRelative({...initialRelative(),scale:'codes',offset}).scenario.summary.codes,true);}
 assert.equal(analyzeRelative({...initialRelative('interval'),factor:60}).scenario.summary.cv,null);
});
test('invalid input cannot produce stale groups or a transformed scenario',()=>{
 for(const changes of [{a:''},{a:'1, nope, 2'},{b:'1, 1000000001'},{a:'NaN'},{a:'Infinity'},{scale:'toString'}]){const a=analyzeRelative({...initialRelative(),...changes});assert.equal(a.groups,null);assert.equal(a.scenario,null);assert.ok(a.error);}
 const valid=analyzeRelative({...initialRelative(),a:'۸ ۱۰ ۱۲',b:'۱۸،۲۰،۲۲'});near(valid.groups[0].cv,.2);
});
test('transform validation preserves valid base results and rejects underflow',()=>{
 for(const changes of [{offset:''},{offset:'1,2'},{factor:0},{factor:-1},{a:'1000000000, 999999999',factor:60},{a:'0, 5e-324',factor:.001},{a:'8e-170,1e-169,1.2e-169',offset:'10'}]){const a=analyzeRelative({...initialRelative(),...changes});assert.ok(a.groups);assert.equal(a.scenario,null);assert.ok(a.scenarioError);}
});
test('dense finite bounded numerical data is required',()=>{
 for(const v of [[],Array(2),[1,NaN],[1,Infinity],[1,1e9+1],Array(201).fill(1),['1',2]])assert.equal(relativeSummary(v),null);
 const max=relativeSummary([0,1e9]);assert.equal(max.n,2);near(max.cv,Math.SQRT2);
});
test('ordering and unequal sample sizes do not require pairing',()=>{
 const a=relativeSummary([1,3,9,11]),b=relativeSummary([11,1,9,3]);near(a.cv,b.cv);near(a.sd,b.sd);
 const groups=analyzeRelative({...initialRelative(),a:'1,3',b:'2,4,6,8,10'}).groups;assert.deepEqual(groups.map(g=>g.n),[2,5]);
});
test('tiny CV differences are not automatically called equal by an absolute threshold',()=>{
 assert.match(relativeComparison([{cv:1e-20},{cv:2e-20}]),/گروه ب/);assert.match(relativeComparison([{cv:0},{cv:0}]),/برابر/);
});
test('reducer preserves checks on edits and resets selection or examples',()=>{
 let s=initialRelative();s=relativeReducer(s,{type:'answer',id:'comparison',value:0});s=relativeReducer(s,{type:'check',id:'comparison'});s=relativeReducer(s,{type:'select',group:1});assert.equal(s.selected,1);
 s=relativeReducer(s,{type:'data',group:'a',value:''});assert.equal(s.selected,null);assert.equal(s.checked.comparison,true);assert.equal(s.preset,'custom');assert.equal(relativeReducer(s,{type:'select',group:0}),s);
 const unit=relativeReducer(initialRelative(),{type:'unit',value:'ثانیه'});assert.equal(unit.a,'8, 10, 12');near(analyzeRelative(unit).groups[0].mean,10);
 const reset=relativeReducer(s,{type:'reset'});assert.deepEqual(reset,initialRelative());assert.deepEqual(relativeReducer(s,{type:'preset',id:'sameCV'}),initialRelative('sameCV'));
});
test('invalid actions and prototype identifiers are ignored',()=>{
 const s=initialRelative();for(const action of [{type:'preset',id:'toString'},{type:'scale',value:'constructor'},{type:'factor',value:2},{type:'select',group:2},{type:'data',group:'x',value:'1'},{type:'answer',id:'comparison',value:9},{type:'check',id:'comparison'}])assert.equal(relativeReducer(s,action),s);
 assert.deepEqual(initialRelative('toString'),initialRelative());
});
test('report distinguishes numeric quotient, interpretation and transform errors',()=>{
 const report=buildRelativeReport({...initialRelative(),factor:60});assert.match(report,/۶۰۰/);assert.match(report,/داده‌های اصلی \[۸، ۱۰، ۱۲\]/);assert.match(report,/n−۱/);assert.match(report,/بی‌واحد|CV=s/);assert.match(report,/NIST|nist.gov/);assert.doesNotMatch(report,/NaN|Infinity|undefined/);
 const interval=buildRelativeReport(initialRelative('interval'));assert.match(interval,/نسبت حسابی/);assert.match(interval,/قابل تفسیر نیست/);
 const codes=buildRelativeReport({...initialRelative(),scale:'codes',offset:'10'});assert.doesNotMatch(codes,/میانگین=|SD=|میانگین سناریو=/);
 assert.match(buildRelativeReport({...initialRelative(),offset:''}),/سناریو محاسبه نشد/);const invalid=buildRelativeReport({...initialRelative(),a:''});assert.doesNotMatch(invalid,/گروه الف:|میانگین=/);
});
test('all presets are independent and all fixed choices have feedback',()=>{
 for(const [id,p] of Object.entries(relativePresets)){const s=initialRelative(id),a=analyzeRelative(s);assert.ok(a.groups);assert.deepEqual(a.groups[0].values,p.a);assert.ok(a.scenario);s.answers.test=1;assert.deepEqual(initialRelative(id).answers,{});}
 for(const q of relativeChecks){assert.equal(q.options.length,3);assert.equal(q.feedback.length,3);assert.ok(q.options[q.correct]);for(let value=0;value<3;value++){const s=relativeReducer(relativeReducer(initialRelative(),{type:'answer',id:q.id,value}),{type:'check',id:q.id});assert.equal(s.checked[q.id],true);assert.ok(q.feedback[value]);}}
});

test('close large measurements retain their actual small sample spread',()=>{
 const step=2**-23,g=relativeSummary([1e9,1e9-step]);near(g.sd,step/Math.SQRT2);near(g.cv,(step/Math.SQRT2)/g.mean);
 const tiny=relativeSummary([1e9,1e9-step,1e9-2*step]);near(tiny.sd,step);assert.ok(tiny.cv>0);
});
