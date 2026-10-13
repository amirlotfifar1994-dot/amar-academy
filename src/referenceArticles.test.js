import test from 'node:test';
import assert from 'node:assert/strict';
import {referenceArticles} from './referenceArticles.js';
import {analyzeSimpson,initialSimpson,commonComposition} from './simpson.js';
test('independent articles map to the correct topics and have distinct shareable slugs',()=>{
 assert.equal(referenceArticles.sampling.slug,'sd-se');assert.equal(referenceArticles.simpson.slug,'simpson');
 assert.equal(new Set(Object.values(referenceArticles).map(a=>a.slug)).size,2);
});
test('Simpson article counts, pooled percentages and all common compositions match its worked claims',()=>{
 const state=initialSimpson(),before=JSON.stringify(state),summary=analyzeSimpson(state).summary;
 assert.deepEqual(summary.strata.map(s=>s.groups.map(g=>[g.positive,g.n,g.rate])),[[[9,10,90],[80,100,80]],[[30,100,30],[2,10,20]]]);
 assert.equal(summary.pooled[0].rate,100*39/110);assert.equal(summary.pooled[1].rate,100*82/110);
 assert.equal(summary.classification,'reversal');
 for(let weight=0;weight<=100;weight++){const scenario=commonComposition(summary,weight);assert.ok(Math.abs(scenario.rates[0]-(30+.6*weight))<1e-10);assert.ok(Math.abs(scenario.rates[1]-(20+.6*weight))<1e-10);assert.ok(Math.abs(scenario.difference-10)<1e-10);}
 assert.deepEqual(commonComposition(summary,50).rates,[60,50]);assert.equal(JSON.stringify(state),before);
});
