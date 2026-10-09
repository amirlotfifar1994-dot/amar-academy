import React from 'react';
import {ArrowLeft,BookOpen,RotateCcw,CheckCircle2} from 'lucide-react';
import {number} from './format.js';
import {summarizeConceptProgress,nextLearningAction} from './conceptProgress.js';

export default function LearningDashboard({course,concepts,progress,navigate,storageError}) {
  const summary=summarizeConceptProgress(concepts),next=nextLearningAction(concepts,progress.lessons);
  const lesson=course.lessons.find(l=>l.id===next.lessonId);
  const copy={review:['یک نکته را دوباره ببین','مرور سؤال'],check:['خودسنجی را ادامه بده','ادامهٔ خودسنجی'],lesson:['قدم بعدی در مسیرت','رفتن به درس'],practice:['وقتِ به‌کاربستن آموخته‌هاست','حل تمرین']}[next.kind];
  function openQuestion(item){navigate('lesson',item.lessonId,{section:`guide-check-${item.index+1}`});}
  function openNext(){next.kind==='practice'?navigate('practice',next.lessonId):next.kind==='lesson'?navigate('lesson',next.lessonId,{section:'guide-idea'}):openQuestion(next);}
  return <section className="learning-dashboard" aria-labelledby="learning-dashboard-title">
    <div className="learning-dashboard-heading"><div><h2 id="learning-dashboard-title">یادگیری من</h2><p>آخرین پاسخ‌های مفهومی‌ات، مسیر مرور را مشخص می‌کنند.</p></div><span className="local-learning-note">{storageError?'ذخیره در مرورگر در دسترس نیست؛ پاسخ‌ها فعلاً در همین صفحه می‌مانند.':'ذخیره روی همین مرورگر'}</span></div>
    <dl className="learning-counts"><div><dt>پاسخ ثبت‌شده</dt><dd>{number(summary.answered)} <small>از {number(summary.total)}</small></dd></div><div><dt>پاسخ درست</dt><dd>{number(summary.correct)}</dd></div><div><dt>نیاز به مرور</dt><dd>{number(summary.review)}</dd></div></dl>
    <div className="next-learning-action"><BookOpen size={24}/><div><strong>{copy[0]}</strong><p>جلسهٔ {number(next.lessonId)} · {lesson.title}{next.index!==undefined?` · سؤال ${number(next.index+1)}`:''}</p></div><button className="button amber compact" onClick={openNext}>{copy[1]}<ArrowLeft size={18}/></button></div>
    {summary.review>0?<details className="concept-review-list"><summary><RotateCcw size={17}/>{number(summary.review)} سؤال برای مرور</summary><ul>{summary.reviews.map(item=><li key={`${item.lessonId}:${item.index}`}><button onClick={()=>openQuestion(item)}><span>جلسهٔ {number(item.lessonId)} · سؤال {number(item.index+1)}</span><strong>{item.question}</strong><ArrowLeft size={17}/></button></li>)}</ul></details>:summary.answered>0?<p className="learning-review-clear"><CheckCircle2 size={17}/>در آخرین پاسخ‌های ثبت‌شده، سؤالی برای مرور باقی نمانده است.</p>:<p className="learning-first-step">پس از «بررسی پاسخ» در درس، نتیجه اینجا ثبت می‌شود. می‌توانی دوباره پاسخ بدهی و وضعیت مرور را تغییر دهی.</p>}
    <p className="learning-dashboard-footnote">این شمارش مربوط به سؤال‌های مفهومی است؛ خواندن درس‌ها و خودارزیابی تمرین‌ها جداگانه ثبت می‌شوند.</p>
  </section>;
}
