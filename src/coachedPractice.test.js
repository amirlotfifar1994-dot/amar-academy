import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {describe,pairStats} from './stats.js';
import {coachedProblems,gradeCoachedStep,parseCoachedNumber,createCoachingState,coachingReducer,coachingSummary} from './coachedPractice.js';
const expectedAnswer=step=>step.type==='choice'?step.correct:String(Number(step.expected.toFixed(2)));
test('every guided exercise is an existing bank question and numeric answers match independent calculations',()=>{
  const course=JSON.parse(readFileSync(new URL('../public/course.json',import.meta.url),'utf8'));
  assert.equal(coachedProblems.length,6);assert.equal(new Set(coachedProblems.map(p=>p.id)).size,6);
  for(const problem of coachedProblems){assert.ok(course.lessons.find(l=>l.id===problem.lessonId).exercises.some(q=>q.id===problem.id));}
  const frequency=coachedProblems.find(p=>p.id==='2-18');assert.equal(frequency.steps[1].expected,frequency.data.filter(v=>v===4).length);assert.equal(frequency.steps[2].expected,100*3/7);
  const mean=coachedProblems.find(p=>p.id==='4-21');assert.equal(mean.steps[1].expected,mean.data.reduce((sum,v)=>sum+v,0));assert.equal(mean.steps[2].expected,describe(mean.data).mean);
  const sd=coachedProblems.find(p=>p.id==='5-23'),stats=describe(sd.data);assert.equal(sd.steps[1].expected,stats.variance);assert.equal(sd.steps[2].expected,stats.sd);
  assert.equal(coachedProblems.find(p=>p.id==='6-17').steps[2].expected,(40-50)/10);
  const box=coachedProblems.find(p=>p.id==='8-14'),quartiles=describe(box.data);assert.equal(box.steps[1].expected,quartiles.iqr);assert.equal(box.steps[2].expected,quartiles.lower);assert.equal(box.steps[3].expected,quartiles.upper);
  const paired=coachedProblems.find(p=>p.id==='9-13'),pair=pairStats(paired.data,paired.y);assert.equal(paired.steps[2].expected,pair.r);
});
test('every choice has specific feedback and exactly one correct result; numeric rounding is explicit',()=>{
  for(const problem of coachedProblems)for(const step of problem.steps){
    assert.ok(step.hint.trim()&&step.solution.trim());
    assert.equal(gradeCoachedStep(step,expectedAnswer(step)).status,'correct');
    if(step.type==='choice'){
      assert.equal(new Set(step.options.map(o=>o.feedback)).size,step.options.length);
      step.options.forEach((_,i)=>assert.equal(gradeCoachedStep(step,i).status,i===step.correct?'correct':'incorrect'));
      for(const invalid of [-1,99,1.5,'0'])assert.equal(gradeCoachedStep(step,invalid).status,'invalid');
    }else for(const mistake of step.mistakes){assert.equal(gradeCoachedStep(step,String(mistake.value)).status,'incorrect');assert.equal(gradeCoachedStep(step,String(mistake.value)).message,mistake.message);}
  }
  const percent=coachedProblems[0].steps[2];
  for(const answer of ['۴۲٫۹','42.86','42.857143'])assert.equal(gradeCoachedStep(percent,answer).status,'correct');
  for(const answer of ['42.8','42.81','0.429','429'])assert.equal(gradeCoachedStep(percent,answer).status,'incorrect');
});
test('empty, invalid and zero answers are distinguished; signed Persian numbers work',()=>{
  const step=coachedProblems.find(p=>p.id==='6-17').steps[2];
  assert.equal(parseCoachedNumber(' −۱٫۵ '),-1.5);assert.equal(parseCoachedNumber('٠'),0);
  for(const answer of ['', '   ',null])assert.equal(gradeCoachedStep(step,answer).status,'empty');
  for(const answer of ['NaN','Infinity','1e2','-1٪','0x10','1000001','0.0000001'])assert.equal(gradeCoachedStep(step,answer).status,'invalid');
  assert.equal(gradeCoachedStep(step,'0').status,'incorrect');assert.equal(gradeCoachedStep(step,'−۱').status,'correct');
});
test('wrong or unchecked answers cannot unlock subsequent steps',()=>{
  let state=createCoachingState(4);const id=state.selected;
  assert.equal(coachingReducer(state,{type:'next'}),state);
  state=coachingReducer(state,{type:'answer',value:0});state=coachingReducer(state,{type:'check'});
  assert.equal(state.attempts[id].results[0].status,'incorrect');assert.equal(coachingReducer(state,{type:'next'}),state);
  assert.equal(coachingReducer(state,{type:'assist'}),state);
  state=coachingReducer(state,{type:'answer',value:1});state=coachingReducer(state,{type:'check'});state=coachingReducer(state,{type:'next'});
  assert.equal(state.attempts[id].active,1);
});
test('full correct path completes the selected exercise without editing bank progress',()=>{
  for(const problem of coachedProblems){
    let state=createCoachingState(problem.lessonId);
    problem.steps.forEach((step,i)=>{state=coachingReducer(state,{type:'answer',value:expectedAnswer(step)});state=coachingReducer(state,{type:'check'});if(i<problem.steps.length-1)state=coachingReducer(state,{type:'next'});});
    const summary=coachingSummary(state.attempts[problem.id]);assert.equal(summary.complete,true);assert.equal(summary.withoutSolution,problem.steps.length);assert.equal(summary.assisted,0);
    assert.deepEqual(Object.keys(state).sort(),['attempts','selected']);
  }
});
test('seeing a solution and passing with help is counted separately from answering before the solution',()=>{
  let state=createCoachingState(5),id=state.selected;
  state=coachingReducer(state,{type:'reveal'});state=coachingReducer(state,{type:'assist'});
  assert.equal(coachingSummary(state.attempts[id]).assisted,1);assert.equal(coachingSummary(state.attempts[id]).withoutSolution,0);
  state=coachingReducer(state,{type:'next'});state=coachingReducer(state,{type:'reveal'});state=coachingReducer(state,{type:'answer',value:'4'});state=coachingReducer(state,{type:'check'});
  assert.equal(coachingSummary(state.attempts[id]).assisted,2);assert.equal(coachingSummary(state.attempts[id]).withoutSolution,0);
});
test('editing an earlier answer invalidates later checks and completion, retaining later drafts',()=>{
  const problem=coachedProblems.find(p=>p.lessonId===4);let state=createCoachingState(4);
  for(const step of problem.steps){state=coachingReducer(state,{type:'answer',value:expectedAnswer(step)});state=coachingReducer(state,{type:'check'});state=coachingReducer(state,{type:'next'});}
  while(state.attempts[problem.id].active>0)state=coachingReducer(state,{type:'previous'});
  state=coachingReducer(state,{type:'answer',value:0});
  assert.equal(coachingSummary(state.attempts[problem.id]).complete,false);assert.ok(state.attempts[problem.id].results.every(r=>r===null));
  assert.equal(state.attempts[problem.id].answers[2],'7.5');
});
test('switching preserves attempts; resetting one exercise leaves others intact and inputs are not mutated',()=>{
  const initial=createCoachingState(2),before=structuredClone(initial);
  let state=coachingReducer(initial,{type:'answer',value:0});state=coachingReducer(state,{type:'check'});assert.deepEqual(initial,before);
  state=coachingReducer(state,{type:'select',id:'4-21'});state=coachingReducer(state,{type:'answer',value:1});state=coachingReducer(state,{type:'check'});state=coachingReducer(state,{type:'reset'});
  assert.equal(coachingSummary(state.attempts['2-18']).passed,1);assert.equal(coachingSummary(state.attempts['4-21']).passed,0);
  assert.equal(coachingReducer(state,{type:'select',id:'foreign'}),state);
});
test('editing an earlier answer does not erase the fact that a later solution was already seen',()=>{
  let state=createCoachingState(4),id=state.selected;
  state=coachingReducer(state,{type:'answer',value:1});state=coachingReducer(state,{type:'check'});state=coachingReducer(state,{type:'next'});
  state=coachingReducer(state,{type:'reveal'});state=coachingReducer(state,{type:'assist'});
  state=coachingReducer(state,{type:'previous'});state=coachingReducer(state,{type:'answer',value:0});
  assert.equal(state.attempts[id].solutions[1],true);assert.equal(state.attempts[id].results[1],null);
  state=coachingReducer(state,{type:'answer',value:1});state=coachingReducer(state,{type:'check'});state=coachingReducer(state,{type:'next'});
  state=coachingReducer(state,{type:'answer',value:'30'});state=coachingReducer(state,{type:'check'});
  assert.equal(state.attempts[id].results[1].assisted,true);assert.equal(coachingSummary(state.attempts[id]).withoutSolution,1);
});
