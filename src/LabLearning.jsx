import React,{useState} from 'react';
import {Lightbulb,Play,Download,BookOpen} from 'lucide-react';
import {fmt} from './format.js';
import {buildLabReport} from './labReport.js';
const prompts={
  hist:['آخرین مقدار را از ۹ به ۱۸ برسان. میانگین بیشتر جابه‌جا می‌شود یا میانه؟','اجرای آزمایش'],
  box:['یک مقدار دورافتاده بساز. آیا دامنه و فاصلهٔ میان‌چارکی به یک اندازه تغییر می‌کنند؟','ساختن مقدار دورافتاده'],
  z:['نمرهٔ مورد بررسی را روی میانگین بگذار. پیش‌بینی می‌کنی z چند شود؟','قرار دادن روی میانگین'],
  scatter:['جهت رابطه را روی نمودار پیدا کن. هر نقطه به یک فرد تعلق دارد؛ ترتیب جفت‌ها را حفظ کن.','دیدن مثال خواب و استرس'],
};
export function GuidedExperiment({mode,onRun}) {
  return <section className="guided-experiment"><Lightbulb size={27}/><div><h2>پیش‌بینی کن، بعد امتحان کن</h2><p>{prompts[mode][0]}</p></div><button className="button amber compact" onClick={onRun}><Play size={18}/>{prompts[mode][1]}</button></section>;
}
export function LabInterpretation({mode,stats,pair,pairError,z,rank,x,y,targetValue}) {
  const [saved,setSaved]=useState(false);
  function downloadReport(){const text=buildLabReport({mode,stats,pair,pairError,z,rank,x,y,targetValue});if(!text)return;const url=URL.createObjectURL(new Blob(['\ufeff'+text],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='amar-amooz-report.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setSaved(true);}
  let text=`مرکز داده‌ها: میانگین ${fmt(stats.mean)} و میانه ${fmt(stats.median)}. فاصلهٔ این دو را همراه شکل نمودار بررسی کن؛ تنها از برابر بودنشان، تقارن یا نرمال‌بودن نتیجه نگیر.`;
  if(mode==='box')text=`بخش میانی توزیع از ${fmt(stats.q1)} تا ${fmt(stats.q3)} است؛ فاصلهٔ میان‌چارکی ${fmt(stats.iqr)}. قاعدهٔ ۱٫۵ IQR یک علامت برای بررسی مقدارهای دورافتاده است، نه دستور حذف آن‌ها.`;
  if(mode==='z')text=z===null?'نمرهٔ z در وضعیت فعلی تعریف نشده است. اعتبار نمره و وجود انحراف معیار غیرصفر را بررسی کن.':`نمرهٔ مورد بررسی ${fmt(Math.abs(z))} انحراف معیار ${z>0?'بالاتر از':z<0?'پایین‌تر از':'با فاصلهٔ صفر از'} میانگین است. این عدد ارزش خوب یا بدِ نمره را تعیین نمی‌کند.`;
  if(mode==='scatter')text=pairError?`برای تفسیر رابطه، ابتدا جفت‌ها را اصلاح کن: ${pairError}`:pair?.r===null?'یکی از متغیرها ثابت است؛ همبستگی پیرسون تعریف نمی‌شود.':`همبستگی خطی ${fmt(pair?.r)} است. نمودار را برای خمیدگی و مقدارهای دورافتاده بررسی کن؛ علت و معلول از این ضریب به دست نمی‌آید.`;
  return <section className="lab-interpretation"><BookOpen size={24}/><div><h2>از عدد به معنا</h2><p>{text}</p></div><button className="button secondary compact" onClick={downloadReport}><Download size={18}/>دریافت گزارش متنی</button>{saved?<span className="sr-only" role="status">گزارش متنی برای دریافت آماده شد.</span>:null}</section>;
}
