import {fmt,number} from './format.js';
export function buildLabReport({mode,stats,pair,pairError,z,rank,x,y,targetValue}) {
  if(!stats) return null;
  const headings={hist:'توزیع و فراوانی',box:'پراکندگی و چارک‌ها',z:'نمرهٔ استاندارد',scatter:'رابطهٔ دو متغیر'};
  const lines=['آمارآموز — گزارش توصیفی',headings[mode]||headings.hist,'',`تعداد مشاهده‌های معتبر X: ${number(stats.n)}`,`میانگین: ${fmt(stats.mean)}`,`میانه: ${fmt(stats.median)}`,`انحراف معیار نمونه‌ای: ${fmt(stats.sd)}`,`کمینه / بیشینه: ${fmt(stats.min)} / ${fmt(stats.max)}`,`چارک اول / سوم: ${fmt(stats.q1)} / ${fmt(stats.q3)}`,`دامنهٔ میان‌چارکی: ${fmt(stats.iqr)}`];
  if(mode==='scatter')lines.push('',pair&&!pairError?`تعداد جفت‌های معتبر: ${number(pair.n)}\nهمبستگی پیرسون: ${fmt(pair.r)}\nکوواریانس نمونه‌ای: ${fmt(pair.covariance)}`:`رابطهٔ دو متغیر محاسبه نشد: ${pairError||'دادهٔ جفت‌شده معتبر نیست.'}`,'همبستگی به‌تنهایی شواهد علیت نیست.');
  if(mode==='z')lines.push('',`نمرهٔ استاندارد: ${fmt(z)}`,`رتبهٔ درصدی با نصف وزن تساوی: ${rank===null?'تعریف‌نشده':fmt(rank)+'٪'}`,'رتبهٔ درصدی از داده‌ها محاسبه شده است؛ مساحت منحنی نرمال نیست.');
  lines.push('','دادهٔ X برای بازبینی (بدون گردکردن):',(x||stats.sorted).join(', '));
  if(mode==='scatter'&&y)lines.push('دادهٔ Y با حفظ ترتیب جفت‌ها:',y.join(', '));
  if(mode==='z'&&targetValue!==undefined)lines.push(`نمرهٔ خام مورد بررسی: ${targetValue===null?'نامعتبر':String(targetValue)}`);
  lines.push('','قراردادها: واریانس و انحراف معیار نمونه‌ای با مخرج n−1؛ چارک‌ها با درون‌یابی خطی نوع ۷. نمایش به دو رقم اعشار؛ محاسبه با دقت کامل.','محدوده: گزارش فقط دادهٔ واردشده را توصیف می‌کند. کیفیت اندازه‌گیری، نرمال‌بودن، تعمیم به جامعه و علیت تأیید نشده‌اند.');
  return lines.join('\n');
}
