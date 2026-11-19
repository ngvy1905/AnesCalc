/* Đơn vị nội bộ: microgam (mcg); chuẩn hóa trước khi chia. */
(function(root){
  'use strict';
  function validPositive(x){ return typeof x === 'number' && Number.isFinite(x) && x > 0; }
  function validNonnegative(x){ return typeof x === 'number' && Number.isFinite(x) && x >= 0; }
  function massToMcg(amount, unit){
    if(!validNonnegative(amount)) return NaN;
    if(unit === 'mg') return amount * 1000;
    if(unit === 'mcg') return amount;
    return NaN;
  }
  function bolus(weight, perKg, unit, conc, concUnit){
    if(![weight,perKg,conc].every(validPositive)) return null;
    const totalMcg = massToMcg(weight * perKg, unit === 'mg/kg' ? 'mg' : unit === 'mcg/kg' ? 'mcg' : '');
    const concMcg = massToMcg(conc, concUnit === 'mg/mL' ? 'mg' : concUnit === 'mcg/mL' ? 'mcg' : '');
    if(!validPositive(totalMcg) || !validPositive(concMcg)) return null;
    return {totalMcg, totalMg: totalMcg / 1000, volumeMl: totalMcg / concMcg};
  }
  function doseMcgPerHour(dose, rateUnit, weight){
    if(!validPositive(dose)) return NaN;
    switch(rateUnit){
      case 'mcg/kg/min': return validPositive(weight) ? dose * weight * 60 : NaN;
      case 'mcg/kg/h': return validPositive(weight) ? dose * weight : NaN;
      case 'mg/kg/h': return validPositive(weight) ? dose * weight * 1000 : NaN;
      case 'mcg/min': return dose * 60;
      case 'mg/h': return dose * 1000;
      default: return NaN;
    }
  }
  function infusion(amount, amountUnit, finalVolume, dose, rateUnit, weight){
    if(!validPositive(amount) || !validPositive(finalVolume)) return null;
    const totalMcg = massToMcg(amount, amountUnit);
    const hourlyMcg = doseMcgPerHour(dose,rateUnit,weight);
    if(!validPositive(totalMcg) || !validPositive(hourlyMcg)) return null;
    const concMcgPerMl = totalMcg/finalVolume;
    const mlPerHour = hourlyMcg / concMcgPerMl;
    if(!validPositive(mlPerHour) || !Number.isFinite(mlPerHour)) return null;
    return {mlPerHour, concMcgPerMl, hourlyMcg};
  }
  function reverseInfusion(amount, amountUnit, finalVolume, pumpMlPerHour, weight){
    if(![amount,finalVolume,weight].every(validPositive) || !validNonnegative(pumpMlPerHour)) return null;
    const total = massToMcg(amount, amountUnit);
    if(!validPositive(total)) return null;
    return pumpMlPerHour * (total / finalVolume) / (weight * 60);
  }
  function mixing(amountMg, stockMgPerMl, finalMl){
    if(![amountMg,stockMgPerMl,finalMl].every(validPositive)) return null;
    const stockMl = amountMg / stockMgPerMl;
    if(stockMl > finalMl) return {error:'Thể tích dung dịch gốc lớn hơn thể tích cuối; không thể pha loãng theo thông số này.'};
    return {stockMl,diluentMl:finalMl-stockMl,finalMgPerMl:amountMg/finalMl};
  }
  function vitals(weight,heightCm,sbp,dbp,hr){
    const bmi = validPositive(weight) && validPositive(heightCm) ? weight/Math.pow(heightCm/100,2) : null;
    const invalidBp = validPositive(sbp) && validPositive(dbp) && dbp > sbp;
    const map = validPositive(sbp) && validPositive(dbp) && !invalidBp ? (sbp+2*dbp)/3 : null;
    const shock = validPositive(hr) && validPositive(sbp) ? hr/sbp : null;
    return {bmi,map,shock,invalidBp};
  }
  const api = {validPositive,validNonnegative,massToMcg,bolus,doseMcgPerHour,infusion,reverseInfusion,mixing,vitals};
  root.AnesCalcCore=api;
  if(typeof module !== 'undefined' && module.exports) module.exports=api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
