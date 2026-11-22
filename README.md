# AnesCalc — website mẫu công cụ tính toán gây mê hồi sức

**Bản thử nghiệm ngày 19/11/2026.** Đây là website tĩnh hoạt động hoàn toàn trong trình duyệt. Không cần tài khoản, không thu thập hay lưu dữ liệu bệnh nhân, không gọi dịch vụ bên ngoài khi tính toán. Các liên kết DailyMed cần Internet để mở.

## Chạy ngay

Mở `index.html` bằng trình duyệt Chrome, Edge, Safari hoặc Firefox (giữ cùng thư mục với `logic.js`, `app.js` và `styles.css`). Hoặc mở bản một tệp `AnesCalc_Mot_File.html` được cung cấp riêng.

## Chức năng

- Tính liều theo cân nặng (mg/kg, mcg/kg), quy đổi thể tích theo nồng độ.
- Quy đổi đơn vị tốc độ truyền sang mL/h: mcg/kg/min, mcg/kg/h, mg/kg/h, mcg/min và mg/h.
- Tính ngược mL/h sang mcg/kg/min.
- Tính thể tích pha thuốc theo nồng độ gốc và thể tích cuối.
- Tính BMI, MAP ước tính và shock index.
- Thư viện 5 thuốc gây mê hồi sức gồm chỉ định, chống chỉ định, cảnh báo và link nhãn thuốc.

## Giới hạn và an toàn

**KHÔNG dùng website này làm căn cứ duy nhất để kê đơn hoặc cài đặt bơm tiêm điện.** Máy tính chỉ thực hiện phép toán từ dữ liệu người dùng nhập. Website không đề xuất liều điều trị; không kiểm tra chỉ định, tương tác, tương thích pha, hiệu chỉnh chức năng gan thận, tuổi, tình trạng bệnh nhân, hay độ ổn định dung dịch. Không được coi là phần mềm y tế đã thẩm định hoặc cấp phép.

Nguồn thông tin thuốc là các nhãn kê đơn Hoa Kỳ được tham khảo ngày 19/11/2026. Nội dung chỉ là tóm tắt, có thể khác theo biệt dược, nhãn tại Việt Nam và bản cập nhật. Kiểm tra nhãn chế phẩm thực tế và quy trình nội bộ bệnh viện.

## Triển khai web

Đăng tải 4 tệp `index.html`, `styles.css`, `logic.js`, `app.js` lên bất kỳ static host nào (GitHub Pages, Netlify, Cloudflare Pages) và mở URL của host. Không cần server. Nên thiết lập HTTPS và quy trình rà soát chuyên môn trước khi dùng trong môi trường bệnh viện.

## Kiểm tra toán học

Chạy `node tests.js` trong cùng thư mục. Các trường hợp thử có sẵn: liều bolus, tốc độ truyền và phép tính ngược, pha dung dịch, BMI/MAP/shock index, và trường hợp dữ liệu không hợp lệ.


## Thuốc mê hô hấp: máy tính xuôi và tính ngược

Trang **Thuốc mê hô hấp** giữ nguyên cách tính buồng bốc hơi bão hòa lý thuyết và bổ sung chiều tính ngược từ nồng độ mục tiêu.

**Nguồn và thứ tự ưu tiên của bảng:** theo ảnh mới nhất ngày 19/11/2026, dùng hệ số máu–khí, hệ số dầu–khí, MAC trong bảng mới. Cột SVP tại 20°C không có trong ảnh mới nên giữ các giá trị từ bảng đầu tiên. Những con số MAC chỉ là dữ liệu tham khảo của tài liệu học tập, không phải ngưỡng áp dụng cho mọi bệnh nhân.

| Thuốc | Máu–khí (mới) | Dầu–khí (mới) | SVP tại 20°C (bảng cũ, mmHg) | MAC (mới, %) |
|---|---:|---:|---:|---:|
| Halothane | 2.5 | 197 | 244 | 0.75 |
| Enflurane | 1.9 | 98.5 | 172 | 1.7 |
| Isoflurane | 1.4 | 90.8 | 240 | 1.2 |
| Sevoflurane | 0.65 | 50 | 160 | 2.0 |
| N₂O | 0.47 | 1.3 | 38770 | 104 |
| Desflurane | 0.45 | 19 | 669 | 6.0 |

### Một mô hình lý tưởng, hai cách nhập

Quy ước:
- P = áp suất khí quyển tổng (mmHg).
- SVP = áp suất hơi bão hòa tại 20°C (mmHg). Yêu cầu P > SVP.
- FGF = tổng lưu lượng khí mới **mL/phút**. Trong UI nhập L/phút nên nhân 1000.
- Fch = lưu lượng khí mang đi qua buồng bốc hơi (mL/phút).
- Vhơi = thể tích hơi thuốc được tạo thêm mỗi phút (mL/phút), **không** phải thể tích thuốc ở dạng lỏng.
- C = phần nồng độ hơi thuốc dạng thập phân (2% = 0,02).

Chiều xuôi, **biết Fch**, tìm nồng độ:
1. Vhơi = Fch × SVP / (P − SVP)
2. C (%) = 100 × Vhơi / (FGF + Vhơi)

Chiều ngược, **biết C mong muốn trong mô hình**, tìm Fch:
1. Fch = FGF × C × (P − SVP) / [SVP × (1 − C)]
2. Bypass = FGF − Fch
3. Split ratio (bypass : buồng) = bypass / Fch : 1

Hai hướng tương đương về đại số; UI sử dụng cùng hàm tính xuôi để đối chiếu kết quả tính ngược.

**Ví dụ hình minh họa mới:** Sevoflurane, SVP 160, P 760 mmHg, FGF 2000 mL/phút, C 2%: Fch ≈ 153,06 mL/phút; bypass ≈ 1846,94 mL/phút; hơi thuốc ≈ 40,82 mL/phút; tổng đầu ra ≈ 2040,82 mL/phút; split ratio ≈ 12,07 : 1. Trong sơ đồ, các giá trị 150 / 1850 / 40 mL/phút là các số làm tròn, vì 40 / 2040 ≈ 1,96%, gần 2%.

**Ví dụ bài trước:** FGF 3000 mL/phút, Fch 200 mL/phút -> nồng độ hơi lý thuyết ≈ 1,75%; tài liệu làm tròn tỷ số thành 1/4 nên ra khoảng 1,6%.

**Giới hạn:**
- N₂O là khí ở điều kiện thường; Desflurane dùng bình bốc hơi chuyên dụng, không áp dụng mô hình buồng bốc hơi bão hòa chia dòng này.
- Kết quả tính là lý thuyết và giả định bão hòa hoàn toàn ở 20°C, không phải nồng độ cung cấp thực đo, EtAA hoặc chỉ dẫn cài đặt bình bốc hơi. Máy thật có bù nhiệt, đặc tính dòng khí, thiết kế và độ chính xác phụ thuộc nhà sản xuất.
- Không cho phép C > SVP/P, vì mức nồng độ đó không đạt được trong mô hình chia dòng. Không cho phép lưu lượng qua buồng vượt quá tổng FGF.
- SVP 160 mmHg cho Sevoflurane được **giữ theo ảnh**; một số nhãn thuốc nêu khoảng 157 mmHg tại 20°C. Giá trị trong bảng chưa phải thông số hiệu chuẩn được thẩm định.
- MAC có thể thay đổi theo tuổi, thuốc phối hợp và điều kiện lâm sàng. Cần rà soát chuyên môn trước khi sử dụng ở môi trường lâm sàng.

Phép tính riêng Desflurane theo áp suất riêng phần ở độ cao vẫn nằm trên cùng trang, không gộp vào công thức buồng chia dòng.

Chạy kiểm thử: `node tests.js` và `node inhaled-tests.js`. Các phép kiểm thử này chỉ đánh giá số học và các điều kiện biên, không thay thế thẩm định y khoa.

Nguồn tham khảo bối cảnh:
- https://www.openanesthesia.org/keywords/inhaled-anesthetics-in-clinical-use/
- https://www.openanesthesia.org/keywords/vaporizers-and-waste-gas-evacuation/
- https://accessanesthesiology.mhmedical.com/content.aspx?bookid=3399&sectionid=282994877


## Circuit wash-in (mô hình hệ thống vòng lý tưởng)

Trang **Circuit wash-in** sử dụng công thức mô hình một ngăn trộn đều, chỉ nhằm minh họa quá trình thay đổi nồng độ khí trong circuit khi nồng độ khí mới vào và FGF không đổi, không có bệnh nhân hấp thu thuốc, không rò khí và không có hấp phụ bởi hệ thống:

- Hằng số thời gian: tau = V_circuit / FGF (phút), V tính L, FGF tính L/phút.
- Nồng độ theo thời gian: C(t) = C_in + (C_0 − C_in) × exp(−t/tau).
- Thời gian tới C_target: t = tau × ln[(C_in−C_0)/(C_in−C_target)], với C_0 ≤ C_target < C_in.
- Thời gian 90%, 95%, 99% *mức thay đổi đến cân bằng* lần lượt: 2,303 tau; 2,996 tau; 4,605 tau. Đây không phải nồng độ tuyệt đối của khí mê hoặc phần trăm MAC.
- Đồ thị wash-in từ nồng độ ban đầu đến khí mới đi vào, có điểm mục tiêu.

**Các preset thể tích có thể sửa:** Circle người lớn ví dụ 5 L (thường 4–6 L); Circle nhỏ ví dụ 3 L (minh họa); tự nhập. Ba cấu hình được đo/ghi trong nghiên cứu Shin và cộng sự (2017) có 1,2 L bộ dây:
- Dräger Primus: tổng 5,9 L (máy 4,7 L + dây 1,2 L).
- Dräger Perseus: tổng 3,3 L (máy 2,1 L + dây 1,2 L).
- Dräger Zeus ở chế độ fresh-gas: tổng 3,2 L (máy 2,0 L + dây 1,2 L).

**Quan trọng:** đây là cấu hình nghiên cứu, không phải thông số được xác minh chung cho tất cả máy cùng tên. Máy cùng thể tích có thể có đặc tính wash-in khác do vị trí khí mới vào, kiến trúc ventilator, fresh-gas decoupling, chế độ hồi lưu và hấp thu của bệnh nhân. Đặc biệt, công thức không áp dụng trực tiếp cho Zeus ở chế độ Auto/DIVA, hệ mở hoặc Mapleson/Bain. Người dùng phải xác minh thể tích hữu hiệu phù hợp và theo dõi nồng độ thuốc hít vào/cuối thì thở ra đo thực tế.

**Kiểm thử:** chạy `node washin-tests.js`; GitHub Actions chạy thêm cú pháp các file JS. Kiểm thử số học không phải thẩm định lâm sàng.

**Nguồn:**
- OpenAnesthesia, Time Constant (cập nhật 25/02/2026): https://www.openanesthesia.org/keywords/time-constant/
- Shin HW et al., *The effect of fresh gas flow rate and type of anesthesia machine on time to reach target sevoflurane concentration*, BMC Anesthesiology 2017: https://link.springer.com/article/10.1186/s12871-016-0294-y
- Anesthesia Patient Safety Foundation, Patient Safety and Low-Flow Anesthesia, 2022: https://www.apsf.org/article/patient-safety-and-low-flow-anesthesia/


## Máu mất & truyền máu chu phẫu — bản thử nghiệm

Trang mới thực hiện các phép tính minh bạch từ số liệu người dùng nhập, **không chọn ngưỡng Hb hay truyền máu tự động**. Các nội dung và ví dụ ban đầu dựa trên bài tổng hợp do người dùng cung cấp, sau đó đối chiếu ngưỡng AABB và phương pháp định lượng EBL với tài liệu công khai.

### 1. EBV

EBV = cân nặng (kg) × hệ số (mL/kg). Sáu nhóm tham khảo (có thể sửa thủ công):

| Nhóm | Khoảng tham khảo (mL/kg) | Hệ số điền sẵn |
|---|---:|---:|
| Nam trưởng thành | 70–75 | 70 |
| Nữ trưởng thành | 60–65 | 65 |
| Trẻ > 1 tuổi | 70–75 | 70 |
| Trẻ nhũ nhi | 75–80 | 80 |
| Sơ sinh đủ tháng | 80–90 | 85 |
| Sơ sinh non tháng | 90–100 | 95 |

Lưu ý giới hạn ước tính ở bệnh nhân béo phì, có thai, trẻ sơ sinh và các tình huống thay đổi thành phần cơ thể. Các hệ số là giá trị giảng dạy, không phải phép đo thể tích máu.

### 2. MABL

- Phương pháp đơn giản Hb: MABL = EBV × (Hb_i − Hb_min) / Hb_i.
- Công thức Gross dùng Hct trung bình: MABL_Gross = EBV × (Hct_i − Hct_min) / [(Hct_i + Hct_min)/2]. Công thức này xuất hiện trong bối cảnh pha loãng máu đẳng thể tích cấp (ANH) và có những giả định khác với công thức đơn giản, không phải giá trị máu mất an toàn.
- Dữ liệu Hb và Hct **được nhập riêng**, không mặc định Hct = 3 × Hb.
- Ví dụ nam 70 kg, hệ số 70: EBV 4900 mL, Hb 12 → 8 thì MABL đơn giản ≈ 1633 mL; với Hct 36 → 24, Gross ≈ 1960 mL. Không chuyển những giá trị này thành lệnh truyền máu.

### 3. EBL định lượng và tốc độ

- EBL ≈ (dịch trong bình hút − dịch rửa trong bình) + (trọng lượng gạc ướt − khô) × 1 mL/g + máu đo thêm chưa tính trùng. Kiểm tra âm, dịch rửa > bình hút và gạc khô > gạc ướt.
- EBL / EBV và EBL / MABL đơn giản chỉ là tỷ lệ mô tả, không phải ngưỡng điều trị.
- Ví dụ 1200 mL dịch hút, 400 mL dịch rửa, gạc ướt 550 g, gạc khô 300 g: EBL ≈ 1050 mL.
- Tốc độ mất máu = lượng mất thêm × 60 / thời gian (phút). Ví dụ 600 mL/30 phút = 1200 mL/giờ. Không ngoại suy tốc độ này cho thời gian tiếp theo.

### 4. Đáp ứng hồng cầu và các tỷ lệ dịch

- Quy tắc kinh nghiệm **1 đơn vị khối hồng cầu ≈ tăng 1 g/dL Hb** dành cho người lớn ổn định, không còn mất máu; chỉ hiện phép tính khi người dùng chủ động xác nhận bối cảnh phù hợp. Hiển thị số đơn vị *tương đương*, không tự làm tròn thành y lệnh truyền máu.
- 1,5:1 và 3:1 chỉ là **phép nhân so sánh lịch sử/tài liệu** của lượng EBL; không tạo liều dịch, thể tích truyền và không gợi ý hồi sức.

### 5. Ngưỡng Hb tham khảo, không phải bộ quy tắc lâm sàng

- AABB 2023: người trưởng thành ổn định <7 g/dL; có thể chọn 7,5 g/dL ở phẫu thuật tim; 8 g/dL ở phẫu thuật chỉnh hình hoặc có bệnh tim mạch từ trước.
- AABB 2025: đối với bệnh nhân nội trú nhồi máu cơ tim cấp, gợi ý chiến lược truyền rộng rãi hơn khi Hb <10 g/dL; **khuyến cáo có điều kiện, chứng cứ độ chắc chắn thấp**.
- Không áp dụng các ngưỡng này cho chảy máu ồ ạt đang tiến triển hoặc sốc mất máu; ưu tiên kiểm soát nguồn, đánh giá tưới máu, hồi sức và quy trình MTP của cơ sở.

### 6. Kiểm thử

Chạy `node blood-tests.js` và các suite trước. GitHub Actions cũng kiểm tra cú pháp `blood.js`, `blood-ui.js` và chạy bộ kiểm thử toán học. Không thay thế rà soát chuyên môn hoặc kiểm định phần mềm y tế.

Nguồn công khai để đối chiếu:
- https://iowaprotocols.medicine.uiowa.edu/protocols/maximum-allowable-blood-loss
- https://pmc.ncbi.nlm.nih.gov/articles/PMC11069068/
- https://pmc.ncbi.nlm.nih.gov/articles/PMC11977757/
- https://pubmed.ncbi.nlm.nih.gov/37824153/
- https://pubmed.ncbi.nlm.nih.gov/40825204/
- https://professionaleducation.blood.ca/en/transfusion/clinical-guide/blood-components
- https://pmc.ncbi.nlm.nih.gov/articles/PMC11069062/
