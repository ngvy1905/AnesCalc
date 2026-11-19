(function(){
'use strict';
const core=window.AnesCalcCore;
const $=id=>document.getElementById(id);
const n=id=>{const raw=$(id).value.trim().replace(',','.'); return raw===''?NaN:Number(raw);};
const fmt=(x,max=3)=>Number.isFinite(x)?new Intl.NumberFormat('vi-VN',{maximumFractionDigits:max}).format(x):'—';
const pageLabels={home:'Tổng quan',bolus:'Tính liều thuốc',infusion:'Tốc độ truyền',mixing:'Pha thuốc',physiology:'Chỉ số sinh lý',inhaled:'Thuốc mê hô hấp',drugs:'Thư viện thuốc'};
function goto(page){
 if(!pageLabels[page]) return;
 document.querySelectorAll('.page').forEach(p=>p.classList.toggle('visible',p.id==='page-'+page));
 document.querySelectorAll('[data-page]').forEach(b=>{const active=b.dataset.page===page;b.classList.toggle('active',active); if(b.classList.contains('nav-link')) b.setAttribute('aria-current',active?'page':'false');});
 $('currentPageLabel').textContent=pageLabels[page];
 window.scrollTo({top:0,behavior:'instant'});
}
document.querySelectorAll('[data-page]').forEach(x=>x.addEventListener('click',()=>goto(x.dataset.page)));
document.querySelectorAll('[data-goto]').forEach(x=>x.addEventListener('click',()=>goto(x.dataset.goto)));

function renderBolus(){
 const dose=n('bolusDose'),weight=n('bolusWeight'),conc=n('bolusConcentration');
 const unit=$('bolusDoseUnit').value,cunit=$('bolusConcentrationUnit').value;
 const out=core.bolus(weight,dose,unit,conc,cunit);
 if(!out){$('bolusResult').textContent='—';$('bolusResultUnit').textContent='Tổng lượng thuốc';$('bolusVolume').textContent='— mL';$('bolusConverted').textContent='—';$('bolusMessage').textContent='Nhập cân nặng, liều dương và nồng độ thuốc dương để tính.';return;}
 $('bolusResult').textContent=fmt(unit==='mg/kg'?out.totalMg:out.totalMcg,4);
 $('bolusResultUnit').textContent=unit==='mg/kg'?'mg tổng liều':'mcg tổng liều';
 $('bolusVolume').textContent=fmt(out.volumeMl,4)+' mL';
 $('bolusConverted').textContent=fmt(out.totalMg,4)+' mg = '+fmt(out.totalMcg,3)+' mcg';
 $('bolusMessage').textContent='Kết quả toán học. Chưa kiểm tra tính phù hợp lâm sàng của liều đã nhập.';
}
['bolusWeight','bolusDose','bolusDoseUnit','bolusConcentration','bolusConcentrationUnit'].forEach(id=>$(id).addEventListener('input',renderBolus));
$('bolusDrug').addEventListener('change',()=>{
 const drug=$('bolusDrug').value;
 const micro=drug==='fentanyl';
 if(drug && drug!=='custom'){
  $('bolusDoseUnit').value=micro?'mcg/kg':'mg/kg';
  $('bolusConcentrationUnit').value=micro?'mcg/mL':'mg/mL';
 }
 renderBolus();
});
$('bolusForm').addEventListener('reset',()=>setTimeout(renderBolus,0));

function renderInfusion(){
 const amount=n('infusionAmount'),volume=n('infusionVolume'),dose=n('infusionDose'),weight=n('infusionWeight');
 const amountUnit=$('infusionAmountUnit').value, rateUnit=$('infusionRateUnit').value;
 const out=core.infusion(amount,amountUnit,volume,dose,rateUnit,weight);
 if(!out){$('infusionResult').textContent='—';$('infusionConcentration').textContent='—';$('infusionHourly').textContent='—';$('infusionMessage').textContent='Nhập lượng thuốc, thể tích, tốc độ liều và cân nặng nếu đơn vị có “/kg”.';}
 else {
  $('infusionResult').textContent=fmt(out.mlPerHour,4);
  $('infusionConcentration').textContent=fmt(out.concMcgPerMl,4)+' mcg/mL ('+fmt(out.concMcgPerMl/1000,6)+' mg/mL)';
  $('infusionHourly').textContent=fmt(out.hourlyMcg,3)+' mcg/giờ';
  $('infusionMessage').textContent='Kiểm tra nhãn nồng độ và đơn vị kê đơn trước khi cài bơm.';
 }
 const reverse=core.reverseInfusion(amount,amountUnit,volume,n('reverseRate'),weight);
 $('reverseResult').textContent=reverse===null?'—':fmt(reverse,5);
}
['infusionAmount','infusionAmountUnit','infusionVolume','infusionWeight','infusionDose','infusionRateUnit','reverseRate'].forEach(id=>$(id).addEventListener('input',renderInfusion));
$('infusionForm').addEventListener('reset',()=>setTimeout(renderInfusion,0));

function renderMixing(){
 const out=core.mixing(n('mixingAmount'),n('mixingStock'),n('mixingFinal'));
 if(!out||out.error){$('mixingResult').textContent='—';$('mixingDiluent').textContent='— mL';$('mixingConcentration').textContent='—';$('mixingMessage').textContent=out?.error || 'Nhập lượng thuốc, nồng độ gốc và thể tích cuối cùng (đều lớn hơn 0).';return;}
 $('mixingResult').textContent=fmt(out.stockMl,4);$('mixingDiluent').textContent=fmt(out.diluentMl,4)+' mL';$('mixingConcentration').textContent=fmt(out.finalMgPerMl,5)+' mg/mL';$('mixingMessage').textContent='Chỉ là phép tính thể tích; xác minh dung môi tương thích và quy trình pha thực tế.';
}
['mixingAmount','mixingStock','mixingFinal'].forEach(id=>$(id).addEventListener('input',renderMixing));
$('mixingForm').addEventListener('reset',()=>setTimeout(renderMixing,0));
function renderPhys(){const v=core.vitals(n('physWeight'),n('physHeight'),n('physSbp'),n('physDbp'),n('physHr'));
 $('physBmi').textContent=v.bmi===null?'—':fmt(v.bmi,2);$('physMap').textContent=v.map===null?'—':fmt(v.map,1);$('physShock').textContent=v.shock===null?'—':fmt(v.shock,3);
 $('physMessage').textContent=v.invalidBp?'Huyết áp tâm trương không thể lớn hơn huyết áp tâm thu; vui lòng kiểm tra số liệu.':'';
}
['physWeight','physHeight','physSbp','physDbp','physHr'].forEach(id=>$(id).addEventListener('input',renderPhys));

const drugs=[
 {name:'Propofol',group:'anesthetic',tag:'Thuốc mê tĩnh mạch',initials:'Pr',indication:'Khởi mê và duy trì gây mê toàn thân; an thần MAC ở người lớn; an thần ICU cho người lớn đã đặt nội khí quản và thở máy theo chỉ định ghi trên nhãn.',contra:'Quá mẫn với propofol hoặc thành phần của chế phẩm. Nhãn chế phẩm tham khảo còn ghi tiền sử phản vệ với trứng, sản phẩm từ trứng, đậu nành hoặc sản phẩm từ đậu nành.',warning:'Có thể gây ngưng thở, hạ huyết áp; cần nhân sự và phương tiện kiểm soát đường thở. Chú ý kỹ thuật vô khuẩn và nguy cơ hội chứng truyền propofol khi an thần kéo dài.',source:'https://www.dailymed.nlm.nih.gov/dailymed/fda/fdaDrugXsl.cfm?setid=f23fe3c5-aa37-4ecc-ad76-f13c1a1dabe2&type=display',note:'Chống chỉ định về tá dược phụ thuộc nhãn từng chế phẩm; không suy rộng cho tất cả sản phẩm.'},
 {name:'Fentanyl',group:'anesthetic',tag:'Opioid giảm đau',initials:'Fe',indication:'Giảm đau trong các giai đoạn gây mê và ngay sau mổ; thuốc phối hợp trong gây mê toàn thân hoặc gây tê vùng theo nhãn.',contra:'Quá mẫn với fentanyl, bao gồm tiền sử phản vệ.',warning:'Nguy cơ ức chế hô hấp nghiêm trọng; thận trọng khi phối hợp thuốc ức chế thần kinh trung ương, có thể gây cứng cơ và tương tác với thuốc ảnh hưởng CYP3A4.',source:'https://www.dailymed.nlm.nih.gov/dailymed/fda/fdaDrugXsl.cfm?setid=ce5db1c2-feb1-4ad2-847a-d02e865bd47e&type=display'},
 {name:'Rocuronium',group:'relaxant',tag:'Thuốc giãn cơ không khử cực',initials:'Ro',indication:'Hỗ trợ đặt nội khí quản (thường quy hoặc nhanh) và giãn cơ trong phẫu thuật hoặc thông khí cơ học.',contra:'Quá mẫn với rocuronium hoặc các thuốc phong bế thần kinh–cơ khác, ví dụ phản vệ.',warning:'Gây liệt cơ hô hấp nhưng không tạo mê hay giảm đau. Phải có gây mê/an thần phù hợp, phương tiện thông khí, theo dõi phong bế thần kinh–cơ và khả năng giải giãn cơ.',source:'https://www.dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=04c9812d-5aa3-4949-ad02-c618028f1bb0'},
 {name:'Sugammadex',group:'relaxant',tag:'Thuốc giải giãn cơ',initials:'Su',indication:'Hồi phục phong bế thần kinh–cơ do rocuronium hoặc vecuronium ở bệnh nhân phẫu thuật theo nhãn.',contra:'Quá mẫn với sugammadex hoặc các thành phần của chế phẩm.',warning:'Có thể gây phản vệ, nhịp chậm nặng; cần giám sát hô hấp và hồi phục giãn cơ. Không khuyến cáo ở suy thận nặng trong nhãn tham khảo; tương tác làm giảm hiệu quả tránh thai nội tiết.',source:'https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=5171d883-fe8f-482c-97ab-40b00975b64a'},
 {name:'Norepinephrine',group:'vasopressor',tag:'Thuốc vận mạch',initials:'NE',indication:'Nâng huyết áp ở người lớn trong tình trạng tụt huyết áp cấp nặng.',contra:'Nhãn sản phẩm tham khảo không liệt kê chống chỉ định tại mục 4; điều này không đồng nghĩa thuốc không có nguy cơ hoặc phù hợp cho mọi bệnh nhân.',warning:'Phải đánh giá và xử trí giảm thể tích tuần hoàn; nguy cơ thiếu máu mô, rối loạn nhịp và hoại tử do thoát mạch. Theo dõi huyết áp, vị trí truyền và tương tác.',source:'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=5fbd0e3b-703b-412e-8b71-bd0a0dbf4500'}
];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function drugCard(d,compact=false){
 if(compact)return `<button class="mini-drug" type="button" data-open-drug="${esc(d.name)}"><span class="pill-icon">${esc(d.initials)}</span><span><strong>${esc(d.name)}</strong><small>${esc(d.tag)}</small></span><span class="mini-arrow">→</span></button>`;
 return `<article class="drug-card"><div class="drug-card-head"><span class="pill-icon">${esc(d.initials)}</span><div class="drug-title"><h3>${esc(d.name)}</h3><span>${esc(d.tag)}</span></div><a target="_blank" rel="noopener noreferrer" href="${esc(d.source)}" class="source-link">Xem nhãn gốc ↗</a></div><div class="drug-detail-grid"><div><b>Chỉ định</b><p>${esc(d.indication)}</p></div><div><b>Chống chỉ định theo nhãn</b><p>${esc(d.contra)}</p></div></div><div class="warning-line"><b>Cảnh báo:</b> ${esc(d.warning)}</div>${d.note?`<div class="note-line">${esc(d.note)}</div>`:''}</article>`;
}
$('homeDrugList').innerHTML=drugs.slice(0,4).map(d=>drugCard(d,true)).join('');
$('homeDrugList').addEventListener('click',e=>{const b=e.target.closest('[data-open-drug]');if(!b)return;goto('drugs');$('drugSearch').value=b.dataset.openDrug;renderDrugs();});
let activeFilter='all';
function renderDrugs(){const q=$('drugSearch').value.toLocaleLowerCase('vi').trim();const subset=drugs.filter(d=>(activeFilter==='all'||d.group===activeFilter) && [d.name,d.tag,d.indication,d.contra].join(' ').toLocaleLowerCase('vi').includes(q));$('drugList').innerHTML=subset.length?subset.map(d=>drugCard(d)).join(''):'<div class="no-results">Chưa có thuốc phù hợp. Thư viện bản mẫu hiện gồm 5 thuốc.</div>';}
$('drugSearch').addEventListener('input',renderDrugs);
document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{activeFilter=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(x=>x.classList.toggle('active',x===b));renderDrugs();}));
renderDrugs();renderBolus();renderInfusion();renderMixing();renderPhys();
})();
