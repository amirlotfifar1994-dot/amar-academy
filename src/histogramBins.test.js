import test from 'node:test';
import assert from 'node:assert/strict';
import {binPresets,binChecks,summarizeBins,initialBinState,binReducer,analyzeBins,buildBinReport,binInterval,binHeight} from './histogramBins.js';
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<=1e-12*Math.max(1,Math.abs(expected)),`${actual} != ${expected}`);
test('unequal widths give equal density but different shares, with every observation retained',()=>{
 const p=binPresets.unequal,s=summarizeBins(p.values,p.edges).summary;
 assert.deepEqual(s.bins.map(b=>b.count),[2,4,4]);assert.deepEqual(s.bins.map(b=>b.width),[2,4,4]);assert.deepEqual(s.bins.map(b=>b.density),[.1,.1,.1]);assert.deepEqual(s.bins.map(b=>b.share),[.2,.4,.4]);assert.equal(s.equalWidth,false);near(s.totalArea,1);
 assert.deepEqual(s.bins.flatMap(b=>b.members.map(m=>m.index)).sort((a,b)=>a-b),Array.from({length:10},(_,i)=>i));
});
test('interior edges enter next bin, final edge enters last bin, repeated values count separately',()=>{
 const s=summarizeBins([0,2,2,4,6],[0,2,4,6]).summary;
 assert.deepEqual(s.bins.map(b=>b.count),[1,2,2]);assert.deepEqual(s.bins.map(b=>b.cumulative),[1,3,5]);assert.equal(binInterval(s.bins[0]),'[۰, ۲)');assert.equal(binInterval(s.bins.at(-1)),'[۴, ۶]');
 assert.deepEqual(s.bins[1].members,[{value:2,index:1},{value:2,index:2}]);
});
test('density can exceed one while area stays a valid share',()=>{
 const p=binPresets.narrow,s=summarizeBins(p.values,p.edges).summary;
 assert.equal(s.bins[0].density,1.5);assert.equal(s.bins[0].area,.75);near(s.totalArea,1);assert.equal(s.equalWidth,true);
});
test('zero-count bins and constant data remain in the summary',()=>{
 const e=analyzeBins(initialBinState('empty')).summary,c=analyzeBins(initialBinState('constant')).summary;
 assert.deepEqual(e.bins.map(b=>b.count),[2,0,0,0,2]);assert.deepEqual(e.bins.map(b=>b.density),[.25,0,0,0,.25]);assert.deepEqual(c.bins.map(b=>b.count),[0,4]);assert.equal(c.mean,7);assert.equal(c.median,7);
});
test('invalid edges, incomplete coverage, sparse and invalid observations suppress result',()=>{
 for(const [values,edges] of [[[1],[0,0,2]],[[1],[0,2,1]],[[1],[0,2]],[[1],[0,NaN,2]],[[1],[0,1,Infinity]],[[3],[0,1,2]],[[-1],[0,1,2]],[[1],Array.from({length:14},(_,i)=>i)],[[1e10],[0,1,2]],[[NaN],[0,1,2]],[[Infinity],[0,1,2]],[[],[0,1,2]],[[,1],[0,1,2]],[[1],[0,,2]]])assert.equal(summarizeBins(values,edges).summary,null);
 assert.equal(summarizeBins(Array(201).fill(1),[0,1,2]).summary,null);
});
test('Persian digits and real zero accepted; empty fields never become zero',()=>{
 const state={...initialBinState(),xtext:'۰، ۱، ۲',etext:'۰، ۱، ۲'};
 assert.deepEqual(analyzeBins(state).summary.bins.map(b=>b.count),[1,2]);
 for(const field of ['xtext','etext'])for(const value of ['', '0,,2','0,1,','0\n\n2','no'])assert.equal(analyzeBins({...state,[field]:value}).summary,null);
});
test('exact comparisons preserve narrow decimals rather than rounding them into the same boundary',()=>{
 const s=summarizeBins([.30000000000000004,.3000000000000001],[.3,.30000000000000004,.3000000000000001]).summary;
 assert.deepEqual(s.bins.map(b=>b.count),[0,2]);assert.ok(s.bins[1].width>0);near(s.totalArea,1);
});
test('scientific inputs, tiny finite density geometries, large finite values and overflow handling',()=>{
 const tiny=analyzeBins({...initialBinState(),xtext:'0,1e-200,2e-200',etext:'0,1e-200,2e-200'}).summary;
 assert.deepEqual(tiny.bins.map(b=>b.count),[1,2]);assert.ok(tiny.bins.every(b=>Number.isFinite(b.density)));near(tiny.totalArea,1);
 const big=summarizeBins([-1e9,0,1e9],[-1e9,0,1e9]).summary;assert.deepEqual(big.bins.map(b=>b.count),[1,2]);assert.equal(big.mean,0);near(big.totalArea,1);
 assert.equal(summarizeBins([0,Number.MIN_VALUE],[0,Number.MIN_VALUE,Number.MIN_VALUE*2]).summary,null);
 assert.ok(!/NaN|Infinity/.test(binHeight(1e300)));assert.ok(!/NaN|Infinity/.test(binHeight(1e-200)));
});
test('rebinning preserves raw order, mean, median and total count without mutating inputs',()=>{
 const values=[9,2,1,6,3,5,4],edges=[0,2,6,10],before=[...values],beforeEdges=[...edges];
 const a=summarizeBins(values,edges).summary,b=summarizeBins(values,[0,5,10]).summary;
 assert.deepEqual(values,before);assert.deepEqual(edges,beforeEdges);assert.deepEqual(a.values,b.values);assert.equal(a.mean,b.mean);assert.equal(a.median,b.median);assert.equal(a.n,b.n);assert.notDeepEqual(a.bins.map(b=>b.count),b.bins.map(b=>b.count));
});
test('count mode requires exactly equal widths, edge edits reset density and selection',()=>{
 let state=initialBinState();assert.equal(binReducer(state,{type:'chart',value:'count'}),state);
 state=binReducer(state,{type:'preset',id:'boundary'});state=binReducer(state,{type:'chart',value:'count'});assert.equal(state.chart,'count');state=binReducer(state,{type:'select',index:1});assert.equal(state.selected,1);
 state=binReducer(state,{type:'data',field:'etext',value:'0,1,6'});assert.equal(state.chart,'density');assert.equal(state.selected,null);
 state=binReducer(state,{type:'select',index:50});assert.equal(state.selected,null);
 assert.equal(summarizeBins([.1],[0,.1,.2,.3]).summary.equalWidth,false);
});
test('alternative edge action retains edited data, reports coverage error and clears selection',()=>{
 let state=initialBinState();state=binReducer(state,{type:'data',field:'xtext',value:'100,101'});state=binReducer(state,{type:'edges',alternative:true});assert.equal(state.xtext,'100,101');assert.equal(state.selected,null);assert.equal(analyzeBins(state).summary,null);assert.match(analyzeBins(state).error,/پوشش/);
});
test('checks require a choice, changing answer clears feedback and reset clears all page state',()=>{
 let state=initialBinState();assert.equal(binReducer(state,{type:'check',id:'area'}),state);
 for(const q of binChecks){assert.equal(q.feedback.length,q.options.length);assert.ok(q.feedback.every(Boolean));state=binReducer(state,{type:'answer',id:q.id,value:q.correct});state=binReducer(state,{type:'check',id:q.id});assert.equal(state.checked[q.id],true);}
 state=binReducer(state,{type:'answer',id:'area',value:0});assert.equal(state.checked.area,false);
 const edited=binReducer(state,{type:'data',field:'xtext',value:'1,2'});assert.deepEqual(edited.answers,state.answers);assert.deepEqual(binReducer(edited,{type:'reset'}),initialBinState());assert.deepEqual(binReducer(state,{type:'preset',id:'narrow'}),initialBinState('narrow'));
});
test('report retains full accepted precision, original order, closure and separate counts/areas',()=>{
 const state={...initialBinState(),xtext:'1.0000000000000002, 0, 2',etext:'0,1,2'};
 const report=buildBinReport(state);assert.match(report,/1\.0000000000000002, 0, 2/);assert.match(report,/2: \[1, 2\]/);assert.match(report,/بدون گردکردن/);assert.match(report,/1: \[0, 1\).*\| 2/);assert.ok(!/NaN|Infinity/.test(report));
 const invalid=buildBinReport({...state,xtext:''});assert.match(invalid,/نتیجه محاسبه نشد/);assert.ok(!invalid.includes('مجموع مساحت محاسبه‌شده'));
});
test('all presets and alternative edges conserve every observation and normalized area',()=>{
 for(const p of Object.values(binPresets))for(const edges of [p.edges,p.alternative]){const s=summarizeBins(p.values,edges).summary;assert.ok(s);assert.equal(s.bins.reduce((sum,b)=>sum+b.count,0),p.values.length);near(s.totalArea,1);assert.equal(s.bins.at(-1).cumulative,p.values.length);}
});
