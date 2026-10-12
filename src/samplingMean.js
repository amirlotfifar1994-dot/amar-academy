import {parseData} from './stats.js';
import {varianceSummary,varianceDisplay as number} from './varianceLesson.js';
import {distributionValue as value} from './distributionComparison.js';

export const samplingPresets={
 balanced:{label:'سه مقدار متقارن؛ ۲،۴،۶',values:[2,4,6],unit:'واحد',note:'جامعهٔ مدل سه عضو دارد؛ در هر برداشت، هر عضو احتمال ۱/۳ دارد. برای نمونهٔ دوتایی، ۹ ترتیب ممکن داریم و میانگین ۴ در سه ترتیب رخ می‌دهد.'},
 wide:{label:'همان میانگین؛ پراکندگی افراد بیشتر',values:[0,4,8],unit:'واحد',note:'میانگین جامعه هنوز ۴ است؛ فاصله‌های افراد دو برابر مثال اول است. در اندازهٔ نمونهٔ یکسان، هم SD جامعه و هم SE واقعی مدل دو برابر می‌شوند.'},
 shifted:{label:'به همهٔ مقدارها ۱۰ اضافه شود',values:[12,14,16],unit:'واحد',note:'مرکز توزیع افراد و میانگین‌ها جابه‌جا می‌شود. پراکندگی افراد و SE مدل، در اندازهٔ نمونهٔ ثابت، همان مثال اول می‌مانند.'},
 skew:{label:'جامعهٔ نامتقارن؛ سه ۱ و یک ۹',values:[1,1,1,9],unit:'واحد',note:'چهار عضو جدا داریم؛ سه عضو مقدار ۱ دارند. احتمال مقدار ۱ برابر ۳/۴ است. افزایش n در این مدل، SE را کم می‌کند؛ توزیع میانگین‌ها برای n کوچک همچنان گسسته است.'},
 repeated:{label:'مقدار برابر؛ عضوهای متفاوت',values:[2,2,6],unit:'واحد',note:'دو عضو مقدار ۲ دارند. ترتیب عضوهای ۱ و ۲ با ترتیب ۲ و ۱ متفاوت است؛ هر دو یک میانگین می‌دهند. تعداد حالت‌ها از هویت عضوها به دست می‌آید.'},
 constant:{label:'همهٔ افراد مدل مقدار ۴ دارند',values:[4,4,4],unit:'واحد',note:'همهٔ میانگین‌های ممکن ۴ هستند. SD جامعه و SE واقعی مدل صفرند؛ برای n≥۲، SD نمونهٔ انتخاب‌شده هم صفر است.'},
};
export const samplingChecks=[
 {id:'meaning',question:'در یک نمونه با ۳۶ مشاهدهٔ مستقل، SD نمونه‌ای ۱۲ واحد است. برآورد سادهٔ SE میانگین چند است و چه چیزی را توصیف می‌کند؟',options:['۲ واحد؛ برآورد نوسان میانگین در نمونه‌گیری تکرارشونده.','۱۲ واحد؛ SE همان پراکندگی افراد است.','۲ واحد؛ فاصلهٔ دقیق همین میانگین از میانگین جامعه.'],correct:0,feedback:['درست است: ۱۲ تقسیم بر ریشهٔ ۳۶، یعنی ۱۲÷۶=۲. SD افراد همچنان ۱۲ است.','SD و SE دو هدف دارند؛ SE برآوردی در این فرمول برابر s/√n است.','عدد ۲ برآورد اندازهٔ نوسان میانگین است؛ خطای دقیق یک نمونه را معلوم نمی‌کند.']},
 {id:'size',question:'در مدلِ برداشت مستقل با جایگذاری، SD جامعه ۴ واحد است. وقتی n از ۱ به ۴ برسد، SE واقعی و SD جامعه چه می‌شوند؟',options:['هر دو به ۲ واحد می‌رسند.','SE به ۲ واحد می‌رسد؛ SD جامعه همان ۴ است.','SE به ۱ واحد می‌رسد؛ چون n چهار برابر شده است.'],correct:1,feedback:['بزرگ‌شدن نمونه، مقدارها یا پراکندگی جامعهٔ مدل را تغییر نمی‌دهد.','درست است: SE=۴÷√۴=۲. برای نصف‌شدن SE، اندازهٔ نمونه چهار برابر شد.','SE با ریشهٔ n تغییر می‌کند، نه خود n؛ ریشهٔ ۴ برابر ۲ است.']},
 {id:'zero',question:'جامعهٔ مدل [۲،۴،۶] است. در یک برداشت دوتایی با جایگذاری، [۲،۲] دیده‌ایم و s و SE برآوردی صفر شده‌اند. چه نتیجه‌ای مناسب است؟',options:['ثابت شد میانگین نمونه هیچ نوسانی ندارد.','کافی است همین دو ردیف را کپی کنیم تا نمونهٔ مستقل بزرگی بسازیم.','این نمونهٔ کوچک پراکندگی مدل را نشان نداده؛ SE واقعی مدل هنوز مثبت است.'],correct:2,feedback:['صفرشدن s در یک نمونهٔ کوچک، تمام نمونه‌های ممکن یا جامعه را توصیف نمی‌کند.','کپی‌کردن دادهٔ واقعی، مشاهدهٔ مستقل تازه ایجاد نمی‌کند؛ کوچک‌شدن صوری s/√n اعتبار نمی‌سازد.','درست است. در این مدل σ=√(۸/۳) و SE واقعی برای n=۲ برابر √(۴/۳) است؛ هر دو مثبت‌اند.']},
];

export function parseModelPopulation(text){
 const data=parseData(text);
 if(data.error)return data;
 if(data.values.length<2||data.values.length>6||!data.values.every(x=>Number.isInteger(x)&&Math.abs(x)<=100))return {...data,error:'برای جامعهٔ آموزشی، ۲ تا ۶ عدد صحیح بین منفی و مثبت ۱۰۰ وارد کن. هر جایگاه یک عضو جداست؛ مقدار برابر مجاز است.'};
 return data;
}
export function samplingModel(values,n){
 if(!Array.isArray(values)||values.length<2||values.length>6||!Array.from(values).every(x=>Number.isInteger(x)&&Math.abs(x)<=100)||!Number.isInteger(n)||n<1||n>4)return null;
 const summary=varianceSummary(values),N=values.length,total=N**n,outcomes=[],buckets=new Map();
 for(let index=0;index<total;index++){
  let code=index;const indices=Array(n);for(let draw=n-1;draw>=0;draw--){indices[draw]=code%N;code=Math.floor(code/N);}
  const sum=indices.reduce((s,i)=>s+values[i],0),outcome={index,indices,sum,mean:sum/n};outcomes.push(outcome);
  const bucket=buckets.get(sum);if(bucket)bucket.count++;else buckets.set(sum,{sum,mean:sum/n,count:1,firstIndex:index});
 }
 const means=[...buckets.values()].sort((a,b)=>a.sum-b.sum).map(p=>({...p,probability:p.count/total}));
 const meanOfMeans=means.reduce((s,p)=>s+p.mean*p.probability,0),varianceOfMeans=means.reduce((s,p)=>s+(p.mean-summary.mean)**2*p.probability,0);
 const populationBuckets=new Map();values.forEach((x,index)=>{const p=populationBuckets.get(x);if(p)p.count++;else populationBuckets.set(x,{mean:x,count:1,firstIndex:index});});
 const individuals=[...populationBuckets.values()].sort((a,b)=>a.mean-b.mean).map(p=>({...p,probability:p.count/N}));
 const min=Math.min(...values),max=Math.max(...values),padding=max===min?1:(max-min)*.1;
 return {values:[...values],N,n,total,outcomes,means,individuals,mean:summary.mean,sd:summary.population.sd,variance:summary.population.variance,se:summary.population.sd/Math.sqrt(n),meanOfMeans,sdOfMeans:Math.sqrt(varianceOfMeans),domain:[min-padding,max+padding]};
}
export function selectModelSample(model,text){
 if(!model)return {sample:null,error:null};
 const parsed=parseData(text),index=parsed.values[0]-1;
 if(parsed.error||parsed.values.length!==1||!Number.isInteger(index)||index<0||index>=model.total)return {sample:null,error:`شمارهٔ صحیح از ۱ تا ${number(model.total)} وارد کن؛ نتیجهٔ نمونهٔ قبلی نمایش داده نمی‌شود.`};
 const outcome=model.outcomes[index],values=outcome.indices.map(i=>model.values[i]),summary=varianceSummary(values),bucket=model.means.find(p=>p.sum===outcome.sum);
 return {sample:{...outcome,values,sd:summary.sample.sd,estimatedSE:summary.sample.sd===null?null:summary.sample.sd/Math.sqrt(model.n),error:outcome.mean-model.mean,meanCount:bucket.count,meanProbability:bucket.probability},error:null};
}
export function initialSampling(id='balanced'){
 const key=Object.hasOwn(samplingPresets,id)?id:'balanced',p=samplingPresets[key];
 return {preset:key,text:p.values.join(', '),unit:p.unit,n:2,sampleText:'2',answers:{},checked:{}};
}
export function analyzeSampling(state,cachedModel){
 const data=parseModelPopulation(state.text),model=data.error?null:cachedModel===undefined?samplingModel(data.values,state.n):cachedModel;
 return {data,model,...selectModelSample(model,state.sampleText)};
}
export function samplingReducer(state,action){
 if(action.type==='preset')return Object.hasOwn(samplingPresets,action.id)?initialSampling(action.id):state;
 if(action.type==='reset')return initialSampling(state.preset);
 if(action.type==='data'&&typeof action.value==='string'&&action.value.length<=1000)return {...state,text:action.value,preset:'custom',sampleText:'1'};
 if(action.type==='unit'&&typeof action.value==='string'&&action.value.length<=60)return {...state,unit:action.value};
 if(action.type==='size'&&Number.isInteger(action.value)&&action.value>=1&&action.value<=4)return {...state,n:action.value,sampleText:'1'};
 if(action.type==='sample'&&typeof action.value==='string'&&action.value.length<=40)return {...state,sampleText:action.value};
 if(action.type==='pick'){
  const {model}=analyzeSampling(state);
  if(model&&Number.isInteger(action.index)&&action.index>=0&&action.index<model.total)return {...state,sampleText:String(action.index+1)};
 }
 const q=samplingChecks.find(q=>q.id===action.id);
 if(action.type==='answer'&&q&&Number.isInteger(action.value)&&action.value>=0&&action.value<q.options.length)return {...state,answers:{...state.answers,[q.id]:action.value},checked:{...state.checked,[q.id]:false}};
 if(action.type==='check'&&q&&Number.isInteger(state.answers[q.id]))return {...state,checked:{...state.checked,[q.id]:true}};
 return state;
}
export function samplingNumber(x){return x===null?'تعریف‌نشده':number(x);}
export function buildSamplingReport(state){
 const {model:m,sample,error,data}=analyzeSampling(state),unit=state.unit.trim()||'واحد اعلام‌نشده';
 const lines=['آمارآموز — پراکندگی افراد و خطای معیار میانگین',`واحد اعلام‌شده: ${unit}`,'جامعهٔ کوچکِ آموزشی؛ هر عضو احتمال برابر دارد. برداشت‌ها مستقل، هم‌توزیع و با جایگذاری‌اند؛ تعداد ترتیب‌ها N^n است.'];
 if(!m)return [...lines,'مدل محاسبه نشده؛ ورودی را اصلاح کن.',data.error||'اندازهٔ نمونه نامعتبر است.'].join('\n');
 lines.push(`مقدارهای اعضای جامعهٔ مدل: [${m.values.map(value).join('، ')}]؛ N=${m.N}.`,`اندازهٔ هر نمونه n=${m.n}؛ همهٔ ترتیب‌های ممکن=${m.total}.`,`میانگین جامعه μ=${value(m.mean)}؛ SD جامعه σ=${value(m.sd)} ${unit}؛ مخرج واریانس جامعه N است.`,`SE واقعی مدل=σ/√n=${value(m.se)} ${unit}.`,`میانگینِ همهٔ میانگین‌ها=${value(m.meanOfMeans)}؛ SD توزیع کامل میانگین‌ها=${value(m.sdOfMeans)} ${unit}؛ وزن هر ترتیب ۱/${m.total} است.`,'توزیع میانگین‌های ممکن:');
 m.means.forEach(p=>lines.push(`جمع=${p.sum}؛ میانگین=${value(p.mean)}؛ تعداد ترتیب‌ها=${p.count} از ${m.total}؛ احتمال=${value(p.probability)}.`));
 if(sample){lines.push(`نمونهٔ انتخاب‌شده: شماره ${sample.index+1} از ${m.total}؛ احتمال این ترتیب مشخص=۱/${m.total}.`);sample.indices.forEach((member,draw)=>lines.push(`برداشت ${draw+1}: عضو ${member+1}؛ مقدار=${value(m.values[member])}.`));lines.push(`میانگین نمونه=${value(sample.mean)}؛ فاصلهٔ علامت‌دار از μ=${value(sample.error)} ${unit}.`,`SD نمونه‌ای s=${sample.sd===null?'تعریف‌نشده':value(sample.sd)} ${unit} با مخرج n−۱؛ SE برآوردی=s/√n=${sample.estimatedSE===null?'تعریف‌نشده':value(sample.estimatedSE)} ${unit}.`,`این میانگین در ${sample.meanCount} ترتیب از ${m.total} دیده می‌شود؛ احتمال میانگین=${value(sample.meanProbability)}.`);}
 else lines.push('نمونهٔ انتخاب‌شده محاسبه نشد: '+error);
 lines.push('SE اندازهٔ نوسان میانگین در نمونه‌گیری تکرارشونده است؛ خطای دقیق یک نمونه یا پراکندگی افراد نیست. s/√n یک برآورد وابسته به نمونه و شرط‌های طراحی است.','افزایش n در این مدل SD جامعه را تغییر نمی‌دهد؛ n تعداد مشاهده در هر نمونه است و N^n تعداد ترتیب‌های ممکن.','جایگذاری اجازه می‌دهد یک عضو دوباره انتخاب شود. کپی‌کردن رکوردهای واقعی، مشاهدهٔ مستقل تازه ایجاد نمی‌کند. مدل بدون جایگذاری یا دادهٔ وابسته، قرارداد متفاوتی دارد.','این توزیع گسستهٔ کامل است؛ نرمال‌بودن داده یا توزیع میانگین‌ها فرض نمی‌شود. هیچ فاصلهٔ اطمینان، آزمون فرض یا تعمیمی به یک جامعهٔ واقعی تولید نشده است.','منابع: https://openstax.org/books/introductory-statistics-2e/pages/7-1-the-central-limit-theorem-for-sample-means-averages','https://www.itl.nist.gov/div898/handbook/eda/section3/eda352.htm');
 return lines.join('\n');
}
