import React, {useId, useState} from 'react';
import {Lightbulb, RotateCcw} from 'lucide-react';
import {describe, pairStats, percentileRank} from './stats.js';
import {fmt, number} from './format.js';
import {NormalChart, ScatterPlot} from './Charts.jsx';

export function DotPlot({values, min=0, max=20, highlight=-1, label='نمودار نقطه‌ایِ مشاهده‌ها'}) {
  const seen = new Map();
  const sx = v => 30 + (v-min)/(max-min)*540;
  return <svg className="dot-plot" viewBox="0 0 600 160" role="img" aria-label={label}>
    <line x1="30" x2="570" y1="120" y2="120" className="chart-axis"/>
    {Array.from({length:5},(_,i)=>{const v=min+(max-min)*i/4;return <text key={i} x={sx(v)} y="147" textAnchor="middle">{fmt(v)}</text>;})}
    {values.map((v,i)=>{const row=seen.get(v)||0;seen.set(v,row+1);return <g key={i}><circle cx={sx(v)} cy={104-row*24} r="9" fill={i===highlight?'var(--amber)':'var(--teal)'}>{<title>{'مشاهدهٔ '+number(i+1)+': '+fmt(v)}</title>}</circle>{i===highlight?<circle cx={sx(v)} cy={104-row*24} r="14" fill="none" stroke="var(--amber)" strokeDasharray="4 3"/>:null}</g>;})}
  </svg>;
}
export function CenterExperiment({compact=false}) {
  const [last,setLast] = useState(8), id=useId();
  const values=[4,5,5,6,6,6,7,7,last], stats=describe(values);
  return <section className={'experiment center-experiment '+(compact?'compact-experiment':'')} aria-label="آزمایش میانگین و میانه">
    <h2>یک عدد، دو روایت</h2><p className="experiment-prompt">آخرین نمره را جابه‌جا کن؛ کدام شاخص تغییر می‌کند؟</p>
    <div className="center-body"><DotPlot values={values} min={4} max={Math.max(8,last)} highlight={8} label={'نمره‌های ساختگی: '+values.map(number).join('، ')}/>
      <div className="center-controls"><label className="experiment-range" htmlFor={id}><span>آخرین نمره</span><input id={id} type="range" min="8" max="20" step="1" value={last} onChange={e=>setLast(Number(e.target.value))}/><output htmlFor={id}>{number(last)}</output></label>
      <div className="experiment-metrics"><div><span>میانگین</span><strong data-testid="demo-mean">{fmt(stats.mean)}</strong></div><div><span>میانه</span><strong data-testid="demo-median">{fmt(stats.median)}</strong></div></div></div>
    </div><div className="observation" aria-live="polite"><Lightbulb size={20}/><p>{last===8?'در این داده‌های متقارن، میانگین و میانه هر دو ۶ هستند. نمرهٔ طلایی را به سمت راست ببر.':`با تغییر فقط یک نمره از ۸ به ${number(last)}، میانگین ${fmt(stats.mean)} شده، اما میانه ۶ مانده است؛ جایگاه میانی تغییر نکرده است.`}</p></div><small>دادهٔ ساختگی آموزشی</small>
  </section>;
}
function ScaleExperiment(){
  const [index,setIndex]=useState(0);
  const examples=[['روش مطالعه','اسمی','این دسته‌ها ترتیب ذاتی ندارند؛ تعداد و درصد هر روش را مقایسه کن.'],['رضایت: کم، متوسط، زیاد','ترتیبی','ترتیب داریم؛ فاصلهٔ کم تا متوسط الزاماً برابر فاصلهٔ متوسط تا زیاد نیست.'],['دما برحسب سلسیوس','فاصله‌ای','فاصله‌ها معنا دارند؛ صفر سلسیوس به معنی نبودِ دما نیست.'],['مدت خواب برحسب ساعت','نسبتی','صفر یعنی نبودِ مدت خواب در بازهٔ اندازه‌گیری؛ نسبت مدت‌ها معنا دارد.']];
  return <section className="experiment"><h2>معنای عدد را پیدا کن</h2><p>یک اندازه‌گیری را انتخاب کن؛ چه مقایسه‌ای دربارهٔ آن معنا دارد؟</p><div className="choice-buttons">{examples.map((e,i)=><button className="button secondary" key={e[0]} aria-pressed={index===i} onClick={()=>setIndex(i)}>{e[0]}</button>)}</div><div className="observation" aria-live="polite"><Lightbulb/><p><strong>مقیاس {examples[index][1]}: </strong>{examples[index][2]}</p></div></section>;
}
function FrequencyExperiment(){
  const [value,setValue]=useState(3), values=[1,2,2,3,3,3],count=values.filter(v=>v===value).length;
  return <section className="experiment"><h2>از مشاهده به فراوانی</h2><p>روی یک مقدار بزن؛ مشاهده‌های آن را در فهرست پیدا کن.</p><div className="data-chips" aria-label="مشاهده‌های خام">{values.map((v,i)=><span key={i} className={v===value?'selected':''}>{number(v)}</span>)}</div><div className="choice-buttons">{[1,2,3].map(v=><button key={v} className="button secondary" aria-pressed={v===value} onClick={()=>setValue(v)}>مقدار {number(v)}</button>)}</div><div className="observation" aria-live="polite"><p>از {number(values.length)} مشاهده، {number(count)} مورد مقدار {number(value)} دارند؛ فراوانی = {number(count)} و درصد = {fmt(count/values.length*100)}٪.</p></div></section>;
}
function ChartExperiment(){
  const [scenario,setScenario]=useState('sleep');
  const scenarios={sleep:['شکل توزیع مدت خواب','هیستوگرام','یک متغیر کمی داریم. هر ستون، تعداد مشاهده‌ها در یک بازه است.'],method:['مقایسهٔ سه روش مطالعه','میله‌ای','دسته‌ها جدا هستند؛ ارتفاع میله، فراوانی هر دسته را نشان می‌دهد.'],relation:['رابطهٔ خواب و استرس','پراکنش','دو متغیر کمیِ جفت‌شده داریم؛ هر فرد یک نقطه می‌سازد.']};
  return <section className="experiment"><h2>از سؤال به نمودار</h2><label className="standalone-label">سؤال پژوهش<select value={scenario} onChange={e=>setScenario(e.target.value)}>{Object.entries(scenarios).map(([key,v])=><option key={key} value={key}>{v[0]}</option>)}</select></label><div className="chart-choice-visual" aria-hidden="true">{scenario==='relation'?<svg viewBox="0 0 260 90">{[0,1,2,3,4,5].map(i=><circle key={i} cx={30+i*37} cy={20+i*9} r="5" fill="var(--teal)"/>)}</svg>:<svg viewBox="0 0 260 90">{(scenario==='sleep'?[1,2,4,5,3,1]:[2,5,3]).map((v,i,arr)=><rect key={i} x={20+i*220/arr.length} y={80-v*12} width={220/arr.length-(scenario==='sleep'?2:20)} height={v*12} fill="var(--teal)"/>)}</svg>}</div><div className="observation" aria-live="polite"><p><strong>{scenarios[scenario][1]}: </strong>{scenarios[scenario][2]} شکل بالا فقط طرحِ نوع نمودار است؛ دادهٔ پژوهشی نیست.</p></div></section>;
}
function SpreadExperiment(){
  const [spread,setSpread]=useState(1),id=useId(),values=[7-spread,7,7+spread],stats=describe(values);
  return <section className="experiment"><h2>میانگین برابر، افراد متفاوت</h2><p>فاصلهٔ دو مقدار کناری از ۷ را بیشتر کن؛ مرکز چه می‌شود؟</p><DotPlot values={values} min={0} max={14}/><label className="experiment-range" htmlFor={id}><span>فاصله از مرکز</span><input id={id} type="range" min="1" max="5" value={spread} onChange={e=>setSpread(Number(e.target.value))}/><output htmlFor={id}>{number(spread)}</output></label><div className="experiment-metrics"><div><span>میانگین</span><strong>{fmt(stats.mean)}</strong></div><div><span>انحراف معیار نمونه‌ای</span><strong>{fmt(stats.sd)}</strong></div></div><p className="observation" aria-live="polite">مرکز همیشه ۷ است، ولی با دورشدن مشاهده‌ها، پراکندگی بیشتر می‌شود. سه مقدار فعلی: {values.map(number).join('، ')}.</p></section>;
}
function ZExperiment(){
  const [score,setScore]=useState(65),id=useId(),z=(score-50)/10;
  return <section className="experiment"><h2>نمره را در گروه مرجع ببین</h2><p>گروهِ فرضی با میانگین ۵۰ و انحراف معیار ۱۰.</p><NormalChart z={z}/><label className="experiment-range" htmlFor={id}><span>نمرهٔ خام</span><input id={id} type="range" min="20" max="80" value={score} onChange={e=>setScore(Number(e.target.value))}/><output htmlFor={id}>{number(score)}</output></label><div className="formula" dir="ltr">z = ({score} − 50) / 10 = {z}</div><p className="observation" aria-live="polite">{score===50?'نمره روی میانگین است؛ z برابر صفر است.':`نمره ${fmt(Math.abs(z))} انحراف معیار ${z>0?'بالاتر':'پایین‌تر'} از میانگین است.`} منحنی، مرجع نرمال است؛ فرضی دربارهٔ شکل دادهٔ واقعی نمی‌سازد.</p></section>;
}
function PositionExperiment(){
  const values=[2,4,6,8],[target,setTarget]=useState(4),id=useId();
  const below=values.filter(v=>v<target).length,equal=values.filter(v=>v===target).length,rank=percentileRank(values,target);
  return <section className="experiment"><h2>رتبهٔ یک مقدار را بساز</h2><p>داده‌ها: ۲، ۴، ۶، ۸. قرارداد: نصف وزن برای تساوی.</p><DotPlot values={values} min={0} max={10}/><label className="experiment-range" htmlFor={id}><span>مقدار مورد بررسی</span><input id={id} type="range" min="1" max="9" step="1" value={target} onChange={e=>setTarget(Number(e.target.value))}/><output htmlFor={id}>{number(target)}</output></label><div className="observation" aria-live="polite"><p>{number(below)} مقدار کوچک‌تر و {number(equal)} مقدار برابر است؛ رتبه = ۱۰۰ × ({number(below)} + ۰٫۵ × {number(equal)}) ÷ ۴ = <strong>{fmt(rank)}٪</strong>. بین دو مقدارِ مشاهده‌شده، رتبه ممکن است ثابت بماند.</p></div></section>;
}
function CorrelationExperiment(){
  const [pattern,setPattern]=useState('negative'),[selected,setSelected]=useState(null),x=[1,2,3,4];
  const patterns={negative:{label:'رابطهٔ نزولی',y:[8,6,4,2]},positive:{label:'رابطهٔ صعودی',y:[2,4,6,8]},curve:{label:'رابطهٔ خمیده',y:[4,1,1,4]}};
  const y=patterns[pattern].y,pair=pairStats(x,y);
  return <section className="experiment"><h2>یک ضریب، همهٔ شکل نیست</h2><div className="choice-buttons">{Object.entries(patterns).map(([key,p])=><button key={key} className="button secondary" aria-pressed={pattern===key} onClick={()=>{setPattern(key);setSelected(null);}}>{p.label}</button>)}</div><ScatterPlot x={x} y={y} pair={pair} showLine={true} selected={selected} onSelect={setSelected}/><div className="observation" aria-live="polite"><p><strong>r = {fmt(pair.r)}. </strong>{pattern==='curve'?'رابطهٔ خطی صفر است؛ بااین‌حال شکل خمیدهٔ نقطه‌ها رابطه‌ای غیرخطی نشان می‌دهد.':'این دادهٔ ساختگی روی یک خط قرار دارد؛ علامت ضریب، جهت آن را نشان می‌دهد.'}{selected!==null?` مشاهدهٔ ${number(selected+1)}: X=${fmt(x[selected])}، Y=${fmt(y[selected])}.`:''}</p></div></section>;
}
function CleaningExperiment(){
  const [cleaned,setCleaned]=useState(false);
  return <section className="experiment"><h2>قبل از تحلیل، داده را بررسی کن</h2><p>مدت خواب در یک شبانه‌روز: مقدار معتبر بین صفر و ۲۴ ساعت.</p><div className="data-chips">{['۵','۶','۷','خالی','۲۵'].map((v,i)=><span key={v} className={i>2?'invalid-chip':''}>{v}{i>2?<small>{i===3?'گمشده':'نامعتبر'}</small>:null}</span>)}</div><button className="button secondary" onClick={()=>setCleaned(v=>!v)} aria-pressed={cleaned}>{cleaned?<RotateCcw size={18}/>:null}{cleaned?'بازگشت به بررسی اولیه':'اعمال قواعد این مثال'}</button><p className="observation" aria-live="polite">{cleaned?'دو مقدار وارد محاسبه نشدند؛ n = ۳، میانگین = ۶ ساعت و انحراف معیار نمونه‌ای = ۱ ساعت. این تصمیم فقط برای مثال حاضر است؛ در پژوهش باید منشأ خطا و سیاست دادهٔ گمشده را مشخص کنی.':'برای مقدار خالی مشاهده‌ای نداریم و ۲۵ خارج از دامنهٔ تعریف‌شده است؛ هنوز خلاصهٔ دادهٔ معتبر را محاسبه نکرده‌ایم.'}</p></section>;
}
export default function ConceptExperiment({kind}) {
  const components={scale:ScaleExperiment,frequency:FrequencyExperiment,chart:ChartExperiment,center:CenterExperiment,spread:SpreadExperiment,z:ZExperiment,position:PositionExperiment,correlation:CorrelationExperiment,cleaning:CleaningExperiment};
  const Component=components[kind];
  return Component?<Component/>:null;
}
