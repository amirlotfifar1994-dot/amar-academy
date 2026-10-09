import test from 'node:test';
import assert from 'node:assert/strict';
import {describe,pairStats,percentileRank} from './stats.js';
import {buildLabReport} from './labReport.js';

test('expanded explanations match even medians, sample spread, quartile fences and paired units',()=>{
  assert.equal(describe([2,4,6,8]).median,5);
  const a=describe([6,7,8]);assert.equal(a.ss,2);assert.equal(a.variance,1);
  const q=describe([2,4,6,8]);assert.equal(q.lower,-1);assert.equal(q.upper,11);
  const x=[1,2,3,4],y=[8,6,4,2],pair=pairStats(x,y);
  assert.equal(describe(x).mean,2.5);assert.equal(describe(y).mean,5);
  assert.equal(pair.covariance,-10/3);assert.equal(pair.r,-1);
  assert.equal(pairStats(x.map(v=>v*60),y).r,-1);
  assert.equal(percentileRank([2,4,6,8],3.5),25);
});

test('worked guide examples retain the advertised centers, spread and percentile convention',()=>{
  const before=describe([4,5,5,6,6,6,7,7,8]),after=describe([4,5,5,6,6,6,7,7,18]);
  assert.equal(before.mean,6);assert.equal(before.median,6);assert.equal(after.median,6);assert.ok(Math.abs(after.mean-64/9)<1e-12);
  assert.equal(describe([6,7,8]).sd,1);assert.equal(describe([2,7,12]).sd,5);
  const quartiles=describe([2,4,6,8]);assert.equal(quartiles.q1,3.5);assert.equal(quartiles.q3,6.5);assert.equal(percentileRank([2,4,6,8],4),37.5);
  assert.equal(pairStats([1,2,3,4],[4,1,1,4]).r,0);
});
test('a report with invalid paired data never invents a correlation or pair count',()=>{
  const report=buildLabReport({mode:'scatter',stats:describe([1,2,3]),pair:pairStats([1,2,3],[2,4]),pairError:'تعداد X و Y برابر نیست.'});
  assert.match(report,/رابطهٔ دو متغیر محاسبه نشد/);assert.doesNotMatch(report,/همبستگی پیرسون:/);assert.doesNotMatch(report,/تعداد جفت‌های معتبر:/);
});
test('zero rank is a valid result and undefined SD and z stay explicit in exported text',()=>{
  const zero=buildLabReport({mode:'z',stats:describe([4,4]),pair:null,pairError:null,z:null,rank:0});
  assert.match(zero,/نمرهٔ استاندارد: تعریف‌نشده/);assert.match(zero,/رتبهٔ درصدی با نصف وزن تساوی: ۰٪/);
  const single=buildLabReport({mode:'hist',stats:describe([4])});assert.match(single,/انحراف معیار نمونه‌ای: تعریف‌نشده/);
  assert.equal(buildLabReport({mode:'hist',stats:null}),null);
});
test('valid paired reports preserve a real zero correlation and state their limitations',()=>{
  const x=[1,2,3,4],y=[4,1,1,4];
  const report=buildLabReport({mode:'scatter',stats:describe(x),pair:pairStats(x,y),pairError:null});
  assert.match(report,/همبستگی پیرسون: ۰/);assert.match(report,/تعداد جفت‌های معتبر: ۴/);assert.match(report,/قراردادها:/);assert.match(report,/علیت تأیید نشده/);
});
test('report data preserve decimal precision and the order of paired observations',()=>{
  const x=[8.123456,2,5],y=[4,9,1];
  const report=buildLabReport({mode:'scatter',stats:describe(x),pair:pairStats(x,y),pairError:null,x,y});
  assert.match(report,/8\.123456, 2, 5/);assert.match(report,/4, 9, 1/);
});
