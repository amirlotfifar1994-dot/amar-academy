export const PROGRESS_KEY='amar-academy:v1';
export const emptyProgress=()=>({lessons:[],solved:[],review:[],drafts:{}});
export function normalizeProgress(data){return data&&Array.isArray(data.lessons)&&Array.isArray(data.solved)&&Array.isArray(data.review)&&typeof data.drafts==='object'&&data.drafts!==null&&!Array.isArray(data.drafts)?{lessons:[...new Set(data.lessons.filter(n=>Number.isInteger(n)&&n>=1&&n<=10))],solved:[...new Set(data.solved.filter(n=>typeof n==='string'))],review:[...new Set(data.review.filter(n=>typeof n==='string'))],drafts:Object.fromEntries(Object.entries(data.drafts).filter(([,value])=>typeof value==='string'))}:emptyProgress();}
export function loadProgress(storage){try{const store=storage===undefined?globalThis.localStorage:storage;return normalizeProgress(JSON.parse(store.getItem(PROGRESS_KEY)));}catch{return emptyProgress();}}
export function saveProgress(data){try{localStorage.setItem(PROGRESS_KEY,JSON.stringify(data));return true;}catch{return false;}}
