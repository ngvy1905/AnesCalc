/* Run: node inhaled-tests.js
   Numerical verification for the idealized physical model, not clinical validation. */
const assert=require('node:assert/strict');
const c=require('./inhaled.js');
let checks=0;
const equal=(actual,expected)=>{assert.equal(actual,expected);checks++;};
const ok=(condition)=>{assert.ok(condition);checks++;};
const approx=(actual,expected,tol=1e-8)=>{
  assert.ok(Math.abs(actual-expected)<tol,'Expected '+expected+', got '+actual);
  checks++;
};

equal(c.AGENTS.length,6);
const expected={
  halothane:[2.5,197,244,0.75],
  enflurane:[1.9,98.5,172,1.7],
  isoflurane:[1.4,90.8,240,1.2],
  sevoflurane:[0.65,50,160,2],
  nitrous:[0.47,1.3,38770,104],
  desflurane:[0.45,19,669,6]
};
for(const [key,[bloodGas,oilGas,svp,mac]] of Object.entries(expected)){
  const agent=c.findAgent(key);
  equal(agent.bloodGas,bloodGas);
  equal(agent.oilGas,oilGas);
  equal(agent.svp,svp);
  equal(agent.mac,mac);
}
equal(c.findAgent('invalid'),null);

const sevo=c.saturatedChamber('sevoflurane',760,3,200);
approx(sevo.ratio,160/600);
approx(sevo.agentVaporMlMin,200*160/600);
approx(sevo.outputPct,100*(200*160/600)/(3000+200*160/600));
approx(sevo.saturatedPct,100*160/760);
approx(sevo.bypassMlMin,2800);
approx(sevo.carrierMlMin,200);
approx(sevo.splitRatio,14);

const iso=c.saturatedChamber('isoflurane',760,3,200);
approx(iso.ratio,240/520);
ok(iso.outputPct>sevo.outputPct);

// New diagram: 2 L/min, desired C=2%, saturated vapor pressure=160 mmHg.
const reverse=c.chamberForTarget('sevoflurane',760,2,2);
approx(reverse.carrierMlMin,2000*0.02*(760-160)/(160*(1-0.02)));
approx(reverse.carrierMlMin,153.0612244897959);
approx(reverse.bypassMlMin,1846.938775510204);
approx(reverse.agentVaporMlMin,40.81632653061225);
approx(reverse.totalGasMlMin,2040.8163265306123);
approx(reverse.outputPct,2);
approx(reverse.splitRatio,1846.938775510204/153.0612244897959);
const approximatedFigure=c.saturatedChamber('sevoflurane',760,2,150);
approx(approximatedFigure.agentVaporMlMin,40);
approx(approximatedFigure.outputPct,100*40/2040);

// Forward and inverse are the same equation solved for different inputs.
for(const agent of c.AGENTS.filter(a=>a.chamber)){
  for(const targetPct of [0.5,1,2,5]){
    const inverse=c.chamberForTarget(agent.key,760,2,targetPct);
    ok(!inverse.error);
    approx(inverse.outputPct,targetPct);
    const forward=c.saturatedChamber(agent.key,760,2,inverse.carrierMlMin);
    approx(forward.outputPct,targetPct);
  }
}

const saturation=100*160/760;
const fullChamber=c.chamberForTarget('sevoflurane',760,2,saturation);
approx(fullChamber.carrierMlMin,2000);
approx(fullChamber.bypassMlMin,0);
approx(fullChamber.outputPct,saturation);

for(const key of ['nitrous','desflurane']){
  ok(c.saturatedChamber(key,760,3,200).error);
  ok(c.chamberForTarget(key,760,3,2).error);
}
for(const args of [
  ['sevoflurane',160,2,2],['sevoflurane',0,2,2],
  ['sevoflurane',760,0,2],['sevoflurane',760,2,0],
  ['sevoflurane',760,2,100],['sevoflurane',760,2,30],
  ['sevoflurane',760,2,NaN],['invalid',760,2,2]
])ok(c.chamberForTarget(...args).error);
for(const args of [
  ['sevoflurane',160,3,200],['sevoflurane',0,3,200],
  ['sevoflurane',760,0,200],['sevoflurane',760,3,3001],
  ['sevoflurane',760,3,NaN]
])ok(c.saturatedChamber(...args).error);

const alt=c.desfluraneAltitude(6,380);
approx(alt.equivalentPct,12);
approx(alt.referencePartialMmHg,45.6);
approx(alt.ambientPartialMmHg,45.6);
approx(c.desfluraneAltitude(6,760).equivalentPct,6);
for(const args of [[6,0],[100,760],[6,1]])ok(c.desfluraneAltitude(...args).error);
console.log('✓ '+checks+' kiểm thử bảng thuốc và mô hình xuôi/ngược đã đạt.');
