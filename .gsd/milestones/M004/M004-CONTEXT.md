# M004: Bill & Checkout

**Gathered:** 2026-05-06
**Status:** Ready for planning

## Project Description

Trang "Tính tiền" mới trong staff dashboard — tab thứ 4 trong bottom nav. Nhân viên xem bill tổng hợp theo bàn (gộp tất cả order chưa paid), huỷ món chưa lên, thêm món mới (ví dụ khách đến quầy mua thêm ly mang về), và đánh dấu đã thanh toán. Hoàn thiện vòng đời đơn hàng từ order → pha chế → phục vụ → **tính tiền**.

## Why This Milestone

Hiện tại flow đơn hàng dừng ở SERVED — chưa có bước tính tiền. Quán không biết bàn nào đã trả, bàn nào chưa. R004 yêu cầu: "Nhân viên xem bill bàn X → thấy tất cả món đã order → tổng tiền đúng → đánh dấu paid." Đây là core capability còn thiếu để hệ thống hoạt động hoàn chỉnh cho vận hành thực tế.

## User-Visible Outcome

### When this milestone is complete, the user can:

- Nhân viên nhấn tab "Tính tiền" → thấy danh sách bàn đang có đơn chưa trả → nhấn vào bàn → xem bill chi tiết gộp tất cả order
- Trên bill, nhân viên huỷ món chưa served (two-tap confirm) hoặc thêm món mới qua menu picker → bill tự cập nhật tổng tiền
- Nhân viên nhấn "Đã thanh toán" (two-tap confirm) → tất cả order của bàn chuyển PAID → các trạm bar/kitchen/overview tự xoá order đã paid qua SSE → bàn sẵn sàng nhận khách mới

### Entry point / environment

- Entry point: `/staff/checkout` — tab thứ 4 trong staff bottom nav
- Environment: local dev / browser (tablet/desktop staff dashboard)
- Live dependencies involved: SQLite database, SSE subscriber registry (existing infrastructure)

## Completion Class

- Contract complete means: API endpoints trả đúng bill data theo bàn (gộp multi-order, exclude cancelled items khỏi tổng, include cancelled items trong danh sách), PATCH mark-paid cập nhật tất cả order → PAID + set paidAt, SSE broadcast payment events. Unit tests cho bill aggregation logic và SERVED→PAID transition.
- Integration complete means: Staff mở tab Tính tiền → chọn bàn → xem bill đúng → huỷ/thêm món → thanh toán → bar/kitchen/overview nhận SSE event → order biến mất khỏi dashboard → khách mới scan QR bàn đó → order mới bình thường.
- Operational complete means: none (local-network single-instance, không cần lifecycle management đặc biệt).

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- Khách gọi 2 lần (2 order) trên cùng 1 bàn → staff mở bill bàn đó → thấy tất cả món gộp → tổng tiền đúng → huỷ 1 món → tổng cập nhật → thêm 1 món mới qua menu picker → tổng cập nhật → nhấn "Đã thanh toán" → tất cả order → PAID → SSE broadcast → các trạm xoá order → khách mới scan QR bàn đó → đặt hàng bình thường
- Món đã cancelled hiện gạch ngang trên bill và không tính vào tổng
- Two-tap confirmation pattern hoạt động đúng trên cả nút "Đã thanh toán" và nút huỷ món trên bill

## Architectural Decisions

### Bill scope: gộp theo bàn

**Decision:** Bill tổng hợp tất cả order chưa paid của cùng 1 bàn thành 1 bill duy nhất. Không tính tiền từng order riêng.

**Rationale:** Khách ngồi 1 bàn có thể gọi nhiều lần (qua "Gọi thêm món"). Khi tính tiền, quán tính tổng cộng tất cả — không chia nhỏ. Đơn giản cho cả staff và khách.

**Alternatives Considered:**
- Tính tiền từng order riêng — Staff phải thao tác nhiều lần, không phản ánh cách quán thực tế vận hành.

---

### Payment method: tiền mặt only

**Decision:** Chỉ cần nút "Đã thanh toán" — không ghi nhận phương thức, không tích hợp payment gateway.

**Rationale:** Quán tầm trung chạy local, không cần MoMo/ZaloPay integration. Đơn giản hóa tối đa — 1 nút, 1 hành động.

**Alternatives Considered:**
- Ghi nhận cash/transfer — thêm paymentMethod field nhưng không có nhu cầu thực tế.
- Tích hợp MoMo/ZaloPay — quá phức tạp cho quán local, cần internet.

---

### Entry point: tab "Tính tiền" trong staff nav

**Decision:** Thêm tab thứ 4 "💰 Tính tiền" vào bottom nav staff → route `/staff/checkout`. Trang liệt kê bàn có đơn chưa trả, nhấn vào xem bill chi tiết.

**Rationale:** Tách biệt flow tính tiền khỏi flow pha chế. Nhân viên tính tiền (cashier/runner) dùng tab riêng, không lẫn với bar/kitchen. Bottom nav đã có 3 tab — thêm 1 tab vẫn gọn.

**Alternatives Considered:**
- Nút trên OrderCard — khó gộp multi-order, lẫn UI pha chế với tính tiền.

---

### After paid: reset tự động

**Decision:** Khi đánh dấu paid, tất cả order của bàn chuyển PAID, bàn tự động sẵn sàng nhận khách mới. Không cần bước "mở bàn" riêng.

**Rationale:** Quán tầm trung không cần quản lý trạng thái bàn chặt chẽ (open/closed). QR scan → order mới tự tạo — không bị chặn bởi trạng thái bàn cũ (vì query chỉ lấy order chưa paid).

**Alternatives Considered:**
- Yêu cầu "mở bàn lại" — thêm phức tạp (table status model) cho lợi ích nhỏ.

---

### Bill timing: thanh toán bất cứ lúc nào

**Decision:** Staff được phép đánh dấu paid bất cứ lúc nào — kể cả khi có món đang pha chế. Bill view cho phép huỷ món chưa lên và thêm món mới.

**Rationale:** Thực tế quán hay tính tiền sớm rồi giao nốt. Bill view đóng vai trò "điểm quản lý cuối cùng" — xem, chỉnh sửa (huỷ/thêm), rồi thanh toán.

**Alternatives Considered:**
- Chặn paid khi chưa tất cả SERVED — quá cứng nhắc cho thực tế vận hành.

---

### Thêm món trên bill: menu picker modal

**Decision:** Nút "+ Thêm món" trên bill view mở modal menu picker đơn giản (DRINK/FOOD tabs) → chọn món, nhập số lượng → tạo OrderItem mới → bill cập nhật tổng → SSE broadcast đến trạm tương ứng.

**Rationale:** Cho phép staff thêm món nhanh (ví dụ khách đến quầy mua thêm ly mang về) mà không cần navigate ra trang order. Reuse menu data nhưng UI gọn hơn trang khách.

**Alternatives Considered:**
- Redirect sang /order?table=N — phải navigate khỏi bill view, UX không mượt cho staff.

---

### Cancelled items display: gạch ngang

**Decision:** Món đã cancelled vẫn hiển thị trên bill nhưng gạch ngang (line-through) + không tính vào tổng. Minh bạch cho cả staff và khách.

**Rationale:** Khách nhìn thấy rõ món nào đã huỷ, tránh thắc mắc "tôi gọi món X đâu?". Tổng tiền chỉ tính món active — consistent với `calculateOrderTotal` hiện tại.

**Alternatives Considered:**
- Ẩn hẳn món cancelled — gọn hơn nhưng gây nhầm lẫn.

---

### Paid confirmation: two-tap pattern

**Decision:** Nút "Đã thanh toán" dùng two-tap confirmation giống nút Huỷ hiện tại — tap 1 hiện "Xác nhận thanh toán?", tap 2 thực thi, auto-reset 3 giây.

**Rationale:** Reuse UX pattern đã established trong M003. Thanh toán là hành động irreversible (chuyển tất cả order → PAID) — cần confirmation. Staff đã quen pattern này từ nút cancel.

**Alternatives Considered:**
- One-tap — nhanh hơn nhưng dễ bấm nhầm, hành động không thể undo.

---

### SSE broadcast on payment

**Decision:** Khi đánh dấu paid, broadcast SSE event cho tất cả trạm (bar/kitchen/overview). Các trạm nhận event → xoá order đã paid khỏi view real-time.

**Rationale:** Consistent với hệ thống SSE hiện tại — mọi thay đổi order status đều broadcast. Bar/kitchen cần biết ngay khi order đã paid để không tiếp tục pha chế.

**Alternatives Considered:**
- Không broadcast, chỉ filter ở query — chậm hơn, không real-time, trạm phải đợi refresh/reconnect.

## Error Handling Strategy

- **Mark paid API:** Validate bàn tồn tại, có ít nhất 1 order chưa paid. Return 404 nếu bàn không có order, 400 nếu request body invalid.
- **Add item API:** Reuse validation chain từ POST /api/order — check menuItem existence, availability (409 nếu hết hàng), quantity > 0.
- **Cancel from bill:** Reuse existing PATCH endpoint + isValidTransition validation. Món đã SERVED/CANCELLED không cho huỷ → 409 Conflict.
- **SSE failure:** Existing disconnection/reconnection banner pattern handles this. Bill view page nên có refetch mechanism khi SSE reconnects.
- **Concurrent modification:** Server-side totalAmount recalculation (existing pattern) ensures consistency kể cả khi staff trên bill và staff trên trạm thao tác cùng lúc.

## Risks and Unknowns

- **Schema migration:** Cần thêm `paidAt` field trên Order model + update deriveOrderStatus/isValidTransition để handle SERVED→PAID. Risk thấp — additive change, backward compatible.
- **Multi-order aggregation performance:** Bill query phải JOIN across orders + items + menuItems cho 1 bàn. Risk thấp — SQLite handles this fine cho lượng data quán nhỏ (<100 order/ngày).
- **SSE event type mới:** Cần define payment event format và ensure useOrderStream xử lý đúng. Risk thấp — extend existing pattern.
- **Menu picker complexity:** Modal menu picker cần fetch menu data + handle state — phức tạp hơn nếu muốn search/filter. Risk trung bình — cần design gọn gàng.

## Existing Codebase / Prior Art

- `src/lib/order-status.ts` — `deriveOrderStatus()`, `calculateOrderTotal()`, `isValidTransition()` — cần extend cho PAID status
- `src/lib/sse.ts` — SSE subscriber registry, `broadcast()` — cần add payment event type
- `src/components/staff/OrderCard.tsx` — two-tap cancel pattern, item display layout — reuse pattern cho bill item rows
- `src/components/staff/StationView.tsx` — categorizeOrders, connection banners — tham khảo pattern cho checkout page
- `src/components/staff/useOrderStream.ts` — SSE hook — cần extend để handle payment events
- `src/app/staff/StaffNav.tsx` — bottom nav — thêm tab thứ 4
- `src/app/api/staff/orders/[orderId]/items/[itemId]/route.ts` — PATCH endpoint cho cancel + status transition — reuse cho cancel từ bill
- `src/app/api/order/route.ts` — POST order creation — reuse validation chain cho add item from bill
- `src/lib/format.ts` — `formatVND()` — reuse cho bill totals
- `prisma/schema.prisma` — Order model (cần thêm paidAt), OrderStatus enum (PAID đã có nhưng chưa dùng)

## Relevant Requirements

- R004 — "Tính tiền theo bàn — tổng hợp bill, hiển thị tổng tiền, đánh dấu đã thanh toán" — đây là requirement chính mà M004 trực tiếp deliver
- R008 — "Nhân viên có thể huỷ món hoặc thêm món khác cho đơn hàng từ dashboard" — M004 mở rộng khả năng này vào bill view (huỷ/thêm món ngay trên trang tính tiền)

## Scope

### In Scope

- Trang `/staff/checkout` với danh sách bàn có đơn chưa paid
- Bill detail view gộp tất cả order chưa paid của 1 bàn
- Huỷ món chưa served trên bill (reuse existing cancel mechanism)
- Thêm món mới qua menu picker modal trên bill
- Nút "Đã thanh toán" với two-tap confirmation
- API endpoint: GET bill by table (aggregated), POST mark-paid, POST add-item-to-bill
- Schema: thêm `paidAt` field, enable SERVED→PAID transition
- SSE broadcast payment events
- Cancelled items hiển thị gạch ngang trên bill
- Tab thứ 4 "Tính tiền" trong staff bottom nav
- Unit tests cho bill aggregation, PAID transition

### Out of Scope / Non-Goals

- Discount / giảm giá / coupon
- VAT / thuế
- In bill / receipt (máy in nhiệt, PDF)
- Customer-facing bill view (trang bill trên phone khách)
- Payment gateway integration (MoMo, ZaloPay, banking API)
- Table status management (open/closed/reserved)
- Revenue reporting / sales dashboard
- Split bill (chia bill giữa nhiều người)

## Technical Constraints

- SQLite single-writer — bill queries và mark-paid phải efficient, tránh long transactions
- SSE broadcast pattern existing — payment events phải compatible với current subscriber registry
- Order.status enum đã có PAID — cần add transition rules mà không break existing flows
- Staff routes không auth (D005 — local WiFi là security boundary)
- Vietnamese UI — tất cả labels, messages, empty states bằng tiếng Việt

## Integration Points

- **SSE Registry (`src/lib/sse.ts`)** — broadcast payment events khi mark-paid, ensure all stations receive
- **Staff Orders API** — GET endpoint cần exclude PAID orders (currently excludes SERVED/CANCELLED — add PAID)
- **Order Status Module** — extend `isValidTransition` và `deriveOrderStatus` cho PAID
- **StaffNav** — thêm tab thứ 4 vào bottom navigation
- **Menu Data** — menu picker modal cần query menu items (reuse existing Prisma query pattern)
- **useOrderStream hook** — handle payment SSE events to remove paid orders from station views

## Testing Requirements

**Unit tests:**
- Bill aggregation logic: multiple orders same table → correct total, cancelled items excluded from total but included in list
- SERVED→PAID transition valid, PAID→any transition invalid (terminal state like CANCELLED)
- `deriveOrderStatus` returns PAID when all non-cancelled items are PAID (or order explicitly marked PAID)
- `calculateOrderTotal` unchanged (already excludes CANCELLED)

**Integration tests:**
- API: GET bill by table returns aggregated data across multiple orders
- API: POST mark-paid sets all table orders to PAID + sets paidAt
- API: POST add item creates new OrderItem linked to existing order + recalculates total

**E2E verification:**
- Full flow: 2 orders on table → open bill → verify aggregation → cancel item → verify total update → add item → verify total update → mark paid → verify SSE broadcast → verify stations cleared

## Acceptance Criteria

**Tab Tính tiền:**
- Tab "💰 Tính tiền" xuất hiện trong staff bottom nav (vị trí thứ 4)
- Trang liệt kê tất cả bàn có ≥1 order chưa paid, hiển thị tên bàn + tổng tiền tạm tính
- Bàn không có order chưa paid → không hiển thị

**Bill detail:**
- Nhấn bàn → xem bill chi tiết gộp tất cả order chưa paid
- Mỗi món hiện: tên, số lượng, giá, trạng thái
- Món cancelled: gạch ngang + không tính vào tổng
- Tổng tiền VND đúng = sum(price × qty) của các món non-cancelled

**Huỷ món trên bill:**
- Món có status PENDING/PREPARING/READY → có nút Huỷ
- Two-tap confirmation, 3-second auto-reset
- Huỷ → PATCH existing endpoint → bill cập nhật tổng → SSE broadcast

**Thêm món trên bill:**
- Nút "+ Thêm món" mở modal menu picker
- Menu picker: tabs DRINK/FOOD, chọn món, nhập số lượng
- Thêm → tạo OrderItem mới → bill cập nhật → SSE broadcast → trạm tương ứng nhận món mới

**Thanh toán:**
- Nút "Đã thanh toán" với two-tap confirmation
- Mark paid → tất cả order bàn đó → status PAID, paidAt = now
- SSE broadcast → bar/kitchen/overview xoá order đã paid
- Bàn biến mất khỏi trang Tính tiền
- Khách mới scan QR bàn đó → đặt hàng bình thường (vì query chỉ lấy order chưa paid)

## Open Questions

- Thêm món trên bill: tạo OrderItem mới trên order cuối cùng (latest unpaid) hay tạo order mới? — Leaning toward adding to latest unpaid order for simplicity, but planning phase should decide.
- Menu picker có cần search/filter hay chỉ cần scroll? — Leaning toward simple scroll với DRINK/FOOD tabs, menu quán nhỏ (~18 items) không cần search.
