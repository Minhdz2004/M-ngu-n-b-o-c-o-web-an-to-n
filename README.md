Danh sach thanh viên nhóm
Nguyễn Văn Minh Msv: 22810340428
Lê Đức Mạnh Msv: 22810320259
Lã Quí Trí Msv: 22810310446

Phân chia công việc 
 Họ tên              Công việc
Nguyễn Văn Minh    phần webapp, docker-compose và báo cáo chương 1
Lê Đức Mạnh        phần alertmanager,docker và báo cáo chương 2
Lã Quí Trí         phần logstash,prometheus và báo cáo chương 3

Hướng dẫn sử dụng
1. Truy cập trang web

Sau khi chạy hệ thống bằng Docker hoặc thông qua Node.js, mở trình duyệt và truy cập:

http://localhost:3000


Trang web sẽ hiển thị giao diện đơn giản gồm:

Form đăng nhập

Khu vực chọn chế độ logging

Nút lấy dữ liệu API

Vùng hiển thị kết quả trả về

2. Chọn chế độ Logging

Ở phần đầu trang có mục:

Chọn mode logging

Basic → Log thô, thiếu thông tin (chỉ timestamp, phương thức, URL, status)

Structured → Log dạng JSON đầy đủ (IP, user, endpoint, latency, timestamp, status…)

Chọn mode bạn muốn kiểm thử.

 Chế độ này ảnh hưởng trực tiếp đến nội dung log được ghi vào:

Console (basic mode)

File logs/app.log (structured mode)

3. Đăng nhập hệ thống

Tại mục Login, nhập thông tin:

Username:

Thành công: admin

Thất bại: bất kỳ giá trị nào khác

Password:

Thành công: password

Thất bại: bất kỳ giá trị nào khác

Nhấn Login.

Kết quả hiển thị:

Thành công → { "success": true }

Thất bại → { "success": false }

Logging:

Basic mode → Console log đơn giản

Structured mode → JSON log, ghi vào logs/app.log

Metrics Prometheus:

Đăng nhập thất bại sẽ tăng login_failed_total

Lỗi server (nếu có) sẽ tăng http_5xx_total

4. Gọi API lấy dữ liệu

Nhấn nút:

GET /api/data


Kết quả trả về dạng JSON:

{ "data": "demo data" }


Yêu cầu này cũng được ghi log theo chế độ mà bạn chọn.

5. Kiểm tra trạng thái hệ thống (Health Check)

Trang web sẽ tự động gửi request đến:

/health


và hiển thị trạng thái:

UP


Endpoint này giúp kiểm tra hệ thống còn hoạt động hay không.

6. Quan sát Metrics Prometheus

Truy cập vào:

http://localhost:9090


Sau đó tìm kiếm các metric:

login_failed_total

http_5xx_total

Metric mặc định của Node.js (CPU, memory, event loop…)

Prometheus sẽ tự động thu thập dữ liệu từ endpoint:

/metrics


khi webapp chạy.

7. Quan sát Log trên ELK
1. Mở Kibana
http://localhost:5601

2. Tạo Index Pattern

Nếu structured logging đã hoạt động, Logstash sẽ đẩy log vào Elasticsearch với index:

app-logs-*


Tạo Kibana Index Pattern:

Discover → Create Index Pattern

Nhập app-logs-*

Chọn field @timestamp

Nhấn Create

3. Xem log dạng JSON

Bạn sẽ thấy log gồm đầy đủ:

timestamp

ip

method

url

latency

status

user

…

8. Kiểm tra Alert Prometheus

Truy cập Alertmanager:

http://localhost:9093

Alert sẽ kích hoạt nếu:

Brute-force: login_failed_total tăng > 5 trong 1 phút

Lỗi hệ thống: số lỗi 5xx tăng liên tục

9. Mô phỏng tấn công brute-force

Chạy lệnh:

for i in {1..10}; do 
  curl -X POST -H "Content-Type: application/json" \
  -d '{"username":"test","password":"wrong"}' \
  "http://localhost:3000/login?mode=structured"
done


<img width="607" height="660" alt="Screenshot 2025-12-09 100940" src="https://github.com/user-attachments/assets/286e82b0-001a-4873-90b1-71f13c0c0c2f" />

<img width="602" height="766" alt="Screenshot 2025-12-09 101032" src="https://github.com/user-attachments/assets/45afcae3-9a5e-4480-a4b3-426cbcbb8bba" />
