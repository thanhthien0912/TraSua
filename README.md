# 🧋 TraSua - Hệ Thống Quản Lý Quán Trà Sữa (Cloud Version)

Ứng dụng quản lý quán trà sữa với đặt món qua mã QR, quản lý đơn hàng theo trạm (Bar/Bếp) và ứng dụng điện thoại (Android).

## ✨ Tính năng

- 📱 **Khách hàng**: Đặt món qua mã QR dán tại bàn.
- 👨‍🍳 **Nhân viên**: Trạm pha chế (Nước), Trạm bếp (Đồ ăn), Tính tiền nhanh.
- 👨‍💼 **Quản lý**: Quản lý thực đơn (ẩn/hiện món), Quản lý bàn, In mã QR tự động.

## 🛠️ Kiến trúc hệ thống (Cloud)

- **Frontend/Backend:** Next.js 15 + React 19 + TypeScript.
- **Giao diện:** Tailwind CSS v4 (Tone màu nâu/cam ấm áp).
- **Cơ sở dữ liệu:** PostgreSQL lưu trữ trên đám mây (Supabase).
- **Đồng bộ thời gian thực:** Cơ chế Polling tối ưu cho Serverless.
- **Lưu trữ/Deploy:** Vercel.
- **Mobile App:** Capacitor (Build Android APK tự động qua GitHub Actions).

## 🚀 Hướng dẫn triển khai cho Quán

### 1. Triển khai Web lên Vercel
1. Đăng ký tài khoản [Supabase](https://supabase.com) và tạo một Project mới.
2. Lấy chuỗi kết nối Database (Connection String - URI).
3. Đăng nhập [Vercel](https://vercel.com), thêm mới Project từ GitHub Repository này.
4. Trong phần **Environment Variables**, thêm 2 biến:
   - `DATABASE_URL="postgresql://...[password]...@...:6543/postgres?pgbouncer=true"`
   - `DIRECT_URL="postgresql://...[password]...@...:5432/postgres"`
   - `ADMIN_PASSWORD="[Mật_khẩu_vào_trang_quản_lý]"`
5. Bấm **Deploy**.

### 2. Khởi tạo Cơ sở dữ liệu
Sau khi Vercel Deploy thành công, mở Terminal tại máy tính của bạn, chạy:
```bash
git clone https://github.com/thanhthien0912/TraSua.git
cd TraSua
npm install
```
Tạo file `.env` chứa `DATABASE_URL` và `DIRECT_URL` giống như trên Vercel. Sau đó chạy:
```bash
npx prisma db push
```

### 3. Cập nhật Mobile App (APK)
1. Mở file `capacitor.config.ts`.
2. Sửa `url` thành đường link Vercel của bạn.
3. Chạy lệnh: `git commit -am "Update URL" && git push`.
4. Vào tab **Actions** trên GitHub, đợi quá trình build hoàn tất và tải file `.apk` về điện thoại.

## 📱 Sơ đồ trang web

| Mục | Đường dẫn | Chức năng |
|-------|-----|-------|
| Khách hàng | `/order?table=[ID]` | Menu gọi món cho khách (quét QR để vào) |
| Quầy Bar | `/staff/bar` | Màn hình cho nhân viên pha chế (chỉ hiện Nước) |
| Bếp | `/staff/kitchen` | Màn hình cho khu vực bếp (chỉ hiện Đồ ăn) |
| Tính tiền | `/staff/checkout` | Tính tiền, in bill, huỷ đơn |
| Quản lý | `/admin` | Thêm món, tạo bàn, in mã QR (Yêu cầu Mật khẩu) |

## 🌐 Chế độ tự động trên Điện thoại
Sau khi tải file APK cài vào máy tính bảng/điện thoại ở quán, ứng dụng sẽ chạy ở chế độ toàn màn hình và tự động kết nối với máy chủ Vercel. Quán của bạn có thể tắt máy tính chủ, hệ thống vẫn hoạt động 24/7.

---
*Phát triển bởi Thanh Thiện*
