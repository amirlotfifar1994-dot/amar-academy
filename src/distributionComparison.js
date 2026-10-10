import {parseData,describe} from './stats.js';
import {fmt,number} from './format.js';

export const distributionPresets={
 spread:{label:'میانگین برابر، پراکندگی متفاوت',groups:[[6,7,7,8],[2,5,9,12]],lesson:'هر دو میانگین ۷ دارند؛ اما مقدارهای گروه ب از مرکز دورترند. برای توضیح تفاوت، انحراف معیار و IQR را هم ببین.'},
 shift:{label:'جابجایی مرکز، پراکندگی یکسان',groups:[[4,5,5,6],[8,9,9,10]],lesson:'به هر مقدار گروه الف، ۴ واحد اضافه شده است. میانگین و میانه جابه‌جا می‌شوند؛ انحراف معیار و IQR تغییر نمی‌کنند.'},
 unequal:{label:'تعداد متفاوت، میانگین یکسان',groups:[[4,5,5,6],[4,4,4,5,5,5,5,5,5,6,6,6]],lesson:'در گروه ب هر مقدار الف سه بار تکرار شده است. تعداد بیشتر، میانگین را بالاتر نمی‌برد. انحراف معیار نمونه‌ای اندکی متفاوت است؛ مخرج آن n−1 است.'},
 outlier:{label:'یک مقدار دور؛ دو خلاصهٔ متفاوت',groups:[[4,5,5,6,6,7,7,8],[4,5,5,6,6,7,7,30]],lesson:'فقط آخرین مقدار در گروه ب تغییر کرده است. میانگین و انحراف معیار بیشتر تغییر می‌کنند؛ در این مثال میانه و IQR ثابت می‌مانند. علامت دورافتادگی مجوز حذف خودکار نیست.'},
};
export const distributionChecks=[
 {id:'center',question:'در مثال ثابتِ الف [۶،۷،۷،۸] و ب [۲،۵،۹،۱۲]، میانگین هر دو ۷ است. چه نتیجه‌ای درست است؟',options:['دو گروه در همهٔ جنبه‌ها یکسان‌اند.','مرکزِ میانگین برابر است؛ پراکندگی را باید جدا بررسی کرد.','تعداد بیشترِ مقدارهای دور، میانگین را حتماً بالاتر می‌برد.'],correct:1,feedback:['میانگین فقط یک خلاصه از مرکز است؛ انحراف معیار گروه ب بزرگ‌تر است.','درست است. مقدارهای گروه ب از مرکز دورترند، با وجود میانگین برابر.','مقدارهای دور می‌توانند در دو طرف مرکز باشند؛ در این مثال اثرشان بر میانگین متوازن است.']},
 {id:'outlier',question:'اگر یک مقدار با قاعدهٔ ۱٫۵ IQR دورافتاده علامت بخورد، قدم مناسب چیست؟',options:['آن را بدون بررسی حذف کنیم.','آن را خودکار با میانگین جایگزین کنیم.','منبع، واحد و علت مقدار را بررسی کنیم و تصمیم را مستند کنیم.'],correct:2,feedback:['علامت آماری، به‌تنهایی خطای ثبت را اثبات نمی‌کند؛ مقدار واقعی هم ممکن است دور باشد.','جایگزینی خودکار داده را تغییر می‌دهد؛ اول علت مقدار را بررسی کن.','درست است. ابزار مقدار را نگه می‌دارد؛ تصمیم دربارهٔ حذف یا اصلاح به بررسی و مستندسازی نیاز دارد.']},
];
export function valueFrequencies(values){const counts=new Map();for(const value of values)counts.set(value,(counts.get(value)||0)+1);return [...counts].sort(([a],[b])=>a-b).map(([value,count])=>({value,count}));}
export function distributionValue(value){return String(value).replace(/[0-9]/g,digit=>'۰۱۲۳۴۵۶۷۸۹'[Number(digit)]).replace(/\./g,'٫').replace(/-/g,'−');}
export function distributionAxisLabels(domain){
 const step=(domain.max-domain.min)/4,digits=Math.min(20,Math.max(2,Math.ceil(-Math.log10(step))+1)),scientific=step<1e-18;
 const formatter=new Intl.NumberFormat('fa-IR',scientific?{notation:'scientific',maximumSignificantDigits:6}:{maximumFractionDigits:digits});
 return Array.from({length:5},(_,index)=>{const value=domain.min+(domain.max-domain.min)*index/4;return {value,label:formatter.format(value)};});
}
export function compareDistributions(values){
 if(!Array.isArray(values)||values.length!==2||values.some(group=>!Array.isArray(group)||group.length<1||group.length>200||group.some(value=>!Number.isFinite(value)||Math.abs(value)>1e9)))return null;
 const groups=values.map((group,index)=>({id:index,label:index===0?'گروه الف':'گروه ب',values:[...group],stats:describe(group),frequencies:valueFrequencies(group)}));
 const all=values.flat(),min=Math.min(...all),max=Math.max(...all),padding=max>min?(max-min)*.08:Math.max(1,Math.abs(min)*.05);
 return {groups,domain:{min:min-padding,max:max+padding},meanDifference:groups[1].stats.mean-groups[0].stats.mean,medianDifference:groups[1].stats.median-groups[0].stats.median,sdDifference:groups.every(group=>group.stats.sd!==null)?groups[1].stats.sd-groups[0].stats.sd:null};
}
export function analyzeDistributionInputs(texts){const parsed=[0,1].map(index=>parseData(typeof texts?.[index]==='string'?texts[index]:''));return {parsed,summary:parsed.some(group=>group.error)?null:compareDistributions(parsed.map(group=>group.values))};}
export function initialDistributionState(){return {texts:distributionPresets.spread.groups.map(group=>group.join(', ')),preset:'spread',chart:'box',selected:null,variable:'نمرهٔ آزمون',unit:'نمره',answers:{},checked:{}};}
export function distributionReducer(state,action){
 if(action.type==='data')return [0,1].includes(action.group)&&typeof action.value==='string'&&action.value.length<=8000?{...state,texts:state.texts.map((text,index)=>index===action.group?action.value:text),preset:'custom',selected:null}:state;
 if(action.type==='preset'){const preset=Object.hasOwn(distributionPresets,action.value)?distributionPresets[action.value]:null;return preset?{...state,texts:preset.groups.map(group=>group.join(', ')),preset:action.value,selected:null,variable:'نمرهٔ آزمون',unit:'نمره'}:state;}
 if(action.type==='chart')return ['box','dots'].includes(action.value)?{...state,chart:action.value,selected:null}:state;
 if(action.type==='swap')return {...state,texts:[state.texts[1],state.texts[0]],preset:'custom',selected:null};
 if(action.type==='select'){
  if(action.value===null)return {...state,selected:null};
  const {group,value}=action.value||{},summary=analyzeDistributionInputs(state.texts).summary;
  return [0,1].includes(group)&&summary?.groups[group].values.includes(value)?{...state,selected:{group,value}}:state;
 }
 if(action.type==='metadata')return ['variable','unit'].includes(action.id)&&typeof action.value==='string'&&action.value.length<=60?{...state,[action.id]:action.value}:state;
 if(action.type==='answer'){const question=distributionChecks.find(q=>q.id===action.id);return question&&Number.isInteger(action.value)&&action.value>=0&&action.value<question.options.length?{...state,answers:{...state.answers,[action.id]:action.value},checked:{...state.checked,[action.id]:false}}:state;}
 if(action.type==='check'){const question=distributionChecks.find(q=>q.id===action.id),answer=state.answers[action.id];return question&&Number.isInteger(answer)&&answer>=0&&answer<question.options.length?{...state,checked:{...state.checked,[action.id]:true}}:state;}
 return state;
}
export function differenceText(value){return value===null?'تعریف‌نشده':value!==0&&Math.abs(value)<.01?(value<0?'منفی':'مثبت')+'؛ قدر مطلق کمتر از ۰٫۰۱':fmt(value);}
export function buildDistributionReport(state){
 const {summary,parsed}=analyzeDistributionInputs(state.texts),unit=state.unit.trim()||'واحد مشخص‌نشده',variable=state.variable.trim()||'متغیر مشخص‌نشده';
 const lines=['آمارآموز — مقایسهٔ توصیفی دو گروه',`متغیر: ${variable}؛ واحد مشترک اعلام‌شده: ${unit}`,state.preset==='custom'?'ورودی کاربر؛ منبع و شیوهٔ گردآوری در این ابزار تأیید نمی‌شود.':'نمونهٔ آموزشی ساختگی: '+distributionPresets[state.preset].label,''];
 if(!summary){lines.push('محاسبه انجام نشده است؛ هر دو فهرست باید کامل و معتبر باشند.');for(let i=0;i<2;i++)if(parsed[i].error)lines.push(`گروه ${i===0?'الف':'ب'}: ${parsed[i].error}`);}
 else{
  for(const group of summary.groups){const s=group.stats;lines.push(`${group.label}: n=${number(s.n)}؛ میانگین ${fmt(s.mean)}؛ میانه ${fmt(s.median)}؛ انحراف معیار نمونه‌ای ${fmt(s.sd)}؛ Q1=${fmt(s.q1)}؛ Q3=${fmt(s.q3)}؛ IQR=${fmt(s.iqr)} (${unit}).`,`مقدارهای علامت‌خورده با ۱٫۵ IQR: ${number(s.outliers.length)}؛ هیچ مقداری حذف نشده است.`);}
  lines.push(`تفاوت میانگین، ب منهای الف: ${differenceText(summary.meanDifference)} (${unit}).`,'','داده‌های اصلی، با حفظ ترتیب هر فهرست:','گروه,ردیف,مقدار');for(const group of summary.groups)group.values.forEach((value,index)=>lines.push(`${group.id===0?'الف':'ب'},${index+1},${value}`));
 }
 lines.push('','قرارداد: یک متغیر با واحد و روش اندازه‌گیری قابل مقایسه در هر دو گروه؛ هر فهرست جداگانه تحلیل می‌شود و ردیف‌ها جفت‌سازی نمی‌شوند.','واریانس و انحراف معیار نمونه‌ای: n−1؛ برای یک مشاهده تعریف‌نشده. چارک‌ها: نوع ۷؛ سبیل‌ها تا آخرین مقدار داخل کرانهٔ ۱٫۵ IQR.','نمایش خلاصه‌ها تا دو رقم اعشار گرد شده؛ داده‌های خروجی دقت اصلی را حفظ می‌کنند.','تفاوت مشاهده‌شده، علت یا تفاوت قطعی در جامعه را اثبات نمی‌کند. این ابزار آزمون فرض، فاصلهٔ اطمینان یا p-value ارائه نمی‌کند.');
 return lines.join('\n');
}
