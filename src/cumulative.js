import {parseData,quantile} from './stats.js';
import {distributionValue} from './distributionComparison.js';

export const cumulativePresets={
 waiting:{label:'انتظار مشاوره؛ دو سؤال عملی',values:[2,3,3,5,7,12,18,20],threshold:10,percent:75,explanation:'زمان انتظار هشت نفر برحسب دقیقه است. پنج نفر حداکثر ۱۰ دقیقه منتظر بوده‌اند: ۶۲٫۵٪. برای سؤال «کدام زمان دست‌کم ۷۵٪ را پوشش می‌دهد؟»، نوع ۱ مقدار ۱۲ دقیقه را انتخاب می‌کند؛ صدک نوع ۷ در همین داده‌ها ۱۳٫۵ دقیقه است.'},
 ties:{label:'نمره‌های برابر؛ سه درصد متفاوت',values:[1,2,2,2,4,6],threshold:2,percent:50,explanation:'از شش نمره، یک نمره کمتر از ۲ و سه نمره برابر ۲ است. سهمِ کمتر از ۲، سهمِ حداکثر ۲ و رتبه با نصف وزن تساوی سه عدد متفاوت‌اند.'},
 even:{label:'چهار مقدار؛ میانه بین دو مشاهده',values:[2,4,6,8],threshold:5,percent:50,explanation:'میانهٔ معمول داده‌های کمی ۵ است؛ در صدک نوع ۷ نیز صدک ۵۰ برابر ۵ می‌شود. نوع ۱ نخستین مقدار با سهم تجمعی دست‌کم ۵۰٪ را انتخاب می‌کند: ۴.'},
 gaps:{label:'فاصلهٔ خالی؛ خط پله‌ای می‌ماند',values:[1,2,8,9],threshold:5,percent:40,explanation:'هیچ مقداری بین ۲ و ۸ نداریم؛ سهم حداکثرِ یک نمره در این فاصله ثابت است. تجمع تجربی، خط صافِ پیوسته بین مشاهده‌ها نیست.'},
 constant:{label:'همهٔ نمره‌ها برابر',values:[7,7,7,7],threshold:7,percent:50,explanation:'در نمرهٔ ۷، تجمع از صفر به ۱۰۰٪ می‌پرد. هر دو قرارداد صدک، ۷ را انتخاب می‌کنند؛ رتبه با نصف وزن تساوی ۵۰٪ است.'},
 zero:{label:'صفر واقعی و آستانهٔ خارج از داده',values:[0,0,1,3,5],threshold:-1,percent:80,explanation:'دو صفر، مشاهده‌های واقعی‌اند و در مخرج می‌مانند. برای آستانهٔ پایین‌تر از کمینه، سهم تجمعی صفر است؛ برای بالاتر از بیشینه، ۱۰۰٪.'},
};
export const cumulativeChecks=[
 {id:'ties',question:'در مثال ثابت [۱،۲،۲،۲،۴،۶]، چند درصدِ نمره‌ها حداکثر ۲ هستند؟',options:['حدود ۱۶٫۶۷٪؛ فقط نمرهٔ کمتر از ۲.','حدود ۶۶٫۶۷٪؛ یک نمرهٔ کمتر و سه نمرهٔ برابر.','حدود ۴۱٫۶۷٪؛ نصف وزن نمره‌های برابر.'],correct:1,feedback:['«حداکثر ۲» نمره‌های برابر ۲ را هم شامل می‌شود؛ چهار نمره از شش نمره حساب می‌شوند.','درست است؛ F(۲)=۴÷۶. این سهم تجربیِ همین داده‌هاست.','نصف وزن تساوی قرارداد رتبهٔ درصدی دیگری است؛ تجمع تجربی همهٔ تساوی‌ها را شامل می‌شود.']},
 {id:'quantile',question:'برای [۲،۴،۶،۸]، صدک ۵۰ نوع ۱ برابر ۴ و نوع ۷ برابر ۵ است. چه توضیحی درست است؟',options:['نوع ۱ جایگاه تجمعی را انتخاب می‌کند؛ نوع ۷ بین دو مقدار میانی درون‌یابی می‌کند.','یکی حتماً خطای محاسباتی دارد.','نوع ۷ یعنی پنج نفر زیر نمره‌اند.'],correct:0,feedback:['درست است؛ قرارداد را همراه صدک گزارش کن. میانهٔ معمول این چهار مقدار کمی، میانگین ۴ و ۶ یعنی ۵ است.','قراردادهای متفاوت می‌توانند نتیجهٔ متفاوت بسازند؛ ورودی و روش هر دو را بررسی کن.','۵ یک مقدار روی مقیاس نمره است، نه تعداد افراد؛ صدک با شمارش یا رتبهٔ درصدی یکی نیست.']},
 {id:'gap',question:'در [۱،۲،۸،۹]، آستانه را از ۳ به ۷ می‌بریم. سهم حداکثرِ آستانه چه تغییری می‌کند؟',options:['به‌طور پیوسته از ۵۰٪ تا ۱۰۰٪ زیاد می‌شود.','صفر می‌شود، چون آستانه‌ها در داده نیستند.','۵۰٪ می‌ماند؛ در فاصلهٔ ۲ تا ۸ مشاهده‌ای اضافه نمی‌شود.'],correct:2,feedback:['تجمع تجربی فقط در مقدارهای مشاهده‌شده می‌پرد؛ خط بین آن‌ها افقی است.','آستانه لازم نیست خودش در داده دیده شده باشد؛ تعداد نمره‌های حداکثر آن را می‌شماریم.','درست است؛ در هر دو آستانه فقط ۱ و ۲ شمرده می‌شوند، یعنی دو نمره از چهار نمره.']},
];
function validValues(values){return Array.isArray(values)&&values.length>=1&&values.length<=200&&Array.from(values).every(v=>Number.isFinite(v)&&Math.abs(v)<=1e9);}
export function cumulativeSummary(values,threshold,percent){
 if(!validValues(values)||!Number.isFinite(threshold)||Math.abs(threshold)>1e9||!Number.isFinite(percent)||percent<1||percent>100)return null;
 const n=values.length,sorted=[...values].sort((a,b)=>a-b),groups=[];
 sorted.forEach(value=>{if(groups.at(-1)?.value===value)groups.at(-1).count++;else groups.push({value,count:1});});
 let cumulative=0;
 for(const group of groups){group.before=cumulative;group.cumulative=cumulative+=group.count;group.share=group.count/n;group.fraction=group.cumulative/n;group.indices=values.flatMap((v,i)=>v===group.value?[i]:[]);}
 const below=values.filter(v=>v<threshold).length,equal=values.filter(v=>v===threshold).length,above=n-below-equal;
 const target=n*percent/100,position=Math.ceil(target),discrete=sorted[position-1];
 const index=(n-1)*(percent/100),lo=Math.floor(index),hi=Math.ceil(index),weight=index-lo,interpolated=quantile(sorted,percent/100);
 return {n,values:[...values],sorted,groups,threshold,percent,below,equal,above,strict:below/n,inclusive:(below+equal)/n,midrank:(below+equal/2)/n,target,position,discrete,index,lo,hi,weight,interpolated,discreteFraction:values.filter(v=>v<=discrete).length/n,interpolatedFraction:values.filter(v=>v<=interpolated).length/n};
}
function singleNumber(text,label,min,max){const parsed=parseData(text);if(parsed.error||parsed.values.length!==1)return {value:null,error:label+': یک عدد معتبر وارد کن؛ خانهٔ خالی صفر نیست.'};const value=parsed.values[0];return value<min||value>max?{value:null,error:label+` باید بین ${distributionValue(min)} و ${distributionValue(max)} باشد.`}:{value,error:null};}
export function analyzeCumulative(state){
 const data=parseData(state.xtext),threshold=singleNumber(state.threshold,'آستانه',-1e9,1e9),percent=singleNumber(state.percent,'درصد هدف',1,100);
 const error=data.error||threshold.error||percent.error;
 return {data,threshold,percent,error,summary:error?null:cumulativeSummary(data.values,threshold.value,percent.value)};
}
export function initialCumulativeState(id='ties'){const key=Object.hasOwn(cumulativePresets,id)?id:'ties',p=cumulativePresets[key];return {preset:key,xtext:p.values.join(', '),threshold:String(p.threshold),percent:String(p.percent),selected:null,answers:{},checked:{}};}
export function cumulativeReducer(state,action){
 if(action.type==='preset')return Object.hasOwn(cumulativePresets,action.id)?initialCumulativeState(action.id):state;
 if(action.type==='reset')return initialCumulativeState(state.preset);
 if(action.type==='data'&&['xtext','threshold','percent'].includes(action.field)&&typeof action.value==='string')return {...state,[action.field]:action.value,selected:null};
 if(action.type==='select'){
  const s=analyzeCumulative(state).summary;
  if(action.index===null)return {...state,selected:null};
  if(s&&Number.isInteger(action.index)&&s.groups[action.index])return {...state,selected:action.index,threshold:String(s.groups[action.index].value)};
 }
 if(action.type==='useQuantile'&&['discrete','interpolated'].includes(action.method)){const s=analyzeCumulative(state).summary;if(s)return {...state,threshold:String(s[action.method]),selected:null};}
 const q=cumulativeChecks.find(q=>q.id===action.id);
 if(action.type==='answer'&&q&&Number.isInteger(action.value)&&q.options[action.value]!==undefined)return {...state,answers:{...state.answers,[q.id]:action.value},checked:{...state.checked,[q.id]:false}};
 if(action.type==='check'&&q&&Number.isInteger(state.answers[q.id]))return {...state,checked:{...state.checked,[q.id]:true}};
 return state;
}
export function cumulativePercent(value){return new Intl.NumberFormat('fa-IR',{maximumFractionDigits:2}).format(value*100)+'٪';}
export function buildCumulativeReport(state){
 const a=analyzeCumulative(state),s=a.summary,lines=['آمارآموز · تجمع تجربی و قراردادهای صدک','مثال‌ها ساختگی‌اند؛ این گزارش توصیفیِ همین داده‌هاست.','ورودی مقدارها: '+state.xtext,'آستانه: '+state.threshold,'درصد هدف: '+state.percent];
 if(!s)return [...lines,'نتیجه محاسبه نشد: '+a.error].join('\n');
 lines.push('مقدارهای پذیرفته‌شده به ترتیب اصلی: '+s.values.join(', '),'تعداد معتبر: '+s.n,'قرارداد تجمع: F(t)=تعداد X≤t / n؛ برابرها کامل شمرده می‌شوند.','کمتر از آستانه: '+s.below,'برابر آستانه: '+s.equal,'بیشتر از آستانه: '+s.above,'سهم کمتر: '+s.strict,'سهم حداکثر: '+s.inclusive,'رتبهٔ درصدی با نصف وزن تساوی: '+s.midrank*100,'نوع ۱: جایگاه ceil(n×p/100)='+s.position+'؛ مقدار='+s.discrete+'؛ سهم تجمعی در مقدار='+s.discreteFraction,'نوع ۷: h=1+(n−1)×p/100='+ (s.index+1)+'؛ جایگاه‌های '+(s.lo+1)+' و '+(s.hi+1)+'؛ وزن درون‌یابی='+s.weight+'؛ مقدار='+s.interpolated+'؛ سهم تجمعی در مقدار='+s.interpolatedFraction,'مقدار | تعداد | تعداد کمتر | تعداد حداکثر | سهم حداکثر | شمارهٔ ردیف‌های اصلی');
 s.groups.forEach(g=>lines.push(`${g.value} | ${g.count} | ${g.before} | ${g.cumulative} | ${g.fraction} | ${g.indices.map(i=>i+1).join(', ')}`));
 lines.push('درصدهای نمایشی گرد می‌شوند؛ محاسبه روی Number پذیرفته‌شده است، بدون تلورانس مرزی اضافه.','نوع ۱ و نوع ۷ قراردادهای متفاوت‌اند؛ صدک درون‌یابی‌شده ممکن است مشاهدهٔ خام نباشد. این روش‌ها همهٔ قراردادهای نرم‌افزارها را پوشش نمی‌دهند.','نمودار سهم تجربیِ همین داده‌هاست؛ احتمال جامعه، نرمال‌بودن یا علت را اثبات نمی‌کند. دادهٔ گمشده به صفر تبدیل یا خودکار حذف نشده است.');
 return lines.join('\n');
}
