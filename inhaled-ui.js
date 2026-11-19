(function(){
  'use strict';
  const core=window.AnesCalcInhaled;
  const el=id=>document.getElementById(id);
  if(!core||!el('vapAgent'))return;

  const format=(v,digits=2)=>Number.isFinite(v)?
    new Intl.NumberFormat('vi-VN',{maximumFractionDigits:digits}).format(v):'—';
  const number=id=>{
    const raw=el(id).value.trim().replace(',','.');
    return raw===''?NaN:Number(raw);
  };
  const show=(id,value)=>{el(id).textContent=value;};

  function renderTable(){
    const rows=core.AGENTS.map(a=>{
      const note=!a.chamber?(a.key==='nitrous'?'Khí ở điều kiện thường; không dùng công thức buồng bốc hơi':'Bình bốc hơi chuyên dụng; không dùng công thức chia dòng thông thường'):'Dùng trong mô hình tính buồng bốc hơi';
      return '<tr><th scope="row">'+a.name+'</th><td>'+format(a.bloodGas,2)+'</td><td>'+format(a.svp,0)+'</td><td>'+format(a.mac,2)+'</td><td>'+note+'</td></tr>';
    });
    el('vapReferenceBody').innerHTML=rows.join('');
  }

  function renderChamber(){
    const agent=core.findAgent(el('vapAgent').value);
    const pressure=number('vapPressure');
    const fgf=number('vapFgf');
    const carrier=number('vapCarrier');
    show('vapSelectedSvp',agent?format(agent.svp,0)+' mmHg':'—');
    const res=core.saturatedChamber(agent?.key,pressure,fgf,carrier);
    for(const id of ['vapRatio','vapGenerated','vapPercent','vapSaturated','vapTotalFlow']){
      show(id,'—');
    }
    if(res.error){
      show('vapResultMessage',res.error);
      el('vapResultMessage').classList.add('vap-error');
      return;
    }
    el('vapResultMessage').classList.remove('vap-error');
    show('vapRatio',format(res.ratio,4));
    show('vapGenerated',format(res.agentVaporMlMin,2)+' mL/phút');
    show('vapPercent',format(res.outputPct,2)+'%');
    show('vapSaturated',format(res.saturatedPct,2)+'%');
    show('vapTotalFlow',format(res.totalGasMlMin,2)+' mL/phút');
    const nom = res.agent.key==='sevoflurane'&&pressure===760&&fgf===3&&carrier===200
      ? ' Ví dụ trong ảnh làm tròn tỷ lệ thành 1/4 nên cho khoảng 1,6%; tính chính xác là '+format(res.outputPct,2)+'%.'
      : '';
    show('vapResultMessage','Mô hình lý thuyết ở 20°C, giả định buồng bốc hơi hoàn toàn bão hòa và các dòng khí đo cùng điều kiện nhiệt độ/áp suất. Không phải nồng độ đo tại bệnh nhân.'+nom);
  }

  function renderAltitude(){
    const res=core.desfluraneAltitude(number('desDesired'),number('desPressure'));
    show('desEquivalent',res.error?'—':format(res.equivalentPct,2)+'%');
    show('desFactor',res.error?'—':format(res.factor,3)+'×');
    show('desPartial',res.error?'—':format(res.referencePartialMmHg,2)+' mmHg');
    show('desMessage',res.error||'Đây chỉ là phép quy đổi tương đương áp suất riêng phần theo ví dụ Tec 6. Phải theo hướng dẫn của đúng thiết bị và theo dõi nồng độ khí mê thực đo, không sử dụng làm chỉ định cài đặt.');
    el('desMessage').classList.toggle('vap-error',!!res.error);
  }

  ['vapAgent','vapPressure','vapFgf','vapCarrier'].forEach(id=>{
    el(id).addEventListener('input',renderChamber);
    el(id).addEventListener('change',renderChamber);
  });
  ['desDesired','desPressure'].forEach(id=>{
    el(id).addEventListener('input',renderAltitude);
    el(id).addEventListener('change',renderAltitude);
  });
  renderTable();renderChamber();renderAltitude();
})();
