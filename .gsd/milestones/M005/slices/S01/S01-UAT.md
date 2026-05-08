# S01: Admin Menu Management — UAT

**Milestone:** M005
**Written:** 2026-05-06T09:18:35.748Z

## UAT: S01 — Admin Menu Management

**UAT Type:** Manual functional verification via browser and API calls against a running local instance.

### Preconditions
- App running at localhost:3000 with seeded data (18 menu items, 15 tables)
- Admin logged in (ADMIN_PASSWORD cookie set)
- Customer order page accessible at /order?table=1

---

### Test Case 1: Admin Dashboard Navigation
1. Navigate to `/admin`
2. **Expected:** Redirected to `/admin/menu`
3. See bottom navigation with 3 tabs: Thực đơn, Bàn, QR Code, plus Đăng xuất link
4. Tap "Bàn" tab → navigates to `/admin/tables` (stub page)
5. Tap "QR Code" tab → navigates to `/admin/qr` (stub page)
6. Tap "Thực đơn" tab → back to `/admin/menu`

### Test Case 2: View Menu Items
1. On `/admin/menu`, see category tabs (DRINK / FOOD)
2. **Expected:** DRINK tab shows 12 items, FOOD tab shows 6 items (per seed data)
3. Each card shows: name, description, price in VND, sortOrder badge
4. Items are sorted by sortOrder
5. No hidden items initially (all seed items have hidden=false)

### Test Case 3: Create New Menu Item
1. Tap "+Thêm" button in header
2. **Expected:** Slide-up modal appears with form fields
3. Enter: name="Trà Đào", price=35000, category=DRINK, description="Trà đào cam sả"
4. Tap "Thêm món"
5. **Expected:** Toast success "Đã thêm món mới" appears. Modal closes. New item appears in DRINK tab.
6. Open `/order?table=1` in another tab
7. **Expected:** "Trà Đào" visible in customer menu at 35,000₫

### Test Case 4: Edit Menu Item
1. On `/admin/menu`, tap edit (pencil) button on any item
2. **Expected:** Modal opens pre-populated with item data
3. Change price to 40000
4. Tap "Cập nhật"
5. **Expected:** Toast success. Item card shows updated price.

### Test Case 5: Toggle Availability
1. Tap availability button on an item showing "Hết hàng" text
2. **Expected:** Toast confirms. Item shows "Hết hàng" badge (orange)
3. Open `/order?table=1`
4. **Expected:** Item shows "Hết hàng" badge on customer page (still visible but unorderable)
5. Back on admin, tap button again → "Còn hàng" restores availability

### Test Case 6: Soft-Delete (Hide) Menu Item
1. Note item count in DRINK tab (e.g., "13")
2. Tap delete (trash) button on an item
3. **Expected:** Button turns red with "Xác nhận xoá?" text
4. Wait 3 seconds without tapping
5. **Expected:** Button resets to normal (auto-cancel)
6. Tap delete again, then tap red confirm within 3 seconds
7. **Expected:** Toast success "Đã ẩn món". Item moves to bottom of list with 55% opacity, 'Đã ẩn' badge. DRINK count decrements.
8. Open `/order?table=1`
9. **Expected:** Hidden item is NOT visible on customer menu
10. Call `GET /api/staff/menu` 
11. **Expected:** Hidden item is NOT in staff menu response

### Test Case 7: Restore Hidden Item
1. On admin page, scroll to bottom to find hidden item (grayed out)
2. Tap green "Khôi phục" button
3. **Expected:** Toast success. Item restored to normal opacity and position. Count increments.
4. Open `/order?table=1`
5. **Expected:** Restored item visible again on customer menu

### Test Case 8: Order Rejection for Hidden Items
1. Hide a menu item via admin
2. Attempt to create an order containing that item's ID via POST /api/order
3. **Expected:** 400 response with message "Món này không còn trong thực đơn"

### Test Case 9: Toast Visibility and Z-Index
1. Open customer page with cart sheet visible (z-50)
2. Trigger a toast (e.g., submit an order)
3. **Expected:** Toast appears above the cart sheet, not behind it

### Test Case 10: Form Validation
1. Open create form, leave name empty, tap submit
2. **Expected:** Vietnamese error "Tên món không được để trống"
3. Enter name, set price to 0
4. **Expected:** Vietnamese error "Giá phải lớn hơn 0"

---

### Not Proven By This UAT
- **Table management** (S02 scope): Admin Bàn tab is a stub — CRUD for tables not yet implemented
- **QR refactor** (S02 scope): Admin QR Code tab is a stub — QR generation from DB tables not yet implemented
- **Skeleton loaders** (S03 scope): No loading state polish — admin page shows raw loading or nothing during fetch
- **Error states** (S03 scope): No retry-on-error UI for admin pages
- **Performance under load**: No load testing for admin CRUD endpoints
- **Concurrent admin editing**: No optimistic locking — last write wins
- **Browser compatibility**: Tested only conceptually — no cross-browser matrix
- **Offline resilience**: App requires network; no offline support tested
