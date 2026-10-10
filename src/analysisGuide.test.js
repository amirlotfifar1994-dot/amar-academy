import test from 'node:test';
import assert from 'node:assert/strict';
import {scales,goals,shapes,recommendAnalysis,normalizeAnalysisChoice,initialAnalysisChoice} from './analysisGuide.js';

test('category codes never become numeric measurements; mixed variables use separate quantitative groups',()=>{
  for(const scale of ['nominal','ordinal'])for(const goal of goals){
    const result=recommendAnalysis({scale,goal:goal.id,secondScale:'quantitative'});
    assert.equal(result.mode,goal.id==='relationship'?'distributions':scale==='ordinal'?'ordinal':null,`${scale}/${goal.id}`);assert.equal(result.visual,goal.id==='relationship'?'group-box':'bars');
  }
  assert.equal(recommendAnalysis({scale:'nominal',goal:'position'}).id,'nominal-position');
  assert.equal(recommendAnalysis({scale:'ordinal',goal:'center'}).id,'ordinal-center');
});
test('both variable scales are checked, including reversed mixed pairs',()=>{
  for(const first of scales)for(const second of scales){
    const result=recommendAnalysis({scale:first.id,secondScale:second.id,goal:'relationship'});
    const expected=first.id==='quantitative'&&second.id==='quantitative'?'scatter':(first.id==='quantitative')!==(second.id==='quantitative')?'distributions':first.id==='nominal'||second.id==='nominal'?'groups':'ranks';
    assert.equal(result.mode,expected);
    const reverse=recommendAnalysis({scale:second.id,secondScale:first.id,goal:'relationship'});
    assert.equal(result.id,reverse.id);
  }
  assert.equal(recommendAnalysis({scale:'ordinal',secondScale:'quantitative',goal:'relationship'}).id,'mixed-pair');
  assert.equal(recommendAnalysis({scale:'ordinal',secondScale:'ordinal',goal:'relationship'}).id,'ranked-pair');
  assert.match(recommendAnalysis({scale:'nominal',secondScale:'quantitative',goal:'relationship'}).caution,/فقط مقدارهای کمی/);
});
test('unknown shape stays exploratory and symmetry alone never implies normality',()=>{
  for(const goal of ['center','spread']){
    const unknown=recommendAnalysis({scale:'quantitative',goal,shape:'unknown'});
    assert.equal(unknown.mode,'hist');assert.equal(unknown.id,'inspect-'+goal);
    const robust=recommendAnalysis({scale:'quantitative',goal,shape:'skewed'});
    assert.equal(robust.mode,'robust');assert.match(robust.caution,/خودکار حذف نمی‌شود/);
    const balanced=recommendAnalysis({scale:'quantitative',goal,shape:'balanced'});
    assert.match(balanced.caution,/تقارن به‌تنهایی کافی نیست/);
  }
});
test('all combinations have a valid lesson, supported destination and a primary source',()=>{
  for(const scale of scales)for(const goal of goals)for(const shape of shapes)for(const second of scales){
    const result=recommendAnalysis({scale:scale.id,goal:goal.id,shape:shape.id,secondScale:second.id});
    assert.ok(Number.isInteger(result.lessonId)&&result.lessonId>=1&&result.lessonId<=10);
    assert.ok([null,'hist','box','z','scatter','groups','distributions','robust','ordinal','ranks'].includes(result.mode));
    assert.ok(['openstax.org','www.itl.nist.gov','stat.ethz.ch'].includes(new URL(result.source[1]).hostname));
    assert.ok(result.title.length>10&&result.why.length>20&&result.caution.length>20);
  }
});
test('hidden shape selections do not affect other goals or categories and invalid choices fall back safely',()=>{
  for(const scale of ['nominal','ordinal'])for(const goal of goals){
    assert.equal(recommendAnalysis({scale,goal:goal.id,shape:'balanced'}).id,recommendAnalysis({scale,goal:goal.id,shape:'skewed'}).id);
  }
  for(const goal of ['distribution','position','relationship'])assert.equal(recommendAnalysis({goal,shape:'balanced'}).id,recommendAnalysis({goal,shape:'skewed'}).id);
  assert.deepEqual(normalizeAnalysisChoice({scale:'other',goal:'infer-causality',shape:'normal',secondScale:'other'}),initialAnalysisChoice);
  assert.deepEqual(normalizeAnalysisChoice(null),initialAnalysisChoice);
  const z=recommendAnalysis({goal:'position'});assert.equal(z.mode,'z');assert.match(z.caution,/انحراف معیار غیرصفر/);assert.match(z.caution,/مستقیم به درصد/);
});
