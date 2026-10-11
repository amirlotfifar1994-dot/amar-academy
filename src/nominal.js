import {parseCount} from './groupComparison.js';
import {fmt,number} from './format.js';

const commute=['اتوبوس','پیاده','خودرو','دوچرخه'];
export const nominalPresets={
 commute:{label:'رفت‌وآمد؛ نما بدون اکثریت',kind:'single',labels:commute,counts:['5','3','2','0'],missing:'2',respondents:'10'},
 majority:{label:'یک دسته با اکثریت پاسخ‌های معتبر',kind:'single',labels:commute,counts:['6','3','1','0'],missing:'2',respondents:'10'},
 tied:{label:'دو دستهٔ هم‌فراوان',kind:'single',labels:commute,counts:['4','4','2','0'],missing:'0',respondents:'10'},
 missing:{label:'نیمی از افراد پاسخ نداده‌اند',kind:'single',labels:commute,counts:['5','3','2','0'],missing:'10',respondents:'10'},
 multiple:{label:'روش مطالعه؛ سؤال چندانتخابی',kind:'multiple',labels:['کتاب','ویدئو','گروهی','پادکست'],counts:['6','5','3','0'],missing:'2',respondents:'10'},
 empty:{label:'بدون پاسخ معتبر',kind:'single',labels:commute,counts:['0','0','0','0'],missing:'2',respondents:'0'},
};
export const nominalChecks=[
 {id:'mode',question:'در یک سؤال تک‌انتخابی، تعدادهای اتوبوس، پیاده و خودرو ۵، ۳ و ۲ است. کدام گزارش درست است؟',options:['اتوبوس نماست و دقیقاً نصف پاسخ‌های معتبر را دارد؛ اکثریت نیست.','چون اتوبوس پرتکرارترین است، بیشتر از نصف افراد آن را انتخاب کرده‌اند.','میانهٔ کدهای ۱، ۲ و ۳ بهترین روش رفت‌وآمد را نشان می‌دهد.'],correct:0,feedback:['درست است؛ ۵ از ۱۰ برابر ۵۰٪ است. در این ابزار اکثریت یعنی بیش از نصف، نه دقیقاً نصف.','نما از مقایسهٔ تعداد دسته‌ها می‌آید؛ اکثریت به بیش از نصف مخرج مشخص نیاز دارد.','کدهای اسمی ترتیب ذاتی ندارند؛ میانهٔ آن‌ها روش میانی یا بهترین روش را مشخص نمی‌کند.']},
 {id:'missing',question:'۵ نفر اتوبوس را انتخاب کرده‌اند؛ ۱۰ نفر پاسخ معتبر و ۲ نفر ثبت گمشده دارند. سهم اتوبوس از کل افراد چیست؟',options:['۵۰٪؛ پنج از ده پاسخ معتبر.','حدود ۴۱٫۶۷٪؛ پنج از دوازده نفر.','۵۸٫۳۳٪؛ دو گمشده را هم به اتوبوس اضافه می‌کنیم.'],correct:1,feedback:['۵۰٪ سهم از پاسخ‌دهندگان معتبر است؛ مخرج سؤال کل ۱۲ نفر است.','درست است؛ گمشده‌ها در مخرج کل قرار می‌گیرند، ولی انتخاب اتوبوس برایشان ثبت نشده است.','از پاسخ گمشده نمی‌دانیم چه گزینه‌ای انتخاب می‌شد؛ آن را خودکار به یک دسته اضافه نمی‌کنیم.']},
 {id:'multiple',question:'۱۰ پاسخ‌دهنده در سؤال چندانتخابی، کتاب را ۶ بار، ویدئو را ۵ بار و مطالعهٔ گروهی را ۳ بار انتخاب کرده‌اند. چرا مجموع درصد افراد ۱۴۰٪ است؟',options:['داده حتماً غلط است؛ هر مجموعه درصدی باید ۱۰۰٪ شود.','۱۴۰٪ افراد کتاب را انتخاب کرده‌اند.','بعضی افراد بیش از یک گزینه انتخاب کرده‌اند؛ ۱۴ انتخاب از ۱۰ پاسخ‌دهنده داریم.'],correct:2,feedback:['درصد افرادِ دسته‌های هم‌پوشان لازم نیست جمعاً ۱۰۰٪ شود. سهم هر دسته همچنان حداکثر ۱۰۰٪ است.','۱۴۰٪ مجموع سهم سه گزینه است، نه سهم کتاب یا درصد افراد یکتا؛ کتاب را ۶ از ۱۰ نفر انتخاب کرده‌اند.','درست است؛ درصد کتاب از افراد ۶۰٪ و سهم کتاب از کل انتخاب‌ها حدود ۴۲٫۸۶٪ است. این دو مخرج متفاوت‌اند.']},
];
const clean=value=>typeof value==='string'?value.trim().replace(/\s+/g,' '):'';
const key=value=>clean(value).replace(/ي/g,'ی').replace(/ك/g,'ک').replace(/\u200c/g,' ').replace(/\s+/g,' ').trim().toLowerCase();
function presetState(id){const p=nominalPresets[id];return {preset:id,kind:p.kind,rows:p.labels.map((label,i)=>({label,count:p.counts[i]})),missing:p.missing,respondents:p.respondents,basis:'valid',order:'input',codes:'simple',selected:null,answers:{},checked:{}};}
export const initialNominal=()=>presetState('commute');
export function analyzeNominal(state){
 if(!Array.isArray(state?.rows)||state.rows.length<2||state.rows.length>8||!['single','multiple'].includes(state.kind))return {rows:[],missing:null,respondents:null,error:'دو تا هشت دسته و نوع سؤال معتبر لازم است.',summary:null};
 const raw=Array.from(state.rows),keys=raw.map(r=>key(r?.label));
 const rows=raw.map((r,index)=>{const label=clean(r?.label),count=parseCount(r?.count);return {index,label,count,labelError:!label||label.length>60||keys.some((k,i)=>i!==index&&k===keys[index]),countError:count===null};});
 const missing=parseCount(state.missing),respondents=state.kind==='multiple'?parseCount(state.respondents):null;
 let error=missing===null||rows.some(r=>r.labelError||r.countError)||state.kind==='multiple'&&respondents===null?'نام‌های متمایز و تعدادهای صحیح از صفر تا ۱٬۰۰۰٬۰۰۰ لازم است.':null;
 if(error)return {rows,missing,respondents,error,summary:null};
 const mentions=rows.reduce((sum,r)=>sum+r.count,0),valid=state.kind==='single'?mentions:respondents;
 if(state.kind==='multiple'&&(rows.some(r=>r.count>valid)||mentions<valid))error='در سؤال چندانتخابی، تعداد هر گزینه نباید از پاسخ‌دهندگان معتبر بیشتر باشد و مجموع انتخاب‌ها نباید از آن‌ها کمتر باشد؛ هر پاسخ‌دهنده دست‌کم یک گزینه انتخاب می‌کند.';
 if(error)return {rows,missing,respondents,error,summary:null};
 const total=valid+missing,maxCount=Math.max(...rows.map(r=>r.count));
 const table=rows.map(r=>({...r,validPercent:valid?100*r.count/valid:null,totalPercent:total?100*r.count/total:null,mentionPercent:mentions?100*r.count/mentions:null,majorityValid:valid>0&&2*r.count>valid,majorityTotal:total>0&&2*r.count>total}));
 const summary={kind:state.kind,rows:table,valid,total,missing,mentions,modes:mentions?table.filter(r=>r.count===maxCount).map(r=>r.index):[],missingPercent:total?100*missing/total:null,validPercentSum:valid?100*mentions/valid:null,totalPercentSum:total?100*mentions/total:null};
 return {rows,missing,respondents,error:null,summary};
}
export function nominalRows(summary,order){return order==='frequency'?[...summary.rows].sort((a,b)=>b.count-a.count||a.index-b.index):[...summary.rows];}
export function nominalBasis(summary,basis){return basis==='all'?{label:'کل افراد',denominator:summary.total,sum:summary.totalPercentSum,field:'totalPercent'}:{label:'پاسخ‌دهندگان معتبر',denominator:summary.valid,sum:summary.validPercentSum,field:'validPercent'};}
export function nominalShare(value){return value===null?'تعریف‌نشده':value>0&&value<.01?'کمتر از ۰٫۰۱٪':value<100&&value>99.99?'بیشتر از ۹۹٫۹۹٪':fmt(value)+'٪';}
export function nominalReducer(state,action){
 if(action.type==='preset')return Object.hasOwn(nominalPresets,action.id)?presetState(action.id):state;
 if(action.type==='reset')return presetState(Object.hasOwn(nominalPresets,state.preset)?state.preset:'commute');
 if(action.type==='row'){
  if(!Number.isInteger(action.index)||!state.rows[action.index]||!['label','count'].includes(action.field)||typeof action.value!=='string'||action.value.length>(action.field==='label'?60:40))return state;
  return {...state,rows:state.rows.map((r,i)=>i===action.index?{...r,[action.field]:action.value}:r),selected:null};
 }
 if(action.type==='add'&&state.rows.length<8){let i=state.rows.length+1;const keys=new Set(state.rows.map(r=>key(r.label)));while(keys.has(key('دستهٔ '+number(i))))i++;return {...state,rows:[...state.rows,{label:'دستهٔ '+number(i),count:'0'}],selected:null};}
 if(action.type==='remove'&&state.rows.length>2&&Number.isInteger(action.index)&&state.rows[action.index])return {...state,rows:state.rows.filter((_,i)=>i!==action.index),selected:null};
 if(['missing','respondents'].includes(action.type))return typeof action.value==='string'&&action.value.length<=40?{...state,[action.type]:action.value,selected:null}:state;
 if(action.type==='kind'&&['single','multiple'].includes(action.value)){
  const s=analyzeNominal(state).summary;
  // A single-response table supplies a valid respondent count; multiple to single explicitly reinterprets marginals.
  return {...state,kind:action.value,respondents:action.value==='multiple'&&state.kind==='single'&&s?String(s.valid):state.respondents,selected:null};
 }
 if(action.type==='basis')return ['valid','all'].includes(action.value)?{...state,basis:action.value}:state;
 if(action.type==='order')return ['input','frequency'].includes(action.value)?{...state,order:action.value}:state;
 if(action.type==='codes')return ['simple','tens'].includes(action.value)?{...state,codes:action.value}:state;
 if(action.type==='select')return Number.isInteger(action.index)&&state.rows[action.index]?{...state,selected:state.selected===action.index?null:action.index}:state;
 if(action.type==='answer'){
  const q=nominalChecks.find(q=>q.id===action.id);if(!q||!Number.isInteger(action.value)||!q.options[action.value])return state;
  return {...state,answers:{...state.answers,[action.id]:action.value},checked:{...state.checked,[action.id]:false}};
 }
 if(action.type==='check')return nominalChecks.some(q=>q.id===action.id)&&Number.isInteger(state.answers[action.id])?{...state,checked:{...state.checked,[action.id]:true}}:state;
 return state;
}
export function buildNominalReport(state){
 const s=analyzeNominal(state).summary,lines=['گزارش توصیفی دسته‌های اسمی','مثال‌ها ساختگی‌اند؛ نام دسته و کد آن ترتیب ذاتی یا فاصلهٔ عددی ایجاد نمی‌کند.'];
 if(!s)return [...lines,'ورودی نامعتبر است؛ نتیجهٔ عددی گزارش نمی‌شود.'].join('\n');
 const basis=nominalBasis(s,state.basis);
 lines.push(`نوع سؤال: ${s.kind==='single'?'تک‌انتخابی':'چندانتخابی'}`,`کل افراد: ${number(s.total)}؛ معتبر: ${number(s.valid)}؛ گمشده: ${number(s.missing)}؛ مجموع انتخاب‌ها: ${number(s.mentions)}`,`مخرج نمودار: ${basis.label} (${number(basis.denominator)})`,'دسته‌ها در ترتیب اصلی ورودی؛ درصدهای نمایش تا دو رقم اعشار گرد می‌شوند.');
 for(const r of s.rows)lines.push(`${r.label}؛ کد برچسب ${number((r.index+1)*(state.codes==='tens'?10:1))}؛ تعداد ${number(r.count)}؛ از معتبر ${nominalShare(r.validPercent)}؛ از کل افراد ${nominalShare(r.totalPercent)}؛ از کل انتخاب‌ها ${nominalShare(r.mentionPercent)}`);
 lines.push('پرتکرارترین '+(s.kind==='single'?'دسته‌ها (نما)':'گزینه‌ها')+': '+(s.modes.length?s.modes.map(i=>s.rows[i].label).join('، '):'تعریف‌نشده'));
 const majority=s.rows.filter(r=>state.basis==='all'?r.majorityTotal:r.majorityValid);
 lines.push(`گزینه‌های با بیش از نصف ${basis.label}: ${basis.denominator?majority.length?majority.map(r=>r.label).join('، '):'هیچ‌کدام':'تعریف‌نشده'}`,`مجموع درصد گزینه‌ها با مخرج نمودار: ${nominalShare(basis.sum)}`,`مجموع درصد از معتبر: ${nominalShare(s.validPercentSum)}؛ مجموع درصد از کل افراد: ${nominalShare(s.totalPercentSum)}`,`سهم گمشده از کل: ${nominalShare(s.missingPercent)}`);
 lines.push(s.kind==='single'?'هر فرد یک دستهٔ معتبر یا ثبت گمشده دارد؛ درصد دسته‌های معتبر با مخرج معتبر جمعاً ۱۰۰٪ است، اگر مخرج غیرصفر باشد.':'هر پاسخ‌دهندهٔ معتبر دست‌کم یک گزینه و هر گزینه را حداکثر یک بار انتخاب کرده است. درصد افراد می‌تواند جمعاً بیش از ۱۰۰٪ شود؛ سهم انتخاب‌ها با مخرج مجموع انتخاب‌ها جمعاً ۱۰۰٪ است، اگر مخرج غیرصفر باشد.');
 lines.push('اکثریت یعنی بیش از نصف مخرج اعلام‌شده؛ دقیقاً ۵۰٪ اکثریت نیست.','گمشده به صفر، دستهٔ واقعی یا انتخابی فرضی تبدیل نمی‌شود. تعداد صفر با مخرج مثبت، سهم صفر دارد؛ مخرج صفر سهم تعریف‌نشده دارد.','جدول تجمیعی نشان نمی‌دهد کدام افراد چه ترکیب گزینه‌هایی انتخاب کرده‌اند. تغییر نوع سؤال یک سناریوی تازه است و رکورد افراد را تبدیل نمی‌کند.','میانه، صدک و تجمع «تا این دسته» برای نام‌های بدون ترتیب گزارش نمی‌شود؛ مرتب‌کردن نمودار، مقیاس ترتیبی نمی‌سازد.','این گزارش همین داده‌های اعلام‌شده را توصیف می‌کند؛ نمایندگی جامعه یا علت را اثبات نمی‌کند.');
 return lines.join('\n');
}
