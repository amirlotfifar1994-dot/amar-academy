import React,{useEffect,useState} from 'react';
import {Check,Download,ClipboardList,ChartColumn,ArrowLeft} from 'lucide-react';
import {Blocks} from './Content.jsx';
import {number,download} from './format.js';
import {guides} from './learning.js';
import ConceptGuide from './ConceptGuide.jsx';

export default function Reader({lesson,progress,setProgress,navigate}) {
  const [full,setFull]=useState(()=>location.hash.startsWith('#section-'));
  const done=progress.lessons.includes(lesson.id),guide=guides[lesson.id];
  const headings=lesson.blocks.map((b,i)=>({...b,index:i})).filter(b=>b.type==='heading');
  useEffect(()=>{if(full&&location.hash.startsWith('#section-'))document.getElementById(location.hash.slice(1))?.scrollIntoView();},[full]);
  function toggle(){setProgress(p=>({...p,lessons:done?p.lessons.filter(n=>n!==lesson.id):[...p.lessons,lesson.id]}));}
  return <>
    <div className="reader-heading"><div className="page-heading"><button className="text-button breadcrumb" onClick={()=>navigate('home')}>مسیر یادگیری / جلسهٔ {number(lesson.id)}</button><h1>{lesson.title}</h1><p>{guide.question}</p></div><a className="text-button word-link" href={download(lesson.files[0])} download><Download size={19}/>دانلود نسخهٔ Word</a></div>
    <div className="reader-tabs" role="tablist" aria-label="نوع مطالعه">{[[false,'راهنمای مفهومی'],[true,'جزوهٔ کامل']].map(([value,label])=><button key={label} id={value?'reader-full-tab':'reader-guide-tab'} role="tab" aria-selected={full===value} aria-controls="reader-panel" tabIndex={full===value?0:-1} className={full===value?'active':''} onClick={()=>setFull(value)} onKeyDown={e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?false:e.key==='End'?true:!full;setFull(next);document.getElementById(next?'reader-full-tab':'reader-guide-tab')?.focus();}}}>{label}</button>)}</div>
    <div className="reader-layout"><aside className="toc"><h2>{full?'در این جلسه':'در این راهنما'}</h2><nav aria-label="فهرست بخش‌های جلسه">{full?headings.map(h=><a key={h.index} className={h.level===2?'sub':''} href={'#section-'+h.index}>{h.text}</a>):[['idea','ایدهٔ اصلی'],['experiment','تجربهٔ دیداری'],['example','مثال حل‌شده'],['check','خودت را بسنج']].map(([id,label])=><a key={id} href={'#guide-'+id}>{label}</a>)}</nav></aside><div id="reader-panel" role="tabpanel" aria-labelledby={full?'reader-full-tab':'reader-guide-tab'}>{full?<Blocks blocks={lesson.blocks}/>:<ConceptGuide guide={guide} navigate={navigate}/>}</div></div>
    <div className="lesson-end"><h2>آموخته‌هایت را به کار بگیر</h2><p>پاسخ خودت را بنویس و بعد با پاسخ معیار مقایسه کن.</p><div className="reader-actions"><button className="button" onClick={()=>navigate('practice',lesson.id)}><ClipboardList size={18}/>تمرین‌های این جلسه</button><button className="button secondary" onClick={()=>navigate('lab',0,{mode:guide.mode})}><ChartColumn size={18}/>تجربه در آزمایشگاه</button><button className={'button '+(done?'':'secondary')} onClick={toggle} aria-pressed={done}>{done?<Check size={18}/>:null}{done?'خوانده‌ام':'ثبت به‌عنوان خوانده‌شده'}</button>{lesson.id<10?<button className="text-button" onClick={()=>navigate('lesson',lesson.id+1)}>جلسهٔ بعد<ArrowLeft size={18}/></button>:null}</div></div>
  </>;
}
