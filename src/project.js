import {describe,pairStats} from './stats.js';
import {fmt,number} from './format.js';

export const PROJECT_KEY='amar-academy:project:v1';
export const projectCase='sleep-stress-v1';
export const projectRows=[
  {id:1,group:'الف',sleep:5,stress:10},{id:2,group:'الف',sleep:6,stress:9},
  {id:3,group:'الف',sleep:6,stress:8},{id:4,group:'الف',sleep:7,stress:7},
  {id:5,group:'ب',sleep:7,stress:6},{id:6,group:'ب',sleep:8,stress:5},
  {id:7,group:'ب',sleep:8,stress:4},{id:8,group:'ب',sleep:9,stress:3},
  {id:9,group:'الف',sleep:null,stress:4},{id:10,group:'ب',sleep:25,stress:2},
];
export const decisionLabels={include:'ورود به تحلیل',missing:'کنارگذاشتن جفت ناقص',range:'کنارگذاشتن مقدار نامعتبر'};
export const reportFields=[
  {id:'question',label:'۱. سؤال و داده',hint:'این داده‌ها متعلق به چه مثال و چه افرادی‌اند؟ چه پرسش توصیفی را بررسی می‌کنی؟'},
  {id:'decisions',label:'۲. تصمیم دربارهٔ کیفیت داده',hint:'دو رکورد کنارگذاشته‌شده، دلیل هر تصمیم و تعداد جفت‌های معتبر را بنویس.'},
  {id:'summary',label:'۳. خلاصهٔ عددی',hint:'تعداد، میانگین و انحراف معیار خواب را با واحد ساعت و قرارداد نمونه‌ای گزارش کن.'},
  {id:'interpretation',label:'۴. توصیف رابطه',hint:'جهت رابطه، مقدار پیرسون و آنچه در نمودار می‌بینی را برای همین جفت‌ها توضیح بده.'},
  {id:'limits',label:'۵. محدودیت‌ها',hint:'ساختگی‌بودن مثال، تعداد اندک، تصمیم دربارهٔ داده و محدودیت علیت و تعمیم را روشن کن.'},
];
export const setupQuestions=[
  {id:'goal',label:'هدف این پروژه چیست؟',correct:'describe',options:[['describe','توصیف خواب، استرس و همراهی آن‌ها در همین داده'],['cause','اثبات اینکه خواب علت کاهش استرس است'],['population','تعیین نتیجهٔ قطعی دربارهٔ همهٔ دانشجویان']],feedback:'هدف، توصیف همین داده است؛ طراحی این مثال برای اثبات علت یا نتیجهٔ قطعی دربارهٔ جامعه کافی نیست.'},
  {id:'chart',label:'برای دیدن اتصال خواب و استرسِ هر فرد کدام نمودار اصلی مناسب است؟',correct:'scatter',options:[['scatter','نمودار پراکنشِ جفت‌ها'],['hist','هیستوگرام خواب به‌تنهایی'],['pie','نمودار دایره‌ای']],feedback:'نمودار پراکنش جفت‌های هر فرد را نشان می‌دهد. هیستوگرام برای توزیع یک متغیر مفید است و اتصال دو مقدار را نشان نمی‌دهد.'},
  {id:'variance',label:'با فرض اینکه این داده یک نمونه است، مخرج واریانس چیست؟',correct:'sample',options:[['sample','n−1؛ قرارداد نمونه‌ای'],['population','n؛ قرارداد جامعه'],['mean','میانگین نمره‌ها']],feedback:'در این پروژه قرارداد نمونه‌ای انتخاب شده است؛ مخرج واریانس تعداد مشاهده‌های معتبر منهای یک است.'},
];
export const interpretationOptions=[
  ['negative','در این جفت‌ها، رابطهٔ خطی منفی دیده می‌شود؛ علت از این نمودار و ضریب معلوم نمی‌شود.'],
  ['cause','خواب بیشتر، به‌طور قطعی استرس را در همهٔ افراد کاهش داده است.'],
  ['percent','پیرسون نشان می‌دهد چند درصد افراد استرس ندارند.'],
];
const fieldObject=value=>Object.fromEntries(reportFields.map(field=>[field.id,value]));
export function initialProject(){return {stage:0,decisions:Object.fromEntries(projectRows.map(row=>[row.id,'include'])),dataChecked:false,setup:{goal:'',chart:'',variance:''},setupChecked:false,interpretation:'',analysisChecked:false,chart:'scatter',report:fieldObject(''),review:fieldObject(false),feedback:null};}
export function expectedDecision(row){return row.sleep===null||row.stress===null?'missing':row.sleep<0||row.sleep>24?'range':'include';}
export function assessProjectData(decisions){
  const issues=projectRows.flatMap(row=>{
    const expected=expectedDecision(row),actual=decisions?.[row.id];
    if(actual===expected)return [];
    return [{id:row.id,message:expected==='missing'?'خواب ثبت نشده است؛ آن را صفر یا یک جفت کامل فرض نکن. در قرارداد فعلی، کل این جفت کنار گذاشته می‌شود.':expected==='range'?'۲۵ ساعت خواب در یک روز از بازهٔ معتبر صفر تا ۲۴ بیرون است. مقدار را حدسی اصلاح نکن؛ این جفت در قرارداد فعلی کنار گذاشته می‌شود.':'این رکورد کامل و در بازهٔ معتبر است؛ مطابق قرارداد پروژه وارد تحلیل می‌شود.'}];
  });
  return {ok:issues.length===0,issues};
}
export function assessProjectSetup(setup){const issues=setupQuestions.filter(question=>setup?.[question.id]!==question.correct).map(question=>({id:question.id,message:question.feedback}));return {ok:issues.length===0,issues};}
export function projectAnalysis(state){
  if(!state.dataChecked||!assessProjectData(state.decisions).ok)return null;
  const rows=projectRows.filter(row=>state.decisions[row.id]==='include'),x=rows.map(row=>row.sleep),y=rows.map(row=>row.stress);
  return {rows,x,y,sleep:describe(x),stress:describe(y),pair:pairStats(x,y),groups:['الف','ب'].map(group=>{const members=rows.filter(row=>row.group===group);return {group,n:members.length,sleep:describe(members.map(row=>row.sleep)),stress:describe(members.map(row=>row.stress))};})};
}
export function projectReportStatus(state){const missing=reportFields.filter(field=>!state.report[field.id].trim()).map(field=>field.id),unchecked=reportFields.filter(field=>!state.review[field.id]).map(field=>field.id);return {ready:state.dataChecked&&state.setupChecked&&state.analysisChecked&&missing.length===0&&unchecked.length===0,missing,unchecked};}
export function projectReducer(state,action){
  if(action.type==='decision'){
    if(!projectRows.some(row=>row.id===action.id)||!Object.hasOwn(decisionLabels,action.value))return state;
    return {...state,decisions:{...state.decisions,[action.id]:action.value},dataChecked:false,setupChecked:false,analysisChecked:false,review:fieldObject(false),stage:0,feedback:null};
  }
  if(action.type==='checkData'){const assessment=assessProjectData(state.decisions);return {...state,dataChecked:assessment.ok,feedback:assessment.ok?{ok:true,messages:['تصمیم‌ها با قرارداد پروژه سازگارند: ۸ جفت معتبر باقی می‌ماند.']}:{ok:false,messages:assessment.issues.map(issue=>`شناسهٔ ${number(issue.id)}: ${issue.message}`)}};}
  if(action.type==='setup'){
    const question=setupQuestions.find(q=>q.id===action.id);if(!question?.options.some(([value])=>value===action.value))return state;
    return {...state,setup:{...state.setup,[action.id]:action.value},setupChecked:false,analysisChecked:false,review:fieldObject(false),stage:Math.min(state.stage,1),feedback:null};
  }
  if(action.type==='checkSetup'){
    if(!state.dataChecked)return state;
    const assessment=assessProjectSetup(state.setup);return {...state,setupChecked:assessment.ok,feedback:{ok:assessment.ok,messages:assessment.ok?['روش با سؤال توصیفی پروژه و قرارداد نمونه‌ای سازگار است.']:assessment.issues.map(issue=>issue.message)}};
  }
  if(action.type==='interpretation'){
    if(!interpretationOptions.some(([value])=>value===action.value))return state;
    return {...state,interpretation:action.value,analysisChecked:false,review:{...state.review,interpretation:false,limits:false},feedback:null};
  }
  if(action.type==='checkAnalysis'){
    if(!state.dataChecked||!state.setupChecked)return state;
    const ok=state.interpretation==='negative';return {...state,analysisChecked:ok,feedback:{ok,messages:[ok?'درست است؛ نتیجه را به همین جفت‌های داده محدود کرده‌ای.':state.interpretation==='percent'?'پیرسون درصد افراد نیست؛ جهت و همراهی خطی دو متغیر را خلاصه می‌کند.':'نمودار و همبستگی به‌تنهایی علت را اثبات نمی‌کنند؛ تفسیر توصیفیِ همین داده را انتخاب کن.']}};
  }
  if(action.type==='stage'){
    const max=state.dataChecked?(state.setupChecked?(state.analysisChecked?3:2):1):0;
    return Number.isInteger(action.value)&&action.value>=0&&action.value<=max?{...state,stage:action.value,feedback:null}:state;
  }
  if(action.type==='chart')return ['scatter','hist','box'].includes(action.value)?{...state,chart:action.value}:state;
  if(action.type==='report'){
    if(!reportFields.some(field=>field.id===action.id)||typeof action.value!=='string'||action.value.length>4000)return state;
    return {...state,report:{...state.report,[action.id]:action.value},review:{...state.review,[action.id]:false}};
  }
  if(action.type==='review')return reportFields.some(field=>field.id===action.id)&&typeof action.value==='boolean'?{...state,review:{...state.review,[action.id]:action.value}}:state;
  return state;
}
export function normalizeProject(value){
  const state=initialProject();if(!value||typeof value!=='object'||Array.isArray(value))return state;
  for(const row of projectRows)if(Object.hasOwn(decisionLabels,value.decisions?.[row.id]))state.decisions[row.id]=value.decisions[row.id];
  for(const q of setupQuestions)if(q.options.some(([id])=>id===value.setup?.[q.id]))state.setup[q.id]=value.setup[q.id];
  if(interpretationOptions.some(([id])=>id===value.interpretation))state.interpretation=value.interpretation;
  if(['scatter','hist','box'].includes(value.chart))state.chart=value.chart;
  for(const field of reportFields){const text=value.report?.[field.id];if(typeof text==='string'&&text.length<=4000)state.report[field.id]=text;state.review[field.id]=value.review?.[field.id]===true;}
  state.dataChecked=value.dataChecked===true&&assessProjectData(state.decisions).ok;
  state.setupChecked=value.setupChecked===true&&state.dataChecked&&assessProjectSetup(state.setup).ok;
  state.analysisChecked=value.analysisChecked===true&&state.setupChecked&&state.interpretation==='negative';
  const max=state.dataChecked?(state.setupChecked?(state.analysisChecked?3:2):1):0;
  state.stage=Number.isInteger(value.stage)?Math.max(0,Math.min(max,value.stage)):0;
  return state;
}
export function loadProjectDraft(storage){
  try{
    const store=storage===undefined?globalThis.localStorage:storage,raw=store.getItem(PROJECT_KEY);
    if(raw===null)return {state:initialProject(),blocked:false};
    const data=JSON.parse(raw);
    if(data?.version!==1||data.case!==projectCase||!data.state||typeof data.state!=='object'||Array.isArray(data.state))throw Error('Unknown draft');
    return {state:normalizeProject(data.state),blocked:false};
  }catch{return {state:initialProject(),blocked:true};}
}
export function saveProjectDraft(state,storage){try{const store=storage===undefined?globalThis.localStorage:storage;store.setItem(PROJECT_KEY,JSON.stringify({version:1,case:projectCase,state:normalizeProject(state)}));return true;}catch{return false;}}
export function buildProjectReport(input){
  const state=normalizeProject(input),status=projectReportStatus(state),analysis=projectAnalysis(state);
  const lines=['آمارآموز — '+(status.ready?'گزارش آموزشی با خودبازبینی کاربر':'پیش‌نویس گزارش آموزشی'),'پروژهٔ خواب و استرس · مثال ساختگیِ درس دهم','این گزارش تأیید علمی خودکار متن کاربر نیست.',''];
  for(const field of reportFields)lines.push(field.label,state.report[field.id].trim()||'هنوز نوشته نشده است.',`خودبازبینی این بخش: ${state.review[field.id]?'علامت خورده':'انجام نشده'}`,'');
  lines.push('ثبت تصمیم‌ها برای بازبینی:');for(const row of projectRows)lines.push(`شناسهٔ ${number(row.id)}: ${decisionLabels[state.decisions[row.id]]}`);
  if(analysis&&state.setupChecked){lines.push('',`جفت‌های معتبر: ${number(analysis.pair.n)}`,`خواب: میانگین ${fmt(analysis.sleep.mean)} ساعت، میانه ${fmt(analysis.sleep.median)} ساعت، انحراف معیار نمونه‌ای ${fmt(analysis.sleep.sd)} ساعت، IQR=${fmt(analysis.sleep.iqr)} ساعت.`,`استرس: میانگین ${fmt(analysis.stress.mean)} نمره، انحراف معیار نمونه‌ای ${fmt(analysis.stress.sd)} نمره.`,`پیرسون: ${fmt(analysis.pair.r)}؛ همبستگی به‌تنهایی علیت نیست.`,`گروه‌های همین داده: ${analysis.groups.map(group=>`${group.group}: n=${number(group.n)}، میانگین خواب ${fmt(group.sleep.mean)} ساعت`).join('؛ ')}`,'قرارداد: جفت‌های کامل و معتبر؛ خواب بین صفر تا ۲۴ ساعت؛ واریانس نمونه‌ای با n−1؛ چارک نوع ۷.','داده‌های معتبر با حفظ ترتیب جفت‌ها:','شناسه,گروه,خواب_ساعت,استرس');for(const row of analysis.rows)lines.push(`${row.id},${row.group},${row.sleep},${row.stress}`);}
  else lines.push('','نتایج عددی هنوز گزارش نشده‌اند؛ کیفیت داده و روش باید تأیید شوند.');
  lines.push('','محدودیت: داده‌ها ساختگی‌اند؛ نتیجه فقط این مشاهده‌ها را توصیف می‌کند و تعمیم به جامعه یا علت را اثبات نمی‌کند.','اصل دادهٔ گمشده یا نامعتبر حدسی اصلاح نشده است.');
  return lines.join('\n');
}
