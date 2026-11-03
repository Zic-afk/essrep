const assert=require('node:assert/strict');
const {groups,calculate,message}=require('../js/data.js');
assert.equal(calculate([]).ep,0);
assert.deepEqual(calculate(['core']),{ep:24,server:24,mobile:0,factor:1,min:84000,max:120000,weeks:2});
assert.equal(calculate(['core','threads','architecture']).ep,52.2);
assert.equal(calculate(['architecture','threads','async','legacy']).ep,21,'Server coefficients must not affect mobile work');
assert.equal(calculate(['threads','async','legacy']).ep,0);
assert.equal(calculate(['core','threads','async','legacy']).ep,60.84);
const all=groups.flatMap(g=>g.items.map(([id])=>id));
assert.equal(new Set(all).size,all.length,'Option IDs must be unique');
for(let mask=0;mask<2**all.length;mask++){
  const ids=all.filter((_,i)=>mask&(1<<i)),result=calculate(ids);
  assert.ok(Number.isFinite(result.ep)&&result.ep>=0);
  assert.ok(result.max>=result.min);
  assert.equal(result.weeks,Math.ceil(result.ep/15));
  assert.ok(result.weeks*15>=result.ep);
}
const text=message(['core','threads','architecture']);
assert.ok(text.includes('52.2 EP')&&text.includes('Ядро сервера')&&text.includes('Многопоточность')&&text.includes('Архитектура приложения'));
assert.equal(decodeURIComponent(encodeURIComponent(text)),text);
console.log('Calculator passed: all 65,536 option combinations, server-only coefficients, rounding and Telegram message.');
