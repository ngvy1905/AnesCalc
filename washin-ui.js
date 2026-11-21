(function(){
'use strict';
const api=window.AnesCalcWashIn;
const get=id=>document.getElementById(id);
if(!api||!get('washPreset'))return;

const format=(v,d=2)=>Number.isFinite(v)?new Intl.NumberFormat('vi-VN',{maximumFractionDigits:d}).format(v):'—';
const read=id=>{
  const s=get(id).value.trim().replace(',','.');
  return s===''?NaN:Number(s);
};
const put=(id,s)=>{get(id).textContent=s;};
const minutes=v=>{
  if(!Number.isFinite(v))return '—';
  if(v===0)return '0 giây';
  if(v<1)return format(v*60,1)+' giây';
  if(v<60)return format(v,2)+' phút';
  return format(v/60,2)+' giờ';
};

function choosePreset(){
  const p=api.getPreset(get('washPreset').value);
  if(!p)return;
  get('washVolume').value=p.volumeL;
  put('washPresetInfo',p.note+(p.kind==='study'?' Đây là cấu hình thí nghiệm năm 2017, không phải thông số cố định của mọi máy.':''));
  render();
}

function renderChart(result){
  const svg=get('washChart');
  if(!result){
    svg.innerHTML='<text x="30" y="90" font-size="16" fill="#7892a0">Nhập dữ liệu hợp lệ để xem đồ thị.</text>';
    return;
  }
  const W=740,H=295,l=57,r=25,t=21,b=49;
  const pw=W-l-r,ph=H-t-b;
  const tmax=Math.max(result.time99Min,result.targetTimeMin*1.15,0.1);
  const ymax=Math.max(result.inletPct,0.1);
  const xs=x=>l+pw*x/tmax;
  const ys=y=>t+ph*(1-y/ymax);
  const curves=[];
  for(let k=0;k<=100;k++){
    const time=tmax*k/100;
    const conc=api.concentrationAt(time,result.tauMin,result.initialPct,result.inletPct);
    curves.push((k?'L':'M')+xs(time).toFixed(2)+' '+ys(conc).toFixed(2));
  }
  const grid=[];
  for(let i=0;i<=4;i++){
    const frac=i/4,y=ys(ymax*frac);
    grid.push('<line x1="'+l+'" y1="'+y.toFixed(2)+'" x2="'+(W-r)+'" y2="'+y.toFixed(2)+'" stroke="#e8eff1"/>');
    grid.push('<text x="'+(l-8)+'" y="'+(y+4).toFixed(2)+'" text-anchor="end" fill="#6b8290" font-size="12">'+format(ymax*frac,2)+'%</text>');
    const time=tmax*frac,x=xs(time);
    grid.push('<line x1="'+x.toFixed(2)+'" y1="'+t+'" x2="'+x.toFixed(2)+'" y2="'+(H-b)+'" stroke="#f1f5f6"/>');
    grid.push('<text x="'+x.toFixed(2)+'" y="'+(H-b+21)+'" text-anchor="middle" fill="#6b8290" font-size="12">'+format(time,2)+'</text>');
  }
  const tx=xs(result.targetTimeMin),ty=ys(result.targetPct);
  const doc='<title>Wash-in: nồng độ khí trong circuit theo thời gian với giả định trộn đều</title>'+
    '<desc>Đường màu xanh tăng dần từ nồng độ ban đầu đến gần nồng độ khí vào. Điểm màu cam là nồng độ mục tiêu và thời điểm tính toán.</desc>'+
    grid.join('')+
    '<path d="'+curves.join(' ')+'" fill="none" stroke="#178b7e" stroke-width="3.2" stroke-linecap="round"/>'+
    '<line x1="'+l+'" y1="'+ty.toFixed(2)+'" x2="'+tx.toFixed(2)+'" y2="'+ty.toFixed(2)+'" stroke="#c37e39" stroke-width="1.5" stroke-dasharray="6 5"/>'+
    '<line x1="'+tx.toFixed(2)+'" y1="'+ty.toFixed(2)+'" x2="'+tx.toFixed(2)+'" y2="'+(H-b)+'" stroke="#c37e39" stroke-width="1.5" stroke-dasharray="6 5"/>'+
    '<circle cx="'+tx.toFixed(2)+'" cy="'+ty.toFixed(2)+'" r="5" fill="#c37e39" stroke="#fff" stroke-width="2"/>'+
    '<text x="'+(l+pw/2)+'" y="'+(H-6)+'" text-anchor="middle" fill="#607887" font-size="12">Thời gian (phút)</text>'+
    '<text x="'+(l+9)+'" y="'+(t-5)+'" fill="#708799" font-size="11">Nồng độ (%)</text>';
  svg.innerHTML=doc;
}

function render(){
  const out=api.computeWashIn(read('washVolume'),read('washFgf'),
    read('washInitial'),read('washInlet'),read('washTarget'));
  if(out.error){
    for(const id of ['washTargetTime','washTau','washT90','washT95','washT99','washProgress'])put(id,'—');
    put('washResultMessage',out.error);
    get('washResultMessage').classList.add('wash-error');
    renderChart(null);
    return;
  }
  get('washResultMessage').classList.remove('wash-error');
  put('washTargetTime',minutes(out.targetTimeMin));
  put('washTau',minutes(out.tauMin));
  put('washT90',minutes(out.time90Min));
  put('washT95',minutes(out.time95Min));
  put('washT99',minutes(out.time99Min));
  put('washProgress',format(out.fraction*100,1)+'%');
  put('washResultMessage',
    'Ước tính hệ vòng lý tưởng: từ '+format(out.initialPct)+'% lên '+format(out.targetPct)+
    '% với khí vào '+format(out.inletPct)+'%, FGF '+format(out.fgfLMin)+
    ' L/phút, thể tích '+format(out.volumeL)+' L. Không tính hấp thu ở bệnh nhân, tái hít, rò khí hoặc đặc điểm riêng của máy.');
  renderChart(out);
}

get('washPreset').addEventListener('change',choosePreset);
get('washVolume').addEventListener('input',()=>{
  if(get('washPreset').value!=='custom'){
    get('washPreset').value='custom';
    put('washPresetInfo','Bạn đã chỉnh thể tích thủ công. Kiểm tra giá trị theo cấu hình máy và bộ dây thực tế; không dùng mặc định làm thông số hiệu chuẩn.');
  }
  render();
});
['washFgf','washInitial','washInlet','washTarget'].forEach(id=>{
  get(id).addEventListener('input',render);
  get(id).addEventListener('change',render);
});
document.querySelectorAll('[data-wash-fgf]').forEach(btn=>btn.addEventListener('click',()=>{
  get('washFgf').value=btn.getAttribute('data-wash-fgf');
  render();
}));
choosePreset();
})();
