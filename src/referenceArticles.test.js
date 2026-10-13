import test from 'node:test';
import assert from 'node:assert/strict';
import {referenceArticles,referenceArticleForTopic} from './referenceArticles.js';
import {analyzeSimpson,initialSimpson,commonComposition} from './simpson.js';
test('independent articles map to the correct topics and have distinct shareable slugs',()=>{
 assert.equal(referenceArticles.sampling.slug,'sd-se');assert.equal(referenceArticles.simpson.slug,'simpson');
 assert.equal(referenceArticles.ranks.slug,'pearson-spearman');assert.equal(new Set(Object.values(referenceArticles).map(a=>a.slug)).size,3);
 assert.equal(referenceArticleForTopic('scatter'),referenceArticles.ranks);assert.equal(referenceArticleForTopic('ranks'),referenceArticles.ranks);assert.equal(referenceArticleForTopic('unknown'),null);
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
