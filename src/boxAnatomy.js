import {describe,quantile} from './stats.js';
import {distributionValue as value} from './distributionComparison.js';

export const boxExamples={
 tail:{label:'کرانه با سبیل فرق دارد',values:[1,2,3,4,5,6,7,100]},
 boundary:{label:'یک مقدار دقیقاً روی کرانه',values:[0,1,2,3,4,5,9]},
 ties:{label:'IQR صفر، با یک مقدار متفاوت',values:[0,0,0,0,10]},
 constant:{label:'همهٔ مقدارها برابر',values:[7,7,7,7]},
};
export const boxChecks=[
 {id:'whisker',question:'در مثال [۱،۲،۳،۴،۵،۶،۷،۱۰۰]، کرانهٔ بالا ۱۱٫۵ است. انتهای سبیل بالا کجاست؟',options:['۱۱٫۵؛ خود کرانه است.','۷؛ آخرین مقدار واقعی داخل کرانه‌هاست.','۱۰۰؛ همیشه بیشینهٔ کل داده است.'],correct:1,feedback:['کرانه از فرمول به دست می‌آید؛ در این فهرست مشاهده‌ای برابر ۱۱٫۵ نداریم.','درست است. ۷ آخرین مشاهدهٔ مجاز برای سبیل است؛ ۱۰۰ جدا علامت می‌خورد و همچنان در داده می‌ماند.','در این نوع نمودار، بیشینه وقتی خارج کرانه باشد انتهای سبیل نیست.']},
 {id:'boundary',question:'در مثال [۰،۱،۲،۳،۴،۵،۹]، کرانهٔ بالا دقیقاً ۹ است. مشاهدهٔ ۹ چگونه طبقه‌بندی می‌شود؟',options:['داخل کرانه؛ برابری، دورافتادگی نیست.','دورافتاده؛ رسیدن به کرانه کافی است.','از محاسبات حذف می‌شود.'],correct:0,feedback:['درست است. قرارداد این ابزار x < کرانهٔ پایین یا x > کرانهٔ بالاست؛ مقایسه‌ها روی مقدار محاسبه‌شده انجام می‌شوند.','مقایسه سخت است: فقط مقدار بزرگ‌تر از کرانهٔ بالا علامت می‌خورد.','این ابزار هیچ مشاهده‌ای را به‌دلیل دورافتادگی حذف نمی‌کند.']},
 {id:'ties',question:'در مثال [۰،۰،۰،۰،۱۰]، Q1=Q3=۰ است. چند مشاهده در بازهٔ بستهٔ جعبه قرار دارد؟',options:['همیشه نصف؛ یعنی ۲٫۵ مشاهده.','هیچ‌کدام؛ عرض جعبه صفر است.','۴ از ۵، یعنی ۸۰٪؛ تساوی‌ها روی مرز هم شمرده می‌شوند.'],correct:2,feedback:['تعداد مشاهده صحیح است؛ فاصلهٔ صدک‌های ۲۵ و ۷۵ لزوماً دقیقاً نصف مشاهده‌های این نمونه را در خود ندارد.','چهار صفر با هر دو مرز برابرند و داخل بازهٔ بسته قرار دارند.','درست است. عرض صفر، تعداد صفر نیست؛ IQR صفر هم برابری همهٔ مقدارها را ثابت نمی‌کند.']},
];
export function boxAnatomy(values){
 if(!Array.isArray(values)||!values.length||values.length>200||Array.from(values).some(x=>!Number.isFinite(x)||Math.abs(x)>1e9))return null;
 const stats=describe(values),ordered=values.map((x,index)=>({value:x,index})).sort((a,b)=>a.value-b.value||a.index-b.index);
 const quartiles=[['Q1',.25],['میانه',.5],['Q3',.75]].map(([label,p])=>{
  const index=(values.length-1)*p,lo=Math.floor(index),hi=Math.ceil(index);
  return {label,p,position:index+1,lo:lo+1,hi:hi+1,weight:index-lo,lower:ordered[lo].value,upper:ordered[hi].value,value:quantile(stats.sorted,p)};
 });
 const groups=[];
 for(const row of ordered){
  const last=groups.at(-1);
  if(last?.value===row.value)last.indices.push(row.index);
  else groups.push({value:row.value,indices:[row.index],region:row.value<stats.lower?'low':row.value>stats.upper?'high':'inside',inBox:row.value>=stats.q1&&row.value<=stats.q3});
 }
 let rank=1;for(const group of groups){group.start=rank;group.end=rank+group.indices.length-1;rank=group.end+1;}
 const insideBox=values.filter(x=>x>=stats.q1&&x<=stats.q3).length;
 return {stats,quartiles,groups,insideBox,boxPercent:100*insideBox/values.length};
}
export function boxRegionLabel(region){return region==='low'?'پایین‌تر از کرانه':region==='high'?'بالاتر از کرانه':'داخل کرانه‌ها';}
export function boxAnatomyReport(values){
 const analysis=boxAnatomy(values);if(!analysis)return '';
 const {stats:s,quartiles,groups,insideBox}=analysis;
 return ['جزئیات نمودار جعبه‌ای — چارک نوع ۷ و کرانهٔ ۱٫۵ IQR',
  `کرانه‌های محاسبه‌شده: ${value(s.lower)} تا ${value(s.upper)}؛ انتهای سبیل‌های مشاهده‌شده: ${value(s.whiskerLow)} تا ${value(s.whiskerHigh)}.`,
  `بازهٔ بستهٔ Q1 تا Q3: ${value(s.q1)} تا ${value(s.q3)}؛ ${insideBox} از ${s.n} مشاهده در این بازه‌اند.`,
  ...quartiles.map(q=>`${q.label}: h=${value(q.position)}؛ جایگاه‌ها ${q.lo} و ${q.hi}؛ مقدارها ${value(q.lower)} و ${value(q.upper)}؛ وزن درون‌یابی=${value(q.weight)}؛ نتیجه=${value(q.value)}.`),
  'مقدارهای متمایز و ردیف‌های اصلی (شماره از ۱):',
  ...groups.map(g=>`${value(g.value)}؛ ردیف‌ها ${g.indices.map(i=>i+1).join(', ')}؛ ${boxRegionLabel(g.region)}؛ ${g.inBox?'در بازهٔ جعبه':'بیرون بازهٔ جعبه'}.`),
  'برابری با کرانه داخل محسوب می‌شود؛ مقدار دورافتاده فقط با < یا > علامت می‌خورد. مقایسه پیش از گردکردن نمایش و بدون تلورانس افزوده است.',
  'سبیل، کرانه و کمینه/بیشینه مفاهیم متفاوت‌اند. با تساوی‌ها و قرارداد چارک، شمار داخل بازهٔ بسته لزوماً نصف n نیست.',
  'دادهٔ اصلی با ترتیب و دقت پذیرفته‌شده: ['+values.map(String).join(', ')+']',
  'هیچ داده‌ای حذف نمی‌شود؛ علامت دورافتادگی خطای ثبت، نرمال‌بودن یا علت را اثبات نمی‌کند.',
 ].join('\n');
}
