import React,{useState} from 'react';
import {ArrowLeft,Compass,BookOpen,FlaskConical} from 'lucide-react';
import {scales,goals,shapes,initialAnalysisChoice,normalizeAnalysisChoice,recommendAnalysis} from './analysisGuide.js';
import {describe,histogram,pairStats} from './stats.js';
import {fmt,number} from './format.js';
import {summarizeGroups,groupPresets} from './groupComparison.js';

const examples=[
  ['روش مطالعه',{scale:'nominal',goal:'distribution'}],
  ['رضایت از یک سؤال',{scale:'ordinal',goal:'center'}],
  ['زمان انتظار نامتقارن',{scale:'quantitative',goal:'center',shape:'skewed'}],
  ['خواب و استرس',{scale:'quantitative',goal:'relationship',secondScale:'quantitative'}],
  ['گروه و پاسخ مثبت/منفی',{scale:'nominal',goal:'relationship',secondScale:'nominal'}],
];
export function GuideExample({result}){
  const kind=result.visual,balanced=result.choice.shape==='balanced'||kind==='position';
  const values=balanced?[2,3,3,4,4,5,5,6]:[2,3,3,4,4,5,6,18],stats=describe(values);
  const sx=v=>40+(v-stats.min)/(stats.max-stats.min)*360;
  let drawing,description;
  if(result.mode==='groups'){
    const summary=summarizeGroups(groupPresets.unequal.cells),labels=['الف','ب'];
    drawing=<><text x="28" y="25">درصد</text>{[0,50,100].map(n=><text key={n} x="36" y={150-n} textAnchor="end">{number(n)}</text>)}{summary.rates.map((rate,i)=><g key={i}><rect x={110+i*160} y={145-rate} width="70" height={rate} rx="3"/><text x={145+i*160} y={135-rate} textAnchor="middle">{fmt(rate)}٪</text><text x={145+i*160} y="174" textAnchor="middle">گروه {labels[i]}</text></g>)}</>;
    description='سهم پاسخ مثبت درون هر گروه: الف ۸ از ۱۰ نفر، برابر ۸۰٪؛ ب ۱۲ از ۳۰ نفر، برابر ۴۰٪. میله‌ها مقیاس مشترک صفر تا ۱۰۰٪ دارند؛ تعداد بیشتر گروه ب به معنی درصد بیشتر نیست.';
  }else if(kind==='bars'){
    const labels=result.choice.scale==='ordinal'?['کم','متوسط','زیاد']:['فردی','گروهی','آنلاین'],counts=[2,5,3];
    drawing=<>{counts.map((n,i)=><g key={i}><rect x={65+i*120} y={145-n*20} width="55" height={n*20} rx="3"/><text x={92+i*120} y={135-n*20} textAnchor="middle">{number(n)}</text><text x={92+i*120} y="174" textAnchor="middle">{labels[i]}</text></g>)}<text x="24" y="30">تعداد</text></>;
    description=`نمونهٔ فراوانی یک متغیر: ${labels.map((label,i)=>`${label} ${number(counts[i])} نفر`).join('؛ ')}. درصدها از ۱۰ پاسخ معتبر حساب می‌شوند.`;
  }else if(kind==='scatter'){
    const x=[1,2,3,4,5],y=[4,1,0,1,4],pair=pairStats(x,y);
    drawing=<><text x="22" y="25">Y</text><text x="407" y="176">X</text>{x.map((v,i)=><g key={i}><circle cx={55+(v-1)*85} cy={145-y[i]*27} r="7"/><text x={55+(v-1)*85} y="174" textAnchor="middle">{number(v)}</text></g>)}{[0,2,4].map(n=><text x="30" y={150-n*27} textAnchor="end" key={n}>{number(n)}</text>)}</>;
    description=`مثال ساختگی خمیده: X: ${x.map(number).join('، ')}؛ Y: ${y.map(number).join('، ')}. پیرسون r = ${fmt(pair.r)}؛ با وجود رابطهٔ خمیده.`;
  }else if(kind==='box'){
    drawing=<><line x1={sx(stats.whiskerLow)} x2={sx(stats.whiskerHigh)} y1="87" y2="87"/>{[stats.whiskerLow,stats.whiskerHigh].map((v,i)=><line key={i} x1={sx(v)} x2={sx(v)} y1="70" y2="104"/>)}<rect className="guide-box" x={sx(stats.q1)} y="62" width={sx(stats.q3)-sx(stats.q1)} height="50"/><line x1={sx(stats.median)} x2={sx(stats.median)} y1="62" y2="112"/>{stats.outliers.map((v,i)=><circle className="guide-highlight" cx={sx(v)} cy="87" r="6" key={i}/>)}{[stats.min,stats.max].map(v=><text key={v} x={sx(v)} y="145" textAnchor="middle">{fmt(v)}</text>)}<text x="220" y="174" textAnchor="middle">مقدار · مثال ساختگی</text></>;
    description=`داده‌های نمونه: ${values.map(number).join('، ')}. میانه ${fmt(stats.median)}؛ Q1 = ${fmt(stats.q1)}؛ Q3 = ${fmt(stats.q3)}؛ IQR = ${fmt(stats.iqr)}. چارک‌ها با روش نوع ۷.`;
  }else if(kind==='position'){
    const z=(6-stats.mean)/stats.sd,position=v=>220+v*80;
    drawing=<>{[-2,-1,0,1,2].map(v=><g key={v}><line x1={position(v)} x2={position(v)} y1="112" y2="123"/><text x={position(v)} y="145" textAnchor="middle">{fmt(v)}</text></g>)}<line x1="60" x2="380" y1="116" y2="116"/><circle className="guide-highlight" cx={position(z)} cy="116" r="7"/><text x="220" y="60" textAnchor="middle">{`نمرهٔ ۶ · z = ${fmt(z)}`}</text><text x="220" y="177" textAnchor="middle">فاصله از میانگین برحسب انحراف معیار</text></>;
    description=`مثال ساختگی: میانگین ${fmt(stats.mean)}، انحراف معیار نمونه‌ای ${fmt(stats.sd)}. نمرهٔ ۶ بالاتر از میانگین است؛ این تصویر احتمال یا درصد افراد را نشان نمی‌دهد.`;
  }else{
    const bins=histogram(values,6),max=Math.max(...bins.map(b=>b.count));
    drawing=<><text x="25" y="25">تعداد</text>{bins.map((b,i)=><g key={i}><rect x={45+i*58} y={145-b.count/max*100} width="56" height={b.count/max*100}/>{b.count>0?<text x={73+i*58} y={136-b.count/max*100} textAnchor="middle">{number(b.count)}</text>:null}</g>)}<text x="45" y="174" textAnchor="middle">{fmt(stats.min)}</text><text x="393" y="174" textAnchor="middle">{fmt(stats.max)}</text><text x="220" y="174" textAnchor="middle">مقدار · بازه‌های هم‌عرض</text></>;
    description=`داده‌های نمونه: ${values.map(number).join('، ')}. میانگین ${fmt(stats.mean)}؛ میانه ${fmt(stats.median)}. ${number(values.length)} مشاهده در ۶ بازهٔ هم‌عرض؛ مرز بالایی فقط در آخرین بازه شامل می‌شود.`;
  }
  return <figure className="guide-example"><svg viewBox="0 0 440 195" role="img" aria-label={description}>{['bars','histogram','scatter'].includes(kind)?<line className="guide-baseline" x1="40" x2="410" y1="145" y2="145"/>:null}{drawing}</svg><figcaption><strong>مثال تصویری ساختگی</strong><p>{description}</p></figcaption></figure>;
}

export function AnalysisRecommendation({result,navigate}){
  return <section className="analysis-recommendation" aria-labelledby="analysis-result-title">
    <span className="analysis-result-label">پیشنهاد بر اساس انتخاب تو</span><h3 id="analysis-result-title">{result.title}</h3><p>{result.why}</p>
    <GuideExample result={result}/>
    <p className="analysis-caution"><strong>هنگام تفسیر</strong>{result.caution}</p>
    <div className="analysis-actions"><button className="button secondary compact" onClick={()=>navigate('lesson',result.lessonId,{section:'guide-idea'})}><BookOpen size={17}/>درس مرتبط · جلسهٔ {number(result.lessonId)}</button>{result.mode?<button className="button compact" onClick={()=>navigate('lab',0,{mode:result.mode})}><FlaskConical size={17}/>تجربه در آزمایشگاه<ArrowLeft size={16}/></button>:null}</div>
    {result.mode?<p className="small-note">آزمایشگاه با نمونهٔ پیش‌فرض باز می‌شود؛ دادهٔ خودت را آنجا وارد کن.</p>:<p className="small-note">برای این انتخاب، محاسبهٔ مستقیم مناسبی در آزمایشگاه فعلی وجود ندارد؛ درس مرتبط را ببین.</p>}
    <a className="analysis-source" href={result.source[1]} target="_blank" rel="noreferrer">مطالعهٔ بیشتر: {result.source[0]}</a>
  </section>;
}

export default function AnalysisGuide({navigate}){
  const [choice,setChoice]=useState(initialAnalysisChoice),result=recommendAnalysis(choice);
  function update(key,value){setChoice(current=>normalizeAnalysisChoice({...current,[key]:value,...(key==='scale'?{shape:'unknown'}:{})}));}
  return <section className="analysis-guide" aria-labelledby="analysis-guide-title">
    <div className="analysis-heading"><Compass size={27}/><div><h2 id="analysis-guide-title">کدام شاخص، کدام نمودار؟</h2><p>از سؤال و نوع داده شروع کن؛ دلیل انتخاب روش را بفهم.</p></div></div>
    <div className="analysis-layout"><div className="analysis-controls">
      <label htmlFor="analysis-scale">۱. {choice.goal==='relationship'?'نوع متغیر اول':'نوع داده'}<select id="analysis-scale" value={choice.scale} onChange={e=>update('scale',e.target.value)}>{scales.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></label><p className="small-note">{scales.find(s=>s.id===choice.scale).example}</p>
      <label htmlFor="analysis-goal">۲. هدف توصیف<select id="analysis-goal" value={choice.goal} onChange={e=>update('goal',e.target.value)}>{goals.map(g=><option key={g.id} value={g.id}>{g.label}</option>)}</select></label>
      {choice.goal==='relationship'?<label htmlFor="analysis-second-scale">۳. نوع متغیر دوم<select id="analysis-second-scale" value={choice.secondScale} onChange={e=>update('secondScale',e.target.value)}>{scales.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></label>:choice.scale==='quantitative'&&['center','spread'].includes(choice.goal)?<label htmlFor="analysis-shape">۳. شکل داده را چطور دیده‌ای؟<select id="analysis-shape" value={choice.shape} onChange={e=>update('shape',e.target.value)}>{shapes.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></label>:null}
      <div className="analysis-examples"><strong>با یک مثال شروع کن</strong>{examples.map(([label,example])=><button key={label} onClick={()=>setChoice(normalizeAnalysisChoice(example))}>{label}<ArrowLeft size={15}/></button>)}</div>
      <p className="small-note">راهنمای آمار توصیفی است و دادهٔ واقعی را خودکار تشخیص نمی‌دهد. برای آزمون فرض یا تصمیم پژوهشی، طراحی مطالعه و شرایط روش هم لازم است.</p>
    </div><div><p className="sr-only" role="status">{result.title}</p><AnalysisRecommendation result={result} navigate={navigate}/></div></div>
  </section>;
}
