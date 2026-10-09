import {guides} from './learning.js';

export const CONCEPT_KEY='amar-academy:concepts:v1';
export const conceptQuestionId=(lessonId,index)=>`${lessonId}:${index}`;

// Invalidate a saved answer when its question, options or correct answer changes.
export function questionSignature(question) {
  const text=JSON.stringify([question.question,question.options,question.correct]);
  let hash=2166136261;
  for(let i=0;i<text.length;i++)hash=Math.imul(hash^text.charCodeAt(i),16777619);
  return (hash>>>0).toString(16);
}
const bank=Object.fromEntries(Object.entries(guides).flatMap(([lessonId,guide])=>guide.checks.map((question,index)=>[conceptQuestionId(lessonId,index),{lessonId:Number(lessonId),index,question,signature:questionSignature(question)}])));

export function sanitizeConceptProgress(data) {
  if(!data||typeof data!=='object'||Array.isArray(data))return {};
  return Object.fromEntries(Object.entries(bank).flatMap(([id,item])=>{
    const answer=Object.hasOwn(data,id)?data[id]:null;
    return answer&&answer.signature===item.signature&&Number.isInteger(answer.choice)&&answer.choice>=0&&answer.choice<item.question.options.length?[[id,{signature:item.signature,choice:answer.choice}]]:[];
  }));
}
export function loadConceptProgress(storage) {
  try {
    const store=storage===undefined?globalThis.localStorage:storage;
    const data=JSON.parse(store.getItem(CONCEPT_KEY));
    return data?.version===1?sanitizeConceptProgress(data.answers):{};
  } catch {return {};}
}
export function saveConceptProgress(data,storage) {
  try {
    const store=storage===undefined?globalThis.localStorage:storage;
    store.setItem(CONCEPT_KEY,JSON.stringify({version:1,answers:sanitizeConceptProgress(data)}));
    return true;
  } catch {return false;}
}
export function recordConceptAnswer(data,lessonId,index,choice) {
  const item=bank[conceptQuestionId(lessonId,index)],clean=sanitizeConceptProgress(data);
  if(!item||!Number.isInteger(choice)||choice<0||choice>=item.question.options.length)return clean;
  return {...clean,[conceptQuestionId(lessonId,index)]:{signature:item.signature,choice}};
}
export function summarizeConceptProgress(data) {
  const answers=sanitizeConceptProgress(data),reviews=[];
  const lessons=Object.entries(guides).map(([id,guide])=>{
    let answered=0,correct=0;
    guide.checks.forEach((question,index)=>{
      const answer=answers[conceptQuestionId(id,index)];
      if(!answer)return;
      answered++;
      if(answer.choice===question.correct)correct++;
      else reviews.push({lessonId:Number(id),index,question:question.question});
    });
    return {id:Number(id),total:guide.checks.length,answered,correct,review:answered-correct};
  });
  return {lessons,reviews,total:lessons.reduce((sum,l)=>sum+l.total,0),answered:lessons.reduce((sum,l)=>sum+l.answered,0),correct:lessons.reduce((sum,l)=>sum+l.correct,0),review:reviews.length};
}
export function nextLearningAction(data,readLessons=[]) {
  const summary=summarizeConceptProgress(data);
  const review=summary.reviews[0];
  if(review)return {kind:'review',lessonId:review.lessonId,index:review.index};
  const unfinished=summary.lessons.find(l=>l.answered>0&&l.answered<l.total)||summary.lessons.find(l=>readLessons.includes(l.id)&&l.answered<l.total);
  if(unfinished){const answers=sanitizeConceptProgress(data),index=guides[unfinished.id].checks.findIndex((_,i)=>!answers[conceptQuestionId(unfinished.id,i)]);return {kind:'check',lessonId:unfinished.id,index};}
  const unread=summary.lessons.find(l=>!readLessons.includes(l.id));
  return unread?{kind:'lesson',lessonId:unread.id}:{kind:'practice',lessonId:10};
}
