import test from 'node:test';
import assert from 'node:assert/strict';
import {referenceArticles,referenceArticleForTopic} from './referenceArticles.js';
import {analyzeSimpson,initialSimpson,commonComposition} from './simpson.js';
import {summarizeWeightedMean} from './weightedMean.js';

test('weighted article reconstructs the individual mean for every 40-person composition, including empty groups',()=>{
 for(let b=0;b<=40;b++){
  const a=40-b,raw=[...Array(a).fill(10),...Array(b).fill(18)];
  const result=summarizeWeightedMean([{value:a?'10':'',weight:String(a)},{value:b?'18':'',weight:String(b)}],'pooled');
  assert.equal(result.totalWeight,40);assert.equal(result.mean,raw.reduce((s,x)=>s+x,0)/raw.length);
  assert.equal(result.equalMean,a&&b?14:b?18:10);
 }
 const grades=summarizeWeightedMean([{value:'12',weight:'1'},{value:'18',weight:'3'},{value:'16',weight:'2'}]);
 assert.equal(grades.weightedSum,98);assert.equal(grades.totalWeight,6);assert.equal(grades.mean,98/6);assert.equal(grades.equalMean,46/3);
});
test('independent articles map to the correct topics and have distinct shareable slugs',()=>{
 assert.equal(referenceArticles.weighted.slug,'weighted-mean');assert.equal(referenceArticleForTopic('weighted'),referenceArticles.weighted);assert.equal(referenceArticles.sampling.slug,'sd-se');assert.equal(referenceArticles.simpson.slug,'simpson');
 assert.equal(referenceArticles.ranks.slug,'pearson-spearman');assert.equal(new Set(Object.values(referenceArticles).map(a=>a.slug)).size,5);
 assert.equal(referenceArticleForTopic('scatter'),referenceArticles.ranks);assert.equal(referenceArticleForTopic('ranks'),referenceArticles.ranks);assert.equal(referenceArticleForTopic('unknown'),null);assert.equal(referenceArticleForTopic('constructor'),null);assert.equal(referenceArticleForTopic('__proto__'),null);assert.equal(referenceArticles.robust.slug,'outliers-robust');
});
test('Simpson article counts, pooled percentages and all common compositions match its worked claims',()=>{
 const state=initialSimpson(),before=JSON.stringify(state),summary=analyzeSimpson(state).summary;
 assert.deepEqual(summary.strata.map(s=>s.groups.map(g=>[g.positive,g.n,g.rate])),[[[9,10,90],[80,100,80]],[[30,100,30],[2,10,20]]]);
 assert.equal(summary.pooled[0].rate,100*39/110);assert.equal(summary.pooled[1].rate,100*82/110);
 assert.equal(summary.classification,'reversal');
 for(let weight=0;weight<=100;weight++){const scenario=commonComposition(summary,weight);assert.ok(Math.abs(scenario.rates[0]-(30+.6*weight))<1e-10);assert.ok(Math.abs(scenario.rates[1]-(20+.6*weight))<1e-10);assert.ok(Math.abs(scenario.difference-10)<1e-10);}
 assert.deepEqual(commonComposition(summary,50).rates,[60,50]);assert.equal(JSON.stringify(state),before);
});

import {rankPresets,summarizeRankPairs} from './rankCorrelation.js';
test('correlation article examples distinguish linear, monotone, curved and undefined relationships',()=>{
 const calculate=id=>{const p=rankPresets[id];return summarizeRankPairs(p.x,p.y,p.scale);};
 const line=calculate('linear');assert.equal(line.pearson,1);assert.equal(line.spearman,1);
 const monotone=calculate('monotone');assert.equal(monotone.spearman,1);assert.ok(Math.abs(monotone.pearson-132/Math.sqrt(10*2932.8))<1e-12);
 const curve=calculate('curved');assert.equal(curve.pearson,0);assert.equal(curve.spearman,0);
 const constant=calculate('constant');assert.equal(constant.pearson,null);assert.equal(constant.spearman,null);
});
test('ordinal worked example retains original pair identities and its stated average-rank formula',()=>{
 const p=rankPresets.ties,s=summarizeRankPairs(p.x,p.y,p.scale);
 assert.deepEqual(s.rx.ranks,[1,2.5,2.5,4]);assert.deepEqual(s.ry.ranks,[1,3,2,4]);assert.equal(s.cross,4.5);assert.equal(s.ssX,4.5);assert.equal(s.ssY,5);
 assert.ok(Math.abs(s.spearman-4.5/Math.sqrt(4.5*5))<1e-12);assert.equal(s.pearson,null);assert.deepEqual(s.x,p.x);assert.deepEqual(s.y,p.y);
});

import {robustSummary,robustPresets} from './robustness.js';
test('robust article scenario changes only the final row and matches the worked mean and spread',()=>{
 const base=robustPresets.balanced.values,before=[...base],a=robustSummary(base,10),b=robustSummary([...base.slice(0,-1),30],10);
 assert.equal(a.mean,6.5);assert.ok(Math.abs(a.sd-Math.sqrt(2.5))<1e-12);assert.equal(b.mean,8.6);assert.ok(Math.abs(b.sd-Math.sqrt(524.4/9))<1e-12);
 assert.equal(b.median,6.5);assert.equal(b.mad,1.5);assert.equal(b.iqr,2.5);assert.equal(b.trimmedMean,6.5);assert.equal(b.retained.length,8);assert.deepEqual(base,before);
 for(let last=0;last<=60;last++){const result=robustSummary([...base.slice(0,-1),last],10);assert.equal(result.n,10);assert.ok(Math.abs(result.mean-(56+last)/10)<1e-12);assert.equal(result.retained.length,8);}
});
test('raw MAD zero counterexample still has a real extreme value and nonzero sample SD',()=>{
 const s=robustSummary([5,5,5,5,100]);assert.equal(s.median,5);assert.equal(s.mean,24);assert.equal(s.mad,0);assert.equal(s.iqr,0);assert.ok(Math.abs(s.sd-Math.sqrt(1805))<1e-12);
});
test('trim choices conserve every raw observation while selecting the stated middle subset',()=>{
 const values=[4,5,5,6,6,7,7,8,8,30];
 for(const trim of [0,10,20]){const s=robustSummary(values,trim);assert.equal(s.k,trim/10);assert.equal(s.retained.length,10-2*s.k);assert.equal(s.excludedLow.length+s.excludedHigh.length+s.retained.length,10);}
 for(const trim of [10,20]){const s=robustSummary([4,6,8],trim);assert.equal(s.k,0);assert.equal(s.trimmedMean,6);}
});
