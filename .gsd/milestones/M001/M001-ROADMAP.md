# M001: Project Foundation

**Vision:** Thiết lập nền tảng dự án: Next.js app chạy được, database schema, seed data menu trà sữa mẫu, và công cụ tạo QR code cho bàn. Sau milestone này, dev có thể chạy app local và thấy trang chủ + database hoạt động.

## Success Criteria

- Next.js app chạy thành công trên localhost:3000
- Database schema đầy đủ bảng cho menu, bàn, đơn hàng
- Seed data có ít nhất 10 món trà sữa mẫu với phân loại drink/food
- QR generator tạo được mã cho N bàn, scan mở đúng URL

## Slices

- [x] **S01: S01** `risk:low` `depends:[]`
  > After this: Chạy npm run dev → mở localhost:3000 → thấy trang chủ TraSua

- [ ] **S02: S02** `risk:medium` `depends:[]`
  > After this: Chạy prisma db seed → database có 10+ món mẫu → query thấy đúng

- [ ] **S03: QR Code Generator** `risk:low` `depends:[S01]`
  > After this: /admin/qr hiển thị QR các bàn → scan mở đúng /order?table=N

## Boundary Map

Not provided.
