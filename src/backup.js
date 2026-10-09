import {normalizeProgress} from './storage.js';
import {guides} from './learning.js';
import {sanitizeConceptProgress} from './conceptProgress.js';

export const MAX_BACKUP_BYTES=32*1024*1024;
const plain=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const fail=()=>{throw Error('ساختار فایل معتبر نیست. فایل پشتیبان آمارآموز را انتخاب کن.');};
function knownIds(course){return {lessons:new Set(course.lessons.map(l=>l.id)),exercises:new Set(course.lessons.flatMap(l=>l.exercises.map(e=>e.id)))};}
function cleanProgress(data,course){
  const p=normalizeProgress(data),ids=knownIds(course),review=p.review.filter(id=>ids.exercises.has(id));
  return {lessons:p.lessons.filter(id=>ids.lessons.has(id)),solved:p.solved.filter(id=>ids.exercises.has(id)&&!review.includes(id)),review,
    drafts:Object.fromEntries(Object.entries(p.drafts).filter(([id,text])=>ids.exercises.has(id)&&text.trim().length>0))};
}
export function createBackup(state,course,date=new Date()){
  const data={format:'amar-academy-backup',version:1,createdAt:date.toISOString(),courseVersion:course.sourceVersion,
    progress:cleanProgress(state.progress,course),concepts:sanitizeConceptProgress(state.concepts)};
  if(Object.values(data.progress.drafts).some(text=>text.length>8000))throw Error('یک یادداشت از حد ۸۰۰۰ نویسه بلندتر است؛ ابتدا آن را کوتاه کن.');
  const text=JSON.stringify(data,null,2);
  if(new TextEncoder().encode(text).length>MAX_BACKUP_BYTES)throw Error('حجم پشتیبان از حد ۳۲ مگابایت بیشتر است.');
  return text;
}
export function parseBackup(text,course){
  if(typeof text!=='string'||new TextEncoder().encode(text).length>MAX_BACKUP_BYTES)throw Error('حجم فایل باید حداکثر ۳۲ مگابایت باشد.');
  let data;try{data=JSON.parse(text);}catch{throw Error('فایل JSON خوانا نیست. فایل پشتیبان آمارآموز را انتخاب کن.');}
  if(!plain(data)||data.format!=='amar-academy-backup')fail();
  if(data.version!==1)throw Error('نسخهٔ این فایل پشتیبانی نمی‌شود. از فایل پشتیبان نسخهٔ فعلی آمارآموز استفاده کن.');
  if(typeof data.createdAt!=='string'||data.createdAt.length>40||!Number.isFinite(Date.parse(data.createdAt))||!Number.isInteger(data.courseVersion)||!plain(data.progress)||!plain(data.concepts))fail();
  const p=data.progress,ids=knownIds(course);
  for(const [key,valid] of [['lessons',id=>ids.lessons.has(id)],['solved',id=>ids.exercises.has(id)],['review',id=>ids.exercises.has(id)]]){
    if(!Array.isArray(p[key])||p[key].length>ids[key==='lessons'?'lessons':'exercises'].size||p[key].some(id=>!valid(id))||new Set(p[key]).size!==p[key].length)fail();
  }
  if(p.solved.some(id=>p.review.includes(id))||!plain(p.drafts)||Object.keys(p.drafts).length>ids.exercises.size)fail();
  for(const [id,text] of Object.entries(p.drafts))if(!ids.exercises.has(id)||typeof text!=='string'||text.length>8000)fail();
  if(Object.keys(data.concepts).length>30)fail();
  for(const [id,answer] of Object.entries(data.concepts)){
    if(!/^([1-9]|10):[0-2]$/.test(id)||!plain(answer))fail();
    const [lesson,index]=id.split(':').map(Number),question=guides[lesson].checks[index];
    if(typeof answer.signature!=='string'||answer.signature.length>64||!Number.isInteger(answer.choice)||answer.choice<0||answer.choice>=question.options.length)fail();
  }
  const concepts=sanitizeConceptProgress(data.concepts);
  return {createdAt:data.createdAt,courseVersion:data.courseVersion,progress:cleanProgress(p,course),concepts,
    skippedConcepts:Object.keys(data.concepts).length-Object.keys(concepts).length};
}
export function mergeBackup(current,incoming,course){
  const progress=cleanProgress(current.progress,course),concepts=sanitizeConceptProgress(current.concepts);
  const added={lessons:0,assessments:0,drafts:0,concepts:0},conflicts={assessments:0,drafts:0,concepts:0};
  for(const id of incoming.progress.lessons)if(!progress.lessons.includes(id)){progress.lessons.push(id);added.lessons++;}
  for(const status of ['solved','review'])for(const id of incoming.progress[status]){
    if(progress.solved.includes(id)||progress.review.includes(id)){if(!progress[status].includes(id))conflicts.assessments++;}
    else{progress[status].push(id);added.assessments++;}
  }
  for(const [id,text] of Object.entries(incoming.progress.drafts)){
    if(Object.hasOwn(progress.drafts,id)){if(progress.drafts[id]!==text)conflicts.drafts++;}
    else{progress.drafts[id]=text;added.drafts++;}
  }
  for(const [id,answer] of Object.entries(incoming.concepts)){
    if(Object.hasOwn(concepts,id)){if(concepts[id].choice!==answer.choice)conflicts.concepts++;}
    else{concepts[id]=answer;added.concepts++;}
  }
  // Preserve even unrecognized local draft entries; importing never deletes local notes.
  return {state:{progress:{...progress,drafts:{...current.progress.drafts,...progress.drafts}},concepts},added,conflicts};
}
