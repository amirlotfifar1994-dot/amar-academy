import test from 'node:test';
import assert from 'node:assert/strict';
import {ordinalPresets,ordinalChecks,initialOrdinal,analyzeOrdinal,ordinalPercentile,ordinalShare,ordinalReducer,buildOrdinalReport} from './ordinal.js';
const preset=id=>ordinalReducer(initialOrdinal(),{type:'preset',id});
const change=(s,index,count)=>ordinalReducer(s,{type:'row',index,field:'count',value:count});

test('ordered five-category example has exact counts, valid denominator, cumulative shares and middle positions',()=>{
 const s=analyzeOrdinal(initialOrdinal()).summary;assert.equal(s.n,20);assert.equal(s.total,20);assert.deepEqual(s.rows.map(r=>r.cumulative),[2,6,12,17,20]);assert.deepEqual(s.rows.map(r=>r.percent),[10,20,30,25,15]);assert.deepEqual(s.modes,[2]);assert.deepEqual(s.positions,[10,11]);assert.deepEqual(s.middle,[2,2]);
 assert.deepEqual([25,50,75,100].map(p=>ordinalPercentile(s,p).index),[1,2,3,4]);assert.deepEqual([25,50,75,100].map(p=>ordinalPercentile(s,p).position),[5,10,15,20]);
});
test('even middle positions in different classes do not invent the empty middle category',()=>{
 const s=analyzeOrdinal(preset('split')).summary;assert.deepEqual(s.positions,[4,5]);assert.deepEqual(s.middle,[0,2]);assert.deepEqual(s.modes,[0,2]);assert.equal(ordinalPercentile(s,50).index,0);assert.equal(ordinalPercentile(s,51).index,2);
 const report=buildOrdinalReport(preset('split'));assert.ok(report.includes('دو جایگاه میانی در دو طبقه‌اند'));assert.ok(report.includes('متوسط: تعداد ۰'));
});
test('odd, single-response and tied modes retain category labels instead of arithmetic codes',()=>{
 const s=initialOrdinal();s.rows.forEach((row,i)=>row.count=i===2?'1':'0');const one=analyzeOrdinal(s).summary;assert.deepEqual(one.positions,[1]);assert.deepEqual(one.middle,[2]);assert.deepEqual(one.modes,[2]);assert.equal(ordinalPercentile(one,1).index,2);assert.equal(ordinalPercentile(one,100).index,2);
 const tied=analyzeOrdinal(preset('tied')).summary;assert.deepEqual(tied.modes,[0,1,2]);assert.equal(tied.n,6);
});
test('missing records are separate from valid shares and empty data has no numerical summaries',()=>{
 const s=analyzeOrdinal(preset('missing')).summary;assert.equal(s.total,8);assert.equal(s.n,6);assert.equal(s.missing,2);assert.equal(s.rows[1].percent,50);assert.equal(s.rows[2].cumulativePercent,100);
 const e=analyzeOrdinal(preset('empty')).summary;assert.equal(e.n,0);assert.equal(e.total,2);assert.deepEqual(e.positions,[]);assert.deepEqual(e.modes,[]);assert.equal(ordinalPercentile(e,50),null);assert.ok(e.rows.every(r=>r.percent===null&&r.cumulativePercent===null));assert.ok(buildOrdinalReport(preset('empty')).includes('بدون پاسخ معتبر'));
});
test('Persian and Arabic counts are valid; incomplete, fractional, signed and excessive counts block stale results',()=>{
 let s=initialOrdinal();s=change(s,0,'۲');s=change(s,1,'٤');assert.equal(analyzeOrdinal(s).summary.n,20);
 for(const value of ['',' ','-1','+2','2.5','1e2','NaN','1000001']){const invalid=analyzeOrdinal(change(s,0,value));assert.equal(invalid.summary,null);assert.equal(invalid.rows[0].countError,true);assert.ok(buildOrdinalReport(change(s,0,value)).includes('نتیجهٔ عددی گزارش نمی‌شود'));}
 s=change(s,0,'0');assert.equal(analyzeOrdinal(s).summary.rows[0].count,0);assert.equal(analyzeOrdinal({...s,missing:''}).summary,null);
});
test('labels must be present and distinct after whitespace and Arabic-letter normalization',()=>{
 const s=preset('tied');for(const label of ['', '   ', 'متوسط', ' متوسط ', 'x'.repeat(61)])assert.equal(analyzeOrdinal({...s,rows:[{label,count:'2'},...s.rows.slice(1)]}).summary,null);
 const arabic={...s,rows:[{label:'كم',count:'1'},{label:'کم',count:'1'}]};assert.equal(analyzeOrdinal(arabic).summary,null);
 assert.equal(analyzeOrdinal({...s,rows:[]}).summary,null);assert.equal(analyzeOrdinal({...s,rows:Array(9).fill(s.rows[0])}).summary,null);
});
test('relabeling codes changes no descriptive result and no numeric mean, SD or code difference is computed',()=>{
 const s=initialOrdinal(),before=analyzeOrdinal(s).summary,after=ordinalReducer(s,{type:'codes',value:'tens'});assert.deepEqual(analyzeOrdinal(after).summary,before);assert.equal(buildOrdinalReport(s),buildOrdinalReport(after));assert.equal(s.codes,'simple');for(const key of ['mean','sd','variance','iqr'])assert.ok(!(key in before));
});
test('discrete percentile categories match independently expanded small samples including exact boundaries',()=>{
 for(let a=0;a<=3;a++)for(let b=0;b<=3;b++)for(let c=0;c<=3;c++){
  if(a+b+c===0)continue;const state={...preset('tied'),rows:[{label:'کم',count:String(a)},{label:'متوسط',count:String(b)},{label:'زیاد',count:String(c)}]},s=analyzeOrdinal(state).summary;
  const expanded=[...Array(a).fill(0),...Array(b).fill(1),...Array(c).fill(2)];
  for(let p=1;p<=100;p++){const cut=ordinalPercentile(s,p);assert.equal(cut.index,expanded[Math.ceil(expanded.length*p/100)-1]);assert.ok(cut.row.previous*100<s.n*p);assert.ok(cut.row.cumulative*100>=s.n*p);}
 }
 for(const p of [0,101,50.5,NaN,'50'])assert.equal(ordinalPercentile(analyzeOrdinal(initialOrdinal()).summary,p),null);
});
test('large counts stay aggregated and tiny positive shares are not labeled zero',()=>{
 const state={...initialOrdinal(),rows:Array.from({length:8},(_,i)=>({label:'طبقه '+i,count:'1000000'})),missing:'1000000'},s=analyzeOrdinal(state).summary;assert.equal(s.n,8000000);assert.equal(s.total,9000000);assert.equal(s.rows.length,8);assert.equal(ordinalPercentile(s,75).index,5);
 assert.equal(ordinalShare(null),'تعریف‌نشده');assert.equal(ordinalShare(0),'۰٪');assert.equal(ordinalShare(.0001),'کمتر از ۰٫۰۱٪');assert.equal(ordinalShare(99.9999),'بیشتر از ۹۹٫۹۹٪');
});
test('fixed self-checks have specific feedback, edits invalidate checks, and resets restore only this workspace',()=>{
 let state=initialOrdinal();for(const q of ordinalChecks){assert.equal(new Set(q.feedback).size,3);assert.equal(q.options.length,3);for(let i=0;i<3;i++){state=ordinalReducer(state,{type:'answer',id:q.id,value:i});assert.equal(state.checked[q.id],false);state=ordinalReducer(state,{type:'check',id:q.id});assert.equal(state.checked[q.id],true);assert.ok(q.feedback[i]);}}
 state=ordinalReducer(state,{type:'select',index:2});const changed=change(state,1,'12');assert.equal(changed.selected,null);assert.deepEqual(changed.checked,state.checked);assert.deepEqual(ordinalReducer(changed,{type:'reset'}),initialOrdinal());
 for(const id of Object.keys(ordinalPresets)){const next=ordinalReducer(changed,{type:'preset',id});assert.deepEqual(next.checked,{});assert.ok(analyzeOrdinal(next).summary);}
});
test('invalid actions preserve state and reports include denominator, missingness and the discrete contract',()=>{
 const s=initialOrdinal();for(const action of [{type:'preset',id:'other'},{type:'row',index:-1,field:'count',value:'2'},{type:'row',index:0,field:'unexpected',value:'2'},{type:'row',index:0,field:'count',value:2},{type:'percent',value:0},{type:'percent',value:101},{type:'codes',value:'bad'},{type:'select',index:99},{type:'check',id:'middle'},{type:'answer',id:'codes',value:3}])assert.strictEqual(ordinalReducer(s,action),s);
 const report=buildOrdinalReport(preset('missing'));assert.ok(report.includes('پاسخ معتبر: ۶؛ گمشده: ۲'));assert.ok(report.includes('مخرج درصدهای جدول فقط پاسخ‌های معتبر'));assert.ok(report.includes('بدون درون‌یابی عددی'));assert.ok(!report.includes('NaN'));
});
