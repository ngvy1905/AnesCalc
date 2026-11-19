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
