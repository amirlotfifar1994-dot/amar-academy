import {latin} from './stats.js';

export const meanExamples={
  weighted:{title:'نمره‌ها با واحدهای متفاوت',rows:[{value:'12',weight:'1'},{value:'18',weight:'3'},{value:'16',weight:'2'}]},
  pooled:{title:'دو گروه با اندازه‌های متفاوت',rows:[{value:'10',weight:'10'},{value:'18',weight:'30'}]},
};
export function parseMeanNumber(input){
  if(typeof input!=='string')return null;
  const text=latin(input).trim();
  if(!/^[-+]?(?:\d+(?:\.\d{0,6})?|\.\d{1,6})$/.test(text))return null;
  const value=Number(text);
  return Number.isFinite(value)&&Math.abs(value)<=1000000?value:null;
}
export function validateMeanRow(row,kind){
  const value=parseMeanNumber(row?.value),weight=parseMeanNumber(row?.weight);
  const weightError=weight===null||weight<0||(kind==='pooled'&&!Number.isInteger(weight));
  // An empty group has no mean. A blank value with known zero weight is safe to omit.
  const valueError=value===null&&!(weight===0&&typeof row?.value==='string'&&row.value.trim()==='');
  return {value,weight,valueError,weightError};
}
export function summarizeWeightedMean(input,kind='weighted'){
  if(!['weighted','pooled'].includes(kind)||!Array.isArray(input)||input.length<1||input.length>10)return null;
  const rows=input.map(row=>validateMeanRow(row,kind));
  if(rows.some(row=>row.valueError||row.weightError))return null;
  const active=rows.filter(row=>row.weight>0),totalWeight=active.reduce((sum,row)=>sum+row.weight,0);
  const weightedSum=active.reduce((sum,row)=>sum+row.value*row.weight,0);
  const mean=totalWeight===0?null:weightedSum/totalWeight;
  const equalMean=active.length?active.reduce((sum,row)=>sum+row.value,0)/active.length:null;
  return {rows:rows.map(row=>({...row,product:row.weight===0?0:row.value*row.weight,share:totalWeight===0?null:row.weight/totalWeight})),totalWeight,weightedSum,mean,equalMean,
    min:active.length?Math.min(...active.map(row=>row.value)):null,max:active.length?Math.max(...active.map(row=>row.value)):null,activeCount:active.length};
}
