import {parseCount} from './groupComparison.js';
import {fmt,number} from './format.js';

export const ordinalPresets={
 satisfaction:{label:'رضایت پنج‌طبقه‌ای',labels:['خیلی کم','کم','متوسط','زیاد','خیلی زیاد'],counts:['2','4','6','5','3'],missing:'0'},
 split:{label:'دو جایگاه میانی در دو طبقه',labels:['کم','متوسط','زیاد'],counts:['4','0','4'],missing:'0'},
 missing:{label:'پاسخ گمشده و مخرج درصد',labels:['کم','متوسط','زیاد'],counts:['2','3','1'],missing:'2'},
 tied:{label:'چند طبقهٔ هم‌فراوان',labels:['کم','متوسط','زیاد'],counts:['2','2','2'],missing:'0'},
 empty:{label:'بدون پاسخ معتبر',labels:['کم','متوسط','زیاد'],counts:['0','0','0'],missing:'2'},
};
export const ordinalChecks=[
 {id:'middle',question:'در مثال ثابت «کم: ۴، متوسط: ۰، زیاد: ۴»، دو جایگاه میانی کجا هستند؟',options:['هر دو در متوسط؛ چون متوسط وسط نام‌هاست.','جایگاه ۴ در کم و جایگاه ۵ در زیاد است.','کدهای کم و زیاد را میانگین می‌گیریم و یک پاسخ متوسط می‌سازیم.'],correct:1,feedback:['طبقهٔ متوسط هیچ پاسخی ندارد؛ جایگاه میانی از فراوانی مشاهده‌ها می‌آید، نه وسط فهرست نام‌ها.','درست است؛ n=۸، پس جایگاه‌های میانی ۴ و ۵ هستند و در دو طبقهٔ متفاوت قرار می‌گیرند.','فاصلهٔ طبقه‌ها معلوم نیست؛ میانگین کدها یک مشاهده یا طبقهٔ میانیِ ثبت‌شده نمی‌سازد.']},
 {id:'denominator',question:'در مثال ثابت «کم: ۲، متوسط: ۳، زیاد: ۱، گمشده: ۲»، درصد متوسط از پاسخ‌های معتبر چقدر است؟',options:['۵۰٪؛ سه پاسخ از شش پاسخ معتبر.','۳۷٫۵٪؛ سه پاسخ از هشت نفر.','۷۵٪؛ سه پاسخ از چهار نفر.'],correct:0,feedback:['درست است؛ مخرج این سؤال شش پاسخ معتبر است. دو پاسخ گمشده جدا گزارش می‌شوند.','۳۷٫۵٪ سهم از کل هشت نفر است؛ سؤال سهم از پاسخ‌های معتبر را می‌خواهد.','چهار، تعداد معتبر این داده نیست؛ ۲+۳+۱=۶ پاسخ معتبر داریم.']},
 {id:'codes',question:'اگر کدهای ۱، ۲، ۳ را به ۱۰، ۲۰، ۳۰ تبدیل کنیم و ترتیب و تعداد هر طبقه ثابت بماند، چه می‌شود؟',options:['درصدها ده برابر می‌شوند.','طبقهٔ میانی عوض می‌شود.','فراوانی، درصد و جایگاه‌های مرتب‌شده همان می‌مانند.'],correct:2,feedback:['درصد از تعداد پاسخ‌ها می‌آید؛ تغییر نام عددی طبقه، تعدادها را زیاد نمی‌کند.','وقتی ترتیب و تعدادها ثابت‌اند، جایگاه‌های میانی به همان طبقه‌ها می‌رسند.','درست است؛ کدها برچسب‌اند. تغییر کد، فاصلهٔ عددی معنادار میان طبقه‌ها ایجاد نمی‌کند.']},
];
const cleanLabel=value=>typeof value==='string'?value.trim().replace(/\s+/g,' '):'';
const labelKey=value=>cleanLabel(value).replace(/ي/g,'ی').replace(/ك/g,'ک').replace(/\u200c/g,' ').toLowerCase();
function presetState(id){const preset=ordinalPresets[id];return {preset:id,rows:preset.labels.map((label,i)=>({label,count:preset.counts[i]})),missing:preset.missing,percent:50,codes:'simple',selected:null,answers:{},checked:{}};}
export function initialOrdinal(){return presetState('satisfaction');}
export function analyzeOrdinal(state){
 const validRows=Array.isArray(state?.rows)&&state.rows.length>=2&&state.rows.length<=8;
 if(!validRows)return {rows:[],missing:null,error:'بین دو تا هشت طبقه لازم است.',summary:null};
 const keys=state.rows.map(row=>labelKey(row?.label));
 const rows=state.rows.map((row,i)=>{const label=cleanLabel(row?.label),count=parseCount(row?.count);return {label,count,labelError:!label||label.length>60||keys.some((key,j)=>j!==i&&key===keys[i]),countError:count===null};});
 const missing=parseCount(state.missing),error=missing===null||rows.some(r=>r.labelError||r.countError)?'نام‌های متمایز و تعدادهای صحیح معتبر وارد کن.':null;
 if(error)return {rows,missing,error,summary:null};
 const n=rows.reduce((sum,row)=>sum+row.count,0);let cumulative=0;
 const table=rows.map(row=>{const previous=cumulative;cumulative+=row.count;return {...row,previous,cumulative,percent:n?100*row.count/n:null,cumulativePercent:n?100*cumulative/n:null};});
 const maxCount=Math.max(...rows.map(row=>row.count)),modes=n?rows.map((row,i)=>row.count===maxCount?i:-1).filter(i=>i>=0):[];
 const positions=n?n%2?[(n+1)/2]:[n/2,n/2+1]:[];
 const summary={n,missing,total:n+missing,rows:table,modes,positions,middle:positions.map(position=>table.findIndex(row=>row.cumulative>=position))};
 return {rows,missing,error:null,summary};
}
export function ordinalPercentile(summary,percent){
 if(!summary?.n||!Number.isInteger(percent)||percent<1||percent>100)return null;
 const position=Math.ceil(summary.n*percent/100),index=summary.rows.findIndex(row=>row.cumulative>=position);
 return {index,position,row:summary.rows[index],percent};
}
export function ordinalShare(value){return value===null?'تعریف‌نشده':value>0&&value<.01?'کمتر از ۰٫۰۱٪':value<100&&value>99.99?'بیشتر از ۹۹٫۹۹٪':fmt(value)+'٪';}
export function ordinalReducer(state,action){
 if(action.type==='preset')return Object.hasOwn(ordinalPresets,action.id)?presetState(action.id):state;
 if(action.type==='reset')return presetState(Object.hasOwn(ordinalPresets,state.preset)?state.preset:'satisfaction');
 if(action.type==='row'){
  if(!Number.isInteger(action.index)||!state.rows[action.index]||!['label','count'].includes(action.field)||typeof action.value!=='string'||action.value.length>(action.field==='label'?60:40))return state;
  return {...state,rows:state.rows.map((row,i)=>i===action.index?{...row,[action.field]:action.value}:row),selected:null};
 }
 if(action.type==='missing')return typeof action.value==='string'&&action.value.length<=40?{...state,missing:action.value,selected:null}:state;
 if(action.type==='percent')return Number.isInteger(action.value)&&action.value>=1&&action.value<=100?{...state,percent:action.value}:state;
 if(action.type==='codes')return ['simple','tens'].includes(action.value)?{...state,codes:action.value}:state;
 if(action.type==='select')return Number.isInteger(action.index)&&state.rows[action.index]?{...state,selected:action.index}:state;
 if(action.type==='answer'){
  const question=ordinalChecks.find(q=>q.id===action.id);if(!question||!Number.isInteger(action.value)||!question.options[action.value])return state;
  return {...state,answers:{...state.answers,[action.id]:action.value},checked:{...state.checked,[action.id]:false}};
 }
 if(action.type==='check')return ordinalChecks.some(q=>q.id===action.id)&&Number.isInteger(state.answers[action.id])?{...state,checked:{...state.checked,[action.id]:true}}:state;
 return state;
}
export function buildOrdinalReport(state){
 const analysis=analyzeOrdinal(state),s=analysis.summary;
 const lines=['گزارش توصیفی دادهٔ ترتیبی','ترتیب طبقه‌ها همان ترتیب ورودی از کم به زیاد است.','کد طبقه، فاصلهٔ عددی یا نمرهٔ کمی نیست.'];
 if(!s)return [...lines,'ورودی نامعتبر است؛ نتیجهٔ عددی گزارش نمی‌شود.'].join('\n');
 lines.push(`کل افراد: ${number(s.total)}؛ پاسخ معتبر: ${number(s.n)}؛ گمشده: ${number(s.missing)}`,'مخرج درصدهای جدول فقط پاسخ‌های معتبر است.');
 for(const row of s.rows)lines.push(`${row.label}: تعداد ${number(row.count)}؛ درصد ${ordinalShare(row.percent)}؛ تجمعی ${number(row.cumulative)}؛ درصد تجمعی ${ordinalShare(row.cumulativePercent)}`);
 if(!s.n)return [...lines,'بدون پاسخ معتبر، نما و جایگاه میانی و طبقهٔ درصدی تعریف نمی‌شوند.'].join('\n');
 lines.push('پرتکرارترین طبقه‌ها: '+s.modes.map(i=>s.rows[i].label).join('، '));
 lines.push('جایگاه‌های میانی: '+s.positions.map((position,i)=>`${number(position)} ← ${s.rows[s.middle[i]].label}`).join('؛ '));
 if(new Set(s.middle).size>1)lines.push('دو جایگاه میانی در دو طبقه‌اند؛ میانگین کدها یا طبقهٔ ساختگی گزارش نمی‌شود.');
 const cut=ordinalPercentile(s,state.percent);
 if(cut)lines.push(`اولین طبقهٔ رسیدن به ${number(state.percent)}٪: ${cut.row.label}؛ جایگاه ${number(cut.position)} از ${number(s.n)}`);
 lines.push('قرارداد طبقهٔ درصدی: نخستین طبقه با فراوانی تجمعی دست‌کم p٪؛ بدون درون‌یابی عددی بین کدها.','این گزارش فقط همین پاسخ‌ها را توصیف می‌کند؛ نتیجهٔ جامعه یا علت نیست.');
 return lines.join('\n');
}
