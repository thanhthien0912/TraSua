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
- Notes: M002 delivers the customer-facing half of R001: QR scan → menu browsing → cart → order submission → confirmation. Orders persist to DB with correct FKs and server-computed totals. Staff receiving orders (the second half of R001's validation criteria) is M003 scope.

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
- Notes: M001/S03 delivers the QR generation infrastructure: admin auth + /api/admin/qr-pdf generates A4 PDF with 3x5 grid of QR codes for N tables. Each QR encodes http://SHOP_IP:SHOP_PORT/order?table=N. Machine-verified: build passes, file content correct. Full validation (scan test) pending live runtime UAT.

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
- Notes: M002 delivers the primary customer-facing UI: /order page verified at 390px mobile viewport, all text Vietnamese, tabular-nums for prices, 44px+ touch targets, safe-area-inset padding, amber/warm branding. Cart sheet, confirmation screen all mobile-first.

### R008 — Nhân viên có thể huỷ món hoặc thêm món khác cho đơn hàng từ dashboard
- Class: core-capability
- Status: active
- Description: Nhân viên có thể huỷ món hoặc thêm món khác cho đơn hàng từ dashboard
- Why it matters: Khách cần thay đổi đơn thì báo nhân viên — nhân viên thao tác trực tiếp trên hệ thống, đảm bảo kiểm soát
- Source: user-interview
- Primary owning slice: M003
- Validation: Nhân viên mở đơn bàn X → huỷ 1 món → tổng bill cập nhật đúng. Nhân viên thêm món khác → món mới xuất hiện trên trạm bar/bếp tương ứng.

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
| R008 | core-capability | active | M003 | none | Nhân viên mở đơn bàn X → huỷ 1 món → tổng bill cập nhật đúng. Nhân viên thêm món khác → món mới xuất hiện trên trạm bar/bếp tương ứng. |

## Coverage Summary

- Active requirements: 8
- Mapped to slices: 8
- Validated: 0
- Unmapped active requirements: 0
