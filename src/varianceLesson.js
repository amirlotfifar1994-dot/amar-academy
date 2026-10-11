import {parseData} from './stats.js';
import {distributionValue as value} from './distributionComparison.js';

export const variancePresets={
 small:{label:'سه مدت نزدیک · ساعت',values:[6,7,8],unit:'ساعت',note:'میانگین ۷ است؛ فاصله‌ها منفی ۱، صفر و ۱ هستند. جمع فاصله‌های علامت‌دار صفر است، اما پراکندگی صفر نیست.'},
 wide:{label:'همان میانگین، فاصله‌های بیشتر',values:[2,7,12],unit:'ساعت',note:'میانگین همچنان ۷ است؛ فاصله‌ها پنج برابر شده‌اند. انحراف معیار پنج برابر و واریانس ۲۵ برابر مثال اول است.'},
 shifted:{label:'به هر مدت ۱۰ ساعت اضافه کنیم',values:[16,17,18],unit:'ساعت',note:'مرکز به ۱۷ می‌رود؛ فاصله‌ها از میانگین جدید همان منفی ۱، صفر و ۱ می‌مانند. جابه‌جایی یکسان، پراکندگی را تغییر نمی‌دهد.'},
 minutes:{label:'مثال اول را به دقیقه بنویسیم',values:[360,420,480],unit:'دقیقه',note:'همان سه مدتِ ۶،۷،۸ ساعت هستند. هر مقدار و فاصله ۶۰ برابر شده؛ انحراف معیار ۶۰ برابر و واریانس ۳۶۰۰ برابر می‌شود.'},
 tail:{label:'یک فاصلهٔ بزرگ، سهم بیشتر',values:[2,4,6,20],unit:'واحد',note:'میانگین ۸ است. فاصلهٔ مقدار ۲۰ برابر ۱۲ و مجذور آن ۱۴۴ است؛ این مشاهده ۷۲٪ مجموع مجذورها را می‌سازد و در داده باقی می‌ماند.'},
 constant:{label:'مقدارهای برابر؛ پراکندگی صفر',values:[7,7,7,7],unit:'واحد',note:'همهٔ فاصله‌ها و مجذورها صفرند. سهم هر مشاهده از مجموع مجذورها تعریف نمی‌شود، چون مخرج این سهم صفر است.'},
 single:{label:'فقط یک مشاهده',values:[7],unit:'واحد',note:'توصیف این فهرست با مخرج n، واریانس صفر می‌دهد؛ واریانس نمونه‌ای با n−۱ تعریف‌نشده است، چون مخرج صفر می‌شود.'},
};
export const varianceChecks=[
 {id:'signed',question:'برای [۶،۷،۸]، جمع فاصله‌ها از میانگین صفر است. چرا انحراف معیار نمونه‌ای صفر نیست؟',options:['فاصله‌های مثبت و منفی خنثی می‌شوند؛ مجذورها ۱،۰،۱ هستند.','صفر بودن جمع فاصله‌ها یعنی همهٔ مقدارها برابرند.','میانگین اشتباه است؛ باید ۸ باشد.'],correct:0,feedback:['درست است. مجموع مجذورها ۲ است؛ ۲÷(۳−۱)=۱ و ریشهٔ آن ۱ است.','خنثی‌شدن علامت‌ها کافی نیست؛ این سه مقدار با هم فرق دارند.','میانگین (۶+۷+۸)÷۳=۷ است؛ مسئله خنثی‌شدن فاصله‌های علامت‌دار است.']},
 {id:'denominator',question:'برای [۶،۷،۸]، مجموع مجذورها ۲ و n=۳ است. کدام مقایسه درست است؟',options:['هر دو واریانس برابر ۱ هستند.','با n، واریانس ۲÷۳؛ با n−۱، واریانس ۱ است.','تغییر مخرج، خود داده‌های خام را تغییر می‌دهد.'],correct:1,feedback:['صورت یکسان است اما مخرج‌ها ۳ و ۲ هستند؛ نتیجه‌ها فرق دارند.','درست است. قرارداد و هدف را همراه گزارش مشخص کن؛ انتخاب مخرج کیفیت نمونه‌گیری را اثبات نمی‌کند.','فقط قرارداد خلاصه تغییر می‌کند؛ داده‌ها، میانگین و مجموع مجذورها همان‌اند.']},
 {id:'units',question:'اگر ساعت را به دقیقه تبدیل کنیم (ضریب ۶۰)، واریانس و انحراف معیار چه می‌شوند؟',options:['هر دو ۶۰ برابر می‌شوند.','انحراف معیار ثابت می‌ماند؛ فقط واحد عوض می‌شود.','انحراف معیار ۶۰ برابر و واریانس ۳۶۰۰ برابر می‌شود.'],correct:2,feedback:['واریانس مجذور فاصله را دارد؛ ضریب آن ۶۰² است.','عدد انحراف معیار هم با واحد تغییر می‌کند؛ یک ساعت برابر ۶۰ دقیقه است.','درست است. واحد انحراف معیار دقیقه و واحد واریانس دقیقهٔ مربع می‌شود.']},
];
export function varianceSummary(values){
 if(!Array.isArray(values)||!values.length||values.length>200||!Array.from(values).every(x=>Number.isFinite(x)&&Math.abs(x)<=1e9))return null;
 const n=values.length,origin=values[0],mean=origin+values.reduce((sum,x)=>sum+(x-origin),0)/n;
 const deviations=values.map(x=>x-mean),scale=Math.max(...deviations.map(Math.abs));
 const normalized=scale?deviations.map(d=>d/scale):deviations.map(()=>0),normalizedSS=normalized.reduce((sum,d)=>sum+d*d,0);
 const ss=(scale*normalizedSS)*scale;
 const measure=denominator=>denominator>0?{denominator,variance:((scale*normalizedSS)/denominator)*scale,sd:scale*Math.sqrt(normalizedSS/denominator)}:{denominator,variance:null,sd:null};
 const population=measure(n),sample=measure(n-1),absoluteMean=scale*normalized.reduce((sum,d)=>sum+Math.abs(d),0)/n;
 const rows=values.map((x,index)=>({index,value:x,deviation:deviations[index],square:deviations[index]**2,squareUnderflow:deviations[index]!==0&&deviations[index]**2===0,share:normalizedSS>0?normalized[index]**2/normalizedSS:null,normalized:normalized[index]}));
 return {n,mean,scale,ss,ssUnderflow:scale>0&&ss===0,signedSum:deviations.reduce((sum,d)=>sum+d,0),absoluteMean,absoluteUnderflow:scale>0&&absoluteMean===0,population,sample,rows};
}
export function varianceNumber(number,underflow=false){return number===null?'تعریف‌نشده':underflow?'کوچک‌تر از دقت عددی':value(number);}
export function varianceDisplay(number,underflow=false){return number===null||underflow?varianceNumber(number,underflow):new Intl.NumberFormat('fa-IR',{maximumSignificantDigits:6,...(number!==0&&(Math.abs(number)<1e-6||Math.abs(number)>=1e8)?{notation:'scientific'}:{})}).format(number);}
export function initialVariance(id='small'){
 const key=Object.hasOwn(variancePresets,id)?id:'small',preset=variancePresets[key];
 return {preset:key,text:preset.values.join(', '),unit:preset.unit,denominator:'sample',plot:'distance',selected:null,answers:{},checked:{}};
}
export function analyzeVariance(state){const data=parseData(state.text);return {data,summary:data.error?null:varianceSummary(data.values)};}
export function varianceReducer(state,action){
 if(action.type==='preset')return Object.hasOwn(variancePresets,action.id)?initialVariance(action.id):state;
 if(action.type==='reset')return initialVariance(Object.hasOwn(variancePresets,state.preset)?state.preset:'small');
 if(action.type==='data'&&typeof action.value==='string'&&action.value.length<=8000)return {...state,text:action.value,preset:'custom',selected:null};
 if(action.type==='unit'&&typeof action.value==='string'&&action.value.length<=60)return {...state,unit:action.value};
 if(action.type==='denominator'&&['sample','population'].includes(action.value))return {...state,denominator:action.value};
 if(action.type==='plot'&&['distance','square'].includes(action.value))return {...state,plot:action.value};
 if(action.type==='select'){
  const summary=analyzeVariance(state).summary;
  return action.index===null||summary&&Number.isInteger(action.index)&&action.index>=0&&action.index<summary.n?{...state,selected:state.selected===action.index?null:action.index}:state;
 }
 const question=varianceChecks.find(q=>q.id===action.id);
 if(action.type==='answer'&&question&&Number.isInteger(action.value)&&action.value>=0&&action.value<question.options.length)return {...state,answers:{...state.answers,[action.id]:action.value},checked:{...state.checked,[action.id]:false}};
 if(action.type==='check'&&question&&Number.isInteger(state.answers[action.id]))return {...state,checked:{...state.checked,[action.id]:true}};
 return state;
}
export function buildVarianceReport(state){
 const {data,summary:s}=analyzeVariance(state),unit=state.unit.trim()||'واحد مشخص‌نشده';
 const lines=['آمارآموز — از فاصله تا واریانس',`واحد اعلام‌شده: ${unit}`,`قرارداد انتخاب‌شده: ${state.denominator==='sample'?'نمونه‌ای با n−۱':'توصیف کل فهرست با n'}`,Object.hasOwn(variancePresets,state.preset)?'مثال ساختگی: '+variancePresets[state.preset].label:'دادهٔ واردشدهٔ کاربر؛ منبع در ابزار تأیید نمی‌شود.'];
 if(!s)lines.push('نتیجه محاسبه نشده است؛ ورودی را اصلاح کن.',data.error||'');
 else{
  lines.push(`n=${s.n}؛ میانگین=${value(s.mean)}؛ مجموع فاصله‌های علامت‌دار=${value(s.signedSum)}؛ مجموع مجذورها=${varianceNumber(s.ss,s.ssUnderflow)} (${unit} مربع).`);
  for(const [label,m] of [['مخرج n',s.population],['مخرج n−۱',s.sample]])lines.push(`${label}: مخرج=${m.denominator}؛ واریانس=${varianceNumber(m.variance,m.variance===0&&s.scale>0)} (${unit} مربع)؛ انحراف معیار=${varianceNumber(m.sd,m.sd===0&&s.scale>0)} (${unit}).`);
  lines.push(`میانگین فاصلهٔ مطلق از میانگین=${varianceNumber(s.absoluteMean,s.absoluteUnderflow)} (${unit})؛ این شاخص انحراف معیار یا MAD خام نیست.`,'ردیف‌های اصلی: مقدار؛ فاصله؛ مجذور فاصله؛ سهم مجموع مجذورها');
  for(const row of s.rows)lines.push(`${row.index+1}: ${value(row.value)}؛ ${value(row.deviation)}؛ ${varianceNumber(row.square,row.squareUnderflow)}؛ ${row.share===null?'تعریف‌نشده':value(100*row.share)+'٪'}.`);
  lines.push('داده‌ها با ترتیب و دقت پذیرفته‌شده: ['+data.values.map(String).join(', ')+']');
 }
 lines.push('','واریانس: مجموع مجذور فاصله‌ها تقسیم بر مخرج اعلام‌شده. انحراف معیار: ریشهٔ واریانس، در واحد اصلی داده.','مخرج n کل فهرست مشاهده‌شده را توصیف می‌کند؛ n−۱ قرارداد واریانس نمونه‌ای است و برای یک مشاهده تعریف نمی‌شود.','با میانگین محاسبه‌شده از همین n مشاهده، جمع فاصله‌ها از نظر ریاضی صفر است؛ خطای ممیز شناور می‌تواند باقی‌ماندهٔ کوچک بسازد.','محاسبهٔ مجذورها برای داده‌های بسیار کوچک می‌تواند زیر دقت Number باشد؛ این مورد صفر واقعی نامیده نمی‌شود. سهم‌ها و انحراف معیار با فاصله‌های مقیاس‌شده محاسبه می‌شوند.','انتخاب مخرج، نمایندگی نمونه، نرمال‌بودن یا تعمیم به جامعه را تأیید نمی‌کند؛ هیچ مشاهده‌ای خودکار حذف یا به صفر تبدیل نمی‌شود.');
 return lines.join('\n');
}
