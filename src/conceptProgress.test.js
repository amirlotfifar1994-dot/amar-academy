import test from 'node:test';
import assert from 'node:assert/strict';
import {guides} from './learning.js';
import {CONCEPT_KEY,questionSignature,recordConceptAnswer,summarizeConceptProgress,nextLearningAction,loadConceptProgress,saveConceptProgress,sanitizeConceptProgress} from './conceptProgress.js';
function memoryStorage(){const values=new Map();return {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),values};}

test('latest answer replaces a review item without double-counting and survives reload',()=>{
  const storage=memoryStorage(),q=guides[4].checks[0],wrong=(q.correct+1)%q.options.length;
  let answers=recordConceptAnswer({},4,0,wrong);
  assert.equal(summarizeConceptProgress(answers).review,1);assert.deepEqual(nextLearningAction(answers),{kind:'review',lessonId:4,index:0});
  answers=recordConceptAnswer(answers,4,0,q.correct);answers=recordConceptAnswer(answers,4,0,q.correct);
  assert.equal(saveConceptProgress(answers,storage),true);
  const summary=summarizeConceptProgress(loadConceptProgress(storage));
  assert.equal(summary.total,30);assert.equal(summary.answered,1);assert.equal(summary.correct,1);assert.equal(summary.review,0);
});
test('changed question text, options or answer invalidates a saved assessment',()=>{
  const q=guides[1].checks[0],answers=recordConceptAnswer({},1,0,q.correct);
  assert.notEqual(questionSignature({...q,question:q.question+' تغییر'}),answers['1:0'].signature);
  assert.notEqual(questionSignature({...q,options:[...q.options].reverse()}),answers['1:0'].signature);
  assert.notEqual(questionSignature({...q,correct:1}),answers['1:0'].signature);
  assert.deepEqual(sanitizeConceptProgress({'1:0':{...answers['1:0'],signature:'old-content'}}),{});
});
test('corrupt or future storage and invalid choices cannot invent course results',()=>{
  const storage=memoryStorage();storage.setItem(CONCEPT_KEY,'{broken');assert.deepEqual(loadConceptProgress(storage),{});
  storage.setItem(CONCEPT_KEY,JSON.stringify({version:2,answers:recordConceptAnswer({},1,0,0)}));assert.deepEqual(loadConceptProgress(storage),{});
  const good=recordConceptAnswer({},1,0,0),bad={'unknown':{choice:0},'1:1':{signature:questionSignature(guides[1].checks[1]),choice:99}};
  assert.deepEqual(sanitizeConceptProgress({...good,...bad}),good);
  assert.deepEqual(recordConceptAnswer(good,99,0,0),good);assert.deepEqual(recordConceptAnswer(good,1,0,-1),good);
});
test('prototype properties are not treated as saved answers',()=>{
  const good=recordConceptAnswer({},1,0,0),inherited=Object.create(good);
  assert.equal(summarizeConceptProgress(inherited).answered,0);
});
test('storage denial is reported while in-memory progress stays usable and old drafts remain untouched',()=>{
  const denied={getItem(){throw Error('blocked');},setItem(){throw Error('full');}};
  assert.deepEqual(loadConceptProgress(denied),{});const answers=recordConceptAnswer({},1,0,0);
  assert.equal(saveConceptProgress(answers,denied),false);assert.equal(summarizeConceptProgress(answers).correct,1);
  const storage=memoryStorage();storage.setItem('amar-academy:v1','original drafts');saveConceptProgress(answers,storage);
  assert.equal(storage.getItem('amar-academy:v1'),'original drafts');
});
test('next action prioritizes review, unfinished checks, read lessons, then new reading',()=>{
  assert.deepEqual(nextLearningAction({}),{kind:'lesson',lessonId:1});
  assert.deepEqual(nextLearningAction({},[1]),{kind:'check',lessonId:1,index:0});
  let answers=recordConceptAnswer({},4,0,guides[4].checks[0].correct);
  assert.deepEqual(nextLearningAction(answers),{kind:'check',lessonId:4,index:1});
  answers=recordConceptAnswer(answers,2,1,(guides[2].checks[1].correct+1)%3);
  assert.deepEqual(nextLearningAction(answers),{kind:'review',lessonId:2,index:1});
});
test('all questions correct does not automatically mark reading complete',()=>{
  let answers={};for(const [id,guide] of Object.entries(guides))guide.checks.forEach((q,index)=>{answers=recordConceptAnswer(answers,id,index,q.correct);});
  assert.equal(summarizeConceptProgress(answers).correct,30);
  assert.deepEqual(nextLearningAction(answers,[]),{kind:'lesson',lessonId:1});
  assert.deepEqual(nextLearningAction(answers,[1,2,3,4,5,6,7,8,9,10]),{kind:'practice',lessonId:10});
});
