import test from 'node:test';
import assert from 'node:assert/strict';
import {reportCases,createReportState,reportAttempt,reportReducer,reportSummary} from './reportCritique.js';
import {describe,pairStats} from './stats.js';
import {robustSummary} from './robustness.js';
import {summarizeGroups} from './groupComparison.js';
import {summarizeWeightedMean} from './weightedMean.js';

const act=(state,type,step,choice)=>reportReducer(state,{type,step,choice});
function solve(state,index){const item=reportCases.find(c=>c.id===state.selected);return act(act(state,'answer',index,item.steps[index].correct),'check',index);}
const correctText=id=>{const c=reportCases.find(c=>c.id===id);return c.steps[1].options[c.steps[1].correct].text;};

test('ten distinct cases have two valid decisions and distinct option-specific explanations',()=>{
 assert.equal(reportCases.length,10);assert.equal(new Set(reportCases.map(c=>c.id)).size,10);
 const modes=['groups','weighted','distributions','z','box','scatter','robust'];
 for(const c of reportCases){assert.ok(c.lesson>=1&&c.lesson<=10);assert.ok(c.context&&c.data&&c.claim&&c.explanation);assert.equal(c.steps.length,2);if(c.mode)assert.ok(modes.includes(c.mode));for(const s of c.steps){assert.equal(s.options.length,3);assert.ok(Number.isInteger(s.correct)&&s.correct>=0&&s.correct<3);assert.equal(new Set(s.options.map(o=>o.feedback)).size,3);for(const o of s.options)assert.ok(o.text&&o.feedback);}}
});
test('lesson entry selects the first related case; missing lesson falls back safely',()=>{
 assert.equal(createReportState(5).selected,'spread');assert.equal(createReportState(9).selected,'pearson');assert.equal(createReportState(10).selected,'codes');
 const s=createReportState();assert.strictEqual(reportReducer(s,{type:'select',id:'unknown'}),s);
});
test('second step stays locked until the first is checked correctly, even after revealing',()=>{
 let s=createReportState();assert.strictEqual(act(s,'answer',1,0),s);assert.strictEqual(act(s,'check',0),s);
 s=act(s,'reveal');assert.strictEqual(act(s,'check',1),s);assert.strictEqual(act(s,'answer',1,0),s);
 s=act(act(s,'answer',0,0),'check',0);assert.equal(reportAttempt(s).results[0].correct,false);assert.strictEqual(act(s,'answer',1,0),s);
 s=solve(s,0);s=solve(s,1);assert.equal(reportSummary(s).withSolution,1);
});
test('all wrong options remain retryable and all cases can be completed without a solution',()=>{
 let s=createReportState();
 for(const c of reportCases){s=reportReducer(s,{type:'select',id:c.id});for(let i=0;i<2;i++){for(let wrong=0;wrong<3;wrong++){if(wrong===c.steps[i].correct)continue;s=act(act(s,'answer',i,wrong),'check',i);assert.equal(reportAttempt(s).results[i].correct,false);assert.equal(reportAttempt(s).results[i].choice,wrong);}s=solve(s,i);assert.equal(reportAttempt(s).results[i].assisted,false);}}
 assert.deepEqual(reportSummary(s),{completed:10,beforeSolution:10,withSolution:0,total:10});
});
test('upstream edits invalidate later checks while preserving drafts and solution history',()=>{
 let s=solve(solve(createReportState(),0),1);s=act(s,'reveal');const a=reportAttempt(s),old=structuredClone(s);
 s=act(s,'answer',0,0);assert.deepEqual(s.attempts.codes.answers,[0,a.answers[1]]);assert.deepEqual(s.attempts.codes.results,[null,null]);assert.equal(s.attempts.codes.seen,true);assert.equal(reportSummary(s).completed,0);
 assert.deepEqual(old.attempts.codes,a);s=solve(s,0);s=act(s,'check',1);assert.equal(reportSummary(s).withSolution,1);assert.equal(reportSummary(s).beforeSolution,0);
});
test('viewing a solution never retroactively changes checks made before viewing',()=>{
 let s=solve(createReportState(),0);s=act(s,'reveal');s=solve(s,1);assert.equal(reportAttempt(s).results[0].assisted,false);assert.equal(reportAttempt(s).results[1].assisted,true);assert.equal(reportSummary(s).withSolution,1);
 s=solve(solve(createReportState(),0),1);s=act(s,'reveal');assert.equal(reportSummary(s).beforeSolution,1);assert.strictEqual(act(s,'check',1),s);
});
test('switching cases preserves attempts; a fresh attempt resets only the selected case',()=>{
 let s=solve(solve(createReportState(),0),1);s=reportReducer(s,{type:'select',id:'missing'});s=act(s,'reveal');s=solve(s,0);s=reportReducer(s,{type:'select',id:'codes'});assert.equal(reportSummary(s).beforeSolution,1);
 s=act(s,'reset');assert.deepEqual(reportAttempt(s).answers,[null,null]);assert.equal(reportAttempt(s).seen,false);assert.equal(s.attempts.missing.seen,true);assert.equal(s.attempts.missing.results[0].correct,true);
});
test('malformed actions and repeated selections do not alter checked results',()=>{
 const s=solve(createReportState(),0);for(const action of [{type:'unknown'},{type:'answer',step:-1,choice:0},{type:'answer',step:0,choice:3},{type:'answer',step:0,choice:'1'},{type:'check',step:1.1},{type:'answer',step:0,choice:1}])assert.strictEqual(reportReducer(s,action),s);
});
test('reported percentages, missing-data and pooled means match independently specified numbers',()=>{
 const g=summarizeGroups(['8','2','12','18']);assert.deepEqual(g.rates,[80,40]);assert.equal(g.difference,40);assert.equal((g.rates[0]-g.rates[1])/g.rates[1]*100,100);assert.ok(correctText('denominator').includes('۴۰ واحد درصد'));
 const w=summarizeWeightedMean([{value:'10',weight:'10'},{value:'18',weight:'30'}],'pooled');assert.equal(w.mean,16);assert.equal(w.equalMean,14);assert.ok(correctText('pooled').includes('۱۶'));
 assert.equal(describe([2,4,6]).mean,4);assert.equal(describe([2,4,0,6]).mean,3);assert.ok(correctText('missing').includes('سه نمرهٔ معتبر ۴'));
 assert.ok(correctText('codes').includes('۵۰٪'));
});
test('spread, sample units, quartile fences, Pearson and raw MAD numbers are consistent',()=>{
 const a=describe([6,7,7,8]),b=describe([2,5,9,12]);assert.equal(a.mean,7);assert.equal(b.mean,7);assert.equal(a.median,7);assert.equal(b.median,7);assert.equal(a.range,2);assert.equal(b.range,10);assert.equal(a.sd.toFixed(2),'0.82');assert.equal(b.sd.toFixed(2),'4.40');
 const d=describe([4,6,8]);assert.equal(d.ss,8);assert.equal(d.variance,4);assert.equal(d.sd,2);assert.ok(correctText('units').includes('۴ دقیقهٔ مربع'));
 const out=describe([10,12,14,16,18,20,22,50]);assert.equal(out.q1,13.5);assert.equal(out.q3,20.5);assert.equal(out.iqr,7);assert.equal(out.lower,3);assert.equal(out.upper,31);assert.deepEqual(out.outliers,[50]);assert.equal(out.n,8);
 assert.equal(pairStats([1,2,3,4,5],[2,1,4,3,5]).r,.8);assert.ok(correctText('pearson').includes('r=۰٫۸'));assert.equal((40-50)/10,-1);
 const mad=robustSummary([5,5,5,5,20],0);assert.equal(mad.mad,0);assert.equal(mad.range,15);assert.equal(mad.sd.toFixed(2),'6.71');assert.ok(correctText('mad').includes('دامنه ۱۵'));
});
