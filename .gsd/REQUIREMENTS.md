# Requirements

This file is the explicit capability and coverage contract for the project.

## Active

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

## Validated

### R001 — Khách hàng scan QR code tại bàn để mở menu và đặt món trên điện thoại
- Class: core-capability
- Status: validated
- Description: Khách hàng scan QR code tại bàn để mở menu và đặt món trên điện thoại
- Why it matters: Đây là luồng chính của hệ thống — thay thế gọi nhân viên bằng self-service order
- Source: user-interview
- Validation: M002 delivered customer QR ordering flow. M003 delivered staff real-time dashboard with SSE — staff receives orders within 3 seconds via bar/kitchen/overview stations. Full R001 loop proven: customer scans QR → places order → staff sees it in real-time on their station tablet.
- Notes: M002 delivers the customer-facing half of R001: QR scan → menu browsing → cart → order submission → confirmation. Orders persist to DB with correct FKs and server-computed totals. Staff receiving orders (the second half of R001's validation criteria) is M003 scope.

### R002 — Phân loại đơn hàng thành món nước (bar) và món bếp (kitchen) tự động
- Class: core-capability
- Status: validated
- Description: Phân loại đơn hàng thành món nước (bar) và món bếp (kitchen) tự động
- Why it matters: Quán có 2 trạm pha chế riêng — bar và bếp cần thấy đúng món của mình
- Source: user-interview
- Validation: GET /api/staff/orders?station=bar returns only DRINK-category items; station=kitchen returns only FOOD-category items. Verified via API curl tests and 71 passing unit tests. StationView component filters client-side by category. Bar/kitchen station pages confirmed to show only their respective items.

### R003 — Dashboard nhân viên hiển thị đơn hàng real-time với trạng thái (mới → đang làm → xong → đã phục vụ)
- Class: core-capability
- Status: validated
- Description: Dashboard nhân viên hiển thị đơn hàng real-time với trạng thái (mới → đang làm → xong → đã phục vụ)
- Why it matters: Nhân viên cần biết ngay khi có đơn mới và theo dõi tiến độ từng đơn
- Source: user-interview
- Validation: SSE stream at /api/staff/orders/stream delivers new-order and item-status-change events within 3 seconds. Staff advance item status PENDING→PREPARING→READY→SERVED with single taps. Notification chime on new orders. Auto-hide completed items after 5 minutes. Disconnection banner on SSE drop. 71 tests pass. All three stations (bar, kitchen, overview) display real-time data simultaneously.

### R004 — Tính tiền theo bàn — tổng hợp bill, hiển thị tổng tiền, đánh dấu đã thanh toán
- Class: core-capability
- Status: validated
- Description: Tính tiền theo bàn — tổng hợp bill, hiển thị tổng tiền, đánh dấu đã thanh toán
- Why it matters: Quán cần tính tiền chính xác theo từng bàn khi khách muốn thanh toán
- Source: user-interview
- Validation: M004/S01 delivers: Staff opens 💰 Tính tiền tab → sees tables with unpaid orders → taps table → sees aggregated bill (items from multiple orders, cancelled items struck through, total excluding cancelled) → cancels item (two-tap) → total updates → taps Đã thanh toán (two-tap) → all orders → PAID with paidAt → table disappears → stations clear paid orders via SSE. 97 unit tests pass, build clean. Bill aggregation API, mark-paid API, checkout UI, SSE integration all verified.

### R008 — Nhân viên có thể huỷ món hoặc thêm món khác cho đơn hàng từ dashboard
- Class: core-capability
- Status: validated
- Description: Nhân viên có thể huỷ món hoặc thêm món khác cho đơn hàng từ dashboard
- Why it matters: Khách cần thay đổi đơn thì báo nhân viên — nhân viên thao tác trực tiếp trên hệ thống, đảm bảo kiểm soát
- Source: user-interview
- Primary owning slice: M003
- Validation: Cancel: ✅ Staff can cancel items via two-tap confirmation, totalAmount recalculated server-side, SSE broadcasts change (M003/S02, extended to bill context in M004/S01). Add item: ✅ Staff taps '+ Thêm món' on bill → MenuPickerModal opens with DRINK/FOOD tabs → selects item, sets quantity → submits → item added to latest unpaid order → bill total recalculates → bar/kitchen stations receive new item via SSE item-status-change event. 111 unit tests pass, build clean. Both halves of R008 now delivered.
- Notes: M003 delivered the cancel half. M004/S02 delivered the add-item half via GET /api/staff/menu + POST /api/staff/orders/[orderId]/items endpoints and MenuPickerModal component wired into BillView.

## Deferred

## Out of Scope

## Traceability

| ID | Class | Status | Primary owner | Supporting | Proof |
|---|---|---|---|---|---|
| R001 | core-capability | validated | none | none | M002 delivered customer QR ordering flow. M003 delivered staff real-time dashboard with SSE — staff receives orders within 3 seconds via bar/kitchen/overview stations. Full R001 loop proven: customer scans QR → places order → staff sees it in real-time on their station tablet. |
| R002 | core-capability | validated | none | none | GET /api/staff/orders?station=bar returns only DRINK-category items; station=kitchen returns only FOOD-category items. Verified via API curl tests and 71 passing unit tests. StationView component filters client-side by category. Bar/kitchen station pages confirmed to show only their respective items. |
| R003 | core-capability | validated | none | none | SSE stream at /api/staff/orders/stream delivers new-order and item-status-change events within 3 seconds. Staff advance item status PENDING→PREPARING→READY→SERVED with single taps. Notification chime on new orders. Auto-hide completed items after 5 minutes. Disconnection banner on SSE drop. 71 tests pass. All three stations (bar, kitchen, overview) display real-time data simultaneously. |
| R004 | core-capability | validated | none | none | M004/S01 delivers: Staff opens 💰 Tính tiền tab → sees tables with unpaid orders → taps table → sees aggregated bill (items from multiple orders, cancelled items struck through, total excluding cancelled) → cancels item (two-tap) → total updates → taps Đã thanh toán (two-tap) → all orders → PAID with paidAt → table disappears → stations clear paid orders via SSE. 97 unit tests pass, build clean. Bill aggregation API, mark-paid API, checkout UI, SSE integration all verified. |
| R005 | primary-user-loop | active | none | none | Admin tạo QR cho N bàn → xuất file in được → scan test thành công mở đúng trang order |
| R006 | constraint | active | none | none | App hoạt động bình thường khi máy chủ và điện thoại cùng mạng WiFi, không có internet |
| R007 | quality-attribute | active | none | none | Trang order hiển thị tốt trên iPhone SE (375px) đến tablet, text tiếng Việt rõ ràng |
| R008 | core-capability | validated | M003 | none | Cancel: ✅ Staff can cancel items via two-tap confirmation, totalAmount recalculated server-side, SSE broadcasts change (M003/S02, extended to bill context in M004/S01). Add item: ✅ Staff taps '+ Thêm món' on bill → MenuPickerModal opens with DRINK/FOOD tabs → selects item, sets quantity → submits → item added to latest unpaid order → bill total recalculates → bar/kitchen stations receive new item via SSE item-status-change event. 111 unit tests pass, build clean. Both halves of R008 now delivered. |

## Coverage Summary

- Active requirements: 3
- Mapped to slices: 3
- Validated: 5 (R001, R002, R003, R004, R008)
- Unmapped active requirements: 0
