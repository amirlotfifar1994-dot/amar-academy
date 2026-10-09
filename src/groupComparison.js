export const groupPresets={
  unequal:{label:'تعداد بیشتر، درصد کمتر',cells:['8','2','12','18']},
  equalRate:{label:'اندازه‌های متفاوت، درصد برابر',cells:['8','2','24','6']},
  empty:{label:'یک گروه بدون مشاهده',cells:['0','0','12','18']},
};
export const percentBases={
  row:{label:'درصد سطری · درون هر گروه',help:'هر خانه بر مجموع همان سطر تقسیم می‌شود. درصدهای هر گروهِ غیرخالی، پیش از گردکردن، جمعاً ۱۰۰٪ هستند.'},
  column:{label:'درصد ستونی · درون هر نوع پاسخ',help:'هر خانه بر مجموع همان ستون تقسیم می‌شود. درصدهای هر ستونِ غیرخالی، پیش از گردکردن، جمعاً ۱۰۰٪ هستند.'},
  total:{label:'درصد کل · از همهٔ مشاهده‌ها',help:'هر خانه بر کل نمونه تقسیم می‌شود. درصد چهار خانه، پیش از گردکردن، جمعاً ۱۰۰٪ است.'},
};
export function parseCount(value){
  if(typeof value!=='string')return null;
  const text=value.trim().replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776)).replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632));
  if(!/^\d+$/.test(text))return null;
  const count=Number(text);
  return Number.isSafeInteger(count)&&count<=1000000?count:null;
}
export function summarizeGroups(input){
  if(!Array.isArray(input)||input.length!==4)return null;
  const values=input.map(parseCount);
  if(values.some(v=>v===null))return null;
  const cells=[values.slice(0,2),values.slice(2)],rows=cells.map(row=>row[0]+row[1]),columns=[cells[0][0]+cells[1][0],cells[0][1]+cells[1][1]],total=rows[0]+rows[1];
  const rates=cells.map((row,i)=>rows[i]===0?null:100*row[0]/rows[i]);
  return {cells,rows,columns,total,rates,difference:rates.some(v=>v===null)?null:rates[0]-rates[1]};
}
export function percentageCell(summary,row,column,basis){
  if(!summary||![0,1].includes(row)||![0,1].includes(column)||!Object.hasOwn(percentBases,basis))return null;
  const numerator=summary.cells[row][column],denominator=basis==='row'?summary.rows[row]:basis==='column'?summary.columns[column]:summary.total;
  return {numerator,denominator,value:denominator===0?null:100*numerator/denominator};
}
