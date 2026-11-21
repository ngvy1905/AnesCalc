/* Circuit wash-in — educational one-compartment well-mixed circle model.
 * FGF and effective gas volume govern the time constant tau = V / FGF.
 * Does NOT estimate patient end-tidal concentration, anesthetic uptake, leak,
 * adsorption, vaporizer response, or a real device's measured wash-in time.
 * Named presets quote experimental machine+1.2L circuit configurations,
 * NOT guaranteed specifications for every installation.
 */
(function(root){
 'use strict';

 const PRESETS=Object.freeze([
   {key:'circle-standard',name:'Circle người lớn tiêu chuẩn (minh họa)',volumeL:5,kind:'illustrative',
    note:'5 L là giá trị minh họa trong khoảng 4–6 L thường được nêu cho hệ thống vòng người lớn. Không đại diện cho một máy cụ thể.'},
   {key:'primus-study',name:'Dräger Primus — cấu hình nghiên cứu',volumeL:5.9,kind:'study',
    note:'5,9 L = 4,7 L trong máy + 1,2 L bộ dây trong nghiên cứu Shin và cộng sự (2017).'},
   {key:'perseus-study',name:'Dräger Perseus — cấu hình nghiên cứu',volumeL:3.3,kind:'study',
    note:'3,3 L = 2,1 L trong máy + 1,2 L bộ dây trong nghiên cứu Shin và cộng sự (2017).'},
   {key:'zeus-fresh-study',name:'Dräger Zeus — chế độ fresh-gas (nghiên cứu)',volumeL:3.2,kind:'study',
    note:'3,2 L = 2,0 L trong máy + 1,2 L bộ dây của nghiên cứu. Không dùng để mô phỏng chế độ auto/DIVA.'},
   {key:'circle-compact',name:'Circle thể tích thấp (minh họa)',volumeL:3,kind:'illustrative',
    note:'3 L chỉ là tình huống luyện tập, không phải thể tích mặc định của một model máy.'},
   {key:'custom',name:'Tự nhập thể tích hệ thống',volumeL:5,kind:'custom',
    note:'Đo/tra thể tích khí hữu hiệu theo máy, bộ dây, bình hấp thu CO₂, túi dự trữ và cấu hình thực tế. Giá trị 5 L khởi tạo chỉ là ví dụ.'}
 ]);

 const positive=n=>typeof n==='number'&&Number.isFinite(n)&&n>0;
 const nonnegative=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0;
 const getPreset=id=>PRESETS.find(p=>p.key===id)||null;

 function fractionReached(tMin,tauMin){
   if(!nonnegative(tMin)||!positive(tauMin))return null;
   return -Math.expm1(-tMin/tauMin);
 }

 function concentrationAt(tMin,tauMin,initialPct,inletPct){
   if(!nonnegative(tMin)||!positive(tauMin)||!nonnegative(initialPct)||
      !nonnegative(inletPct)||initialPct>100||inletPct>100)return null;
   return inletPct+(initialPct-inletPct)*Math.exp(-tMin/tauMin);
 }

 function computeWashIn(volumeL,fgfLMin,initialPct,inletPct,targetPct){
   if(!positive(volumeL)||!positive(fgfLMin))
     return {error:'Thể tích khí trong hệ thống và FGF phải lớn hơn 0.'};
   if(![initialPct,inletPct,targetPct].every(nonnegative)||
      initialPct>100||inletPct>100||targetPct>100)
     return {error:'Các nồng độ phải nằm trong khoảng 0–100%.'};
   if(inletPct<=initialPct)
     return {error:'Wash-in cần nồng độ khí mới cao hơn nồng độ ban đầu. Công cụ này chưa tính wash-out.'};
   if(targetPct<initialPct)
     return {error:'Nồng độ mục tiêu phải nằm giữa nồng độ ban đầu và nồng độ khí mới.'};
   if(targetPct>=inletPct)
     return {error:'Mô hình chỉ tiến gần nồng độ khí mới theo tiệm cận; không đạt chính xác mức bằng hoặc cao hơn nồng độ khí mới trong thời gian hữu hạn.'};
   const tauMin=volumeL/fgfLMin;
   const fraction=(targetPct-initialPct)/(inletPct-initialPct);
   const targetTimeMin=-tauMin*Math.log1p(-fraction);
   const time50Min=tauMin*Math.LN2;
   const time90Min=tauMin*Math.LN10;
   const time95Min=-tauMin*Math.log(0.05);
   const time99Min=-tauMin*Math.log(0.01);
   const time63Min=tauMin;
   if(![tauMin,targetTimeMin,time50Min,time90Min,time95Min,time99Min].every(Number.isFinite))
     return {error:'Dữ liệu tạo ra kết quả vượt phạm vi tính toán; hãy kiểm tra lại.'};
   return {tauMin,targetTimeMin,fraction,time50Min,time63Min,time90Min,time95Min,time99Min,
     volumeL,fgfLMin,initialPct,inletPct,targetPct};
 }

 const api={PRESETS,getPreset,fractionReached,concentrationAt,computeWashIn};
 root.AnesCalcWashIn=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
