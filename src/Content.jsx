import React from 'react';
import {download} from './format.js';
export function Block({block,index}){
 if(block.type==='table')return <div className="table-scroll" tabIndex="0" aria-label="جدول آموزشی"><table><tbody>{block.rows.map((row,i)=><tr key={i}>{row.map((cell,j)=>i===0?<th key={j} scope="col">{cell}</th>:<td key={j}>{cell}</td>)}</tr>)}</tbody></table></div>;
 if(block.type==='heading')return block.level===2?<h3 id={'section-'+index}>{block.text}</h3>:<h2 id={'section-'+index}>{block.text}</h2>;
 if(/^=|^(DATA LIST|BEGIN DATA|END DATA\.|DESCRIPTIVES|CORRELATIONS|\/STATISTICS|\/VARIABLES|\/MISSING)/.test(block.text))return <pre className="code-block" dir="ltr">{block.text}</pre>;
 return <><p className={block.type==='list'?'list-paragraph':''}>{block.text}</p>{block.links?.length?<div className="source-links">{block.links.map((link,i)=><a key={i} href={link.href} target="_blank" rel="noreferrer">{link.label}</a>)}</div>:null}</>;
}
export function Blocks({blocks}){return <div className="prose">{blocks.map((block,i)=><Block key={i} block={block} index={i}/>)}</div>;}
export default function Content({lesson}){return <><h1>{lesson.title}</h1><Blocks blocks={lesson.blocks}/><a className="button" href={download(lesson.files[0])} download>دریافت جزوهٔ Word</a></>;}
