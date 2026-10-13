export const referenceArticles={sampling:{slug:'sd-se',title:'انحراف معیار و خطای معیار'},simpson:{slug:'simpson',title:'پارادوکس سیمپسون و ترکیب زیرگروه‌ها'},ranks:{slug:'pearson-spearman',title:'پیرسون، اسپیرمن و معنای رابطه'}};
export function referenceArticleForTopic(id){return referenceArticles[id==='scatter'?'ranks':id]??null;}
