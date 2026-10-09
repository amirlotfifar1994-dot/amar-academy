import React,{useId,useState} from 'react';
import {CheckCircle2,Lightbulb,TriangleAlert,ArrowLeft,RotateCcw} from 'lucide-react';
import ConceptExperiment from './Experiments.jsx';
import {guideSource} from './learning.js';
import {number} from './format.js';

function KnowledgeCheck({question,index}) {
  const [choice,setChoice]=useState(null),[submitted,setSubmitted]=useState(false),id=useId();
  const correct=choice===question.correct;
  return <form className="knowledge-check" onSubmit={e=>{e.preventDefault();setSubmitted(true);}}>
    <fieldset><legend>{number(index+1)}. {question.question}</legend><div className="quiz-options">{question.options.map((option,i)=><label key={i} className={(submitted&&i===question.correct?'correct-option ':'')+(choice===i?'chosen-option':'')}><input type="radio" name={id} value={i} checked={choice===i} onChange={()=>{setChoice(i);setSubmitted(false);}}/>{option}</label>)}</div></fieldset>
    <div className="quiz-bottom"><button className="button amber compact" disabled={choice===null} type="submit">بررسی پاسخ<ArrowLeft size={18}/></button>{submitted?<button className="text-button" type="button" onClick={()=>{setChoice(null);setSubmitted(false);}}><RotateCcw size={16}/>دوباره فکر می‌کنم</button>:null}</div>
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
export default function ConceptGuide({guide,navigate}) {
  const source=guideSource(guide);
  return <div className="concept-guide">
    <section className="concept-intro" id="guide-idea"><h2>{guide.headline}</h2><p>{guide.idea}</p><dl className="concept-terms">{guide.terms.map(([term,meaning,example])=><div key={term}><dt>{term}</dt><dd>{meaning}<small>{example}</small></dd></div>)}</dl></section>
    <div id="guide-experiment"><ConceptExperiment kind={guide.experiment}/></div>
    <section className="worked-example" id="guide-example"><h2>مثال حل‌شده</h2><p>{guide.example}</p><ol className="worked-steps">{guide.steps.map(([title,text])=><li key={title}><h3>{title}</h3><p>{text}</p></li>)}</ol><div className="concept-warning"><TriangleAlert size={21}/><div><strong>اشتباه رایج</strong><p>{guide.pitfall}</p></div></div></section>
    <PrecisionExplanation detail={guide.detail}/>
    <section className="concept-checks" id="guide-check"><h2>خودت را بسنج</h2><p className="small-note">این سؤال‌ها برای فهم مفهوم‌اند؛ پیشرفت مطالعه را فقط خودت ثبت می‌کنی.</p>{guide.checks.map((q,i)=><KnowledgeCheck key={i} question={q} index={i}/>)}</section>
    <section className="concept-takeaway"><Lightbulb size={24}/><div><h2>با خودت ببر</h2><p>{guide.takeaway}</p><button className="text-button" onClick={()=>navigate('lab',0,{mode:guide.mode})}>این مفهوم را با دادهٔ خودت امتحان کن<ArrowLeft size={18}/></button>{source?<a className="guide-source" href={source[1]} target="_blank" rel="noopener noreferrer">برای مطالعهٔ بیشتر: {source[0]}</a>:null}</div></section>
  </div>;
}
