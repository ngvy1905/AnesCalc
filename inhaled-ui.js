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
      return '<tr><th scope="row">'+a.name+'</th><td>'+format(a.bloodGas,2)+'</td><td>'+format(a.oilGas,2)+'</td><td>'+format(a.svp,0)+'</td><td>'+format(a.mac,2)+'%</td><td>'+note+'</td></tr>';
    });
    el('vapReferenceBody').innerHTML=rows.join('');
  }

  function renderChamber(){
    const agent=core.findAgent(el('vapAgent').value);
    const pressure=number('vapPressure');
    const fgf=number('vapFgf');
    const mode=el('vapMode').value;
    el('vapTargetField').hidden=mode!=='target';
    el('vapFlowField').hidden=mode!=='flow';
    show('vapSelectedSvp',agent?format(agent.svp,0)+' mmHg':'—');

    const res=mode==='target'
      ?core.chamberForTarget(agent?.key,pressure,fgf,number('vapDesired'))
      :core.saturatedChamber(agent?.key,pressure,fgf,number('vapCarrier'));
    for(const id of ['vapRatio','vapGenerated','vapPercent','vapSaturated','vapTotalFlow',
                      'vapChamber','vapBypass','vapSplit'])show(id,'—');
    if(res.error){
      show('vapResultMessage',res.error);
      el('vapResultMessage').classList.add('vap-error');
      return;
    }
    el('vapResultMessage').classList.remove('vap-error');
    show('vapRatio',format(res.ratio,4));
    show('vapGenerated',format(res.agentVaporMlMin,2)+' mL/phút');
    show('vapPercent',format(res.outputPct,2)+'%');
    show('vapChamber',format(res.carrierMlMin,2)+' mL/phút');
    show('vapBypass',format(res.bypassMlMin,2)+' mL/phút');
    show('vapSplit',format(res.splitRatio,2)+' : 1');
    show('vapSaturated',format(res.saturatedPct,2)+'%');
    show('vapTotalFlow',format(res.totalGasMlMin,2)+' mL/phút');

    let note=mode==='target'
      ?'Từ nồng độ lý thuyết đã nhập, tính ngược lưu lượng qua buồng; bạn có thể chuyển sang chế độ kia để kiểm tra.'
      :'Từ lưu lượng qua buồng, tính lượng hơi sinh ra rồi tính nồng độ lý thuyết sau khi trộn khí.';
    note+=' Đây chỉ là mô hình khí lý tưởng tại 20°C; không phản ánh nồng độ đo, không dùng để cài đặt bình bốc hơi thực.';
    if(agent?.key==='sevoflurane'&&pressure===760&&fgf===2&&mode==='target'&&number('vapDesired')===2)
      note+=' Ví dụ trong hình làm tròn thành 150 mL/phút qua buồng, 1850 mL/phút bypass và 40 mL/phút hơi thuốc (≈ 2%).';
    if(agent?.key==='sevoflurane'&&pressure===760&&fgf===3&&mode==='flow'&&number('vapCarrier')===200)
      note+=' Bài giảng cũ làm tròn tỷ số thành 1/4 nên cho ước lượng 1,6%; phép tính không làm tròn cho khoảng 1,75%.';
    show('vapResultMessage',note);
  }

  function renderAltitude(){
    const res=core.desfluraneAltitude(number('desDesired'),number('desPressure'));
    show('desEquivalent',res.error?'—':format(res.equivalentPct,2)+'%');
    show('desFactor',res.error?'—':format(res.factor,3)+'×');
    show('desPartial',res.error?'—':format(res.referencePartialMmHg,2)+' mmHg');
    show('desMessage',res.error||'Đây chỉ là phép quy đổi tương đương áp suất riêng phần theo ví dụ Tec 6. Phải theo hướng dẫn của đúng thiết bị và theo dõi nồng độ khí mê thực đo, không sử dụng làm chỉ định cài đặt.');
    el('desMessage').classList.toggle('vap-error',!!res.error);
  }

  ['vapMode','vapAgent','vapPressure','vapFgf','vapCarrier','vapDesired'].forEach(id=>{
    el(id).addEventListener('input',renderChamber);
    el(id).addEventListener('change',renderChamber);
  });
  ['desDesired','desPressure'].forEach(id=>{
    el(id).addEventListener('input',renderAltitude);
    el(id).addEventListener('change',renderAltitude);
  });
  renderTable();renderChamber();renderAltitude();
})();
