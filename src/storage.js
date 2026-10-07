const KEY='amar-academy:v1';
export const emptyProgress=()=>({lessons:[],solved:[],review:[],drafts:{}});
export function loadProgress(){try{const data=JSON.parse(localStorage.getItem(KEY));return data&&Array.isArray(data.lessons)&&Array.isArray(data.solved)&&Array.isArray(data.review)&&typeof data.drafts==='object'&&data.drafts!==null?{lessons:data.lessons.filter(n=>Number.isInteger(n)&&n>=1&&n<=10),solved:data.solved.filter(n=>typeof n==='string'),review:data.review.filter(n=>typeof n==='string'),drafts:data.drafts}:emptyProgress();}catch{return emptyProgress();}}
export function saveProgress(data){try{localStorage.setItem(KEY,JSON.stringify(data));return true;}catch{return false;}}
