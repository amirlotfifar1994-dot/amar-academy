import React,{useId,useState} from 'react';
import {CheckCircle2,Lightbulb,TriangleAlert,ArrowLeft,RotateCcw} from 'lucide-react';
import ConceptExperiment from './Experiments.jsx';
import {guideSource} from './learning.js';
import {number} from './format.js';
import {conceptQuestionId} from './conceptProgress.js';
import PlainLesson from './PlainLesson.jsx';

function KnowledgeCheck({question,index,lessonId,concepts,onAnswer}) {
  const saved=concepts[conceptQuestionId(lessonId,index)];
  const [choice,setChoice]=useState(()=>saved?.choice??null),[submitted,setSubmitted]=useState(()=>Boolean(saved)),id=useId();
  const correct=choice===question.correct;
  return <form className="knowledge-check" id={'guide-check-'+(index+1)} tabIndex="-1" aria-label={'سؤال مفهومی '+number(index+1)} onSubmit={e=>{e.preventDefault();if(choice===null||submitted)return;setSubmitted(true);onAnswer(lessonId,index,choice);}}>
    <fieldset><legend>{number(index+1)}. {question.question}</legend><div className="quiz-options">{question.options.map((option,i)=><label key={i} className={(submitted&&i===question.correct?'correct-option ':'')+(choice===i?'chosen-option':'')}><input type="radio" name={id} value={i} checked={choice===i} onChange={()=>{setChoice(i);setSubmitted(false);}}/>{option}</label>)}</div></fieldset>
    <div className="quiz-bottom"><button className="button amber compact" disabled={choice===null||submitted} type="submit">بررسی پاسخ<ArrowLeft size={18}/></button>{submitted?<button className="text-button" type="button" onClick={()=>{setChoice(null);setSubmitted(false);}}><RotateCcw size={16}/>دوباره فکر می‌کنم</button>:null}</div>
    {submitted?<div className={'quiz-feedback '+(correct?'success':'retry')} role="status">{correct?<CheckCircle2 size={20}/>:<Lightbulb size={20}/>}<p><strong>{correct?'درست است. ':'یک نکته را دوباره ببین. '}</strong>{question.explanation}</p></div>:null}
  </form>;
}
function PrecisionExplanation({detail}) {
  return <section className="precision-explanation" id="guide-precision">
    <h2>دقیق‌تر بفهم: {detail.title}</h2><p>{detail.lead}</p>
    <div className="plain-formula" dir={detail.latin?'ltr':'rtl'} role="region" aria-label="فرمول این مفهوم" tabIndex="0">{detail.formula}</div>
    <dl className="formula-symbols">{detail.symbols.map(([symbol,meaning])=><div key={symbol}><dt>{symbol}</dt><dd>{meaning}</dd></div>)}</dl>
    <div className="table-scroll precision-table" role="region" aria-label={detail.table.caption} tabIndex="0"><table><caption>{detail.table.caption}</caption><thead><tr>{detail.table.headers.map(h=><th key={h} scope="col">{h}</th>)}</tr></thead><tbody>{detail.table.rows.map((row,i)=><tr key={i}>{row.map((cell,j)=>{const content=/[=÷×]/.test(cell)?<bdi dir="ltr">{cell}</bdi>:cell;return j===0?<th key={j} scope="row">{content}</th>:<td key={j}>{content}</td>;})}</tr>)}</tbody></table></div>
    <details className="explain-why"><summary>{detail.why[0]}</summary><p>{detail.why[1]}</p></details>
    <div className="report-example"><h3>نمونهٔ بیان نتیجه</h3><p>{detail.report}</p><small>این متن برای مثال ساختگی همین درس است؛ عددها و تصمیم‌ها را برای دادهٔ خودت دوباره بررسی کن.</small></div>
  </section>;
}
export default function ConceptGuide({guide,navigate,lessonId,concepts,onAnswer}) {
  const source=guideSource(guide);
  const answers=guide.checks.map((q,i)=>concepts[conceptQuestionId(lessonId,i)]),answered=answers.filter(Boolean).length,correct=answers.filter((a,i)=>a?.choice===guide.checks[i].correct).length;
  return <div className="concept-guide">
    <nav className="lesson-roadmap" aria-label="مسیر مطالعهٔ راهنما">{[['basics','ساده بفهم'],['experiment','تجربه کن'],['example','حل را دنبال کن'],['check','خودت را بسنج']].map(([id,label],i)=><a key={id} href={'#guide-'+id}><span>{number(i+1)}</span>{label}</a>)}</nav>
    <section className="concept-intro" id="guide-idea"><h2>{guide.headline}</h2><p>{guide.idea}</p><dl className="concept-terms">{guide.terms.map(([term,meaning,example])=><div key={term}><dt>{term}</dt><dd>{meaning}<small>{example}</small></dd></div>)}</dl></section>
    <PlainLesson lessonId={lessonId}/>
    <div id="guide-experiment"><ConceptExperiment kind={guide.experiment}/></div>
    <section className="worked-example" id="guide-example"><h2>مثال حل‌شده</h2><p>{guide.example}</p><ol className="worked-steps">{guide.steps.map(([title,text])=><li key={title}><h3>{title}</h3><p>{text}</p></li>)}</ol><div className="concept-warning"><TriangleAlert size={21}/><div><strong>اشتباه رایج</strong><p>{guide.pitfall}</p></div></div></section>
    <PrecisionExplanation detail={guide.detail}/>
    <section className="concept-checks" id="guide-check"><h2>خودت را بسنج</h2><p className="small-note">پس از «بررسی پاسخ»، آخرین پاسخ ثبت می‌شود. با پاسخ‌دادن دوباره، وضعیت مرور تغییر می‌کند؛ خواندن درس را خودت جداگانه ثبت می‌کنی.</p><div className="lesson-concept-status" role="status"><span>{number(answered)} از {number(guide.checks.length)} پاسخ ثبت‌شده</span><span>{number(correct)} درست</span><span>{number(answered-correct)} نیاز به مرور</span></div>{guide.checks.map((q,i)=><KnowledgeCheck key={i} question={q} index={i} lessonId={lessonId} concepts={concepts} onAnswer={onAnswer}/>)}</section>
    <section className="concept-takeaway"><Lightbulb size={24}/><div><h2>با خودت ببر</h2><p>{guide.takeaway}</p><button className="text-button" onClick={()=>navigate('lab',0,{mode:guide.mode})}>این مفهوم را با دادهٔ خودت امتحان کن<ArrowLeft size={18}/></button>{[1,9].includes(lessonId)?<button className="text-button" onClick={()=>navigate('lab',0,{mode:'ranks'})}>پیرسون و اسپیرمن را با حفظ جفت‌ها مقایسه کن<ArrowLeft size={18}/></button>:null}{[1,2,3,4,8].includes(lessonId)?<button className="text-button" onClick={()=>navigate('lab',0,{mode:'ordinal'})}>فراوانی و جایگاه میانی در دادهٔ ترتیبی<ArrowLeft size={18}/></button>:null}{[2,3].includes(lessonId)?<button className="text-button" onClick={()=>navigate('lab',0,{mode:'groups'})}>مقایسهٔ گروه‌ها و مخرج درصد را تجربه کن<ArrowLeft size={18}/></button>:null}{[4,5,7,8].includes(lessonId)?<button className="text-button" onClick={()=>navigate('lab',0,{mode:'distributions'})}>مرکز و پراکندگی دو گروه را کنار هم ببین<ArrowLeft size={18}/></button>:null}{[4,5,7,8].includes(lessonId)?<button className="text-button" onClick={()=>navigate('lab',0,{mode:'robust'})}>اثر یک مقدار دور و شاخص‌های مقاوم را تجربه کن<ArrowLeft size={18}/></button>:null}{lessonId===4?<button className="text-button" onClick={()=>navigate('lab',0,{mode:'weighted'})}>میانگین وزنی و ترکیب گروه‌ها را تجربه کن<ArrowLeft size={18}/></button>:null}{source?<a className="guide-source" href={source[1]} target="_blank" rel="noopener noreferrer">برای مطالعهٔ بیشتر: {source[0]}</a>:null}</div></section>
  </div>;
}
