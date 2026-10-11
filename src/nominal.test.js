import test from 'node:test';
import assert from 'node:assert/strict';
import {initialNominal,nominalPresets,nominalChecks,analyzeNominal,nominalRows,nominalBasis,nominalShare,nominalReducer,buildNominalReport} from './nominal.js';
const load=id=>nominalReducer(initialNominal(),{type:'preset',id});
const summary=state=>analyzeNominal(state).summary;
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-10,`${a} != ${b}`);

test('mode is not necessarily a majority: five of ten is exactly half',()=>{
 const s=summary(initialNominal());assert.equal(s.valid,10);assert.equal(s.total,12);assert.equal(s.mentions,10);assert.deepEqual(s.modes,[0]);assert.equal(s.rows[0].validPercent,50);assert.equal(s.rows[0].majorityValid,false);assert.equal(s.rows[0].majorityTotal,false);assert.equal(s.rows[3].validPercent,0);assert.equal(s.rows[3].totalPercent,0);
});
test('majority depends on a declared denominator and uses exact counts',()=>{
 const s=summary(load('majority'));assert.equal(s.rows[0].validPercent,60);assert.equal(s.rows[0].totalPercent,50);assert.equal(s.rows[0].majorityValid,true);assert.equal(s.rows[0].majorityTotal,false);
 const a=initialNominal();a.rows=[{label:'الف',count:'500001'},{label:'ب',count:'499999'}];a.missing='0';assert.equal(summary(a).rows[0].majorityValid,true);assert.equal(nominalShare(summary(a).rows[0].validPercent),'۵۰٪');
});
test('ties preserve all maxima and never select a zero-frequency category',()=>{
 const s=summary(load('tied'));assert.deepEqual(s.modes,[0,1]);assert.equal(s.rows[0].majorityValid,false);assert.equal(s.rows[1].majorityValid,false);
 const a=load('tied');a.rows.forEach(r=>r.count='1');assert.deepEqual(summary(a).modes,[0,1,2,3]);
});
test('missing counts change the all-person denominator without allocating observations',()=>{
 const a=summary(initialNominal()),b=summary(load('missing'));assert.deepEqual(b.rows.map(r=>r.count),a.rows.map(r=>r.count));assert.equal(b.valid,10);assert.equal(b.total,20);assert.equal(b.rows[0].validPercent,50);assert.equal(b.rows[0].totalPercent,25);assert.equal(b.missingPercent,50);assert.equal(b.totalPercentSum,50);near(b.totalPercentSum+b.missingPercent,100);near(a.rows[0].totalPercent,100*5/12);
});
test('multiple responses separate people from selections: 140 percent of people vs 100 percent of selections',()=>{
 const s=summary(load('multiple'));assert.equal(s.valid,10);assert.equal(s.total,12);assert.equal(s.mentions,14);assert.equal(s.validPercentSum,140);near(s.totalPercentSum,1400/12);assert.deepEqual(s.rows.map(r=>r.validPercent),[60,50,30,0]);near(s.rows[0].mentionPercent,600/14);near(s.rows.reduce((sum,r)=>sum+r.mentionPercent,0),100);assert.equal(s.rows[0].majorityValid,true);assert.equal(s.rows[0].majorityTotal,false);assert.deepEqual(s.modes,[0]);
});
test('multiple response marginals cannot exceed respondents or leave declared valid respondents without a choice',()=>{
 for(const respondents of ['5','15','0','', '-1','2.5','1000001']){const a={...load('multiple'),respondents};assert.equal(summary(a),null,respondents);}
 const a=load('multiple');a.rows[0].count='11';assert.equal(summary(a),null);
 const b=load('multiple');b.rows.forEach(r=>r.count='0');b.respondents='0';assert.equal(summary(b).valid,0);
 // All people may choose every category; >100% in total is valid.
 const c=load('multiple');c.rows.forEach(r=>r.count='10');assert.equal(summary(c).validPercentSum,400);assert.equal(summary(c).rows.every(r=>r.validPercent===100),true);
});
test('no valid choices means undefined valid percentages, while zero counts can have zero percent of all people',()=>{
 const a=summary(load('empty'));assert.equal(a.valid,0);assert.equal(a.total,2);assert.deepEqual(a.modes,[]);assert.equal(a.validPercentSum,null);assert.equal(a.totalPercentSum,0);assert.equal(a.missingPercent,100);assert.equal(a.rows.every(r=>r.validPercent===null&&r.mentionPercent===null&&r.totalPercent===0),true);
 const b=load('empty');b.missing='0';assert.equal(summary(b).rows.every(r=>r.totalPercent===null),true);assert.equal(summary(b).missingPercent,null);
});
test('Persian and Arabic counts accepted; blank, signed, fractional, unsafe and sparse inputs rejected',()=>{
 const a=initialNominal();a.rows[0].count='۵';a.rows[1].count='٣';a.missing='۲';assert.equal(summary(a).total,12);
 for(const count of ['', ' ', '-1','+2','1.5','2e2','1,000','1000001','NaN',null]){const b=initialNominal();b.rows[0].count=count;assert.equal(summary(b),null,String(count));}
 for(const count of ['', '-1','1.5','1000001'])assert.equal(summary({...initialNominal(),missing:count}),null);
 assert.equal(summary({...initialNominal(),rows:Array(3)}),null);assert.equal(summary({...initialNominal(),rows:[{label:'الف',count:'2'}]}),null);assert.equal(summary({...initialNominal(),kind:'unknown'}),null);
});
test('duplicate category names are normalized across Arabic letters, whitespace, case and joiners',()=>{
 for(const labels of [['کتاب','كتاب'],['علی','علي'],['الف ب',' الف  ب '],['گروه یک','گروه‌یک'],['A','a'],['الف','']]){const a=initialNominal();a.rows=labels.map(label=>({label,count:'1'}));assert.equal(summary(a),null,labels.join('/'));}
 const a=initialNominal();a.rows[0].label='x'.repeat(61);assert.equal(summary(a),null);assert.equal(summary(initialNominal()).rows[0].label,'اتوبوس');
});
test('frequency sort changes display order while preserving original identities, codes and selection',()=>{
 let a=initialNominal();a=nominalReducer(a,{type:'row',index:2,field:'count',value:'7'});a=nominalReducer(a,{type:'select',index:0});const before=structuredClone(a);const s=summary(a),sorted=nominalRows(s,'frequency');assert.deepEqual(sorted.map(r=>r.index),[2,0,1,3]);assert.deepEqual(nominalRows(s,'input').map(r=>r.index),[0,1,2,3]);assert.deepEqual(a,before);a=nominalReducer(a,{type:'order',value:'frequency'});a=nominalReducer(a,{type:'codes',value:'tens'});a=nominalReducer(a,{type:'basis',value:'all'});assert.equal(a.selected,0);assert.deepEqual(summary(a),s);assert.deepEqual(nominalRows(summary(load('tied')),'frequency').map(r=>r.index),[0,1,2,3]);
});
test('new categories start at a real zero and category deletion does not silently preserve totals',()=>{
 let a=initialNominal();a=nominalReducer(a,{type:'add'});assert.equal(a.rows.length,5);assert.equal(a.rows[4].count,'0');assert.equal(summary(a).valid,10);a=nominalReducer(a,{type:'select',index:0});a=nominalReducer(a,{type:'remove',index:0});assert.equal(a.selected,null);assert.equal(summary(a).valid,5);
 while(a.rows.length<8)a=nominalReducer(a,{type:'add'});assert.equal(nominalReducer(a,{type:'add'}),a);while(a.rows.length>2)a=nominalReducer(a,{type:'remove',index:0});assert.equal(nominalReducer(a,{type:'remove',index:0}),a);
 const b=initialNominal();b.rows[0].label='دستهٔ ۵';assert.equal(nominalReducer(b,{type:'add'}).rows[4].label,'دستهٔ ۶');
});
test('switching question kind declares a new scenario, not reconstructed individual records',()=>{
 let a=initialNominal();a=nominalReducer(a,{type:'kind',value:'multiple'});assert.equal(a.respondents,'10');assert.equal(summary(a).valid,10);const b=nominalReducer(load('multiple'),{type:'kind',value:'single'});assert.equal(summary(b).valid,14);assert.match(buildNominalReport(b),/سناریوی تازه/);
});
test('input edits clear selection but preserve answers, even while results are invalid; reset restarts checks',()=>{
 let a=initialNominal();a=nominalReducer(a,{type:'answer',id:'mode',value:0});a=nominalReducer(a,{type:'check',id:'mode'});a=nominalReducer(a,{type:'select',index:1});a=nominalReducer(a,{type:'row',index:0,field:'count',value:''});assert.equal(a.selected,null);assert.equal(summary(a),null);assert.equal(a.checked.mode,true);a=nominalReducer(a,{type:'row',index:0,field:'count',value:'5'});assert.equal(a.checked.mode,true);a=nominalReducer(a,{type:'reset'});assert.deepEqual(a,initialNominal());
});
test('unsupported actions and prototype preset names cannot change state',()=>{
 const a=initialNominal();for(const action of [{type:'preset',id:'__proto__'},{type:'preset',id:'constructor'},{type:'row',index:-1,field:'count',value:'2'},{type:'row',index:0,field:'x',value:'2'},{type:'row',index:0,field:'label',value:'x'.repeat(61)},{type:'select',index:99},{type:'basis',value:'mentions'},{type:'answer',id:'mode',value:99},{type:'check',id:'mode'},{type:'respondents',value:2},{type:'kind',value:'other'}])assert.equal(nominalReducer(a,action),a);
});
test('all presets valid, nonshared, all checks have feedback for every option',()=>{
 for(const id of Object.keys(nominalPresets)){const a=load(id);assert.ok(summary(a),id);a.rows[0].count='';assert.ok(summary(load(id)),id);}
 for(const q of nominalChecks){assert.equal(q.options.length,q.feedback.length);assert.ok(q.options[q.correct]);assert.ok(q.feedback.every(f=>f.length>25));let a=nominalReducer(initialNominal(),{type:'answer',id:q.id,value:q.correct});a=nominalReducer(a,{type:'check',id:q.id});assert.equal(a.checked[q.id],true);a=nominalReducer(a,{type:'answer',id:q.id,value:(q.correct+1)%q.options.length});assert.equal(a.checked[q.id],false);}
});
test('reports preserve original category order, both person bases and selection base; invalid reports have no stale numbers',()=>{
 const a=load('multiple');a.order='frequency';a.basis='all';a.codes='tens';const text=buildNominalReport(a);for(const fragment of ['چندانتخابی','کل افراد (۱۲)','مجموع انتخاب‌ها: ۱۴','از معتبر ۶۰٪','از کل افراد ۵۰٪','از کل انتخاب‌ها ۴۲٫۸۶٪','کد برچسب ۱۰','۱۴۰٪','۱۰۰٪','رکورد افراد','صدک'])assert.ok(text.includes(fragment),fragment);assert.ok(text.indexOf('کتاب؛')<text.indexOf('ویدئو؛'));assert.equal(/NaN|undefined|Infinity/.test(text),false);
 a.rows[0].count='';const invalid=buildNominalReport(a);assert.match(invalid,/ورودی نامعتبر/);assert.doesNotMatch(invalid,/کل افراد:|از معتبر|کتاب؛/);assert.match(buildNominalReport(load('empty')),/تعریف‌نشده/);
});
test('selected percentage base returns exact denominator and does not mutate data',()=>{
 const s=summary(load('multiple'));assert.deepEqual(nominalBasis(s,'valid'),{label:'پاسخ‌دهندگان معتبر',denominator:10,sum:140,field:'validPercent'});near(nominalBasis(s,'all').sum,1400/12);assert.equal(nominalBasis(s,'all').denominator,12);
});
