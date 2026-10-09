import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createBackup,parseBackup,mergeBackup,MAX_BACKUP_BYTES} from './backup.js';
import {loadLearningState,saveLearningState,restoreLearningBackup,LEARNING_KEY} from './learningStorage.js';
import {PROGRESS_KEY,emptyProgress} from './storage.js';
import {CONCEPT_KEY,recordConceptAnswer,summarizeConceptProgress} from './conceptProgress.js';
const course=JSON.parse(readFileSync(new URL('../public/course.json',import.meta.url),'utf8'));
const state=()=>({progress:{lessons:[1,3],solved:['1-1'],review:['2-1'],drafts:{'1-1':'پاسخ من\nمیانگین <script> & "نمونه"'}},concepts:recordConceptAnswer({},1,0,0)});
const file=()=>JSON.parse(createBackup(state(),course,new Date('2026-10-09T10:00:00Z')));
function memoryStorage(){const values=new Map();return {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),values};}

test('backup round-trip preserves Persian notes, exercise assessment and concept choices',()=>{
  const before=state(),parsed=parseBackup(createBackup(before,course),course);
  assert.deepEqual(parsed.progress,before.progress);assert.deepEqual(parsed.concepts,before.concepts);
  assert.equal(parsed.skippedConcepts,0);assert.equal(course.lessons.flatMap(l=>l.exercises).length,480);
  assert.deepEqual(before,state());
});
test('invalid files, future versions and foreign exercise identifiers are rejected',()=>{
  assert.throws(()=>parseBackup('{broken',course),/JSON/);
  for(const mutate of [d=>d.format='other-app',d=>d.version=2,d=>d.createdAt='invalid',d=>d.progress.lessons=[11],d=>d.progress.lessons=[1,1],d=>d.progress.solved=['1-fake'],d=>d.progress.review=['1-1'],d=>d.progress.drafts=JSON.parse('{"__proto__":"bad"}'),d=>d.concepts={'99:0':{choice:0,signature:'x'}},d=>d.concepts['1:0'].choice=99]){
    const data=file();mutate(data);assert.throws(()=>parseBackup(JSON.stringify(data),course));
  }
});
test('oversize files and notes cannot be imported, and boundary-length notes round-trip',()=>{
  const data=file();data.progress.drafts['1-1']='آ'.repeat(8000);
  assert.equal(parseBackup(JSON.stringify(data),course).progress.drafts['1-1'].length,8000);
  data.progress.drafts['1-1']+='آ';assert.throws(()=>parseBackup(JSON.stringify(data),course));
  const tooLong=state();tooLong.progress.drafts['1-1']='a'.repeat(8001);assert.throws(()=>createBackup(tooLong,course));
  assert.throws(()=>parseBackup(' '.repeat(MAX_BACKUP_BYTES+1),course),/۳۲/);
});
test('changed questions are excluded and explicitly counted in the import preview',()=>{
  const data=file();data.concepts['1:0'].signature='outdated-question';
  const parsed=parseBackup(JSON.stringify(data),course);
  assert.equal(parsed.skippedConcepts,1);assert.equal(summarizeConceptProgress(parsed.concepts).answered,0);
});
test('merge preserves conflicting current work, fills blank drafts and never mutates its inputs',()=>{
  const current=state();current.progress.drafts['2-1']='';current.progress.drafts['local-legacy']='keep me';
  const remote=state();remote.progress.lessons=[1,2];remote.progress.solved=['2-1','3-1'];remote.progress.review=[];
  remote.progress.drafts={'1-1':'remote conflict','2-1':'new note'};remote.concepts=recordConceptAnswer(recordConceptAnswer({},1,0,1),2,0,0);
  const incoming=parseBackup(createBackup(remote,course),course),original=structuredClone(current),remoteCopy=structuredClone(incoming);
  const result=mergeBackup(current,incoming,course);
  assert.deepEqual(result.added,{lessons:1,assessments:1,drafts:1,concepts:1});
  assert.deepEqual(result.conflicts,{assessments:1,drafts:1,concepts:1});
  assert.equal(result.state.progress.drafts['1-1'],current.progress.drafts['1-1']);
  assert.equal(result.state.progress.drafts['local-legacy'],'keep me');assert.equal(result.state.progress.drafts['2-1'],'new note');
  assert.equal(result.state.concepts['1:0'].choice,0);assert.ok(result.state.progress.review.includes('2-1'));
  assert.ok(!result.state.progress.solved.includes('2-1'));assert.deepEqual(current,original);assert.deepEqual(incoming,remoteCopy);
  const repeated=mergeBackup(result.state,incoming,course);assert.deepEqual(repeated.added,{lessons:0,assessments:0,drafts:0,concepts:0});
});
test('migration reads original keys, keeps them, and reloads the new complete record',()=>{
  const storage=memoryStorage(),original=state();
  storage.setItem(PROGRESS_KEY,JSON.stringify(original.progress));storage.setItem(CONCEPT_KEY,JSON.stringify({version:1,answers:original.concepts}));
  assert.deepEqual(loadLearningState(storage),original);
  const merged={progress:{...original.progress,lessons:[1,2,3]},concepts:recordConceptAnswer(original.concepts,2,0,1)};
  assert.equal(saveLearningState(merged,storage),true);assert.deepEqual(loadLearningState(storage),merged);
  assert.deepEqual(JSON.parse(storage.getItem(PROGRESS_KEY)),original.progress);
  assert.deepEqual(JSON.parse(storage.getItem(CONCEPT_KEY)).answers,original.concepts);
});
test('an import storage failure leaves the entire previous record intact in a single write',()=>{
  const storage=memoryStorage(),original=state();saveLearningState(original,storage);
  const before=storage.getItem(LEARNING_KEY),incoming=parseBackup(createBackup({progress:emptyProgress(),concepts:recordConceptAnswer({},2,0,0)},course),course);
  const merged=mergeBackup(original,incoming,course);let writes=0;
  const full={getItem:storage.getItem,setItem(){writes++;throw Error('QuotaExceededError');}};
  assert.deepEqual(restoreLearningBackup(original,incoming,course,full),{ok:false});assert.equal(writes,1);
  assert.equal(storage.getItem(LEARNING_KEY),before);assert.deepEqual(loadLearningState(storage),original);
  const restored=restoreLearningBackup(original,incoming,course,storage);
  assert.equal(restored.ok,true);assert.deepEqual(restored.state,merged.state);assert.deepEqual(loadLearningState(storage),merged.state);
});
test('denied storage still allows an in-memory backup and empty imports erase nothing',()=>{
  const denied={getItem(){throw Error('SecurityError');},setItem(){throw Error('SecurityError');}};
  assert.deepEqual(loadLearningState(denied),{progress:emptyProgress(),concepts:{}});
  assert.equal(saveLearningState(state(),denied),false);assert.deepEqual(parseBackup(createBackup(state(),course),course).progress,state().progress);
  const empty=parseBackup(createBackup({progress:emptyProgress(),concepts:{}},course),course);
  assert.deepEqual(mergeBackup(state(),empty,course).state,state());
});
