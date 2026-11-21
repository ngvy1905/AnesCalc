/* Circuit wash-in test suite.
 * Arithmetic of an ideal one-compartment system ONLY, not clinical validation. */
const assert=require('node:assert/strict');
const c=require('./washin.js');
let count=0;
function close(x,y,eps=1e-9){
  assert.ok(Math.abs(x-y)<=eps,'Expected '+y+', got '+x);
  count++;
}
function eq(x,y){assert.equal(x,y);count++;}
function ok(x){assert.ok(x);count++;}

eq(c.PRESETS.length,6);
for(const [id,volume,kind] of [
  ['circle-standard',5,'illustrative'],
  ['primus-study',5.9,'study'],
  ['perseus-study',3.3,'study'],
  ['zeus-fresh-study',3.2,'study'],
  ['circle-compact',3,'illustrative'],
  ['custom',5,'custom']
]){
 const p=c.getPreset(id);
 close(p.volumeL,volume);
 eq(p.kind,kind);
 ok(p.note.length>40);
}
eq(c.getPreset('unknown'),null);

const r=c.computeWashIn(5,5,0,3,2);
close(r.tauMin,1);
close(r.fraction,2/3);
close(r.targetTimeMin,Math.log(3));
close(r.time50Min,Math.LN2);
close(r.time63Min,1);
close(r.time90Min,Math.log(10));
close(r.time95Min,Math.log(20));
close(r.time99Min,Math.log(100));
close(c.concentrationAt(0,r.tauMin,0,3),0);
close(c.concentrationAt(r.targetTimeMin,r.tauMin,0,3),2);
close(c.fractionReached(r.tauMin,r.tauMin),1-Math.exp(-1));
close(c.concentrationAt(r.time95Min,r.tauMin,0,3),2.85);
close(c.concentrationAt(r.time99Min,r.tauMin,0,3),2.97);

const r0=c.computeWashIn(5,5,0,3,0);
close(r0.targetTimeMin,0);
const rFromOne=c.computeWashIn(5,5,1,3,2);
close(rFromOne.targetTimeMin,Math.log(2));
close(c.concentrationAt(rFromOne.targetTimeMin,1,1,3),2);

for(const p of c.PRESETS){
 const t=c.computeWashIn(p.volumeL,1,0,4,2);
 close(t.tauMin,p.volumeL);
 close(t.targetTimeMin,p.volumeL*Math.LN2);
}
for(const flow of [0.3,0.5,1,2,4,6,8,10]){
 const t=c.computeWashIn(5,flow,0,3,2);
 close(t.tauMin,5/flow);
 close(c.concentrationAt(t.targetTimeMin,t.tauMin,0,3),2);
}
const smaller=c.computeWashIn(3,2,0,3,2);
const larger=c.computeWashIn(6,2,0,3,2);
const faster=c.computeWashIn(6,6,0,3,2);
ok(smaller.targetTimeMin<larger.targetTimeMin);
ok(faster.targetTimeMin<larger.targetTimeMin);

for(const args of [
 [0,5,0,3,2],[5,0,0,3,2],[-5,5,0,3,2],
 [5,5,-1,3,2],[5,5,0,-1,2],[5,5,0,101,2],
 [5,5,0,3,-1],[5,5,0,3,101],
 [5,5,3,3,2],[5,5,3,1,2],
 [5,5,0,3,3],[5,5,0,3,4],[5,5,0,3,NaN],
 [Infinity,5,0,3,2],[5,Infinity,0,3,2]
])ok(c.computeWashIn(...args).error);
eq(c.concentrationAt(-1,1,0,3),null);
eq(c.concentrationAt(1,0,0,3),null);
eq(c.fractionReached(-1,1),null);
eq(c.fractionReached(1,0),null);
close(c.fractionReached(0,1),0);
console.log('✓ '+count+' kiểm tra Circuit wash-in và preset thể tích đã đạt.');
