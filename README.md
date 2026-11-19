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


## Thuốc mê hô hấp (bản đề xuất qua Pull Request)

Mục mới gồm bảng tham khảo 6 thuốc (hệ số phân bố máu–khí, SVP ở 20°C và MAC từ ảnh người dùng); máy tính buồng bốc hơi bão hòa dạng chia dòng, và công cụ minh họa áp suất riêng phần tương đương Desflurane theo ví dụ độ cao.

- SVP / PT = VA / (VC + VA), nên VA = VC × SVP / (PT − SVP).
- Nồng độ lý thuyết (%) = 100 × VA / (1000 × FGF[L/phút] + VA).
- Công cụ kiểm tra PT > SVP, VC ≤ FGF, số liệu dương; không áp dụng công thức buồng bốc hơi cho N₂O và Desflurane.
- Ví dụ Sevo: SVP 160 mmHg, PT 760 mmHg, FGF 3 L/phút, VC 200 mL/phút: VA = 53,33 mL/phút, nồng độ lý thuyết ≈ 1,75%. Tài liệu làm tròn tỷ số thành 1/4 nên cho khoảng 1,6%.
- Desflurane: nồng độ phần trăm tương đương = nồng độ tham chiếu × 760 / PT. Ví dụ 6% ở 760 mmHg tương đương 12% ở 380 mmHg theo áp suất riêng phần (đơn vị mmHg, không phải atm). Đây không phải hướng dẫn cài đặt bình bốc hơi cho bệnh nhân.

Các thông số trong bảng giữ nguyên theo ảnh người dùng, không tự động coi là dữ liệu hiệu chuẩn. Một số nhãn sevoflurane ghi SVP 157 mmHg tại 20°C thay vì 160 mmHg; thông số có thể khác theo nguồn và chế phẩm. Tất cả kết quả là mô hình vật lý lý tưởng, không phản ánh nồng độ thực đo hoặc nhu cầu MAC lâm sàng. Mọi dữ liệu thuốc cần thẩm định chuyên môn trước khi sử dụng trên bệnh nhân.

Kiểm thử bổ sung: node inhaled-tests.js.

Nguồn tham khảo thêm:
- https://www.openanesthesia.org/keywords/inhaled-anesthetics-in-clinical-use/
- https://www.openanesthesia.org/keywords/vaporizers-and-waste-gas-evacuation/
- https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=3dbab949-6ab7-4040-9c81-314e5bb61d41
