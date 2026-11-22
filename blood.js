/* Perioperative blood loss — transparent arithmetic only.
 * Educational formulas, not a transfusion decision aid or validated clinical device.
 * Pediatric EBV ranges are references only; no pediatric transfusion formula is provided.
 */
(function(root){
  'use strict';
  const EBV_GROUPS=Object.freeze([
    {key:'adult-male',name:'Nam trưởng thành',low:70,high:75,defaultFactor:70},
    {key:'adult-female',name:'Nữ trưởng thành',low:60,high:65,defaultFactor:65},
    {key:'child',name:'Trẻ > 1 tuổi',low:70,high:75,defaultFactor:70},
    {key:'infant',name:'Trẻ nhũ nhi',low:75,high:80,defaultFactor:80},
    {key:'term',name:'Sơ sinh đủ tháng',low:80,high:90,defaultFactor:85},
    {key:'preterm',name:'Sơ sinh non tháng',low:90,high:100,defaultFactor:95},
    {key:'custom',name:'Tự nhập hệ số',low:null,high:null,defaultFactor:70}
  ]);
  const positive=n=>typeof n==='number'&&Number.isFinite(n)&&n>0;
  const nonnegative=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0;
  const validPercent=n=>nonnegative(n)&&n<=100;
  const findGroup=key=>EBV_GROUPS.find(g=>g.key===key)||null;
  const failure=message=>({error:message});

  function estimatedBloodVolume(weightKg,mlPerKg){
    if(!positive(weightKg)||!positive(mlPerKg))
      return failure('Nhập cân nặng và hệ số mL/kg hợp lệ, đều lớn hơn 0.');
    const valueMl=weightKg*mlPerKg;
    if(!Number.isFinite(valueMl))return failure('Giá trị EBV vượt phạm vi tính toán.');
    return {valueMl,weightKg,mlPerKg};
  }

  function allowableBloodLossSimple(ebvMl,hbInitial,hbMinimum){
    if(!positive(ebvMl)||!positive(hbInitial)||!positive(hbMinimum)||hbMinimum>hbInitial)
      return failure('Nhập EBV > 0, Hb ban đầu > 0 và 0 < Hb giới hạn ≤ Hb ban đầu.');
    return {valueMl:ebvMl*(hbInitial-hbMinimum)/hbInitial,method:'simple',
      initial:hbInitial,minimum:hbMinimum};
  }

  // Gross / acute normovolemic hemodilution (ANH) expression.
  // Results differ from the Hb(initial denominator) simplification.
  function allowableBloodLossGross(ebvMl,hctInitial,hctMinimum){
    if(!positive(ebvMl)||!positive(hctInitial)||!positive(hctMinimum)||
       hctInitial>100||hctMinimum>hctInitial)
      return failure('Nhập EBV > 0, Hct ban đầu trong (0–100]% và 0 < Hct giới hạn ≤ Hct ban đầu.');
    const avgHct=(hctInitial+hctMinimum)/2;
    return {valueMl:ebvMl*(hctInitial-hctMinimum)/avgHct,averageHct:avgHct,
      method:'gross',initial:hctInitial,minimum:hctMinimum};
  }

  function estimatedMeasuredLoss(suctionMl,irrigationMl,wetG,dryG,otherBloodMl=0){
    if(![suctionMl,irrigationMl,wetG,dryG,otherBloodMl].every(nonnegative))
      return failure('Thể tích dịch và trọng lượng gạc phải là số ≥ 0.');
    if(irrigationMl>suctionMl)
      return failure('Dịch rửa đã hút lớn hơn tổng dịch trong bình hút; hãy đối chiếu phép đo.');
    if(dryG>wetG)
      return failure('Trọng lượng gạc khô vượt trọng lượng gạc ướt; hãy kiểm tra lại số liệu.');
    const netSuctionMl=suctionMl-irrigationMl;
    const gauzeEstimateMl=wetG-dryG; // 1 g ~ 1 mL as gravimetric estimate
    const valueMl=netSuctionMl+gauzeEstimateMl+otherBloodMl;
    if(!Number.isFinite(valueMl))return failure('Kết quả vượt phạm vi tính toán.');
    return {valueMl,netSuctionMl,gauzeEstimateMl,otherBloodMl};
  }

  function percentOfEBV(lossMl,ebvMl){
    if(!nonnegative(lossMl)||!positive(ebvMl))
      return failure('Lượng mất phải ≥ 0 và EBV phải lớn hơn 0.');
    return {valuePct:lossMl/ebvMl*100};
  }

  function percentOfMABL(lossMl,mablMl){
    if(!nonnegative(lossMl)||!positive(mablMl))
      return failure('MABL phải lớn hơn 0 và lượng máu mất không âm.');
    return {valuePct:lossMl/mablMl*100};
  }

  function bloodLossRate(deltaBloodMl,minutes){
    if(!nonnegative(deltaBloodMl)||!positive(minutes))
      return failure('Nhập lượng máu mất thêm ≥ 0 và khoảng thời gian > 0 phút.');
    return {valueMlHour:deltaBloodMl*60/minutes};
  }

  function adultRBCIllustration(currentHb,targetHb,isStableAdult){
    if(isStableAdult!==true)
      return failure('Chỉ hiển thị ước tính kinh nghiệm khi xác nhận: người trưởng thành ổn định, không chảy máu tiếp.');
    if(!positive(currentHb)||!positive(targetHb)||targetHb<currentHb)
      return failure('Nhập Hb hiện tại > 0 và Hb mục tiêu ≥ Hb hiện tại.');
    const gapGdL=targetHb-currentHb;
    return {hbGapGdL:gapGdL,equivalentUnits:gapGdL,assumptionHbRisePerUnit:1};
  }

  function fluidRatioExamples(lossMl){
    if(!nonnegative(lossMl))
      return failure('Nhập lượng mất máu ≥ 0 để xem phép nhân minh họa.');
    return {ratio1_5Ml:lossMl*1.5,ratio3Ml:lossMl*3,
      note:'So sánh toán học 1,5:1 và 3:1, KHÔNG phải lượng dịch phải truyền.'};
  }

  const api={EBV_GROUPS,findGroup,estimatedBloodVolume,allowableBloodLossSimple,
    allowableBloodLossGross,estimatedMeasuredLoss,percentOfEBV,percentOfMABL,
    bloodLossRate,adultRBCIllustration,fluidRatioExamples};
  root.AnesCalcBlood=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
