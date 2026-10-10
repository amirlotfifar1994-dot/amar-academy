export const scales=[
  {id:'nominal',label:'اسمی · دسته‌های بدون ترتیب',example:'روش مطالعه: فردی، گروهی، آنلاین'},
  {id:'ordinal',label:'ترتیبی · دسته‌های دارای ترتیب',example:'رضایت: کم، متوسط، زیاد؛ فاصله‌ها معلوم نیست'},
  {id:'quantitative',label:'کمی · فاصله‌های عددی معنادار',example:'مدت خواب، تعداد مراجعه یا نمره با فرض فاصله‌های برابر'},
];
export const goals=[
  {id:'distribution',label:'دیدن توزیع و فراوانی'},
  {id:'center',label:'خلاصه‌کردن مرکز داده‌ها'},
  {id:'spread',label:'توصیف پراکندگی'},
  {id:'position',label:'جایگاه یک مقدار یا نمره'},
  {id:'relationship',label:'رابطهٔ دو متغیر'},
];
export const shapes=[
  {id:'unknown',label:'هنوز بررسی نکرده‌ام'},
  {id:'balanced',label:'تقریباً متقارن، بدون دنبالهٔ سنگین یا مقدار بسیار دور'},
  {id:'skewed',label:'نامتقارن یا دارای مقدارهای بسیار دور'},
];
const sources={
  measurement:['مقیاس اندازه‌گیری · OpenStax','https://openstax.org/books/introductory-statistics-2e/pages/1-3-frequency-frequency-tables-and-levels-of-measurement'],
  distributions:['نمودار جعبه‌ای گروه‌ها · NIST','https://www.itl.nist.gov/div898/handbook/eda/section3/boxplot.htm'],
  groups:['جدول دوطرفه · OpenStax','https://openstax.org/books/introductory-statistics-2e/pages/3-4-contingency-tables'],
  center:['شاخص‌های مرکز · NIST','https://www.itl.nist.gov/div898/handbook/eda/section3/eda351.htm'],
  spread:['شاخص‌های پراکندگی · NIST','https://www.itl.nist.gov/div898/handbook/eda/section3/eda356.htm'],
  histogram:['هیستوگرام · NIST','https://www.itl.nist.gov/div898/handbook/eda/section3/eda33e.htm'],
  relationship:['نمودار پراکنش · NIST','https://www.itl.nist.gov/div898/handbook/eda/section3/scatterp.htm'],
  rank:['همبستگی رتبه‌ای · مستندات R','https://stat.ethz.ch/R-manual/R-devel/library/stats/html/cor.html'],
  z:['نمرهٔ استاندارد · OpenStax','https://openstax.org/books/introductory-statistics-2e/pages/6-1-the-standard-normal-distribution'],
};
export const initialAnalysisChoice={scale:'quantitative',goal:'distribution',shape:'unknown',secondScale:'quantitative'};
export function normalizeAnalysisChoice(value={}){
  value=value&&typeof value==='object'?value:{};
  return {scale:scales.some(s=>s.id===value.scale)?value.scale:initialAnalysisChoice.scale,
    goal:goals.some(g=>g.id===value.goal)?value.goal:initialAnalysisChoice.goal,
    shape:shapes.some(s=>s.id===value.shape)?value.shape:initialAnalysisChoice.shape,
    secondScale:scales.some(s=>s.id===value.secondScale)?value.secondScale:initialAnalysisChoice.secondScale};
}
export function recommendAnalysis(input){
  const choice=normalizeAnalysisChoice(input),{scale,goal,shape,secondScale}=choice;
  const result=(id,title,why,caution,lessonId,mode,source,visual)=>({id,title,why,caution,lessonId,mode,source:sources[source],visual:visual||(mode==='box'?'box':mode==='scatter'?'scatter':mode==='z'?'position':scale==='quantitative'?'histogram':'bars'),choice});
  if(goal==='relationship'){
    if(scale==='quantitative'&&secondScale==='quantitative')return result('paired','اول پراکنش؛ سپس همبستگی پیرسون برای رابطهٔ خطی','هر نقطه باید دو مقدارِ متعلق به یک مشاهده را نشان دهد. شکل رابطه و مقدارهای دورافتاده را پیش از خلاصه‌کردن با r بررسی کن.','جفت‌ها را جداگانه مرتب نکن. r نزدیک صفر، رابطهٔ خمیده را رد نمی‌کند؛ همبستگی هم به‌تنهایی علیت را نشان نمی‌دهد.',9,'scatter','relationship');
    if((scale==='quantitative')!==(secondScale==='quantitative'))return result('mixed-pair','توزیع متغیر کمی را در هر گروه جداگانه ببین','متغیر دسته‌ای، گروه‌ها را مشخص می‌کند و مقدارهای متغیر کمی در هر گروه جدا خلاصه می‌شوند. تعداد، مرکز، پراکندگی و شکل توزیع را روی محور مشترک بررسی کن.','کد دسته‌ها را وارد میانگین یا پیرسون نکن؛ فقط مقدارهای کمیِ هر گروه را وارد ابزار کن. ابزار فعلی دو گروه با واحد قابل مقایسه دارد و تفاوت مشاهده‌شده علت یا تفاوت قطعی در جامعه را اثبات نمی‌کند.',5,'distributions','distributions','group-box');
    if(scale!=='nominal'&&secondScale!=='nominal')return result('ranked-pair','برای دادهٔ ترتیبی، رابطهٔ رتبه‌ها را بررسی کن','روش‌هایی مانند اسپیرمن یا کندال برای رابطهٔ رتبه‌ها به کار می‌روند؛ عددهای کدگذاری‌شده الزاماً فاصلهٔ برابر ندارند.','در ابزار رتبه‌ها، اسپیرمن با رتبهٔ متوسط تساوی‌ها محاسبه می‌شود؛ کد بزرگ‌تر باید طبقهٔ بالاتر را نشان دهد. کندال در این ابزار نیست و همبستگی رتبه‌ای علت را اثبات نمی‌کند.',9,'ranks','rank','bars');
    if(scale!=='quantitative'&&secondScale!=='quantitative')return result('categorical-pair','جدول دوطرفه؛ با درصدهای درون هر گروه','فراوانی ترکیب دسته‌ها را ببین. برای مقایسهٔ سهم یک پاسخ در گروه‌های نابرابر، تعداد آن پاسخ را بر اندازهٔ همان گروه تقسیم کن.','ابزار فعلی دو گروه و دو نوع پاسخ دارد؛ برای دسته‌های بیشتر، جدول بزرگ‌تری لازم است. تفاوت درصدها به‌تنهایی علیت یا نتیجهٔ کل جامعه را اثبات نمی‌کند.',2,'groups','groups','bars');
  }
  if(scale==='nominal'){
    if(goal==='position')return result('nominal-position','جایگاه عددی برای دستهٔ بدون ترتیب تعریف نمی‌شود','نام روش مطالعه یا شهر، بالا و پایینِ ذاتی ندارد. فراوانی و درصد هر دسته پرسش مناسب‌تری است.','کد ۳ برای یک شهر، به معنی بیشتر یا بهتر بودن آن نسبت به کد ۱ نیست.',1,null,'measurement');
    if(goal==='center')return result('nominal-center','نما؛ همراه فراوانی و درصد دسته‌ها','نما پرتکرارترین دسته است؛ ممکن است چند دسته هم‌فراوان باشند. نام دسته و تعداد آن را گزارش کن.','میانگین و میانهٔ کدهای دلخواه اسمی معنای اندازه‌گیری ندارند.',4,null,'measurement');
    return result('nominal-frequency','جدول فراوانی و نمودار میله‌ای دسته‌ها','تعداد و درصد هر دسته را مقایسه کن. میله‌ها دسته‌های جدا را نشان می‌دهند؛ برای پراکندگیِ عددی از انحراف معیار کدها استفاده نکن.','مخرج درصد را روشن کن؛ پاسخ گمشده با صفر یا یک دستهٔ واقعی یکی نیست.',2,null,'measurement');
  }
  if(scale==='ordinal'){
    if(goal==='center')return result('ordinal-center','طبقهٔ میانی و نما؛ همراه فراوانیِ مرتب‌شده','ترتیب طبقه‌ها معنا دارد. با فراوانی تجمعی، طبقهٔ مشاهدهٔ میانی را پیدا کن و پرتکرارترین طبقه را نیز ببین.','اگر دو مشاهدهٔ میانی در طبقه‌های متفاوت‌اند، هر دو را گزارش کن؛ میانگین کدهای آن‌ها فاصلهٔ برابر را فرض می‌کند.',4,'ordinal','measurement');
    if(goal==='position'||goal==='spread')return result('ordinal-order','فراوانی تجمعی و طبقه‌های چارکی','ببین مشاهده‌ها در کدام طبقه‌های مرتب‌شده قرار دارند. طبقهٔ چارک‌ها، بخش میانی ترتیب را توصیف می‌کند.','فاصلهٔ عددی بین کد طبقه‌ها را IQR یا انحراف معیار تلقی نکن. ابزار ترتیبی، طبقهٔ رسیدن به درصد را با قرارداد گسسته نشان می‌دهد؛ تفاضل کدها فاصلهٔ اندازه‌گیری‌شده نیست.',8,'ordinal','measurement');
    return result('ordinal-frequency','نمودار میله‌ای با حفظ ترتیب طبقه‌ها','فراوانی هر طبقه را از کم به زیاد نمایش بده؛ فاصلهٔ برابر میان کدها از این نمایش نتیجه نمی‌شود.','پاسخ یک سؤال رضایت با نمرهٔ مجموع یک مقیاس یکسان نیست؛ فرض فاصله‌های برابر برای نمرهٔ مجموع باید جداگانه توجیه شود.',3,'ordinal','measurement');
  }
  if(goal==='distribution')return result('quantitative-distribution','هیستوگرام؛ همراه تعداد و واحد مشاهده‌ها','بازه‌ها نشان می‌دهند دادهٔ کمی کجا متمرکز است و دنباله‌ها چه شکلی دارند. چند تعداد طبقه را مقایسه کن؛ برای شمارش با مقدارهای اندک، میلهٔ فراوانی هر مقدار هم روشن است.','عوض‌کردن طبقه‌ها نمایش را تغییر می‌دهد؛ تقارن ظاهری به‌تنهایی نرمال‌بودن داده را اثبات نمی‌کند.',3,'hist','histogram');
  if(goal==='position')return result('quantitative-position','رتبهٔ درصدی یا فاصلهٔ استاندارد z','رتبهٔ درصدی از ترتیب داده‌ها می‌آید؛ z فاصله از میانگین را برحسب انحراف معیار بیان می‌کند. این دو به پرسش‌های متفاوت پاسخ می‌دهند.','برای z نمونه‌ای، حداقل دو مشاهده و انحراف معیار غیرصفر لازم است. بدون فرض نرمال‌بودن، z را مستقیم به درصد افراد تبدیل نکن.',6,'z','z');
  if(shape==='unknown')return result('inspect-'+goal,'اول شکل توزیع را ببین؛ سپس خلاصه‌ها را کنار هم بخوان',goal==='center'?'میانگین و میانه را با هیستوگرام مقایسه کن. انتخاب مقدار نماینده به هدف تو و اثر دنباله‌ها بستگی دارد.':'انحراف معیار و IQR جنبه‌های متفاوتی از پراکندگی را نشان می‌دهند؛ نمودار کمک می‌کند اثر دنباله‌ها را ببینی.','این راهنما دادهٔ واقعی را بررسی نکرده است. از نزدیک‌بودن میانگین و میانه هم نرمال‌بودن نتیجه نگیر.',goal==='center'?4:5,'hist',goal==='center'?'center':'spread');
  if(shape==='skewed')return result('robust-'+goal,goal==='center'?'میانه؛ همراه نمودار و در صورت نیاز میانگین':'IQR؛ همراه نمودار جعبه‌ای',goal==='center'?'میانه برای توصیف مقدار معمول، به مقدارهای بسیار دور حساسیت کمتری دارد. اگر هدف میانگین واقعی است، میانگین را هم گزارش کن.':'IQR پراکندگی نیمهٔ میانی را نشان می‌دهد؛ انحراف معیار اثر مقدارهای دور را بیشتر منعکس می‌کند.','مقدار دورافتاده خودکار حذف نمی‌شود. میانه و IQR همهٔ جزئیات دنباله‌ها را نشان نمی‌دهند.',goal==='center'?4:5,'robust',goal==='center'?'center':'spread','box');
  return result('balanced-'+goal,goal==='center'?'میانگین؛ همراه میانه و شکل توزیع':'انحراف معیار؛ همراه مرکز و شکل توزیع',goal==='center'?'در شکل تقریباً متقارن با دنباله‌های آرام، میانگین خلاصهٔ مفیدی از مرکز است. میانه را برای مقایسه حفظ کن.':'انحراف معیار پراکندگی پیرامون میانگین را در واحد اصلی بیان می‌کند. برای نمونه در این اپ، مخرج واریانس n−1 است.','تقارن به‌تنهایی کافی نیست؛ دنبالهٔ سنگین و مقدارهای دور را هم بررسی کن. این انتخاب آزمون نرمال‌بودن نیست.',goal==='center'?4:5,goal==='center'?'hist':'box',goal==='center'?'center':'spread');
}
