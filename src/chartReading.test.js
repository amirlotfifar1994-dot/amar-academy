import test from 'node:test';
import assert from 'node:assert/strict';
import {scales,goals,shapes,recommendAnalysis} from './analysisGuide.js';
import {chartReadingFor,chartChoiceChecks,chartChoiceReducer} from './chartReading.js';
import {rankPresets,summarizeRankPairs} from './rankCorrelation.js';

test('every recommendation has complete chart semantics and a supported learning destination',()=>{
 for(const scale of scales)for(const goal of goals)for(const shape of shapes)for(const second of scales){
  const r=recommendAnalysis({scale:scale.id,goal:goal.id,shape:shape.id,secondScale:second.id}),c=chartReadingFor(r);
  for(const key of ['title','horizontal','vertical','mark','limit'])assert.ok(c[key].length>15,`${r.id}/${key}`);
  assert.ok(['ranks','simpson','distributions','scatter','box','cumulative','ordinal','nominal','bins'].includes(c.next));
 }
});
test('ordered relationships describe paired ranks rather than univariate category counts',()=>{
 const r=recommendAnalysis({scale:'ordinal',secondScale:'ordinal',goal:'relationship'}),c=chartReadingFor(r);
 assert.equal(r.visual,'rank-scatter');assert.equal(c.kind,'rank-scatter');assert.match(c.horizontal,/رتبه/);assert.match(c.vertical,/همان مشاهده/);assert.match(c.mark,/جفت‌ها/);
 const p=rankPresets.ties,s=summarizeRankPairs(p.x,p.y,'ordinal');assert.deepEqual(s.rx.ranks,[1,2.5,2.5,4]);assert.deepEqual(s.ry.ranks,[1,3,2,4]);assert.ok(Math.abs(s.spearman-Math.sqrt(.9))<1e-12);assert.equal(s.pearson,null);
});
test('categorical axes distinguish ordered categories from quantitative intervals',()=>{
 const nominal=chartReadingFor(recommendAnalysis({scale:'nominal',goal:'distribution'})),ordinal=chartReadingFor(recommendAnalysis({scale:'ordinal',goal:'distribution'}));
 assert.match(nominal.limit,/نام دسته‌ها/);assert.match(nominal.vertical,/۱۰ پاسخ معتبر/);assert.match(ordinal.horizontal,/ترتیب واقعی/);assert.match(ordinal.limit,/ترتیب تعداد نچین/);
});
test('conditional percentages specify the denominator and group boxes use a shared measurement axis',()=>{
 const percent=chartReadingFor(recommendAnalysis({scale:'nominal',goal:'relationship',secondScale:'nominal'}));assert.match(percent.mark,/کل معتبر همان گروه/);assert.match(percent.vertical,/۱۰۰٪/);
 const mixed=chartReadingFor(recommendAnalysis({scale:'nominal',goal:'relationship',secondScale:'quantitative'}));assert.equal(mixed.kind,'group-box');assert.match(mixed.vertical,/اندازه‌گیری نیست/);assert.match(mixed.limit,/تعداد افراد/);
});
test('standardized position has no probability axis and histogram widths remain explicit',()=>{
 const z=chartReadingFor(recommendAnalysis({goal:'position'}));assert.equal(z.next,'cumulative');assert.match(z.vertical,/احتمال یا تعداد ندارد/);
 const hist=chartReadingFor(recommendAnalysis({goal:'distribution'}));assert.equal(hist.next,'bins');assert.match(hist.horizontal,/هم‌عرض/);assert.match(hist.limit,/مساحت/);
 const box=chartReadingFor(recommendAnalysis({goal:'spread',shape:'balanced'}));assert.match(box.limit,/میانه را میانگین نخوان/);assert.match(box.mark,/مشاهده/);
});
test('answer changes invalidate prior feedback and unchecked or invalid actions cannot score',()=>{
 let s={answers:{},checked:{}};assert.equal(chartChoiceReducer(s,{type:'check',id:'pairs'}),s);
 s=chartChoiceReducer(s,{type:'answer',id:'pairs',value:0});s=chartChoiceReducer(s,{type:'check',id:'pairs'});assert.equal(s.checked.pairs,true);const changed=chartChoiceReducer(s,{type:'answer',id:'pairs',value:2});assert.equal(changed.checked.pairs,false);assert.equal(s.answers.pairs,0);
 for(const action of [{type:'answer',id:'pairs',value:3},{type:'answer',id:'pairs',value:-1},{type:'answer',id:'constructor',value:0},{type:'check',id:'constructor'}])assert.equal(chartChoiceReducer(changed,action),changed);
 assert.deepEqual(chartChoiceReducer(changed,{type:'reset'}),{answers:{},checked:{}});
});
test('all fixed choices have feedback and assess distinct descriptive questions',()=>{
 assert.equal(new Set(chartChoiceChecks.map(q=>q.id)).size,3);
 for(const q of chartChoiceChecks){assert.equal(q.options.length,3);assert.equal(q.feedback.length,3);assert.ok(q.options[q.correct]);for(let value=0;value<3;value++){const s=chartChoiceReducer(chartChoiceReducer({answers:{},checked:{}},{type:'answer',id:q.id,value}),{type:'check',id:q.id});assert.equal(s.checked[q.id],true);assert.ok(q.feedback[value].length>20);}}
});
