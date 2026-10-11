import {parseData} from './stats.js';
import {distributionValue as value} from './distributionComparison.js';
import {varianceDisplay as display} from './varianceLesson.js';

export const relativePresets={
 sameSD:{label:'مدت‌زمان؛ SD برابر، میانگین متفاوت',a:[8,10,12],b:[18,20,22],unit:'دقیقه',scale:'ratio',note:'در هر دو گروه SD نمونه‌ای ۲ دقیقه است؛ اما نسبت آن به میانگین در الف ۲۰٪ و در ب ۱۰٪ است. سؤال دربارهٔ پراکندگی مطلق با سؤال دربارهٔ پراکندگی نسبی فرق دارد.'},
 sameCV:{label:'مدت‌زمان؛ SD متفاوت، CV برابر',a:[8,10,12],b:[16,20,24],unit:'دقیقه',scale:'ratio',note:'در ب، هم میانگین و هم SD دو برابر الف است. پراکندگی مطلق بیشتر است، اما نسبت به میانگین همان ۲۰٪ می‌ماند.'},
 interval:{label:'دمای سلسیوس؛ صفر قراردادی',a:[8,10,12],b:[18,20,22],unit:'درجهٔ سلسیوس',scale:'interval',note:'همان عددهای مثال اول، این بار دما هستند. صفر سلسیوس نبودِ دما نیست؛ نسبت SD به میانگین را معیار معتبر پراکندگی نسبی نمی‌نامیم. تبدیل به فارنهایت، علاوه بر ضریب، جابه‌جایی مبدأ دارد.'},
 zeros:{label:'مدت‌زمان صفر؛ میانگین صفر یا مثبت',a:[0,0,0],b:[0,0,6],unit:'دقیقه',scale:'ratio',note:'در الف، میانگین صفر است و CV تعریف نمی‌شود. در ب وجود مشاهدهٔ صفر مانع CV نیست: میانگین ۲ و CV حدود ۱۷۳٫۲۱٪ است. CV درصد افراد نیست و سقف ۱۰۰٪ ندارد.'},
 constant:{label:'مدت‌زمان‌های برابر؛ CV صفر',a:[10,10,10],b:[20,20,20],unit:'دقیقه',scale:'ratio',note:'در هر گروه، میانگین مثبت و SD صفر است؛ CV صفرِ تعریف‌شده داریم. این وضعیت با تقسیم بر میانگین صفر فرق دارد.'},
 signed:{label:'تغییرِ علامت‌دار؛ میانگین نزدیک صفر',a:[-1,0.999],b:[-1,0.998],unit:'واحد تغییر',scale:'interval',note:'دو میانگین نزدیک صفرند؛ نسبت حسابی SD به میانگین بسیار حساس می‌شود. این دادهٔ علامت‌دار برای تفسیر CV در ابزار مناسب نیست. کوچک‌بودن عددها بر اثر تبدیل واحد، به‌تنهایی این مشکل را ایجاد نمی‌کند.'},
};
export const relativeScales={ratio:'کمّی نسبتی؛ صفرِ معنی‌دار',interval:'کمّی فاصله‌ای؛ صفر قراردادی',codes:'کدِ دستهٔ اسمی یا ترتیبی'};
export const relativeChecks=[
 {id:'comparison',question:'مدت‌زمان دو گروه، میانگین‌های ۱۰ و ۲۰ دقیقه و SD نمونه‌ای ۲ دقیقه دارد. کدام گزارش درست است؟',options:['SD برابر است؛ CV الف ۲۰٪ و ب ۱۰٪ است.','چون SD برابر است، هر دو CV برابرند.','CV یعنی درصد افراد بالاتر از میانگین.'],correct:0,feedback:['درست است: ۲÷۱۰ و ۲÷۲۰. در این دادهٔ نسبتی، اندازهٔ پراکندگی نسبت به میانگین فرق دارد.','مخرج CV میانگین است و میانگین‌های این دو گروه برابر نیستند.','CV نسبت یک اندازهٔ پراکندگی به میانگین است؛ تعداد افراد یا احتمال را نمی‌شمارد.']},
 {id:'conversion',question:'مدت‌زمان‌های [۸،۱۰،۱۲] دقیقه را واقعاً به ثانیه تبدیل می‌کنیم؛ هر عدد ×۶۰. چه اتفاقی می‌افتد؟',options:['SD ثابت و CV شصت برابر می‌شود.','میانگین و SD شصت برابر می‌شوند؛ CV همان ۲۰٪ می‌ماند.','فقط نوشتن نام «ثانیه» کنار عددهای قبلی کافی است.'],correct:1,feedback:['عدد SD هم با واحد تغییر می‌کند؛ در نسبت، ضریب صورت و مخرج حذف می‌شود.','درست است: میانگین ۶۰۰ ثانیه و SD برابر ۱۲۰ ثانیه؛ ۱۲۰÷۶۰۰=۰٫۲.','تبدیل واحد نیازمند تبدیل عددهاست؛ ویرایش برچسب، محاسبهٔ تبدیل نیست.']},
 {id:'meaning',question:'برای دمای [۸،۱۰،۱۲] درجهٔ سلسیوس، s/میانگین=۰٫۲ است. آیا آن را CV معتبرِ دما گزارش می‌کنیم؟',options:['بله؛ مثبت‌بودن عددها کافی است.','بله؛ CV کمتر از ۱۰۰٪ همیشه معتبر است.','خیر؛ صفر سلسیوس قراردادی است و نسبت به مبدأ وابسته می‌ماند.'],correct:2,feedback:['باید معنی صفر را از نوع اندازه‌گیری بشناسیم؛ از خود عددها نمی‌توان آن را فهمید.','هیچ آستانهٔ عمومیِ ۱۰۰٪ برای اعتبار CV نداریم.','درست است. در مقیاس فاصله‌ای، نسبت حسابی قابل محاسبه است؛ اما تفسیر CV را نمی‌سازد.']},
];

// Normalize before dividing, so tiny measurements retain their relative spread.
export function relativeSummary(values,scale='ratio'){
 if(!Array.isArray(values)||!values.length||values.length>200||!Array.from(values).every(x=>Number.isFinite(x)&&Math.abs(x)<=1e9)||!Object.hasOwn(relativeScales,scale))return null;
 const n=values.length,magnitude=Math.max(...values.map(Math.abs)),origin=values[0];
 const offsets=values.map(x=>magnitude?(x-origin)/magnitude:0),meanOffset=offsets.reduce((sum,x)=>sum+x,0)/n;
 const meanNormalized=(magnitude?origin/magnitude:0)+meanOffset;
 const deviations=offsets.map(x=>x-meanOffset),sdNormalized=n>1?Math.sqrt(deviations.reduce((sum,d)=>sum+d*d,0)/(n-1)):null;
 const mean=meanNormalized*magnitude,sd=sdNormalized===null?null:sdNormalized*magnitude;
 const raw=sdNormalized!==null&&meanNormalized!==0?sdNormalized/meanNormalized:null;
 const quotient=raw!==null&&Number.isFinite(raw)?raw:null;
 const reason=scale==='codes'?'کد دسته، فاصلهٔ کمّی نمی‌سازد؛ میانگین و SD کدها را تفسیر نمی‌کنیم.':n<2?'برای SD نمونه‌ای و CV دست‌کم دو مشاهده لازم است.':meanNormalized===0?'میانگین صفر است؛ تقسیم بر صفر تعریف نمی‌شود.':scale!=='ratio'?'صفر این مقیاس قراردادی است؛ نسبت حسابی به مبدأ وابسته است.':values.some(x=>x<0)?'در این ابزار، CV فقط برای اندازه‌گیری نسبتیِ نامنفی با میانگین مثبت تفسیر می‌شود.':meanNormalized<=0?'برای تفسیر CV در این ابزار میانگین باید مثبت باشد.':quotient===null?'نسبت از محدودهٔ عددی ابزار بیرون است.':null;
 return {n,values:[...values],mean,sd,meanNormalized,sdNormalized,quotient,cv:reason===null?quotient:null,reason,meanUnderflow:meanNormalized!==0&&mean===0,sdUnderflow:sdNormalized>0&&sd===0,codes:scale==='codes'};
}
export function initialRelative(id='sameSD'){
 const key=Object.hasOwn(relativePresets,id)?id:'sameSD',p=relativePresets[key];
 return {preset:key,a:p.a.join(', '),b:p.b.join(', '),unit:p.unit,scale:p.scale,factor:1,offset:'0',selected:null,answers:{},checked:{}};
}
export function analyzeRelative(state){
 const a=parseData(state.a),b=parseData(state.b),validScale=Object.hasOwn(relativeScales,state.scale);
 const groups=!a.error&&!b.error&&validScale?[relativeSummary(a.values,state.scale),relativeSummary(b.values,state.scale)]:null;
 const offset=parseData(state.offset),factorValid=[1,60,0.001].includes(state.factor);
 let scenario=null,scenarioError=null;
 if(groups){
  if(offset.error||offset.values.length!==1||!factorValid)scenarioError='برای جابه‌جایی یک عدد معتبر و برای ضریب یکی از گزینه‌های ابزار لازم است.';
  else{const shift=offset.values[0],transformed=a.values.map(x=>state.factor*x+shift);
   if(transformed.some(x=>!Number.isFinite(x)||Math.abs(x)>1e9))scenarioError='عددهای تبدیل‌شده باید در بازهٔ منفی و مثبت یک میلیارد بمانند.';
   else if(a.values.some((x,i)=>x!==0&&shift===0&&transformed[i]===0))scenarioError='تبدیل، یک مقدار غیرصفر را از دقت عددی ابزار کوچک‌تر می‌کند؛ سناریو نمایش داده نمی‌شود.';
   else {const seen=new Map(),collapsed=transformed.some((y,i)=>{if(seen.has(y)&&seen.get(y)!==a.values[i])return true;seen.set(y,a.values[i]);return false;});
    if(collapsed)scenarioError='تبدیل، مقدارهای متفاوت را در دقت عددی ابزار یکسان می‌کند؛ سناریو نمایش داده نمی‌شود.';
    else scenario={factor:state.factor,offset:shift,values:transformed,summary:relativeSummary(transformed,state.scale==='codes'?'codes':shift===0?state.scale:'interval')};
   }
  }
 }
 return {a,b,groups,scenario,scenarioError,error:a.error||b.error||(!validScale?'نوع مقیاس معتبر نیست.':null)};
}
export function relativeComparison(groups){
 if(!groups||groups.some(g=>g.cv===null))return 'تا شرایط تفسیر برای هر دو گروه برقرار نباشد، رتبه‌بندی بر اساس CV انجام نمی‌دهیم.';
 const [a,b]=groups,difference=a.cv-b.cv,tolerance=16*Number.EPSILON*Math.max(a.cv,b.cv);
 return Math.abs(difference)<=tolerance?'CV دو گروه در دقت محاسبات برابر است؛ SD و میانگین را هم کنار آن گزارش کن.':`در این داده‌ها پراکندگی نسبت به میانگین در گروه ${difference>0?'الف':'ب'} بیشتر است. این نتیجه دربارهٔ همین فهرست‌هاست؛ «بهتر بودن» گروه یا تفاوت جامعه‌ها را اثبات نمی‌کند.`;
}
export function relativeReducer(state,action){
 if(action.type==='preset')return Object.hasOwn(relativePresets,action.id)?initialRelative(action.id):state;
 if(action.type==='reset')return initialRelative(state.preset);
 if(action.type==='data'&&['a','b'].includes(action.group)&&typeof action.value==='string'&&action.value.length<=8000)return {...state,[action.group]:action.value,preset:'custom',selected:null};
 if(action.type==='unit'&&typeof action.value==='string'&&action.value.length<=60)return {...state,unit:action.value};
 if(action.type==='scale'&&Object.hasOwn(relativeScales,action.value))return {...state,scale:action.value,selected:null};
 if(action.type==='factor'&&[1,60,0.001].includes(action.value))return {...state,factor:action.value};
 if(action.type==='offset'&&typeof action.value==='string'&&action.value.length<=40)return {...state,offset:action.value};
 if(action.type==='select'&&[0,1].includes(action.group)&&analyzeRelative(state).groups)return {...state,selected:state.selected===action.group?null:action.group};
 const q=relativeChecks.find(q=>q.id===action.id);
 if(action.type==='answer'&&q&&Number.isInteger(action.value)&&action.value>=0&&action.value<q.options.length)return {...state,answers:{...state.answers,[q.id]:action.value},checked:{...state.checked,[q.id]:false}};
 if(action.type==='check'&&q&&Number.isInteger(state.answers[q.id]))return {...state,checked:{...state.checked,[q.id]:true}};
 return state;
}
export function relativeNumber(x,underflow=false){return underflow?'کوچک‌تر از دقت عددی':x===null?'تعریف‌نشده':display(x);}
export function relativePercent(x){return x===null?'قابل تفسیر نیست':relativeNumber(x*100)+'٪';}
export function relativeCVLabel(g){return g.cv!==null?relativePercent(g.cv):g.n<2||g.meanNormalized===0?'تعریف‌نشده':'قابل تفسیر نیست';}
export function buildRelativeReport(state){
 const {groups,scenario,scenarioError,error}=analyzeRelative(state),unit=state.unit.trim()||'واحد اعلام‌نشده';
 const lines=['آمارآموز — پراکندگی مطلق و نسبی',`واحد مشترک اعلام‌شده: ${unit}`,`مقیاس اعلام‌شده: ${relativeScales[state.scale]||'نامعتبر'}`,'قرارداد: SD نمونه‌ای با مخرج n−۱؛ CV=s/میانگین؛ CV درصدی=۱۰۰×CV.'];
 if(!groups)return [...lines,'نتیجه محاسبه نشده؛ همهٔ ورودی‌ها را اصلاح کن.',error].join('\n');
 groups.forEach((g,i)=>{lines.push(`گروه ${i?'ب':'الف'}: داده‌های اصلی [${g.values.map(value).join('، ')}]؛ n=${g.n}.`);
  if(g.codes)lines.push(g.reason);
  else lines.push(`میانگین=${g.meanUnderflow?'کوچک‌تر از دقت عددی':value(g.mean)} ${unit}؛ SD=${g.sdUnderflow?'کوچک‌تر از دقت عددی':g.sd===null?'تعریف‌نشده':value(g.sd)} ${unit}؛ نسبت حسابی s/میانگین=${g.quotient===null?'تعریف‌نشده':value(g.quotient)}؛ CV درصدی=${g.cv===null?relativeCVLabel(g):value(g.cv*100)+'٪'}.`,g.reason||'شرایط عددی برقرارند؛ نسبتی‌بودن و معنای صفر از نوع اندازه‌گیری اعلام می‌شود و توسط ابزار تأیید نمی‌شود.');
 });
 lines.push(relativeComparison(groups));
 if(scenario){const g=scenario.summary;lines.push(`سناریوی گروه الف: y=${value(scenario.factor)}×x+(${value(scenario.offset)})؛ مقدارهای سناریو [${scenario.values.map(value).join('، ')}].`,g.codes?g.reason:`میانگین سناریو=${relativeNumber(g.mean,g.meanUnderflow)}؛ SD سناریو=${relativeNumber(g.sd,g.sdUnderflow)}؛ نسبت حسابی=${g.quotient===null?'تعریف‌نشده':value(g.quotient)}؛ CV درصدی=${g.cv===null?relativeCVLabel(g):value(g.cv*100)+'٪'}.`,g.reason||'ضریب مثبت و بدون جابه‌جایی مبدأ: CV حفظ می‌شود.');}
 else lines.push('سناریو محاسبه نشد: '+scenarioError);
 lines.push('سناریو داده‌های اصلی را تغییر نمی‌دهد؛ ویرایش نام واحد، تبدیل عددی نیست. جابه‌جایی مبدأ را تبدیل صرفِ واحد نسبتی نمی‌نامیم.','CV درصد افراد یا احتمال نیست و می‌تواند بیشتر از ۱۰۰٪ باشد. آستانهٔ عمومی برای CV خوب یا بد نداریم.','نوع متغیر و واحد مشترک باید از طرح اندازه‌گیری تأیید شوند. CV شکل توزیع، اثر دورافتاده، خطای معیار میانگین یا کیفیت نمونه‌گیری را جایگزین نمی‌کند.','منبع: https://www.itl.nist.gov/div898/software/dataplot/refman2/auxillar/coefvari.htm');
 return lines.join('\n');
}
