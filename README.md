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
