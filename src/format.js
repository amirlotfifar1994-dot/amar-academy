export const fa=new Intl.NumberFormat('fa-IR',{maximumFractionDigits:2});
export const fmt=value=>value===null||value===undefined||!Number.isFinite(value)?'تعریف‌نشده':fa.format(value);
export const number=value=>new Intl.NumberFormat('fa-IR').format(value);
export const download=name=>import.meta.env.BASE_URL+'downloads/'+encodeURIComponent(name);
