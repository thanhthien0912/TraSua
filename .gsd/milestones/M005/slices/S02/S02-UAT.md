# S02: Table Management + QR Refactor — UAT

**Milestone:** M005
**Written:** 2026-05-08T04:12:15.961Z

## UAT: Table Management + QR Refactor (S02)

### Setup
1. Run `npx prisma migrate deploy` to ensure DB schema is current
2. Start app: `npm run dev`
3. Login to admin: http://localhost:3000/admin → password: admin123
4. Navigate to Bàn tab

### Test Cases

#### 1. Add Table
- [ ] Click "Thêm bàn" button
- [ ] New table "Bàn N" appears in list (auto-numbered)
- [ ] Success toast: "Đã tạo 'Bàn N'"
- [ ] Add 3 more tables → should be Bàn 2, Bàn 3, Bàn 4

#### 2. Rename Table
- [ ] Click "Đổi tên" on any table
- [ ] Input field appears with current name
- [ ] Type new name and press Enter → name updates, success toast
- [ ] Press Escape → cancels edit, name unchanged

#### 3. Delete Empty Table
- [ ] Tap "Xoá" once → button changes to "Xác nhận xoá?" (red)
- [ ] Tap again within 3s → table deleted, success toast
- [ ] Wait 3s → confirmation resets to "Xoá" button

#### 4. Delete Guard (Unpaid Orders)
- [ ] Create an order at a table (don't pay)
- [ ] Attempt to delete that table
- [ ] Error toast: "Bàn đang có N đơn chưa thanh toán. Không thể xoá."
- [ ] Table is NOT deleted

#### 5. QR PDF Generation
- [ ] Navigate to QR Code tab
- [ ] Table count displayed (e.g., "Hiện có 5 bàn")
- [ ] Click download button
- [ ] PDF downloads as "trasua-qr-codes.pdf"
- [ ] PDF contains QR codes for all DB tables
- [ ] New table's QR code has correct URL

#### 6. Empty State
- [ ] Delete all tables
- [ ] Go to QR Code tab → warning/error about no tables

### Expected Results
- All operations show Vietnamese toast feedback
- Delete guard prevents data loss
- QR PDF always reflects current DB state
- 178 tests pass: `npx vitest run`
