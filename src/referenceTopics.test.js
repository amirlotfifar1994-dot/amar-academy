import test from 'node:test';
import assert from 'node:assert/strict';
import {referenceCategories,referenceTopics,findReferenceTopics,normalizeReferenceText} from './referenceTopics.js';
test('topic directory covers the ten foundational texts and all seventeen existing interactive modes',()=>{
  assert.equal(new Set(referenceTopics.map(t=>t.id)).size,20);
  assert.deepEqual([...new Set(referenceTopics.map(t=>t.lessonId))].sort((a,b)=>a-b),[1,2,3,4,5,6,7,8,9,10]);
  assert.deepEqual([...new Set(referenceTopics.map(t=>t.mode))].sort(),['hist','box','z','scatter','groups','weighted','distributions','robust','ordinal','ranks','bins','cumulative','variance','nominal','simpson','relative','sampling'].sort());
  for(const topic of referenceTopics)assert.ok(referenceCategories.slice(1).includes(topic.category));
});
test('search accepts Persian and Arabic letter variants, spacing and case without ignoring active categories',()=>{
  assert.equal(normalizeReferenceText('  كد يک\u200cنفر  SD '),'کد یک نفر sd');
  assert.ok(findReferenceTopics('پاسخ گمشده').some(t=>t.id==='report'));
  assert.ok(findReferenceTopics('sd').some(t=>t.id==='variance'));
  assert.deepEqual(findReferenceTopics('ميانه','مرکز و پراکندگی').map(t=>t.id),['center','robust']);
  assert.equal(findReferenceTopics('هیچموضوعناموجود').length,0);
  assert.equal(findReferenceTopics('','رابطه و گزارش').length,3);
  assert.equal(findReferenceTopics('   ').length,20);
});
