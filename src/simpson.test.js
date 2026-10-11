import test from 'node:test';
import assert from 'node:assert/strict';
import {initialSimpson,simpsonPresets,simpsonChecks,analyzeSimpson,commonComposition,simpsonShare,simpsonGap,simpsonClassification,simpsonReducer,simpsonSelection,buildSimpsonReport} from './simpson.js';
const load=id=>simpsonReducer(initialSimpson(),{type:'preset',id});
const summarize=state=>analyzeSimpson(state).summary;
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-10,`${a} != ${b}`);

test('worked reversal conserves all counts and compares own denominators at both levels',()=>{
 const a=initialSimpson(),copy=structuredClone(a),s=summarize(a);assert.deepEqual(s.strata.map(r=>r.groups.map(g=>g.rate)),[[90,80],[30,20]]);assert.deepEqual(s.strata.map(r=>r.direction),[1,1]);assert.deepEqual(s.pooled.map(g=>[g.positive,g.negative,g.n]),[[39,71,110],[82,28,110]]);near(s.pooled[0].rate,3900/110);near(s.pooled[1].rate,8200/110);assert.equal(s.direction,-1);assert.equal(s.classification,'reversal');assert.equal(s.total,220);assert.deepEqual(a,copy);
});
test('actual group composition reproduces pooled rates rather than an unweighted average',()=>{
 const s=summarize(initialSimpson());near(s.pooled[0].weights[0],1/11);near(s.pooled[1].weights[0],10/11);
 for(const g of s.pooled){near(g.weights.reduce((a,b)=>a+b,0),1);near(g.weights.reduce((sum,w,k)=>sum+w*s.strata[k].groups[g.group].rate,0),g.rate);assert.notEqual(g.rate,g.group?50:60);}
});
test('common 50/50 mix gives 60 vs 50 percent and preserves the actual pooled data',()=>{
 const s=summarize(initialSimpson()),copy=structuredClone(s),c=commonComposition(s,50);assert.deepEqual(c.weights,[.5,.5]);assert.deepEqual(c.contributions,[[45,15],[40,10]]);assert.deepEqual(c.rates,[60,50]);assert.equal(c.difference,10);assert.equal(c.direction,1);assert.deepEqual(s,copy);
});
test('common mixture endpoints equal subgroup rates and stay within each group rate bounds',()=>{
 const s=summarize(initialSimpson());assert.deepEqual(commonComposition(s,0).rates,[30,20]);assert.deepEqual(commonComposition(s,100).rates,[90,80]);
 for(const w of [0,1,27,50,73,99,100]){const c=commonComposition(s,w);for(let g=0;g<2;g++)assert.ok(c.rates[g]>=s.strata[1].groups[g].rate&&c.rates[g]<=s.strata[0].groups[g].rate);near(c.difference,10);assert.equal(c.direction,1);}
 for(const w of [-1,101,50.5,NaN,'50'])assert.equal(commonComposition(s,w),null);assert.equal(commonComposition(null,50),null);
});
test('same mixture produces the same direction; composition changes need not reverse a comparison',()=>{
 const s=summarize(load('balanced'));assert.deepEqual(s.pooled.map(g=>g.rate),[60,50]);assert.equal(s.classification,'sameDirection');assert.deepEqual(s.pooled.map(g=>g.weights),[[.5,.5],[.5,.5]]);
});
test('equal subgroup rates with different pooled rates are composition-only, not strict reversal',()=>{
 const s=summarize(load('equalRates'));assert.deepEqual(s.strata.map(r=>r.direction),[0,0]);assert.equal(s.classification,'composition');assert.equal(s.direction,-1);const c=commonComposition(s,37);near(c.rates[0],c.rates[1]);assert.equal(c.direction,0);
});
test('mixed subgroup directions and pooled ties are reported distinctly',()=>{
 const s=summarize(load('mixed'));assert.deepEqual(s.strata.map(r=>r.direction),[1,-1]);assert.equal(s.direction,0);assert.equal(s.classification,'mixed');
 const a={...initialSimpson(),counts:['90','10','80','20','30','70','10','40']};assert.equal(summarize(a).classification,'aggregateTie');assert.deepEqual(summarize(a).pooled.map(g=>g.rate),[60,60]);
 const b={...initialSimpson(),counts:['1','3','2','6','2','6','1','3']};assert.equal(summarize(b).classification,'allTie');assert.equal(summarize(b).pooled.every(g=>g.rate===25),true);
});
test('zero denominator is unknown; zero successes with positive denominator is a true zero',()=>{
 const s=summarize(load('empty'));assert.equal(s.strata[1].groups[0].rate,null);assert.equal(s.classification,'incomplete');assert.deepEqual(s.pooled[0].weights,[1,0]);assert.equal(s.pooled[0].rate,90);assert.equal(commonComposition(s,50).rates[0],null);assert.equal(commonComposition(s,0).rates[0],null);assert.deepEqual(commonComposition(s,100).rates,[90,80]);assert.equal(commonComposition(s,100).direction,1);assert.deepEqual(commonComposition(s,100).contributions[0],[90,0]);
 const zero=summarize(load('zero'));assert.deepEqual(zero.pooled.map(g=>g.rate),[null,null]);assert.equal(zero.total,0);assert.equal(zero.classification,'incomplete');assert.deepEqual(commonComposition(zero,50).rates,[null,null]);
 const a={...initialSimpson(),counts:['0','1','0','2','0','1','0','2']};assert.equal(summarize(a).classification,'allTie');assert.equal(summarize(a).pooled.every(g=>g.rate===0),true);
});
test('integer cross-products keep very small real differences from being classified as ties after rounding',()=>{
 const a={...initialSimpson(),counts:['1000000','999999','999999','999998','1000000','999999','999999','999998']};const s=summarize(a);assert.deepEqual(s.strata.map(r=>r.direction),[-1,-1]);assert.equal(s.classification,'sameDirection');assert.equal(s.direction,-1);assert.equal(simpsonShare(s.strata[0].groups[0].rate),simpsonShare(s.strata[0].groups[1].rate));assert.match(simpsonGap(s.strata[0].difference,-1),/روش ب، کمتر از/);assert.equal(commonComposition(s,47).direction,-1);
});
test('common rational direction recognizes an exact weighted tie without a display tolerance',()=>{
 const a={...initialSimpson(),counts:['1','2','1','5','1','5','1','2']},s=summarize(a);assert.equal(commonComposition(s,50).direction,0);near(commonComposition(s,50).rates[0],25);near(commonComposition(s,50).rates[1],25);assert.equal(commonComposition(s,49).direction,-1);assert.equal(commonComposition(s,51).direction,1);
});
test('scaling counts preserves comparisons and mixtures; swapping methods reverses every direction',()=>{
 const a=initialSimpson(),s=summarize(a),scaled=summarize({...a,counts:a.counts.map(v=>String(Number(v)*3))});assert.equal(scaled.classification,s.classification);assert.deepEqual(scaled.pooled.map(g=>g.rate),s.pooled.map(g=>g.rate));assert.deepEqual(scaled.pooled.map(g=>g.weights),s.pooled.map(g=>g.weights));
 const b=summarize({...a,counts:[2,3,0,1,6,7,4,5].map(i=>a.counts[i])});assert.equal(b.classification,'reversal');assert.equal(b.direction,-s.direction);assert.deepEqual(b.pooled.map(g=>g.rate),[s.pooled[1].rate,s.pooled[0].rate]);assert.equal(commonComposition(b,47).direction,-commonComposition(s,47).direction);
 const reversed=summarize({...a,labels:[...a.labels].reverse(),counts:[...a.counts.slice(4),...a.counts.slice(0,4)]});assert.equal(reversed.classification,s.classification);assert.deepEqual(commonComposition(reversed,53).rates,commonComposition(s,47).rates);
});
test('Persian and Arabic counts accepted; invalid, sparse or incomplete input produces no results',()=>{
 const a=initialSimpson();a.counts[0]='۹';a.counts[1]='١';assert.equal(summarize(a).classification,'reversal');
 for(const value of ['', ' ','-1','+1','1.5','1e3','1,000','1000001',null]){const b=initialSimpson();b.counts[0]=value;assert.equal(summarize(b),null,String(value));}
 assert.equal(summarize({...initialSimpson(),counts:Array(8)}),null);assert.equal(summarize({...initialSimpson(),counts:['1']}),null);assert.equal(summarize(null),null);
 const maximum=summarize({...initialSimpson(),counts:Array(8).fill('1000000')});assert.equal(maximum.total,8000000);assert.equal(maximum.classification,'allTie');assert.deepEqual(commonComposition(maximum,47).rates,[50,50]);
});
test('stratum names must be distinct after normalization and cannot be absent or too long',()=>{
 for(const labels of [['کتاب','كتاب'],['گروه یک','گروه‌یک'],['a','A'],['','دشوار'],['x'.repeat(61),'الف'],Array(2)])assert.equal(summarize({...initialSimpson(),labels}),null);
 assert.equal(summarize({...initialSimpson(),labels:['  آسان  ','دشوار']}).strata[0].label,'آسان');
});
test('data edits clear selected cells and preserve fixed checks, while weights preserve all raw counts',()=>{
 let a=simpsonReducer(initialSimpson(),{type:'answer',id:'reversal',value:1});a=simpsonReducer(a,{type:'check',id:'reversal'});const counts=[...a.counts];a=simpsonReducer(a,{type:'select',id:'p0'});a=simpsonReducer(a,{type:'weight',value:37});assert.deepEqual(a.counts,counts);assert.equal(a.selected,'p0');assert.equal(a.checked.reversal,true);a=simpsonReducer(a,{type:'count',index:0,value:''});assert.equal(summarize(a),null);assert.equal(a.selected,null);assert.equal(a.checked.reversal,true);assert.deepEqual(simpsonReducer(a,{type:'reset'}),initialSimpson());
});
test('prototype names, oversized edits, invalid indices and unchecked quiz actions cannot mutate state',()=>{
 const a=initialSimpson();for(const action of [{type:'preset',id:'__proto__'},{type:'preset',id:'constructor'},{type:'weight',value:50.5},{type:'weight',value:-1},{type:'count',index:8,value:'1'},{type:'count',index:0,value:'1'.repeat(41)},{type:'label',index:0,value:'x'.repeat(61)},{type:'select',id:'p2'},{type:'answer',id:'reversal',value:3},{type:'check',id:'reversal'}])assert.equal(simpsonReducer(a,action),a);
});
test('all six presets valid and nonshared, and every fixed answer has specific feedback',()=>{
 for(const id of Object.keys(simpsonPresets)){const a=load(id);assert.ok(summarize(a),id);a.counts[0]='';assert.ok(summarize(load(id)),id);assert.ok(simpsonClassification(summarize(load(id))).every(v=>v.length>20));}
 for(const q of simpsonChecks){assert.ok(q.options[q.correct]);assert.equal(q.options.length,q.feedback.length);assert.ok(q.feedback.every(f=>f.length>25));let a=simpsonReducer(initialSimpson(),{type:'answer',id:q.id,value:q.correct});a=simpsonReducer(a,{type:'check',id:q.id});assert.equal(a.checked[q.id],true);a=simpsonReducer(a,{type:'answer',id:q.id,value:(q.correct+1)%3});assert.equal(a.checked[q.id],false);}
});
test('reports include raw counts, conditional and pooled rates, composition and scenario limitations',()=>{
 const a=initialSimpson(),text=buildSimpsonReport(a);for(const fragment of ['درست ۹؛ نادرست ۱؛ کل ۱۰','درصد درست ۹۰٪','درست ۳۹؛ نادرست ۷۱؛ کل ۱۱۰','۳۵٫۴۵٪','۷۴٫۵۵٪','وزن ۵۰٪','درصد سناریو ۶۰٪','درصد سناریو ۵۰٪','سناریوی','علّی','گمشده','وزن صفر','قبل از گردکردن'])assert.ok(text.includes(fragment),fragment);assert.equal(/NaN|Infinity|undefined/.test(text),false);
 a.counts[0]='';assert.doesNotMatch(buildSimpsonReport(a),/درصد درست ۹۰٪|درست ۳۹/);assert.match(buildSimpsonReport(a),/ورودی نامعتبر/);assert.match(buildSimpsonReport(load('empty')),/تعریف‌نشده/);
});
test('chart and table selections describe the same original denominators; common scenarios invent no counts',()=>{
 const a=initialSimpson(),s=summarize(a);assert.match(simpsonSelection(s,a),/۹ پاسخ درست از ۱۰/);assert.match(simpsonSelection(s,{...a,selected:'p0'}),/۳۹ پاسخ درست از ۱۱۰/);assert.match(simpsonSelection(s,{...a,selected:'c0'}),/درصد ترکیبی ۶۰٪/);assert.match(simpsonSelection(s,{...a,selected:null}),/کلیک یا Enter/);assert.equal(simpsonReducer(a,{type:'select',id:'s0g0'}).selected,null);
});
