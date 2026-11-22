/* Perioperative blood tool tests: arithmetic and validation ONLY.
 * These do not certify clinical accuracy, transfusion thresholds or patient safety.
 */
const assert=require('node:assert/strict');
const m=require('./blood.js');
let checks=0;
function eq(a,b){assert.equal(a,b);checks++;}
function ok(condition){assert.ok(condition);checks++;}
function near(a,b,tol=1e-8){assert.ok(Math.abs(a-b)<tol,'Expected '+b+', got '+a);checks++;}

eq(m.EBV_GROUPS.length,7);
const groups={
 'adult-male':[70,75,70],'adult-female':[60,65,65],
 child:[70,75,70],infant:[75,80,80],term:[80,90,85],
 preterm:[90,100,95]
};
for(const [key,expected] of Object.entries(groups)){
 const p=m.findGroup(key);
 eq(p.low,expected[0]);eq(p.high,expected[1]);eq(p.defaultFactor,expected[2]);
}
eq(m.findGroup('custom').low,null);
eq(m.findGroup('wrong'),null);

const ebv=m.estimatedBloodVolume(70,70);
eq(ebv.valueMl,4900);
near(m.percentOfEBV(1000,ebv.valueMl).valuePct,1000/4900*100);
near(m.percentOfEBV(1050,ebv.valueMl).valuePct,1050/4900*100);
near(m.percentOfEBV(0,ebv.valueMl).valuePct,0);
near(m.percentOfEBV(5000,ebv.valueMl).valuePct,5000/4900*100);
near(m.estimatedBloodVolume(3.5,85).valueMl,297.5);

const simple=m.allowableBloodLossSimple(4900,12,8);
near(simple.valueMl,1633.3333333333333);
near(m.allowableBloodLossSimple(4900,12,7).valueMl,2041.6666666666667);
near(m.allowableBloodLossSimple(4900,12,12).valueMl,0);
const gross=m.allowableBloodLossGross(4900,36,24);
near(gross.averageHct,30);
near(gross.valueMl,1960);
near(m.allowableBloodLossGross(4900,36,36).valueMl,0);
ok(gross.valueMl>simple.valueMl);

const measured=m.estimatedMeasuredLoss(1200,400,550,300);
eq(measured.netSuctionMl,800);
eq(measured.gauzeEstimateMl,250);
eq(measured.valueMl,1050);
eq(m.estimatedMeasuredLoss(1200,400,550,300,50).valueMl,1100);
eq(m.estimatedMeasuredLoss(0,0,0,0,0).valueMl,0);
near(m.percentOfMABL(1050,simple.valueMl).valuePct,1050/simple.valueMl*100);
near(m.bloodLossRate(600,30).valueMlHour,1200);
near(m.bloodLossRate(0,30).valueMlHour,0);
near(m.bloodLossRate(100,15).valueMlHour,400);
const rbc=m.adultRBCIllustration(6.5,8.5,true);
eq(rbc.equivalentUnits,2);
eq(rbc.hbGapGdL,2);
eq(rbc.assumptionHbRisePerUnit,1);
eq(m.adultRBCIllustration(8,8,true).equivalentUnits,0);
const fluid=m.fluidRatioExamples(1000);
eq(fluid.ratio1_5Ml,1500);
eq(fluid.ratio3Ml,3000);
eq(m.fluidRatioExamples(1050).ratio1_5Ml,1575);

const errorCalls=[
 ()=>m.estimatedBloodVolume(0,70),
 ()=>m.estimatedBloodVolume(-1,70),
 ()=>m.estimatedBloodVolume(70,0),
 ()=>m.estimatedBloodVolume(70,NaN),
 ()=>m.allowableBloodLossSimple(0,12,8),
 ()=>m.allowableBloodLossSimple(4900,0,8),
 ()=>m.allowableBloodLossSimple(4900,8,12),
 ()=>m.allowableBloodLossSimple(4900,12,0),
 ()=>m.allowableBloodLossGross(4900,24,36),
 ()=>m.allowableBloodLossGross(4900,0,24),
 ()=>m.allowableBloodLossGross(4900,101,24),
 ()=>m.allowableBloodLossGross(0,36,24),
 ()=>m.estimatedMeasuredLoss(300,400,550,300),
 ()=>m.estimatedMeasuredLoss(1200,400,200,300),
 ()=>m.estimatedMeasuredLoss(-1,0,0,0),
 ()=>m.estimatedMeasuredLoss(1,0,0,0,NaN),
 ()=>m.percentOfEBV(100,0),
 ()=>m.percentOfEBV(-100,4900),
 ()=>m.percentOfMABL(100,0),
 ()=>m.bloodLossRate(600,0),
 ()=>m.bloodLossRate(-600,30),
 ()=>m.bloodLossRate(600,NaN),
 ()=>m.adultRBCIllustration(6.5,8.5,false),
 ()=>m.adultRBCIllustration(6.5,8.5,null),
 ()=>m.adultRBCIllustration(9,8,true),
 ()=>m.adultRBCIllustration(0,8,true),
 ()=>m.fluidRatioExamples(-1)
];
for(const call of errorCalls)ok(Boolean(call().error));
console.log('✓ '+checks+' kiểm tra toán học EBV, MABL, EBL, tốc độ mất máu và ví dụ RBC đã đạt.');
