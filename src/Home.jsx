import React from 'react';
import {ArrowLeft,Check,ChevronDown,ChevronLeft,FileText,FlaskConical,Lightbulb,ChartColumn} from 'lucide-react';
import {number} from './format.js';
import {CenterExperiment} from './Experiments.jsx';
import {guides,phases} from './learning.js';
import LearningDashboard from './LearningDashboard.jsx';
import {summarizeConceptProgress} from './conceptProgress.js';
import BackupPanel from './BackupPanel.jsx';
import AnalysisGuide from './AnalysisGuide.jsx';

export default function Home({course,progress,navigate,concepts,conceptStorageError,onRestore}) {
  const next=course.lessons.find(l=>!progress.lessons.includes(l.id))||course.lessons[0];
  const conceptsByLesson=summarizeConceptProgress(concepts).lessons;
  return <>
    <div className="home-opening">
      <section className="home-intro"><h1>اول بفهم،<br/>بعد محاسبه کن.</h1><p>آمار توصیفی را با مثال‌های روان‌شناسی، آزمایش و تمرین یاد بگیر.</p><button className="button amber" onClick={()=>navigate('lesson',next.id)}>{progress.lessons.length?'ادامهٔ یادگیری':'شروع یادگیری'}<ArrowLeft size={22}/></button><button className="text-button explore-link" onClick={()=>navigate('lab')}>کاوش در آزمایشگاه<ArrowLeft size={21}/></button><button className="next-lesson" onClick={()=>navigate('lesson',next.id)}><FileText size={21}/><span>جلسهٔ {number(next.id)} · {next.title}</span></button></section>
      <CenterExperiment compact/>
    </div>
    <LearningDashboard course={course} concepts={concepts} progress={progress} navigate={navigate} storageError={conceptStorageError}/>
    <BackupPanel course={course} progress={progress} concepts={concepts} onRestore={onRestore} storageError={conceptStorageError}/>
    <AnalysisGuide navigate={navigate}/><section className="group-home-entry"><div><h2>تعداد بیشتر یا سهم بیشتر؟</h2><p>با جدول دوطرفه و تغییر مخرج، درصد گروه‌های نابرابر را درست مقایسه کن.</p></div><button className="button secondary" onClick={()=>navigate('lab',0,{mode:'groups'})}>مقایسهٔ گروه‌ها<ArrowLeft size={18}/></button></section>
    <section className="group-home-entry"><div><h2>میانگین برابر، پراکندگی متفاوت؟</h2><p>نمره‌های دو گروه را روی یک محور ببین؛ مرکز، پراکندگی و تعداد هر گروه را کنار هم بخوان.</p></div><button className="button secondary" onClick={()=>navigate('lab',0,{mode:'distributions'})}>توزیع نمره‌های دو گروه<ArrowLeft size={18}/></button><button className="text-button" onClick={()=>navigate('lab',0,{mode:'robust'})}>اثر مقدار دور<ArrowLeft size={18}/></button></section><section className="mean-home-entry"><div><h2>میانگینِ میانگین‌ها، همیشه میانگین همه نیست.</h2><p>وزن‌ها و اندازهٔ گروه‌ها را تغییر بده؛ سهم‌ها و نتیجه را کنار هم ببین.</p></div><button className="button secondary" onClick={()=>navigate('lab',0,{mode:'weighted'})}>میانگین وزنی و ترکیبی<ArrowLeft size={18}/></button></section><section className="coach-entry"><div><h2>جواب را خودت بساز؛ گام‌به‌گام.</h2><p>شش تمرین منتخب، با بررسی روش، محاسبه و تفسیر و راهنمای مخصوص اشتباه‌ها.</p></div><button className="button secondary" onClick={()=>navigate('practice')}>حل هدایت‌شده<ArrowLeft size={18}/></button></section><section className="project-home-entry"><div><h2>یک تحلیل کامل را خودت پیش ببر.</h2><p>از ده رکورد خام خواب و استرس، تا انتخاب روش، تفسیر نمودار و نوشتن گزارش با خودبازبینی.</p></div><button className="button secondary" onClick={()=>navigate('project')}>پروژهٔ پایانی<ArrowLeft size={18}/></button></section><section className="syllabus"><div className="syllabus-heading"><div><h2>مسیر یادگیری</h2><p>از فهم مفاهیم تا تحلیل و گزارش</p></div><div className="learning-rhythm">{[[Lightbulb,'بفهم','مفهوم را با مثال ببین'],[FlaskConical,'تجربه کن','با تغییر داده، اثرش را ببین'],[ChartColumn,'به کار ببر','حل تمرین و گزارش نتیجه']].map(([Icon,title,subtitle])=><div key={title}><span><Icon size={23}/></span><div><strong>{title}</strong><small>{subtitle}</small></div></div>)}</div></div>
      <div className="course-phases">{phases.map(phase=><details key={phase.title} open={phase.ids.includes(next.id)}><summary><strong>{phase.title}</strong><span>{phase.range}</span><ChevronDown size={17}/></summary><div>{phase.ids.map(id=>{const l=course.lessons.find(item=>item.id===id),done=progress.lessons.includes(id);return <button className="syllabus-row" key={id} onClick={()=>navigate('lesson',id)}><span className={'lesson-number '+(done?'complete':'')}>{done?<Check size={18}/>:number(id)}</span><strong>{l.title}</strong><span className="syllabus-question">{guides[id].question}{conceptsByLesson[id-1].answered>0?<small className={conceptsByLesson[id-1].review?"concept-needs-review":"concept-answered"}>خودسنجی: {number(conceptsByLesson[id-1].correct)} از {number(conceptsByLesson[id-1].total)} درست{conceptsByLesson[id-1].review?" · نیاز به مرور":""}</small>:null}</span><span className="syllabus-action"><ChevronLeft size={19}/></span></button>;})}</div></details>)}</div>
    </section>
    <div className="home-bottom"><p>۱۰ درس مفهومی، ۴۸۰ تمرین تشریحی و ۳۲ سند آموزشی؛ با متن کامل و فایل‌های اصلی.</p><button className="text-button" onClick={()=>navigate('library')}>رفتن به کتابخانه<ArrowLeft size={18}/></button></div>
  </>;
}
