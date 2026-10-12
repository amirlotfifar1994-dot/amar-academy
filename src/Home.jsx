import React from 'react';
import {ArrowLeft} from 'lucide-react';
import LearningDashboard from './LearningDashboard.jsx';
import BackupPanel from './BackupPanel.jsx';
import AnalysisGuide from './AnalysisGuide.jsx';
import ReferenceHub from './ReferenceHub.jsx';
export default function Home({course,progress,navigate,concepts,conceptStorageError,onRestore}){
 return <>
 <section className="reference-opening"><span>آمار توصیفی برای فهم داده</span><h1>چه چیزی را می‌خواهی<br/>دربارهٔ داده‌ات بفهمی؟</h1><p>یک موضوع را انتخاب کن، توضیح کاملش را بخوان و با مثال و نمودار امتحانش کن. می‌توانی از هر مفهومی که الآن به آن نیاز داری شروع کنی.</p><a className="button amber" href="#reference-topics">پیداکردن موضوع</a><button className="text-button" onClick={()=>navigate('library')}>جست‌وجو در متن کامل منابع<ArrowLeft size={18}/></button></section>
 <section className="reference-context" aria-labelledby="reference-context-title"><h2 id="reference-context-title">آمار توصیفی چه کمکی می‌کند؟</h2><p>فرض کن زمان انتظار مراجعه‌کنندگان را ثبت کرده‌ای. آمار توصیفی کمک می‌کند بگویی چند پاسخ داری، انتظار معمول چقدر است، مقدارها چقدر پراکنده‌اند و چه الگوهایی دیده می‌شود. هدف، روشن‌کردن داستان همان داده‌های مشاهده‌شده است.</p><div><p><strong>از سؤال شروع کن.</strong> «معمولاً چقدر منتظر می‌مانند؟» با «چند نفر بیش از ده دقیقه منتظرند؟» یک محاسبه نمی‌خواهد.</p><p><strong>عدد را در بافت بخوان.</strong> واحد، تعداد پاسخ معتبر، روش محاسبه و نمودار را کنار نتیجه نگه دار.</p><p><strong>مرز نتیجه را بشناس.</strong> خلاصهٔ این مراجعه‌کنندگان به‌تنهایی وضعیت همهٔ افراد یا علت انتظار طولانی را ثابت نمی‌کند؛ تعمیم و علیت به شواهد بیشتری نیاز دارند.</p></div></section>
 <ReferenceHub navigate={navigate} course={course}/><AnalysisGuide navigate={navigate}/>
 <section className="reference-tools"><h2>از فهم مفهوم تا استفاده از آن</h2><p>برای یک سؤال واقعی، روش را انتخاب کن، داده را بررسی کن و نتیجه را با محدودیتش توضیح بده.</p><div><button className="button secondary" onClick={()=>navigate('lab')}>ابزارهای تعاملی</button><button className="button secondary" onClick={()=>navigate('practice')}>مثال‌ها و تمرین‌های تشریحی</button><button className="button secondary" onClick={()=>navigate('reports')}>خواندن و نقد گزارش</button><button className="button secondary" onClick={()=>navigate('project')}>نمونهٔ تحلیل از داده تا گزارش</button></div></section>
 <details className="reference-personal"><summary>مرورهای من و پشتیبان یادداشت‌ها</summary><LearningDashboard course={course} concepts={concepts} progress={progress} navigate={navigate} storageError={conceptStorageError}/><BackupPanel course={course} progress={progress} concepts={concepts} onRestore={onRestore} storageError={conceptStorageError}/></details>
 </>;
}
