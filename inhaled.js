/* AnesCalc — educational inhaled anesthetics calculations.
   Data transcribed from user's teaching slides. All SVP at 20°C.
   Calculated output is a theoretical fully saturated chamber model,
   NOT patient end-tidal concentration, clinical dose or actual vaporizer output. */
(function(root){
  'use strict';

  // Bảng mới: bloodGas, oilGas, mac. SVP giữ theo bảng cũ (20°C).
  const AGENTS = Object.freeze([
    {key:'halothane', name:'Halothane', bloodGas:2.5, oilGas:197, svp:244, mac:0.75, chamber:true},
    {key:'enflurane', name:'Enflurane', bloodGas:1.9, oilGas:98.5, svp:172, mac:1.7, chamber:true},
    {key:'isoflurane', name:'Isoflurane', bloodGas:1.4, oilGas:90.8, svp:240, mac:1.2, chamber:true},
    {key:'sevoflurane', name:'Sevoflurane', bloodGas:0.65, oilGas:50, svp:160, mac:2.0, chamber:true},
    {key:'nitrous', name:'Nitrous oxide (N₂O)', bloodGas:0.47, oilGas:1.3, svp:38770, mac:104, chamber:false},
    {key:'desflurane', name:'Desflurane', bloodGas:0.45, oilGas:19, svp:669, mac:6, chamber:false}
  ]);
  const positive = x => typeof x === 'number' && Number.isFinite(x) && x > 0;
  function findAgent(key){return AGENTS.find(a=>a.key===key)||null;}

  function saturatedChamber(agentKey, pressureMmHg, freshGasLMin, carrierMlMin){
    const agent=findAgent(agentKey);
    if(!agent) return {error:'Chưa chọn thuốc mê hợp lệ.'};
    if(!agent.chamber) return {error:'Mô hình buồng bốc hơi này không áp dụng cho Nitrous oxide hoặc bình Desflurane chuyên dụng.'};
    if(!positive(pressureMmHg)||!positive(freshGasLMin)||!positive(carrierMlMin))
      return {error:'Áp suất, FGF và lưu lượng qua buồng bốc hơi phải lớn hơn 0.'};
    if(pressureMmHg<=agent.svp)
      return {error:'Áp suất tổng phải lớn hơn SVP để áp dụng mô hình hơi bão hòa.'};
    const freshGasMlMin=freshGasLMin*1000;
    if(carrierMlMin>freshGasMlMin)
      return {error:'Lưu lượng qua buồng bốc hơi không được vượt tổng lưu lượng khí mới (FGF).'};
    const ratio=agent.svp/(pressureMmHg-agent.svp);
    const agentVaporMlMin=ratio*carrierMlMin;
    const outputPct=100*agentVaporMlMin/(freshGasMlMin+agentVaporMlMin);
    const saturatedPct=100*agent.svp/pressureMmHg;
    if(![ratio,agentVaporMlMin,outputPct,saturatedPct].every(Number.isFinite))
      return {error:'Thông số tạo ra kết quả không hữu hạn. Hãy kiểm tra lại đầu vào.'};
    return {agent,ratio,agentVaporMlMin,outputPct,saturatedPct,freshGasMlMin,
      totalGasMlMin:freshGasMlMin+agentVaporMlMin,bypassMlMin:freshGasMlMin-carrierMlMin,
      carrierMlMin,splitRatio:(freshGasMlMin-carrierMlMin)/carrierMlMin};
  }


  /* Algebraic inverse of saturatedChamber:
     C = VA/(FGF+VA), VA = Fch*Pv/(P-Pv)
     => Fch = FGF*C*(P-Pv)/(Pv*(1-C)); C is a fraction (2%=0.02).
     FGF/Fch/VA must use the same standard conditions and flow units. */
  function chamberForTarget(agentKey, pressureMmHg, freshGasLMin, desiredPct){
    const agent=findAgent(agentKey);
    if(!agent) return {error:'Chưa chọn thuốc mê hợp lệ.'};
    if(!agent.chamber) return {error:'Mô hình buồng bốc hơi này không áp dụng cho Nitrous oxide hoặc bình Desflurane chuyên dụng.'};
    if(!positive(pressureMmHg)||!positive(freshGasLMin))
      return {error:'Áp suất tổng và FGF phải lớn hơn 0.'};
    if(pressureMmHg<=agent.svp)
      return {error:'Áp suất tổng phải lớn hơn SVP để áp dụng mô hình hơi bão hòa.'};
    if(!positive(desiredPct)||desiredPct>=100)
      return {error:'Nồng độ mục tiêu lý thuyết phải lớn hơn 0% và nhỏ hơn 100%.'};
    const saturatedPct=100*agent.svp/pressureMmHg;
    if(desiredPct>saturatedPct+1e-10)
      return {error:'Nồng độ yêu cầu cao hơn nồng độ bão hòa ('+saturatedPct.toFixed(2)+'%) tại áp suất đang nhập; không thể tạo ra bằng cách chia dòng trong mô hình này.'};
    const C=desiredPct/100;
    const totalFreshMlMin=freshGasLMin*1000;
    let carrierMlMin=totalFreshMlMin*C*(pressureMmHg-agent.svp)/(agent.svp*(1-C));
    if(!Number.isFinite(carrierMlMin)||carrierMlMin<=0||carrierMlMin>totalFreshMlMin*(1+1e-10))
      return {error:'Không thể tính lưu lượng qua buồng hợp lệ từ các thông số này.'};
    carrierMlMin=Math.min(carrierMlMin,totalFreshMlMin);
    const result=saturatedChamber(agentKey,pressureMmHg,freshGasLMin,carrierMlMin);
    if(result.error)return result;
    return {...result,desiredPct};
  }

  /* Partial-pressure equivalence ONLY for a suitable desflurane Tec 6-style
     device under the altitude assumptions of the user's teaching slide.
     Never infer a clinical dial instruction or a measured end-tidal value. */
  function desfluraneAltitude(desiredSeaLevelPct, ambientMmHg){
    if(!positive(desiredSeaLevelPct)||desiredSeaLevelPct>=100||!positive(ambientMmHg))
      return {error:'Nhập nồng độ tham chiếu (0–100%) và áp suất khí quyển (mmHg) hợp lệ.'};
    const equivalentPct=desiredSeaLevelPct*760/ambientMmHg;
    if(!Number.isFinite(equivalentPct)||equivalentPct>=100)
      return {error:'Giá trị quy đổi đạt hoặc vượt 100%, không có ý nghĩa vật lý. Hãy kiểm tra đầu vào.'};
    return {equivalentPct, referencePartialMmHg:desiredSeaLevelPct/100*760,
      ambientPartialMmHg:equivalentPct/100*ambientMmHg, factor:760/ambientMmHg};
  }

  const api={AGENTS,findAgent,saturatedChamber,chamberForTarget,desfluraneAltitude};
  root.AnesCalcInhaled=api;
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
