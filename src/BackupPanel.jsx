import React,{useState,useRef,useEffect} from 'react';
import {Download,Upload,ChevronDown} from 'lucide-react';
import {createBackup,parseBackup,mergeBackup,MAX_BACKUP_BYTES} from './backup.js';
import {number} from './format.js';

export function BackupPreview({incoming,preview,fileName,onApply,onCancel}){
  const p=incoming.progress,rows=[
    ['درس خوانده‌شده',p.lessons.length,preview.added.lessons,0],
    ['خودارزیابی تمرین',p.solved.length+p.review.length,preview.added.assessments,preview.conflicts.assessments],
    ['یادداشت تمرین',Object.keys(p.drafts).length,preview.added.drafts,preview.conflicts.drafts],
    ['پاسخ مفهومی معتبر',Object.keys(incoming.concepts).length,preview.added.concepts,preview.conflicts.concepts],
  ];
  const additions=Object.values(preview.added).reduce((sum,n)=>sum+n,0);
  return <section className="backup-preview" aria-labelledby="backup-preview-title">
    <h3 id="backup-preview-title">پیش‌نمایش انتقال</h3>
    <p className="backup-file-name">{fileName}</p>
    <p className="small-note">تاریخ فایل: {new Date(incoming.createdAt).toLocaleDateString('fa-IR')} · نسخهٔ محتوای فایل: {number(incoming.courseVersion)}</p>
    <div className="table-scroll"><table><thead><tr><th scope="col">نوع اطلاعات</th><th scope="col">در فایل</th><th scope="col">افزوده می‌شود</th><th scope="col">تعارض</th></tr></thead><tbody>{rows.map(([label,count,added,conflicts])=><tr key={label}><th scope="row">{label}</th><td>{number(count)}</td><td>{number(added)}</td><td>{number(conflicts)}</td></tr>)}</tbody></table></div>
    <p className="backup-policy">در تعارض‌ها، یادداشت، پاسخ و خودارزیابی فعلی مرورگر حفظ می‌شود. موارد یکسان دوباره شمرده نمی‌شوند؛ هیچ یادداشتی با این انتقال حذف نمی‌شود.</p>
    {incoming.skippedConcepts>0?<p className="storage-message">{number(incoming.skippedConcepts)} پاسخ به‌دلیل تغییر محتوای سؤال کنار گذاشته می‌شود.</p>:null}
    {additions===0?<p className="small-note">اطلاعات تازه‌ای برای افزودن وجود ندارد.</p>:null}
    <div className="backup-actions"><button className="button compact" disabled={additions===0} onClick={onApply}>تأیید و افزودن اطلاعات</button><button className="button secondary compact" onClick={onCancel}>انصراف</button></div>
  </section>;
}

export default function BackupPanel({course,progress,concepts,onRestore,storageError}){
  const [pending,setPending]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const readToken=useRef(0);
  useEffect(()=>()=>{readToken.current++;},[]);
  const state={progress,concepts},preview=pending?mergeBackup(state,pending.incoming,course):null;
  function download(){
    setError('');setNotice('');
    try{
      const text=createBackup(state,course),url=URL.createObjectURL(new Blob([text],{type:'application/json;charset=utf-8'}));
      const link=document.createElement('a');link.href=url;link.download=`amar-academy-backup-${new Date().toISOString().slice(0,10)}.json`;
      document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
      setNotice('فایل پشتیبان برای دانلود آماده شد. برای انتقال، همین فایل را در مرورگر دیگر انتخاب کن.');
    }catch(e){setError(e.message||'آماده‌کردن فایل پشتیبان ممکن نشد.');}
  }
  async function selectFile(event){
    const file=event.target.files?.[0];event.target.value='';if(!file)return;
    const token=++readToken.current;setPending(null);setError('');setNotice('');setBusy(true);
    try{
      if(file.size>MAX_BACKUP_BYTES)throw Error('حجم فایل باید حداکثر ۳۲ مگابایت باشد.');
      const incoming=parseBackup(await file.text(),course);
      if(token===readToken.current){setPending({incoming,fileName:file.name});setNotice('فایل بررسی شد. پیش‌نمایش را ببین؛ هنوز هیچ اطلاعاتی منتقل نشده است.');}
    }catch(e){if(token===readToken.current)setError(e.message||'خواندن فایل ممکن نشد.');}
    finally{if(token===readToken.current)setBusy(false);}
  }
  function apply(){
    const result=onRestore(pending.incoming);
    if(!result.ok){setError('مرورگر نتوانست اطلاعات را ذخیره کند؛ انتقال اعمال نشد. پیشرفت فعلی صفحه حفظ شده است. می‌توانی از آن فایل پشتیبان بگیری.');return;}
    setPending(null);setError('');setNotice('اطلاعات تازه افزوده و در این مرورگر ذخیره شد. اطلاعات قبلی حفظ شده است.');
  }
  return <details className="backup-panel" id="learning-backup">
    <summary><span><Download size={18}/>پشتیبان و انتقال پیشرفت</span><ChevronDown size={18}/></summary>
    <div className="backup-body"><p>درس‌های خوانده‌شده، خودارزیابی تمرین‌ها، یادداشت‌ها و پاسخ‌های مفهومی‌ات را در یک فایل نگه دار. برای انتقال به مرورگر دیگر، فایل را اینجا انتخاب کن.</p>
      <p className="small-note">فایل روی همین دستگاه خوانده می‌شود و به سرور فرستاده نمی‌شود. این انتقال دستی است؛ تغییرهای بعدی بین مرورگرها همگام نمی‌شوند.</p>
      {storageError?<p className="storage-message">ذخیره در این مرورگر در دسترس نیست. دریافت پشتیبان از اطلاعات فعلی صفحه همچنان ممکن است.</p>:null}
      <div className="backup-actions"><button className="button secondary compact" onClick={download}><Download size={18}/>دریافت پشتیبان فعلی</button><label className="backup-file-input"><span><Upload size={18}/>انتخاب فایل پشتیبان</span><input type="file" accept=".json,application/json" disabled={busy} onChange={selectFile}/></label></div>
      {busy?<p role="status" className="small-note">در حال بررسی فایل…</p>:null}
      {error?<p role="alert" className="error-message">{error}</p>:null}
      {notice?<p role="status" className="backup-success">{notice}</p>:null}
      {pending?<BackupPreview incoming={pending.incoming} preview={preview} fileName={pending.fileName} onApply={apply} onCancel={()=>{setPending(null);setError('');setNotice('');}}/>:null}
    </div>
  </details>;
}
