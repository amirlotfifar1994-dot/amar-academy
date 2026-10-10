import {parseData,describe,quantile} from './stats.js';
import {compareDistributions,distributionValue} from './distributionComparison.js';
import {fmt,number} from './format.js';

export const robustPresets={
 balanced:{label:'یک مقدار دور در فهرست متعادل',values:[4,5,5,6,6,7,7,8,8,9],replacement:30,explanation:'آخرین مشاهده از ۹ به ۳۰ تغییر کرده است. مرکزهای مقاوم را با میانگین و شاخص‌های پراکندگی مقایسه کن؛ سپس مقدار را خودت جابه‌جا کن.'},
 zero:{label:'MAD صفر، با یک مقدار متفاوت',values:[5,5,5,5,20],replacement:100,explanation:'چهار مقدار با میانه برابرند و یک مقدار دور است. MAD می‌تواند صفر باشد، در حالی که همهٔ مقدارها یکسان نیستند.'},
 small:{label:'نمونهٔ کوچک و پیرایش',values:[4,6,8],replacement:30,explanation:'برای سه مشاهده و پیرایش ۱۰٪ یا ۲۰٪ از هر سر، تعداد کنارگذاشته‌شده با گردکردن رو به پایین صفر است. در این قرارداد، میانگین پیرایش‌شده همان میانگین کامل می‌شود.'},
 constant:{label:'همهٔ مقدارها برابر',values:[7,7,7,7],replacement:7,explanation:'ابتدا هیچ پراکندگی وجود ندارد. آخرین مقدار را تغییر بده و ببین کدام خلاصه‌ها تغییر می‌کنند؛ صفر بودن MAD یا IQR به‌تنهایی برابری همهٔ مقدارها را اثبات نمی‌کند.'},
};
export const robustChecks=[
 {id:'mad',question:'در مثال ثابت [۵،۵،۵،۵،۱۰۰]، MAD خام صفر است. چه نتیجه‌ای درست است؟',options:['همهٔ مقدارها حتماً برابرند.','فاصلهٔ میانی از میانه صفر است؛ یک مقدار دور هنوز می‌تواند وجود داشته باشد.','انحراف معیار نمونه‌ای هم حتماً صفر است.'],correct:1,feedback:['چهار مقدار در مرکزند، اما مقدار ۱۰۰ متفاوت است؛ MAD صفر برابری همهٔ مقدارها را ثابت نمی‌کند.','درست است. MAD میانهٔ فاصله‌هاست، نه بیشترین فاصله یا همهٔ جزئیات دنباله.','انحراف معیار فاصله‌های همهٔ مقدارها از میانگین را وارد محاسبه می‌کند و در این مثال صفر نیست.']},
 {id:'trim',question:'با n=۱۰ و پیرایش ۱۰٪ از هر سر، طبق قرارداد k=⌊n×۰٫۱۰⌋ چند مشاهده وارد میانگین پیرایش‌شده می‌شود؟',options:['۹ مشاهده؛ فقط یک مقدار از کل فهرست کنار می‌رود.','۸ مشاهده؛ یک مقدار از هر سرِ فهرست مرتب کنار می‌رود.','همان ۱۰ مشاهده، با وزن کمتر برای مقدار دور.'],correct:1,feedback:['۱۰٪ برای هر سر است؛ یک مقدار کم و یک مقدار زیاد در محاسبهٔ این شاخص کنار می‌روند.','درست است: k=۱ در هر سر و ۱۰−۲×۱=۸ مشاهدهٔ میانی باقی می‌ماند.','این روش وزن‌دهی نیست؛ میانگینِ بخش میانیِ مشخص‌شدهٔ فهرست مرتب محاسبه می‌شود.']},
 {id:'purpose',question:'اگر سؤال پژوهش دربارهٔ میانگین کل داده باشد، با دیدن یک مقدار دور چه کنیم؟',options:['به‌طور خودکار میانگین را با میانه جایگزین کنیم.','مقدار دور را بدون بررسی حذف کنیم.','کیفیت داده و هدف را بررسی کنیم؛ میانگین کل و خلاصه‌های مکمل را با قراردادشان گزارش کنیم.'],correct:2,feedback:['میانه و میانگین به پرسش یکسان پاسخ نمی‌دهند؛ انتخاب شاخص باید با هدف هماهنگ باشد.','دوربودن مقدار، خطای ثبت را اثبات نمی‌کند. تصمیم به حذف یا اصلاح باید بررسی و مستند شود.','درست است. خلاصهٔ مقاوم می‌تواند مکمل باشد؛ هدف تحلیل و تصمیم دربارهٔ داده را روشن نگه دار.']},
];
export function robustSummary(values,trim=10){
 if(!Array.isArray(values)||!values.length||values.length>200||values.some(value=>!Number.isFinite(value)||Math.abs(value)>1e9)||![0,10,20].includes(trim))return null;
 const stats=describe(values),distances=values.map(value=>Math.abs(value-stats.median)),sortedDistances=[...distances].sort((a,b)=>a-b),mad=quantile(sortedDistances,.5),k=Math.floor(values.length*trim/100);
 const ordered=values.map((value,index)=>({value,index})).sort((a,b)=>a.value-b.value||a.index-b.index),retained=ordered.slice(k,ordered.length-k),trimmedMean=k===0?stats.mean:retained.reduce((sum,row)=>sum+row.value,0)/retained.length;
 return {...stats,mad,distances,sortedDistances,trimmedMean,trim,k,retained,excludedLow:ordered.slice(0,k),excludedHigh:k?ordered.slice(-k):[]};
}
export function analyzeRobustness(state){
 const base=parseData(state.text),replacement=parseData(state.replacement);
 const replacementError=replacement.error|| (replacement.values.length!==1?'فقط یک مقدار معتبر برای جایگزینی آخرین مشاهده وارد کن.':null);
 if(base.error||replacementError)return {baseError:base.error,replacementError,analysis:null};
 const current=[...base.values.slice(0,-1),replacement.values[0]],plot=compareDistributions([base.values,current]);
 const baseline=robustSummary(base.values,state.trim),scenario=robustSummary(current,state.trim);
 if(!baseline||!scenario)return {baseError:null,replacementError:null,analysis:null};
 plot.groups[0].label='پایه';plot.groups[1].label='سناریو';
 return {baseError:null,replacementError:null,analysis:{baseline,scenario,base:base.values,current,plot,originalLast:base.values.at(-1),replacement:replacement.values[0]}};
}
export function initialRobustness(){const preset=robustPresets.balanced;return {preset:'balanced',text:preset.values.join(', '),replacement:String(preset.replacement),trim:10,unit:'واحد',chart:'dots',selected:null,answers:{},checked:{}};}
export function robustnessReducer(state,action){
 if(action.type==='data'){
  if(typeof action.value!=='string'||action.value.length>8000)return state;
  const parsed=parseData(action.value);return {...state,text:action.value,replacement:parsed.error?'':String(parsed.values.at(-1)),preset:'custom',selected:null};
 }
 if(action.type==='replacement')return typeof action.value==='string'&&action.value.length<=80?{...state,replacement:action.value,selected:null}:state;
 if(action.type==='restore'){const parsed=parseData(state.text);return parsed.error?state:{...state,replacement:String(parsed.values.at(-1)),selected:null};}
 if(action.type==='preset'){const preset=Object.hasOwn(robustPresets,action.value)?robustPresets[action.value]:null;return preset?{...state,preset:action.value,text:preset.values.join(', '),replacement:String(preset.replacement),selected:null}:state;}
 if(action.type==='trim')return [0,10,20].includes(action.value)?{...state,trim:action.value}:state;
 if(action.type==='unit')return typeof action.value==='string'&&action.value.length<=60?{...state,unit:action.value}:state;
 if(action.type==='chart')return ['dots','box'].includes(action.value)?{...state,chart:action.value,selected:null}:state;
 if(action.type==='select'){
  if(action.value===null)return {...state,selected:null};
  const {group,value}=action.value||{},analysis=analyzeRobustness(state).analysis;
  return [0,1].includes(group)&&analysis?.plot.groups[group].values.includes(value)?{...state,selected:{group,value}}:state;
 }
 if(action.type==='answer'){const question=robustChecks.find(q=>q.id===action.id);return question&&Number.isInteger(action.value)&&action.value>=0&&action.value<question.options.length?{...state,answers:{...state.answers,[action.id]:action.value},checked:{...state.checked,[action.id]:false}}:state;}
 if(action.type==='check'){const question=robustChecks.find(q=>q.id===action.id),answer=state.answers[action.id];return question&&Number.isInteger(answer)&&answer>=0&&answer<question.options.length?{...state,checked:{...state.checked,[action.id]:true}}:state;}
 return state;
}
export function buildRobustnessReport(state){
 const {analysis,baseError,replacementError}=analyzeRobustness(state),unit=state.unit.trim()||'واحد مشخص‌نشده';
 const lines=['آمارآموز — حساسیت شاخص‌ها به تغییر یک مشاهده',`واحد اعلام‌شده: ${unit}`,state.preset==='custom'?'فهرست پایهٔ کاربر؛ منبع و شیوهٔ گردآوری در ابزار تأیید نمی‌شود.':'دادهٔ پایهٔ ساختگی: '+robustPresets[state.preset].label,'سناریو یک تغییر آزمایشی است؛ مقدار اصلی داده پاک یا اصلاح نشده است.',''];
 if(!analysis)lines.push('نتیجه محاسبه نشده است؛ ورودی‌ها را اصلاح کن.',baseError||'',replacementError||'');
 else{
  lines.push(`آخرین مشاهدهٔ پایه: ${distributionValue(analysis.originalLast)}؛ در سناریو: ${distributionValue(analysis.replacement)} (${unit}).`);
  for(const [label,summary] of [['پایه',analysis.baseline],['سناریو',analysis.scenario]])lines.push(`${label}: n=${number(summary.n)}؛ میانگین ${fmt(summary.mean)}؛ میانه ${fmt(summary.median)}؛ انحراف معیار نمونه‌ای ${fmt(summary.sd)}؛ IQR=${fmt(summary.iqr)}؛ MAD خام=${fmt(summary.mad)}؛ میانگین پیرایش‌شده ${fmt(summary.trimmedMean)} (${unit}).`,`پیرایش ${number(summary.trim)}٪ از هر سر: k=${number(summary.k)}؛ تعداد در میانگین پیرایش‌شده ${number(summary.retained.length)}.`,`مقدارهای کنارگذاشته‌شده فقط در این شاخص: پایین [${summary.excludedLow.map(row=>distributionValue(row.value)).join('، ')}]؛ بالا [${summary.excludedHigh.map(row=>distributionValue(row.value)).join('، ')}].`);
  lines.push('','داده‌ها با دقت اصلی و ترتیب اولیه:','ردیف,پایه,سناریو');analysis.base.forEach((value,index)=>lines.push(`${index+1},${value},${analysis.current[index]}`));
 }
 lines.push('','قرارداد: MAD خام = median(|x−median(x)|)؛ ضریب مقیاس‌دهی ۱٫۴۸۲۶ اعمال نشده است. MAD، انحراف معیار نیست.','میانگین پیرایش‌شده: مرتب‌سازی، k=⌊n×درصد/۱۰۰⌋ از هر سر، میانگین n−۲k مقدار باقی‌مانده. این درصد از هر سر است و حذف از دادهٔ اصلی نیست.','انحراف معیار نمونه‌ای با n−1 و چارک نوع ۷؛ برای یک مشاهده، انحراف معیار نمونه‌ای تعریف‌نشده است.','MAD یا IQR صفر برابری همهٔ مقدارها را اثبات نمی‌کند. خلاصهٔ مقاوم خودکار بهترین شاخص برای هر هدف نیست.','نمایش خلاصه‌ها تا دو رقم اعشار گرد شده است. تحلیل توصیفی است و علت یا نتیجهٔ قطعی دربارهٔ جامعه را اثبات نمی‌کند.');
 return lines.join('\n');
}
