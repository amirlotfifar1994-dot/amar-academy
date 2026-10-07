export const BASE_X=[5,6,6,7,7,8,8,9];
export const BASE_Y=[10,9,8,7,6,5,4,3];
export function latin(text){return String(text).replace(/[۰-۹]/g,c=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(c)).replace(/[٠-٩]/g,c=>'٠١٢٣٤٥٦٧٨٩'.indexOf(c)).replace(/٫/g,'.').replace(/−/g,'-');}
export function parseData(text){
  const raw=latin(text).trim();if(!raw)return {values:[],error:'حداقل یک عدد وارد کنید.'};
  if(/^[,،;؛]|[,،;؛]$|[,،;؛]\s*[,،;؛]|\n\s*\n/.test(raw))return {values:[],error:'مقدار خالی در فهرست وجود دارد. دادهٔ گمشده را با صفر جایگزین نکنید؛ جفت مشاهده را بررسی کنید.'};
  const tokens=raw.split(/[\s,،;؛]+/).filter(Boolean);
  if(tokens.length>200)return {values:[],error:'برای نمایش خوانا، حداکثر ۲۰۰ مشاهده وارد کنید.'};
  const values=tokens.map(Number);
  if(tokens.some(t=>!/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[-+]?\d+)?$/i.test(t))||values.some(n=>!Number.isFinite(n)||Math.abs(n)>1e9))return {values:[],error:'فقط عددهای معتبر بین منفی و مثبت یک میلیارد وارد کنید.'};
  return {values,error:null};
}
export function quantile(sorted,p){if(!sorted.length)return null;const index=(sorted.length-1)*p,lo=Math.floor(index),hi=Math.ceil(index);return sorted[lo]+(sorted[hi]-sorted[lo])*(index-lo);}
export function describe(values){
  if(!values.length)return null;const n=values.length,sorted=[...values].sort((a,b)=>a-b),mean=values.reduce((s,v)=>s+v,0)/n;
  const ss=values.reduce((s,v)=>s+(v-mean)**2,0),variance=n>1?ss/(n-1):null,sd=variance===null?null:Math.sqrt(variance);
  const q1=quantile(sorted,.25),median=quantile(sorted,.5),q3=quantile(sorted,.75),iqr=q3-q1,lower=q1-1.5*iqr,upper=q3+1.5*iqr;
  const frequencies=new Map();for(const v of values)frequencies.set(v,(frequencies.get(v)||0)+1);
  const maxCount=Math.max(...frequencies.values()),modes=maxCount===1?[]:[...frequencies].filter(([,count])=>count===maxCount).map(([v])=>v).sort((a,b)=>a-b);
  const within=sorted.filter(v=>v>=lower&&v<=upper),m2=ss/n;
  const skew=m2>0?values.reduce((s,v)=>s+(v-mean)**3,0)/n/m2**1.5:null;
  const excess=m2>0?values.reduce((s,v)=>s+(v-mean)**4,0)/n/m2**2-3:null;
  return {n,sorted,mean,median,modes,ss,variance,sd,min:sorted[0],max:sorted[n-1],range:sorted[n-1]-sorted[0],q1,q3,iqr,lower,upper,whiskerLow:within[0],whiskerHigh:within.at(-1),outliers:sorted.filter(v=>v<lower||v>upper),skew,excess};
}
export function pairStats(x,y){
  if(x.length!==y.length||x.length<2)return null;const a=describe(x),b=describe(y);
  const cross=x.reduce((s,v,i)=>s+(v-a.mean)*(y[i]-b.mean),0),covariance=cross/(x.length-1),r=a.ss>0&&b.ss>0?cross/Math.sqrt(a.ss*b.ss):null;
  return {n:x.length,covariance,r,slope:a.ss>0?cross/a.ss:null,intercept:a.ss>0?b.mean-cross/a.ss*a.mean:null};
}
export function histogram(values,count=6){
  const s=describe(values);if(!s)return [];if(s.range===0)return [{lo:s.min-.5,hi:s.max+.5,count:s.n,values:[...values]}];
  const width=s.range/count;const bins=Array.from({length:count},(_,i)=>({lo:s.min+i*width,hi:s.min+(i+1)*width,count:0,values:[]}));
  for(const v of values){const index=Math.min(count-1,Math.floor((v-s.min)/width));bins[index].count++;bins[index].values.push(v);}return bins;
}
export function percentileRank(values,target){return values.length?100*(values.filter(v=>v<target).length+.5*values.filter(v=>v===target).length)/values.length:null;}
