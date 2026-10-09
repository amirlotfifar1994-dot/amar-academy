import React from 'react';
import {Sparkles,ChevronDown,MessageCircle,ArrowLeft} from 'lucide-react';
import {number} from './format.js';
import {plainLessons} from './plainLessons.js';

export default function PlainLesson({lessonId}){
  const lesson=plainLessons[lessonId];
  return <section className="plain-lesson" id="guide-basics" aria-labelledby="plain-lesson-title">
    <div className="plain-lesson-heading"><span className="plain-icon"><Sparkles size={22}/></span><div><span className="lesson-eyebrow">از زندگی به مفهوم</span><h2 id="plain-lesson-title">ساده شروع کنیم</h2></div><span className="example-label">مثال ساختگی</span></div>
    <p className="plain-sentence">{lesson.sentence}</p><p className="plain-situation">{lesson.situation}</p>
    <div className="plain-data"><span>{lesson.dataLabel}</span><ul>{lesson.data.map((datum,i)=><li key={i}>{datum}</li>)}</ul></div>
    <div className="plain-prediction"><MessageCircle size={20}/><p><strong>قبل از دیدن پاسخ، فکر کن</strong>{lesson.question}</p></div>
    <details className="plain-solution"><summary>حل این مثال را ببین<ChevronDown size={18}/></summary><div className="plain-solution-body"><ol>{lesson.steps.map(([title,text],i)=><li key={title}><span aria-hidden="true">{number(i+1)}</span><div><h3>{title}</h3><p>{text}</p></div></li>)}</ol><div className="plain-answer"><strong>پاسخ، به زبان ساده</strong><p>{lesson.answer}</p></div></div></details>
    <div className="plain-transfer"><span>کجا به کار می‌آید؟</span><p>{lesson.use}</p></div>
    <div className="plain-faq"><h3>دو سؤال رایج</h3>{lesson.questions.map(([question,answer])=><details key={question}><summary>{question}<ChevronDown size={17}/></summary><p>{answer}</p></details>)}</div>
    <a className="text-button plain-experiment-link" href="#guide-experiment">حالا اثرش را در تجربهٔ دیداری ببین<ArrowLeft size={17}/></a>
  </section>;
}
