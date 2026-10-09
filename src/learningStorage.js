import {loadProgress,normalizeProgress,emptyProgress} from './storage.js';
import {loadConceptProgress,sanitizeConceptProgress} from './conceptProgress.js';
import {mergeBackup} from './backup.js';

export const LEARNING_KEY='amar-academy:learning:v2';
// One storage write keeps imported exercise notes and concept answers together.
// Read the previous two keys only when the unified record has not been created.
export function loadLearningState(storage){
  try{
    const store=storage===undefined?globalThis.localStorage:storage;
    const raw=store.getItem(LEARNING_KEY);
    if(raw===null)return {progress:loadProgress(store),concepts:loadConceptProgress(store)};
    const data=JSON.parse(raw);
    if(data?.version!==2||!data.progress||!data.concepts)throw Error('Invalid learning record');
    return {progress:normalizeProgress(data.progress),concepts:sanitizeConceptProgress(data.concepts)};
  }catch{return {progress:emptyProgress(),concepts:{}};}
}
export function saveLearningState(state,storage){
  try{
    const store=storage===undefined?globalThis.localStorage:storage;
    store.setItem(LEARNING_KEY,JSON.stringify({version:2,progress:state.progress,concepts:sanitizeConceptProgress(state.concepts)}));
    return true;
  }catch{return false;}
}
export function restoreLearningBackup(current,incoming,course,storage){
  const merged=mergeBackup(current,incoming,course);
  return saveLearningState(merged.state,storage)?{ok:true,...merged}:{ok:false};
}
