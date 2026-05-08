# 🧋 TraSuá App — Hướng Dẫn Cài Đặt

## Mục lục
1. [Yêu cầu](#1-yêu-cầu)
2. [Cài đặt nhanh](#2-cài-đặt-nhanh)
3. [Cấu hình](#3-cấu-hình)
4. [Khởi động ứng dụng](#4-khởi-động-ứng-dụng)
5. [Truy cập ứng dụng](#5-truy-cập-ứng-dụng)
6. [Xử lý lỗi](#6-xử-lý-lỗi)

---

## 1. Yêu cầu

- **Node.js** phiên bản 18 trở lên
  - Tải tại: https://nodejs.org (chọn bản LTS)
- **npm** (đã có sẵn khi cài Node.js)
- **Windows 10/11** hoặc **macOS** hoặc **Linux**

---

## 2. Cài đặt nhanh

### Bước 1: Cài đặt Node.js
1. Truy cập https://nodejs.org
2. Tải bản **LTS** (khuyến nghị)
3. Cài đặt theo hướng dẫn mặc định

### Bước 2: Cài đặt thư viện
Mở **CMD** hoặc **PowerShell**, chạy:

```bash
cd D:\TraSua
npm install
```

Đợi cho đến khi hoàn tất (có thể mất 2-5 phút).

### Bước 3: Tạo file cấu hình
Tạo file `.env` trong thư mục gốc với nội dung:

```
# Prisma SQLite database URL
DATABASE_URL="file:./prisma/dev.db"

# Admin panel configuration
ADMIN_PASSWORD=admin123
SHOP_IP=192.168.1.100
SHOP_PORT=3000
TABLE_COUNT=15
```

> **Lưu ý:** Thay `192.168.1.100` bằng địa chỉ IP thực của máy tính trong mạng LAN.

### Bước 4: Chạy migration và seed
```bash
npx prisma migrate deploy
npx prisma db seed
```

---

## 3. Cấu hình

### Các biến môi trường

| Biến | Mô tả | Ví dụ |
|------|-------|-------|
| `DATABASE_URL` | Đường dẫn database SQLite | `file:./prisma/dev.db` |
| `ADMIN_PASSWORD` | Mật khẩu đăng nhập trang quản lý | `admin123` |
| `SHOP_IP` | Địa chỉ IP máy trong mạng LAN | `192.168.1.100` |
| `SHOP_PORT` | Cổng chạy ứng dụng | `3000` |
| `TABLE_COUNT` | Số bàn mặc định | `15` |

### Tìm địa chỉ IP máy

**Windows:**
1. Mở CMD, gõ: `ipconfig`
2. Tìm dòng "IPv4 Address" (ví dụ: `192.168.1.100`)

**macOS:**
1. Mở System Preferences → Network
2. Chọn kết nối mạng đang dùng
3. Xem "IPv4 Address"

---

## 4. Khởi động ứng dụng

### Cách 1: Dùng script có sẵn (Khuyến nghị)

**Windows:** Chạy file `start.bat` (double-click hoặc gõ trong CMD)

**macOS/Linux:** Chạy file `start.sh` trong Terminal:
```bash
chmod +x start.sh
./start.sh
```

Script sẽ tự động:
- Kiểm tra các biến môi trường
- Chạy migration nếu cần
- Khởi động server

### Cách 2: Chạy thủ công

```bash
# Khởi động development server
npm run dev

# Hoặc build và chạy production
npm run build
npm start
```

---

## 5. Truy cập ứng dụng

### Trang khách hàng (Đặt món)
```
http://localhost:3000/order?table=1
```
- Thay `1` bằng số bàn tương ứng
- Khách hàng quét QR code để đặt món

### Trang nhân viên (Bar)
```
http://localhost:3000/staff/bar
```
- Xem và cập nhật đơn nước

### Trang nhân viên (Bếp)
```
http://localhost:3000/staff/kitchen
```
- Xem và cập nhật đơn đồ ăn

### Trang thanh toán
```
http://localhost:3000/staff/checkout
```
- Tính tiền và in hóa đơn

### Trang quản lý (Admin)
```
http://localhost:3000/admin
```
- **Mật khẩu:** `admin123` (hoặc giá trị `ADMIN_PASSWORD` trong .env)

Quản lý:
- **Thực đơn:** Thêm/sửa/xóa món, đổi giá
- **Bàn:** Thêm/xóa bàn, đổi tên
- **QR Code:** Tải file PDF in mã QR cho các bàn

---

## 6. Xử lý lỗi

### Lỗi: "ADMIN_PASSWORD chưa được cấu hình"
- Kiểm tra file `.env` có tồn tại không
- Đảm bảo có dòng `ADMIN_PASSWORD=...`

### Lỗi: "SHOP_IP chưa được cấu hình"
- Kiểm tra file `.env` có dòng `SHOP_IP=...`
- Thay bằng địa chỉ IP thực của máy

### Lỗi: "Prisma Migrate failed"
```bash
# Xóa database cũ và tạo lại
rm prisma/dev.db
npx prisma migrate deploy
npx prisma db seed
```

### Lỗi: "Port 3000 đã được sử dụng"
- Đổi cổng bằng cách thêm vào `.env`:
  ```
  SHOP_PORT=3001
  ```
- Hoặc tắt ứng dụng khác đang dùng port 3000

### Lỗi: Cannot find module
```bash
npm install
```

### Các lỗi khác
```bash
# Xóa node_modules và cài lại
rm -rf node_modules
npm install
```

---

## Cấu trúc dự án

```
D:\TraSua\
├── prisma/
│   ├── schema.prisma    # Schema database
│   └── dev.db           # Database SQLite
├── src/
│   ├── app/
│   │   ├── admin/       # Trang quản lý
│   │   ├── order/       # Trang đặt món (khách)
│   │   ├── staff/       # Trang nhân viên
│   │   └── api/         # API endpoints
│   └── components/      # Các component React
├── start.bat            # Script khởi động Windows
├── start.sh             # Script khởi động Mac/Linux
└── README.md            # File này
```

---

## Liên hệ hỗ trợ

Nếu gặp lỗi không giải quyết được, kiểm tra:
1. File `.env` có đúng format không
2. Đã chạy `npm install` thành công chưa
3. Port 3000 có đang bị chiếm không
4. Node.js phiên bản có >= 18 không

---

**Chúc quán kinh doanh thuận lợi! 🧋☕**