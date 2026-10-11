import {parseCount} from './groupComparison.js';
import {fmt,number} from './format.js';

export const simpsonPresets={
 reversal:{label:'در هر زیرگروه بالاتر؛ در مجموع پایین‌تر',counts:['9','1','80','20','30','70','2','8']},
 balanced:{label:'ترکیب زیرگروه‌ها در دو روش برابر',counts:['90','10','80','20','30','70','20','80']},
 equalRates:{label:'درون زیرگروه برابر؛ در مجموع متفاوت',counts:['8','2','80','20','20','80','2','8']},
 mixed:{label:'جهت مقایسه در دو زیرگروه متفاوت',counts:['9','1','8','2','2','8','3','7']},
 empty:{label:'یک خانهٔ روش × زیرگروه بدون مشاهده',counts:['9','1','80','20','0','0','2','8']},
 zero:{label:'هیچ مشاهده‌ای ثبت نشده',counts:['0','0','0','0','0','0','0','0']},
};
export const simpsonChecks=[
 {id:'reversal',question:'در مثال ثابت، الف در آسان ۹۰٪ و در دشوار ۳۰٪ دارد؛ ب به‌ترتیب ۸۰٪ و ۲۰٪. در مجموع الف حدود ۳۵٫۴۵٪ و ب ۷۴٫۵۵٪ دارد. چه چیزی این نتیجه را توضیح می‌دهد؟',options:['دست‌کم یکی از درصدها حتماً اشتباه است.','وزن زیرگروه‌ها در دو روش متفاوت است؛ هر دو مقایسه می‌توانند درست باشند.','ب در هر زیرگروه سهم پاسخ درست بالاتری دارد.'],correct:1,feedback:['هر درصد مخرج خودش را دارد؛ جمعِ درست تعدادها هم می‌تواند جهت مقایسه را عوض کند.','درست است؛ الف بیشتر در دشوار و ب بیشتر در آسان مشاهده دارد. درصد کل میانگین وزنی با ترکیب واقعی هر روش است.','درون هر دو زیرگروه الف ۱۰ واحد درصد بالاتر است؛ مزیتِ ب در جدول تجمیعی دربارهٔ ترکیب فعلی افراد است.']},
 {id:'weights',question:'با درصدهای ثابتِ مثال اول، اگر در هر دو روش وزن آسان ۵۰٪ و دشوار ۵۰٪ باشد، درصد سناریوی مشترک چیست؟',options:['الف ۶۰٪ و ب ۵۰٪؛ میانگین وزنی دو زیرگروه.','الف ۱۲۰٪ و ب ۱۰۰٪؛ درصدها را جمع می‌کنیم.','همان ۳۵٫۴۵٪ و ۷۴٫۵۵٪؛ وزن‌ها هیچ اثری ندارند.'],correct:0,feedback:['درست است؛ الف: ۰٫۵×۹۰+۰٫۵×۳۰=۶۰؛ ب: ۰٫۵×۸۰+۰٫۵×۲۰=۵۰. این درصدها سناریو هستند و تعدادهای ثبت‌شده را تغییر نمی‌دهند.','وزن‌های ۰٫۵ و ۰٫۵ جمعاً یک‌اند؛ میانگین وزنیِ درصدها از ۱۰۰٪ بیشتر نمی‌شود.','درصد کل به وزن هر زیرگروه وابسته است؛ درصدهای درون زیرگروه را ثابت نگه داشتیم و ترکیب را مشترک کردیم.']},
 {id:'cause',question:'اگر پس از استفاده از وزن مشترک، درصد روش الف بالاتر بماند، چه گزارشی مناسب است؟',options:['ثابت شد روش الف علت نتیجهٔ بهتر است.','حالا می‌توان همهٔ داده‌های دشوار را حذف کرد.','در این سناریوی توصیفی الف بالاتر است؛ برای اثر علّی باید طراحی و نحوهٔ تشکیل گروه‌ها بررسی شود.'],correct:2,feedback:['وزن‌دهی به دو زیرگروه، تخصیص تصادفی یا کنترل همهٔ عوامل مؤثر را ایجاد نمی‌کند.','زیرگروه دشوار بخشی از داده است؛ تفاوت نتیجه مجوز حذف آن نیست.','درست است؛ انتخاب متغیر مناسب برای گروه‌بندی و تفسیر علّی به سؤال و طراحی مطالعه وابسته است. جدول به‌تنهایی بهترین تصمیم یا علت را تعیین نمی‌کند.']},
];
const clean=value=>typeof value==='string'?value.trim().replace(/\s+/g,' '):'';
const labelKey=value=>clean(value).replace(/ي/g,'ی').replace(/ك/g,'ک').replace(/\u200c/g,' ').replace(/\s+/g,' ').trim().toLowerCase();
const rate=(positive,n)=>n?100*positive/n:null;
const direction=groups=>groups.some(g=>!g.n)?null:Math.sign(groups[0].positive*groups[1].n-groups[1].positive*groups[0].n);
function presetState(id){return {preset:id,labels:['تمرین آسان','تمرین دشوار'],counts:[...simpsonPresets[id].counts],weight:50,selected:'s0g0',answers:{},checked:{}};}
export const initialSimpson=()=>presetState('reversal');
export function analyzeSimpson(state){
 if(!Array.isArray(state?.counts)||state.counts.length!==8||!Array.isArray(state.labels)||state.labels.length!==2)return {counts:[],labels:[],error:'هشت تعداد و نام دو زیرگروه لازم است.',summary:null};
 const counts=Array.from(state.counts,parseCount),labels=Array.from(state.labels,clean);
 if(counts.some(n=>n===null)||labels.some(l=>!l||l.length>60)||labelKey(labels[0])===labelKey(labels[1]))return {counts,labels,error:'نام‌های متمایز و تعدادهای صحیح از صفر تا ۱٬۰۰۰٬۰۰۰ وارد کن؛ خانهٔ خالی صفر نیست.',summary:null};
 const strata=labels.map((label,index)=>{
  const groups=[0,1].map(group=>{const offset=index*4+group*2,positive=counts[offset],negative=counts[offset+1],n=positive+negative;return {group,positive,negative,n,rate:rate(positive,n)};});
  return {index,label,groups,difference:groups.some(g=>g.rate===null)?null:groups[0].rate-groups[1].rate,direction:direction(groups)};
 });
 const pooled=[0,1].map(group=>{const positive=strata.reduce((sum,s)=>sum+s.groups[group].positive,0),negative=strata.reduce((sum,s)=>sum+s.groups[group].negative,0),n=positive+negative;return {group,positive,negative,n,rate:rate(positive,n),weights:strata.map(s=>n?s.groups[group].n/n:null)};});
 const pooledDirection=direction(pooled),within=strata.map(s=>s.direction);
 let classification;
 if(within.includes(null)||pooledDirection===null)classification='incomplete';
 else if(within[0]!==0&&within[0]===within[1])classification=pooledDirection===-within[0]?'reversal':pooledDirection===0?'aggregateTie':'sameDirection';
 else if(within.every(d=>d===0))classification=pooledDirection===0?'allTie':'composition';
 else classification='mixed';
 return {counts,labels,error:null,summary:{strata,pooled,total:pooled.reduce((sum,g)=>sum+g.n,0),difference:pooled.some(g=>g.rate===null)?null:pooled[0].rate-pooled[1].rate,direction:pooledDirection,classification}};
}
// Integer cross-products determine observed directions before any display rounding.
// Common-weight directions use exact rational arithmetic, with only the final sign returned.
export function commonComposition(summary,weight){
 if(!summary||!Number.isInteger(weight)||weight<0||weight>100)return null;
 const weights=[weight/100,(100-weight)/100];
 const contributions=[0,1].map(group=>summary.strata.map((s,index)=>weights[index]===0?0:s.groups[group].rate===null?null:weights[index]*s.groups[group].rate));
 const rates=contributions.map(values=>values.includes(null)?null:values.reduce((sum,v)=>sum+v,0));
 let exactDirection=null;
 if(rates.every(r=>r!==null)){
  let numerator=0n,denominator=1n;
  for(let i=0;i<2;i++){
   const w=i===0?weight:100-weight;if(!w)continue;
   const [a,b]=summary.strata[i].groups,term=BigInt(w)*(BigInt(a.positive)*BigInt(b.n)-BigInt(b.positive)*BigInt(a.n)),divisor=BigInt(a.n)*BigInt(b.n);
   numerator=numerator*divisor+term*denominator;denominator*=divisor;
  }
  exactDirection=numerator===0n?0:numerator>0n?1:-1;
 }
 return {weights,rates,contributions,difference:rates.includes(null)?null:rates[0]-rates[1],direction:exactDirection};
}
export function simpsonShare(value){return value===null?'تعریف‌نشده':value>0&&value<.01?'کمتر از ۰٫۰۱٪':value<100&&value>99.99?'بیشتر از ۹۹٫۹۹٪':fmt(value)+'٪';}
export function simpsonGap(value,sign){if(value===null||sign===null)return 'مقایسه تعریف‌نشده است.';if(sign===0)return 'درصدهای الف و ب برابرند.';return `روش ${sign>0?'الف':'ب'}، ${Math.abs(value)<.01?'کمتر از ۰٫۰۱':fmt(Math.abs(value))} واحد درصد بالاتر است.`;}
export function simpsonClassification(summary){
 const messages={
  reversal:['جهت مقایسه برعکس شد؛ پارادوکس سیمپسون','در هر دو زیرگروه، یک روش سهم پاسخ درست بالاتری دارد؛ در مجموع روش دیگر بالاتر است. وزن زیرگروه‌ها را در هر روش بررسی کن.'],
  sameDirection:['جهت درون زیرگروه و مجموع یکسان است','هر دو زیرگروه و مجموع در یک جهت‌اند؛ ترکیب متفاوت همیشه وارونگی نمی‌سازد.'],
  aggregateTie:['در هر زیرگروه متفاوت؛ در مجموع برابر','یک روش در هر دو زیرگروه بالاتر است، اما وزن‌ها باعث شده‌اند درصد کل برابر شود. این حالت، وارونگیِ جهت نیست.'],
  composition:['درون هر زیرگروه برابر؛ در مجموع متفاوت','در هر زیرگروه درصد دو روش برابر است؛ تفاوت مجموع به سهم متفاوت زیرگروه‌ها مربوط است. این حالت با برتریِ یک روش در هر دو زیرگروه فرق دارد.'],
  allTie:['درون زیرگروه‌ها و مجموع برابرند','درصدهای دو روش در هر زیرگروه و مجموع برابرند؛ تعدادهای خام هنوز می‌توانند متفاوت باشند.'],
  mixed:['جهت مقایسه در زیرگروه‌ها یکسان و غیرصفر نیست','ممکن است یک زیرگروه برابر یا جهت دو زیرگروه متفاوت باشد. این ابزار آن را وارونگیِ یک جهت مشترک در هر دو زیرگروه نمی‌نامد.'],
  incomplete:['برای مقایسهٔ کامل، مشاهده کافی نداریم','حداقل یک روش در یک زیرگروه مشاهده ندارد؛ درصد آن تعریف نمی‌شود. از درصدهای موجود، برتری در همهٔ زیرگروه‌ها نتیجه نگیر.'],
 };return messages[summary.classification];
}
export function simpsonReducer(state,action){
 if(action.type==='preset')return Object.hasOwn(simpsonPresets,action.id)?presetState(action.id):state;
 if(action.type==='reset')return presetState(Object.hasOwn(simpsonPresets,state.preset)?state.preset:'reversal');
 if(action.type==='count')return Number.isInteger(action.index)&&action.index>=0&&action.index<8&&typeof action.value==='string'&&action.value.length<=40?{...state,counts:state.counts.map((v,i)=>i===action.index?action.value:v),selected:null}:state;
 if(action.type==='label')return [0,1].includes(action.index)&&typeof action.value==='string'&&action.value.length<=60?{...state,labels:state.labels.map((v,i)=>i===action.index?action.value:v),selected:null}:state;
 if(action.type==='weight')return Number.isInteger(action.value)&&action.value>=0&&action.value<=100?{...state,weight:action.value}:state;
 if(action.type==='select')return ['s0g0','s0g1','s1g0','s1g1','p0','p1','c0','c1'].includes(action.id)?{...state,selected:state.selected===action.id?null:action.id}:state;
 if(action.type==='answer'){
  const q=simpsonChecks.find(q=>q.id===action.id);if(!q||!Number.isInteger(action.value)||!q.options[action.value])return state;
  return {...state,answers:{...state.answers,[action.id]:action.value},checked:{...state.checked,[action.id]:false}};
 }
 if(action.type==='check')return simpsonChecks.some(q=>q.id===action.id)&&Number.isInteger(state.answers[action.id])?{...state,checked:{...state.checked,[action.id]:true}}:state;
 return state;
}
export function simpsonSelection(summary,state){
 if(!state.selected)return 'با کلیک یا Enter روی میله یا ردیف، صورت و مخرج همان درصد را ببین.';
 const group=Number(state.selected.at(-1)),name=group?'ب':'الف';
 if(state.selected.startsWith('c')){
  const c=commonComposition(summary,state.weight);if(!c)return 'وزن نامعتبر است.';
  return `سناریوی روش ${name}: وزن ${number(state.weight)}٪ برای «${summary.strata[0].label}» و ${number(100-state.weight)}٪ برای «${summary.strata[1].label}»؛ درصد ترکیبی ${simpsonShare(c.rates[group])}. این میانگین وزنیِ درصدهای مشاهده‌شده است؛ تعداد تازه‌ای از افراد ساخته نمی‌شود.`;
 }
 const stratum=state.selected.startsWith('s')?Number(state.selected[1]):null,row=stratum===null?summary.pooled[group]:summary.strata[stratum].groups[group];
 return `روش ${name} · ${stratum===null?'مجموع دو زیرگروه':summary.strata[stratum].label}: ${number(row.positive)} پاسخ درست از ${number(row.n)} مشاهدهٔ معتبر = ${simpsonShare(row.rate)}. ${row.n?'مخرج، کل درست و نادرست همین روش و همین سطح است.':'مخرج صفر است؛ درصد تعریف نمی‌شود.'}`;
}
export function buildSimpsonReport(state){
 const s=analyzeSimpson(state).summary,lines=['گزارش توصیفی ترکیب زیرگروه‌ها و پارادوکس سیمپسون','مثال‌های آماده ساختگی‌اند. هر فرد یک روش، یک زیرگروه و یک پاسخ درست/نادرست دارد. فقط ثبت‌های معتبر وارد می‌شوند؛ گمشده، نادرست یا صفر فرض نمی‌شود.'];
 if(!s)return [...lines,'ورودی نامعتبر است؛ نتیجهٔ عددی گزارش نمی‌شود.'].join('\n');
 lines.push('تعدادها در ترتیب اصلی؛ درصدها تا دو رقم اعشار نمایش داده می‌شوند.');
 for(const stratum of s.strata){for(const g of stratum.groups)lines.push(`${stratum.label}؛ روش ${g.group?'ب':'الف'}؛ درست ${number(g.positive)}؛ نادرست ${number(g.negative)}؛ کل ${number(g.n)}؛ درصد درست ${simpsonShare(g.rate)}`);lines.push('مقایسهٔ زیرگروه: '+simpsonGap(stratum.difference,stratum.direction));}
 for(const g of s.pooled)lines.push(`مجموع؛ روش ${g.group?'ب':'الف'}؛ درست ${number(g.positive)}؛ نادرست ${number(g.negative)}؛ کل ${number(g.n)}؛ درصد درست ${simpsonShare(g.rate)}؛ وزن زیرگروه‌ها ${g.weights.map(w=>simpsonShare(w===null?null:100*w)).join('، ')}`);
 lines.push('مقایسهٔ مجموع: '+simpsonGap(s.difference,s.direction),...simpsonClassification(s),'قرارداد وارونگی در این ابزار: جهتِ غیرصفر یکسان در هر دو زیرگروهِ قابل مقایسه و جهت غیرصفر مخالف در مجموع؛ تصمیم از تعداد دقیق، قبل از گردکردن است.');
 const c=commonComposition(s,state.weight);
 if(c){lines.push(`سناریوی ترکیب مشترک: وزن ${number(state.weight)}٪ برای ${s.strata[0].label}؛ ${number(100-state.weight)}٪ برای ${s.strata[1].label}`);for(let g=0;g<2;g++)lines.push(`روش ${g?'ب':'الف'}؛ درصد سناریو ${simpsonShare(c.rates[g])}؛ سهم وزنی زیرگروه‌ها (واحد درصد) ${c.contributions[g].map(v=>v===null?'تعریف‌نشده':String(v).replace(/[0-9]/g,d=>'۰۱۲۳۴۵۶۷۸۹'[Number(d)])).join(' + ')}`);lines.push('مقایسهٔ سناریو: '+simpsonGap(c.difference,c.direction));}
 lines.push('درصد کل از جمع تعداد درست تقسیم بر جمع کل به دست می‌آید؛ برابر میانگین وزنی درصد زیرگروه‌ها با وزن اندازهٔ آن‌هاست. میانگین ساده فقط با وزن‌های برابر یا در موارد خاص همان نتیجه را می‌دهد.','زیرگروه بدون مشاهده، درصد صفر ندارد. در سناریوی مشترک، درصد نامعلوم با وزن مثبت قابل محاسبه نیست؛ وزن صفر آن زیرگروه را از سناریو کنار می‌گذارد، بدون حذف دادهٔ اصلی.','سناریوی وزن مشترک شمار مشاهده‌های ثبت‌شده یا درصد کل واقعی را تغییر نمی‌دهد؛ نمونهٔ جدید یا نتیجهٔ علّی نیست.','انتخاب متغیر مناسب برای گروه‌بندی به سؤال، زمان اندازه‌گیری و طراحی مطالعه وابسته است. این جدول تصادفی‌سازی، اثر علّی یا نمایندگی جامعه را اثبات نمی‌کند؛ نتیجهٔ کل و درون زیرگروه‌ها را با مخرج روشن گزارش کن.');
 return lines.join('\n');
}
