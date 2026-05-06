# Requirements

This file is the explicit capability and coverage contract for the project.

## Active

### R001 — Khách hàng scan QR code tại bàn để mở menu và đặt món trên điện thoại
- Class: core-capability
- Status: active
- Description: Khách hàng scan QR code tại bàn để mở menu và đặt món trên điện thoại
- Why it matters: Đây là luồng chính của hệ thống — thay thế gọi nhân viên bằng self-service order
- Source: user-interview
- Validation: Khách scan QR → thấy menu → chọn món → gửi order thành công → nhân viên nhận được

### R002 — Phân loại đơn hàng thành món nước (bar) và món bếp (kitchen) tự động
- Class: core-capability
- Status: active
- Description: Phân loại đơn hàng thành món nước (bar) và món bếp (kitchen) tự động
- Why it matters: Quán có 2 trạm pha chế riêng — bar và bếp cần thấy đúng món của mình
- Source: user-interview
- Validation: Order chứa cả đồ uống và đồ ăn → bar chỉ thấy đồ uống, kitchen chỉ thấy đồ ăn

### R003 — Dashboard nhân viên hiển thị đơn hàng real-time với trạng thái (mới → đang làm → xong → đã phục vụ)
- Class: core-capability
- Status: active
- Description: Dashboard nhân viên hiển thị đơn hàng real-time với trạng thái (mới → đang làm → xong → đã phục vụ)
- Why it matters: Nhân viên cần biết ngay khi có đơn mới và theo dõi tiến độ từng đơn
- Source: user-interview
- Validation: Khách gửi order → dashboard cập nhật trong <3 giây không cần refresh trang

### R004 — Tính tiền theo bàn — tổng hợp bill, hiển thị tổng tiền, đánh dấu đã thanh toán
- Class: core-capability
- Status: active
- Description: Tính tiền theo bàn — tổng hợp bill, hiển thị tổng tiền, đánh dấu đã thanh toán
- Why it matters: Quán cần tính tiền chính xác theo từng bàn khi khách muốn thanh toán
- Source: user-interview
- Validation: Nhân viên xem bill bàn X → thấy tất cả món đã order → tổng tiền đúng → đánh dấu paid

### R005 — QR codes được tạo sẵn cho 10-20 bàn, in ra và dán tại bàn
- Class: primary-user-loop
- Status: active
- Description: QR codes được tạo sẵn cho 10-20 bàn, in ra và dán tại bàn
- Why it matters: QR phải được chuẩn bị trước — không phải tạo mới mỗi lần khách đến
- Source: user-interview
- Validation: Admin tạo QR cho N bàn → xuất file in được → scan test thành công mở đúng trang order

### R006 — Hệ thống chạy local trên mạng nội bộ quán — không cần internet
- Class: constraint
- Status: active
- Description: Hệ thống chạy local trên mạng nội bộ quán — không cần internet
- Why it matters: Quán tầm trung không cần phức tạp hóa với cloud hosting, WiFi nội bộ đủ dùng
- Source: user-interview
- Validation: App hoạt động bình thường khi máy chủ và điện thoại cùng mạng WiFi, không có internet

### R007 — Giao diện khách hàng tiếng Việt, tối ưu mobile-first
- Class: quality-attribute
- Status: active
- Description: Giao diện khách hàng tiếng Việt, tối ưu mobile-first
- Why it matters: Khách hàng dùng điện thoại scan QR — UI phải đẹp và dễ dùng trên mobile
- Source: user-interview
- Validation: Trang order hiển thị tốt trên iPhone SE (375px) đến tablet, text tiếng Việt rõ ràng

## Validated

## Deferred

## Out of Scope

## Traceability

| ID | Class | Status | Primary owner | Supporting | Proof |
|---|---|---|---|---|---|
| R001 | core-capability | active | none | none | Khách scan QR → thấy menu → chọn món → gửi order thành công → nhân viên nhận được |
| R002 | core-capability | active | none | none | Order chứa cả đồ uống và đồ ăn → bar chỉ thấy đồ uống, kitchen chỉ thấy đồ ăn |
| R003 | core-capability | active | none | none | Khách gửi order → dashboard cập nhật trong <3 giây không cần refresh trang |
| R004 | core-capability | active | none | none | Nhân viên xem bill bàn X → thấy tất cả món đã order → tổng tiền đúng → đánh dấu paid |
| R005 | primary-user-loop | active | none | none | Admin tạo QR cho N bàn → xuất file in được → scan test thành công mở đúng trang order |
| R006 | constraint | active | none | none | App hoạt động bình thường khi máy chủ và điện thoại cùng mạng WiFi, không có internet |
| R007 | quality-attribute | active | none | none | Trang order hiển thị tốt trên iPhone SE (375px) đến tablet, text tiếng Việt rõ ràng |

## Coverage Summary

- Active requirements: 7
- Mapped to slices: 7
- Validated: 0
- Unmapped active requirements: 0
