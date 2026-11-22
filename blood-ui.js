(function(){
'use strict';
const core=window.AnesCalcBlood;
const get=id=>document.getElementById(id);
if(!core||!get('bloodGroup'))return;
const fmt=(n,d=1)=>Number.isFinite(n)?
 new Intl.NumberFormat('vi-VN',{maximumFractionDigits:d}).format(n):'—';
const read=id=>{
 const raw=get(id).value.trim().replace(',','.');
 return raw===''?NaN:Number(raw);
};
const put=(id,s)=>{get(id).textContent=s;};
const status=(id,message,error)=>{
 const el=get(id);
 el.textContent=message;
 el.classList.toggle('error',!!error);
};
let lastEBV=null;
let lastMABL=null;
let lastEBL=null;

function updateGroup(){
 const group=core.findGroup(get('bloodGroup').value);
 if(!group)return;
 get('bloodFactor').value=group.defaultFactor;
 put('bloodGroupHelp',group.key==='custom'
  ?'Tự nhập hệ số và xác minh nguồn. 70 mL/kg chỉ là giá trị minh họa khi chuyển sang chế độ này.'
  :'Khoảng tham khảo: '+group.low+'–'+group.high+
   ' mL/kg. Tự điền '+group.defaultFactor+' mL/kg; có thể sửa, không tự động xác định EBV thực tế.');
 renderPatient();
}

function renderPatient(){
 const weight=read('bloodWeight'),factor=read('bloodFactor');
 const ebv=core.estimatedBloodVolume(weight,factor);
 lastEBV=ebv.error?null:ebv.valueMl;
 put('bloodEBV',lastEBV===null?'—':fmt(lastEBV,0)+' mL');
 if(ebv.error)status('bloodPatientMsg',ebv.error,true);
 else status('bloodPatientMsg','EBV = '+fmt(weight)+' kg × '+fmt(factor)+' mL/kg. Đây là thể tích tuần hoàn ước tính, không phải phép đo trực tiếp.',false);

 let simple={error:'Chưa có EBV hợp lệ.'},gross={error:'Chưa có EBV hợp lệ.'};
 if(lastEBV!==null){
   simple=core.allowableBloodLossSimple(lastEBV,read('bloodHbInitial'),read('bloodHbMin'));
   gross=core.allowableBloodLossGross(lastEBV,read('bloodHctInitial'),read('bloodHctMin'));
 }
 lastMABL=simple.error?null:simple.valueMl;
 put('bloodMablSimple',simple.error?'—':fmt(simple.valueMl,0)+' mL');
 put('bloodMablGross',gross.error?'—':fmt(gross.valueMl,0)+' mL');
 const notes=[];
 if(simple.error)notes.push('Hb: '+simple.error);
 if(gross.error)notes.push('Hct: '+gross.error);
 status('bloodMablMsg',notes.length?notes.join(' '):
  'Hai công thức dùng mẫu số và giả định khác nhau; công thức Gross gắn với bối cảnh ANH, không thay thế phép đo Hb/Hct hoặc quyết định truyền máu.',!!notes.length);
 renderLoss();
}

function renderLoss(){
 const result=core.estimatedMeasuredLoss(read('bloodSuction'),read('bloodIrrigation'),
   read('bloodWet'),read('bloodDry'),read('bloodOther'));
 lastEBL=result.error?null:result.valueMl;
 put('bloodEBL',result.error?'—':fmt(result.valueMl,0)+' mL');
 put('bloodSuctionNet',result.error?'—':fmt(result.netSuctionMl,0)+' mL');
 put('bloodGauzeNet',result.error?'—':fmt(result.gauzeEstimateMl,0)+' mL');
 if(result.error)status('bloodEblMsg',result.error,true);
 else status('bloodEblMsg','Ước tính từ phép trừ dịch rửa và chênh lệch khối lượng gạc (1 g ≈ 1 mL máu). Kiểm tra máu đọng, dịch không phải máu và phần đã tính trùng.',false);

 const p=lastEBL!==null&&lastEBV!==null?core.percentOfEBV(lastEBL,lastEBV):null;
 put('bloodEblPercent',p&&!p.error?fmt(p.valuePct)+'%':'—');
 const m=lastEBL!==null&&lastMABL!==null?core.percentOfMABL(lastEBL,lastMABL):null;
 put('bloodMablFraction',m&&!m.error?fmt(m.valuePct)+'%':'—');
 if(lastEBL!==null){
  const fluid=core.fluidRatioExamples(lastEBL);
  put('bloodFluid15',fmt(fluid.ratio1_5Ml,0)+' mL');
  put('bloodFluid3',fmt(fluid.ratio3Ml,0)+' mL');
 }else{
  put('bloodFluid15','—');
  put('bloodFluid3','—');
 }
}

function renderRate(){
 const r=core.bloodLossRate(read('bloodRateDelta'),read('bloodRateMins'));
 put('bloodRateValue',r.error?'—':fmt(r.valueMlHour,0)+' mL/giờ');
 status('bloodRateMsg',r.error||'Tính từ lượng máu mất thêm và khoảng thời gian đã nhập. Không ngoại suy tuyến tính nếu tình trạng chảy máu thay đổi.',!!r.error);
}

function renderRBC(){
 const res=core.adultRBCIllustration(read('bloodHbNow'),read('bloodHbGoal'),get('bloodRbcStable').checked);
 put('bloodRbcUnits',res.error?'—':fmt(res.equivalentUnits,1)+' đơn vị tương đương');
 status('bloodRbcMsg',res.error||
  'Độ chênh Hb '+fmt(res.hbGapGdL,1)+' g/dL. Theo quy tắc kinh nghiệm 1 đơn vị ≈ +1 g/dL ở người lớn không chảy máu. Không làm tròn để ra lệnh truyền; phải đánh giá và xét nghiệm lại.',!!res.error);
}

get('bloodGroup').addEventListener('change',updateGroup);
get('bloodFactor').addEventListener('input',()=>{
 if(get('bloodGroup').value!=='custom'){
  get('bloodGroup').value='custom';
  put('bloodGroupHelp','Đã sửa hệ số thủ công. Hãy kiểm chứng hệ số mL/kg theo người bệnh; không sử dụng mặc định làm phép đo EBV.');
 }
 renderPatient();
});
['bloodWeight','bloodHbInitial','bloodHbMin','bloodHctInitial','bloodHctMin'].forEach(id=>{
 get(id).addEventListener('input',renderPatient);
});
['bloodSuction','bloodIrrigation','bloodWet','bloodDry','bloodOther'].forEach(id=>{
 get(id).addEventListener('input',renderLoss);
});
['bloodRateDelta','bloodRateMins'].forEach(id=>get(id).addEventListener('input',renderRate));
['bloodHbNow','bloodHbGoal'].forEach(id=>get(id).addEventListener('input',renderRBC));
get('bloodRbcStable').addEventListener('change',renderRBC);
updateGroup();
renderRate();
renderRBC();
})();
