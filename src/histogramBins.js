import {parseData,quantile} from './stats.js';
import {distributionValue} from './distributionComparison.js';

export const binPresets={
 unequal:{label:'ارتفاع برابر، سهم متفاوت',values:[.5,1,2,3,4,5,6,7,8,9],edges:[0,2,6,10],alternative:[0,2,4,6,8,10],explanation:'طبقهٔ اول ۲ مشاهده در عرض ۲ دارد؛ دو طبقهٔ بعدی هر کدام ۴ مشاهده در عرض ۴. ارتفاع چگالی هر سه ۰٫۱ است، اما مساحت‌ها ۲۰٪، ۴۰٪ و ۴۰٪ هستند.'},
 boundary:{label:'عدد دقیقاً روی مرز',values:[0,2,4,6],edges:[0,2,4,6],alternative:[0,3,6],explanation:'با قرارداد این ابزار، ۲ وارد طبقهٔ دوم و ۴ وارد طبقهٔ سوم می‌شود. آخرین مرز، یعنی ۶، هم در آخرین طبقه حساب می‌شود.'},
 narrow:{label:'چگالی بزرگ‌تر از یک',values:[.1,.2,.3,.7],edges:[0,.5,1],alternative:[0,.25,.5,.75,1],explanation:'طبقهٔ اول سهم ۰٫۷۵ و عرض ۰٫۵ دارد؛ ارتفاع چگالی آن ۱٫۵ است. سهم همان ۷۵٪ می‌ماند؛ ارتفاع چگالی، احتمال نیست.'},
 empty:{label:'طبقه‌های خالی',values:[1,1.5,8.5,9],edges:[0,2,4,6,8,10],alternative:[0,5,10],explanation:'چند طبقه هیچ مشاهده‌ای ندارند. طبقهٔ خالی سهم صفر دارد و در جدول حفظ می‌شود؛ مقدار گمشده وارد این فهرست نشده است.'},
 constant:{label:'داده‌های ثابت',values:[7,7,7,7],edges:[6,7,8],alternative:[6,6.5,7,7.5,8],explanation:'هر چهار مقدار در طبقه‌ای قرار می‌گیرند که از ۷ شروع می‌شود. تغییر مرزها شکل نمایش را عوض می‌کند؛ همهٔ مشاهده‌ها هنوز ۷ هستند.'},
};
export const binChecks=[
 {id:'boundary',question:'با مرزهای [۰،۲،۴،۶] و قرارداد [a,b)، مقدار ۲ در کدام طبقه است؟',options:['طبقهٔ اول و دوم؛ هر دو آن را می‌شمارند.','فقط طبقهٔ دوم، یعنی [۲،۴).','فقط طبقهٔ اول، یعنی [۰،۲).'],correct:1,feedback:['این کار یک مشاهده را دوبار می‌شمارد. انتهای راست طبقهٔ اول باز است.','درست است؛ مرز داخلی وارد طبقه‌ای می‌شود که از همان مرز شروع می‌شود. فقط آخرین طبقه انتهای راست را هم شامل می‌شود.','طبقهٔ اول عدد ۲ را شامل نمی‌شود؛ علامت ) یعنی انتهای راست باز است.']},
 {id:'area',question:'دو طبقه ارتفاع چگالی ۰٫۱ دارند؛ عرض اول ۲ و عرض دوم ۴ است. سهم کدام بیشتر است؟',options:['برابرند، چون ارتفاع برابر است.','اولی، چون باریک‌تر است.','دومی؛ مساحت ۰٫۴ در برابر ۰٫۲ است.'],correct:2,feedback:['در هیستوگرام چگالی، سهم از مساحت به دست می‌آید؛ عرض‌ها هم لازم‌اند.','با ارتفاع برابر، عرض بیشتر مساحت بیشتری می‌سازد.','درست است؛ سهم = عرض × چگالی. ارتفاع برابر، با عرض‌های نابرابر به معنی سهم برابر نیست.']},
 {id:'rebin',question:'همان داده‌ها را با مرزهای دیگری دسته‌بندی می‌کنیم. چه چیزی ثابت می‌ماند؟',options:['میانگین و میانهٔ داده‌های اصلی؛ شمارش هر طبقه ممکن است تغییر کند.','تعداد مشاهده در تک‌تک طبقه‌ها.','شکل نمودار؛ پس نرمال‌بودن هم اثبات می‌شود.'],correct:0,feedback:['درست است؛ عددهای اصلی تغییر نکرده‌اند. میانگین را از مرکز طبقه‌ها دوباره برآورد نمی‌کنیم.','مرزهای جدید می‌توانند مشاهده‌ها را در طبقه‌های دیگری قرار دهند. مجموع تعداد ثابت است، نه تعداد هر طبقه.','شکل نمایش به طبقه‌بندی حساس است و هیستوگرام به‌تنهایی نرمال‌بودن را اثبات نمی‌کند.']},
];
const validList=(values,min,max)=>Array.isArray(values)&&values.length>=min&&values.length<=max&&Array.from(values).every(v=>Number.isFinite(v)&&Math.abs(v)<=1e9);
export function summarizeBins(values,edges){
 if(!validList(values,1,200)||!validList(edges,3,13))return {summary:null,error:'۱ تا ۲۰۰ مقدار و ۳ تا ۱۳ مرز عددی معتبر لازم است.'};
 if(edges.some((v,i)=>i>0&&v<=edges[i-1]))return {summary:null,error:'مرزها باید از کوچک به بزرگ و بدون تکرار باشند؛ عرض هر طبقه باید مثبت باشد.'};
 if(values.some(v=>v<edges[0]||v>edges.at(-1)))return {summary:null,error:'مرز اول و آخر باید همهٔ داده‌ها را پوشش دهند؛ هیچ مشاهده‌ای خودکار حذف نمی‌شود.'};
 const n=values.length,bins=edges.slice(0,-1).map((lo,i)=>({lo,hi:edges[i+1],width:edges[i+1]-lo,members:[],last:i===edges.length-2}));
 values.forEach((value,index)=>{const bin=bins.find(b=>value>=b.lo&&(value<b.hi||b.last&&value===b.hi));bin.members.push({value,index});});
 let cumulative=0;
 for(const b of bins){b.count=b.members.length;b.share=b.count/n;b.density=b.share/b.width;b.cumulative=cumulative+=b.count;b.area=b.density*b.width;}
 if(bins.some(b=>!Number.isFinite(b.density)||b.share>0&&b.density===0))return {summary:null,error:'عرض یک طبقه برای محاسبهٔ چگالی با دقت عددی این ابزار بیش از حد کوچک است؛ مرزهای دورتری انتخاب کن.'};
 const sorted=[...values].sort((a,b)=>a-b),min=sorted[0],range=sorted.at(-1)-min;
 const mean=range===0?min:min+range*(values.reduce((sum,v)=>sum+(v-min)/range,0)/n);
 // Count mode is offered only for equal widths in the accepted Number representation.
 const equalWidth=bins.every(b=>b.width===bins[0].width);
 return {summary:{n,values:[...values],edges:[...edges],bins,equalWidth,mean,median:quantile(sorted,.5),totalArea:bins.reduce((sum,b)=>sum+b.area,0)},error:null};
}
export function analyzeBins(state){
 const data=parseData(state.xtext),edges=parseData(state.etext);
 if(data.error||edges.error)return {data,edges,summary:null,error:data.error||edges.error};
 return {data,edges,...summarizeBins(data.values,edges.values)};
}
export function initialBinState(id='unequal'){const p=binPresets[id]||binPresets.unequal;return {preset:binPresets[id]?id:'unequal',xtext:p.values.join(', '),etext:p.edges.join(', '),chart:'density',selected:null,answers:{},checked:{}};}
export function binReducer(state,action){
 if(action.type==='preset')return binPresets[action.id]?initialBinState(action.id):state;
 if(action.type==='reset')return initialBinState(state.preset);
 if(action.type==='data'&&['xtext','etext'].includes(action.field))return {...state,[action.field]:action.value,selected:null,chart:action.field==='etext'?'density':state.chart};
 if(action.type==='edges')return {...state,etext:binPresets[state.preset][action.alternative?'alternative':'edges'].join(', '),selected:null,chart:'density'};
 if(action.type==='chart'&&['density','count'].includes(action.value)){const s=analyzeBins(state).summary;return s&&(action.value==='density'||s.equalWidth)?{...state,chart:action.value}:state;}
 if(action.type==='select'){const s=analyzeBins(state).summary;return action.index===null||s&&Number.isInteger(action.index)&&s.bins[action.index]?{...state,selected:action.index}:state;}
 const q=binChecks.find(q=>q.id===action.id);
 if(action.type==='answer'&&q&&Number.isInteger(action.value)&&q.options[action.value]!==undefined)return {...state,answers:{...state.answers,[q.id]:action.value},checked:{...state.checked,[q.id]:false}};
 if(action.type==='check'&&q&&Number.isInteger(state.answers[q.id]))return {...state,checked:{...state.checked,[q.id]:true}};
 return state;
}
export function binInterval(bin){return `[${distributionValue(bin.lo)}, ${distributionValue(bin.hi)}${bin.last?']':')'}`;}
export function binHeight(value){return new Intl.NumberFormat('fa-IR',{notation:value!==0&&(Math.abs(value)<.0001||Math.abs(value)>=1e5)?'scientific':'standard',maximumSignificantDigits:5}).format(value);}
export function buildBinReport(state){
 const analysis=analyzeBins(state),s=analysis.summary;
 const lines=['آمارآموز · گزارش طبقه‌بندی هیستوگرام','این گزارش توصیفی است؛ مثال‌ها ساختگی‌اند.','ورودی مقدارها: '+state.xtext,'ورودی مرزها: '+state.etext];
 if(!s)return [...lines,'نتیجه محاسبه نشد: '+analysis.error].join('\n');
 lines.push('مقدارهای پذیرفته‌شده به ترتیب اصلی: '+s.values.join(', '),'مرزهای پذیرفته‌شده: '+s.edges.join(', '),'قرارداد: [a,b)؛ آخرین طبقه [a,b]. مقایسه روی عددهای پذیرفته‌شده، بدون گردکردن یا تلورانس مرزی.','تعداد: '+s.n,'میانگین داده‌های اصلی: '+s.mean,'میانهٔ داده‌های اصلی: '+s.median,'نمایش: '+(state.chart==='count'&&s.equalWidth?'تعداد؛ مساحت سهم نیست':'چگالی؛ مساحت سهم است'),'چگالی = (تعداد / n) / عرض؛ مساحت = چگالی × عرض.','طبقه | عرض | تعداد | سهم | چگالی | مساحت | تجمعی | شمارهٔ مشاهده‌ها');
 s.bins.forEach((b,i)=>lines.push(`${i+1}: [${b.lo}, ${b.hi}${b.last?']':')'} | ${b.width} | ${b.count} | ${b.share} | ${b.density} | ${b.area} | ${b.cumulative} | ${b.members.map(m=>m.index+1).join(', ')||'خالی'}`));
 lines.push('مجموع مساحت محاسبه‌شده: '+s.totalArea,'برچسب‌های نمودار کوتاه شده‌اند؛ گزارش مقدارهای پذیرفته‌شده را با دقت Number نگه می‌دارد. گردکردن ممیز شناور می‌تواند اختلاف بسیار کوچک با مجموع نظری ۱ بسازد.','تغییر مرزها داده‌های اصلی را تغییر نمی‌دهد و نرمال‌بودن یا رابطهٔ علّی را اثبات نمی‌کند.');
 return lines.join('\n');
}
