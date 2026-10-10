import {parseData} from './stats.js';
import {number} from './format.js';
import {distributionValue} from './distributionComparison.js';

export const rankPresets={
 linear:{label:'رابطهٔ خطی مثبت',x:[1,2,3,4,5],y:[2,4,6,8,10],scale:'quantitative',explanation:'با افزایش X، مقدار Y روی یک خط افزایش می‌یابد. پیرسون و اسپیرمن هر دو برابر ۱ هستند.'},
 monotone:{label:'افزایشی، ولی روی خط نیست',x:[1,2,3,4,5],y:[1,2,4,8,64],scale:'quantitative',explanation:'ترتیب Y با X کاملاً افزایشی است، اما فاصله‌ها روی یک خط قرار ندارند. اسپیرمن ۱ است؛ پیرسون کوچک‌تر از ۱ است.'},
 curved:{label:'رابطهٔ خمیده با دو ضریب صفر',x:[1,2,3,4,5],y:[4,1,0,1,4],scale:'quantitative',explanation:'Y ابتدا کم و سپس زیاد می‌شود. در این مثال پیرسون و اسپیرمن هر دو صفرند؛ نمودار همچنان یک رابطهٔ خمیده نشان می‌دهد.'},
 ties:{label:'کدهای ترتیبی و رتبه‌های برابر',x:[1,2,2,4],y:[1,3,2,4],scale:'ordinal',explanation:'کد بزرگ‌تر یعنی طبقهٔ بالاتر؛ فاصلهٔ کدها فرض اندازه‌گیری نیست. دو مقدار ۲ در X جایگاه‌های ۲ و ۳ را شریک‌اند و هر دو رتبهٔ ۲٫۵ می‌گیرند.'},
 influential:{label:'یک جفت دور و تغییر رابطه',x:[1,2,3,4,5,6],y:[1,2,3,4,5,-20],scale:'quantitative',explanation:'پنج جفت اول روی یک خط افزایشی‌اند؛ جفت آخر نتیجه را تغییر می‌دهد. آن را انتخاب و سناریوی بدون آن را مقایسه کن. این آزمایش مجوز حذف نیست و اسپیرمن هم در برابر تغییر داده مصون نیست.'},
 constant:{label:'یک متغیر ثابت',x:[7,7,7,7],y:[1,2,3,4],scale:'quantitative',explanation:'X و رتبه‌های X ثابت‌اند؛ هر دو ضریب تعریف‌نشده‌اند. تعریف‌نشده را با صفر یا نبود رابطه یکی نکن.'},
};
export const rankChecks=[
 {id:'ties',question:'در مثال ثابت X=[۱،۲،۲،۴]، دو مقدار ۲ چه رتبه‌هایی می‌گیرند؟',options:['۲ و ۳؛ به ترتیب ظاهرشدن در فایل.','هر دو ۲٫۵؛ میانگین جایگاه‌های ۲ و ۳.','هر دو ۲؛ رتبهٔ کمینه.'],correct:1,feedback:['این کار میان مقدارهای برابر فرق دلخواه می‌گذارد؛ قرارداد این ابزار رتبهٔ متوسط است.','درست است؛ (۲+۳)÷۲=۲٫۵ و هر دو مقدار برابر همین رتبه را می‌گیرند.','رتبهٔ کمینه قرارداد دیگری است؛ اینجا برای اسپیرمن، رتبهٔ متوسط جایگاه‌های برابر را می‌گیریم.']},
 {id:'curve',question:'در مثال ثابت X=[۱،۲،۳،۴،۵] و Y=[۴،۱،۰،۱،۴]، پیرسون و اسپیرمن صفرند. کدام برداشت درست است؟',options:['هیچ نوع رابطه‌ای در داده‌ها وجود ندارد.','هر دو متغیر ثابت‌اند.','نمودار رابطهٔ خمیده دارد؛ این دو ضریب آن را با رابطهٔ خطی یا روند یک‌جهته خلاصه نمی‌کنند.'],correct:2,feedback:['صفر بودن این دو خلاصه، نبود همهٔ شکل‌های رابطه را اثبات نمی‌کند؛ نمودار U شکل است.','مقدارهای هر دو متغیر تغییر می‌کنند؛ مسئله شکل رابطه است، نه ثابت بودن داده.','درست است؛ Y ابتدا کاهش و سپس افزایش دارد. دیدن شکل رابطه ضروری است.']},
 {id:'pairing',question:'برای ساختن رتبه‌ها و محاسبهٔ اسپیرمن چه چیزی باید حفظ شود؟',options:['هر X باید با Y همان مشاهده جفت بماند؛ رتبه‌ها به ردیف اصلی برمی‌گردند.','X و Y را جدا مرتب می‌کنیم و ردیف‌های مرتب‌شده را جفت می‌کنیم.','با رتبه‌گذاری می‌توان از همبستگی علت را نتیجه گرفت.'],correct:0,feedback:['درست است؛ مرتب‌کردن برای یافتن رتبه است و هویت هر جفت باید حفظ شود.','این کار جفت‌های واقعی را عوض می‌کند و معمولاً رابطه‌ای ساختگی می‌سازد.','رتبه‌گذاری طراحی پژوهش را عوض نمی‌کند؛ همبستگی رتبه‌ای نیز به‌تنهایی علت را ثابت نمی‌کند.']},
];
function validValues(values){return Array.isArray(values)&&values.length>=1&&values.length<=200&&Array.from(values).every(v=>Number.isFinite(v)&&Math.abs(v)<=1e9);}
export function rankValues(values){
 if(!validValues(values))return null;
 const ordered=values.map((value,index)=>({value,index})).sort((a,b)=>a.value-b.value||a.index-b.index),ranks=Array(values.length),groups=[],byIndex=Array(values.length);
 for(let start=0;start<ordered.length;){let end=start;while(end+1<ordered.length&&ordered[end+1].value===ordered[start].value)end++;
  const rank=(start+1+end+1)/2,group={value:ordered[start].value,start:start+1,end:end+1,rank,indices:ordered.slice(start,end+1).map(row=>row.index)};
  for(const index of group.indices){ranks[index]=rank;byIndex[index]=groups.length;}groups.push(group);start=end+1;
 }
 return {ranks,groups,byIndex};
}
// Rescaling before centering preserves r and avoids squaring very small raw values.
export function linearCorrelation(x,y){
 if(!validValues(x)||!validValues(y)||x.length!==y.length||x.length<2)return null;
 const xmin=Math.min(...x),xspan=Math.max(...x)-xmin,ymin=Math.min(...y),yspan=Math.max(...y)-ymin;
 if(!xspan||!yspan)return null;
 const a=x.map(v=>(v-xmin)/xspan),b=y.map(v=>(v-ymin)/yspan),mx=a.reduce((s,v)=>s+v,0)/a.length,my=b.reduce((s,v)=>s+v,0)/b.length;
 const sx=a.reduce((s,v)=>s+(v-mx)**2,0),sy=b.reduce((s,v)=>s+(v-my)**2,0),cross=a.reduce((s,v,i)=>s+(v-mx)*(b[i]-my),0);
 return Math.max(-1,Math.min(1,cross/Math.sqrt(sx*sy)));
}
export function summarizeRankPairs(x,y,scale='quantitative'){
 if(!['quantitative','ordinal'].includes(scale)||!validValues(x)||!validValues(y)||x.length!==y.length||x.length<2)return null;
 const rx=rankValues(x),ry=rankValues(y),mean=(x.length+1)/2;
 const ssX=rx.ranks.reduce((sum,v)=>sum+(v-mean)**2,0),ssY=ry.ranks.reduce((sum,v)=>sum+(v-mean)**2,0),cross=rx.ranks.reduce((sum,v,i)=>sum+(v-mean)*(ry.ranks[i]-mean),0);
 return {n:x.length,x:[...x],y:[...y],rx,ry,pearson:scale==='quantitative'?linearCorrelation(x,y):null,spearman:linearCorrelation(rx.ranks,ry.ranks),mean,ssX,ssY,cross};
}
function presetState(id){const p=rankPresets[id];return {preset:id,xtext:p.x.join(', '),ytext:p.y.join(', '),scale:p.scale,selected:null,omitted:null,answers:{},checked:{}};}
export function initialRankState(){return presetState('linear');}
export function analyzeRanks(state){
 const x=parseData(state.xtext),y=parseData(state.ytext);
 const error=x.error||y.error||(x.values.length!==y.values.length?'تعداد X و Y باید برابر باشد؛ هر ردیف یک جفت است.':x.values.length<2?'برای همبستگی دست‌کم دو جفت لازم است.':!['quantitative','ordinal'].includes(state.scale)?'نوع داده را مشخص کن.':null);
 if(error)return {x,y,error,summary:null,scenario:null};
 const summary=summarizeRankPairs(x.values,y.values,state.scale);
 const omitted=Number.isInteger(state.omitted)&&state.omitted>=0&&state.omitted<summary.n?state.omitted:null;
 const scenario=omitted===null?null:summarizeRankPairs(x.values.filter((_,i)=>i!==omitted),y.values.filter((_,i)=>i!==omitted),state.scale);
 return {x,y,error:null,summary,scenario};
}
export function coefficientText(value){
 if(value===null)return 'تعریف‌نشده';
 if(value===0||Math.abs(value)===1)return distributionValue(value);
 if(Math.abs(value)<.0001)return (value<0?'منفی':'مثبت')+'؛ قدر مطلق کمتر از ۰٫۰۰۰۱';
 return '≈ '+new Intl.NumberFormat('fa-IR',{maximumFractionDigits:4}).format(value);
}
export function rankReducer(state,action){
 if(action.type==='preset')return Object.hasOwn(rankPresets,action.id)?presetState(action.id):state;
 if(action.type==='reset')return presetState(Object.hasOwn(rankPresets,state.preset)?state.preset:'linear');
 if(action.type==='data')return ['xtext','ytext'].includes(action.field)&&typeof action.value==='string'&&action.value.length<=10000?{...state,[action.field]:action.value,selected:null,omitted:null}:state;
 if(action.type==='scale')return ['quantitative','ordinal'].includes(action.value)?{...state,scale:action.value}:state;
 if(action.type==='select'){const n=analyzeRanks(state).summary?.n;return action.index===null||Number.isInteger(action.index)&&action.index>=0&&action.index<n?{...state,selected:action.index}:state;}
 if(action.type==='omit'){const n=analyzeRanks(state).summary?.n;return action.index===null||Number.isInteger(action.index)&&action.index>=0&&action.index<n?{...state,omitted:action.index}:state;}
 if(action.type==='answer'){const q=rankChecks.find(q=>q.id===action.id);return q&&Number.isInteger(action.value)&&q.options[action.value]?{...state,answers:{...state.answers,[q.id]:action.value},checked:{...state.checked,[q.id]:false}}:state;}
 if(action.type==='check')return rankChecks.some(q=>q.id===action.id)&&Number.isInteger(state.answers[action.id])?{...state,checked:{...state.checked,[action.id]:true}}:state;
 return state;
}
export function buildRankReport(state){
 const a=analyzeRanks(state),s=a.summary,lines=['گزارش توصیفی رابطهٔ رتبه‌ها',state.scale==='ordinal'?'کدهای ترتیبی با ترتیب معلوم؛ پیرسون کدها محاسبه نمی‌شود.':'دو متغیر کمی با فاصله‌های عددی معنادار.','رتبهٔ ۱ برای کوچک‌ترین مقدار؛ تساوی‌ها با میانگین جایگاه‌ها. جفت‌ها در ترتیب اصلی حفظ شده‌اند.'];
 if(!s)return [...lines,'ورودی نامعتبر است؛ نتیجهٔ عددی گزارش نمی‌شود.'].join('\n');
 lines.push(`تعداد جفت‌ها: ${number(s.n)}`,`اسپیرمن: ${coefficientText(s.spearman)}`);
 if(state.scale==='quantitative')lines.push(`پیرسون: ${coefficientText(s.pearson)}`);
 lines.push('ردیف,X,Y,رتبه X,رتبه Y');
 for(let i=0;i<s.n;i++)lines.push([i+1,s.x[i],s.y[i],s.rx.ranks[i],s.ry.ranks[i]].join(','));
 if(state.omitted!==null){lines.push(`سناریوی آزمایشی بدون جفت ${number(state.omitted+1)}؛ دادهٔ کامل بالا حفظ شده است.`);if(a.scenario){lines.push(`تعداد جفت‌های سناریو: ${number(a.scenario.n)}؛ رتبه‌ها از نو محاسبه شده‌اند.`,`اسپیرمن سناریو: ${coefficientText(a.scenario.spearman)}`);if(state.scale==='quantitative')lines.push(`پیرسون سناریو: ${coefficientText(a.scenario.pearson)}`);}else lines.push('پس از کنارگذاشتن این جفت، کمتر از دو جفت باقی می‌ماند؛ همبستگی سناریو تعریف نمی‌شود.');}
 lines.push('اسپیرمن = پیرسونِ رتبه‌های متوسط؛ فرمول کوتاهِ بدون تساوی، در دادهٔ دارای تساوی استفاده نشده است.','صفر بودن ضریب، نبود همهٔ شکل‌های رابطه را اثبات نمی‌کند. تعریف‌نشده با صفر متفاوت است.','این ابزار آزمون فرض یا اثبات علت و تعمیم به جامعه انجام نمی‌دهد. سناریو مجوز حذف مشاهده نیست.');
 return lines.join('\n');
}
