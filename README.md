# 🧋 TraSua - Hệ Thống Quản Lý Quán Trà Sữa

> Ứng dụng quản lý quán trà sữa hiện đại với giao diện xanh tươi mát, hỗ trợ đặt món QR, real-time order tracking, và quản lý toàn diện.

## ✨ Tính năng chính

### 👥 Khách hàng
- 📱 Đặt món qua QR code tại bàn
- 🎨 Giao diện thân thiện, dễ sử dụng
- 🔄 Cập nhật trạng thái đơn real-time

### 👨‍🍳 Nhân viên
- 🧋 **Quầy Bar**: Quản lý đơn đồ uống
- 🍜 **Bếp**: Quản lý đơn đồ ăn
- 💰 **Tính tiền**: Thanh toán và in hóa đơn
- ➕ **Thêm đơn**: Nhân viên thêm món cho khách
- 📊 **Tổng quan**: Xem tất cả đơn hàng

### 👨‍💼 Quản lý
- 📋 **Thực đơn**: Thêm/sửa/xóa món, quản lý giá
- 🪑 **Bàn**: Quản lý số lượng và tên bàn
- 📄 **QR Code**: Tạo và in mã QR cho các bàn

---

## 🎨 Giao diện

Ứng dụng sử dụng bảng màu **Emerald/Teal** tươi mát:
- Màu chính: Emerald (xanh lá)
- Màu phụ: Teal (xanh ngọc)
- Gradient: `from-emerald-50 via-teal-50 to-cyan-50`

---

## 🛠️ Công nghệ

- **Frontend**: Next.js 16.2.4 + React 19.2.4
- **Styling**: Tailwind CSS v4
- **Database**: SQLite + Prisma 7.8.0
- **Real-time**: Server-Sent Events (SSE)
- **Language**: TypeScript (strict mode)

---

## 📋 Yêu cầu hệ thống

- **Node.js** ≥ 18.0.0 (khuyến nghị LTS)
- **npm** ≥ 9.0.0
- **Hệ điều hành**: Windows 10/11, macOS, hoặc Linux

---

## 🚀 Cài đặt nhanh

### 1. Clone repository
```bash
git clone https://github.com/thanhthien0912/TraSua.git
cd TraSua
```

### 2. Cài đặt dependencies
```bash
npm install
```

### 3. Tạo file `.env`
Tạo file `.env` trong thư mục gốc:

```env
# Database
DATABASE_URL="file:./prisma/dev.db"

# Server configuration
SHOP_IP=192.168.1.100
SHOP_PORT=3000

# Admin
ADMIN_PASSWORD=admin123

# Tables
TABLE_COUNT=15
```

> **Lưu ý:** Thay `192.168.1.100` bằng địa chỉ IP thực của máy trong mạng LAN.

### 4. Khởi tạo database
```bash
npx prisma migrate deploy
npx prisma db seed
```

### 5. Khởi động ứng dụng

**Windows:**
```bash
start.bat
```

**macOS/Linux:**
```bash
chmod +x start.sh
./start.sh
```

Hoặc chạy thủ công:
```bash
npm run dev
```

---

## 📱 Truy cập ứng dụng

### Khách hàng (Đặt món)
```
http://localhost:3000/order?table=1
```
- Quét QR code tại bàn để đặt món
- Thay `1` bằng số bàn tương ứng

### Nhân viên

| Trang | URL | Mô tả |
|-------|-----|-------|
| 🧋 Quầy Bar | `/staff/bar` | Quản lý đơn đồ uống |
| 🍜 Bếp | `/staff/kitchen` | Quản lý đơn đồ ăn |
| ➕ Thêm đơn | `/staff/add-order` | Nhân viên thêm món cho khách |
| 💰 Tính tiền | `/staff/checkout` | Thanh toán và in hóa đơn |
| 📊 Tổng quan | `/staff` | Xem tất cả đơn hàng |

### Quản lý (Admin)
```
http://localhost:3000/admin
```
- **Mật khẩu mặc định**: `admin123`
- Quản lý thực đơn, bàn, và tạo QR code

---

## 🔧 Scripts

```bash
# Development
npm run dev          # Khởi động dev server
npm run build        # Build production
npm start            # Chạy production build

# Database
npx prisma migrate dev    # Tạo migration mới
npx prisma migrate deploy # Apply migrations
npx prisma db seed        # Seed dữ liệu mẫu
npx prisma studio         # Mở Prisma Studio

# Testing
npm test             # Chạy tests
npm run test:watch   # Chạy tests ở chế độ watch

# Code quality
npm run lint         # Kiểm tra linting
npm run type-check   # Kiểm tra TypeScript
```

---

## 📁 Cấu trúc dự án

```
TraSua/
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── seed.ts             # Seed data
│   └── dev.db              # SQLite database
├── src/
│   ├── app/
│   │   ├── admin/          # Admin pages
│   │   │   ├── menu/       # Quản lý thực đơn
│   │   │   ├── tables/     # Quản lý bàn
│   │   │   └── qr/         # Tạo QR code
│   │   ├── staff/          # Staff pages
│   │   │   ├── bar/        # Quầy bar
│   │   │   ├── kitchen/    # Bếp
│   │   │   ├── checkout/   # Tính tiền
│   │   │   └── add-order/  # Thêm đơn
│   │   ├── order/          # Customer order page
│   │   ├── api/            # API routes
│   │   └── globals.css     # Global styles
│   ├── components/
│   │   ├── admin/          # Admin components
│   │   ├── staff/          # Staff components
│   │   ├── order/          # Order components
│   │   └── ui/             # Shared UI components
│   └── lib/
│       ├── prisma.ts       # Prisma client
│       ├── order-status.ts # Order status logic
│       └── format.ts       # Formatting utilities
├── start.bat               # Windows startup script
├── start.sh                # Unix startup script
└── README.md               # This file
```

---

## 🔍 Tìm địa chỉ IP máy

### Windows
1. Mở **Command Prompt** (CMD)
2. Gõ: `ipconfig`
3. Tìm dòng **"IPv4 Address"** (ví dụ: `192.168.1.100`)

### macOS
1. Mở **System Settings** → **Network**
2. Chọn kết nối đang dùng (Wi-Fi hoặc Ethernet)
3. Xem **"IP Address"**

### Linux
```bash
ip addr show
# hoặc
ifconfig
```

---

## 🐛 Xử lý lỗi thường gặp

### Lỗi: "ADMIN_PASSWORD chưa được cấu hình"
**Nguyên nhân:** File `.env` không tồn tại hoặc thiếu biến `ADMIN_PASSWORD`

**Giải pháp:**
```bash
# Tạo file .env với nội dung:
echo "ADMIN_PASSWORD=admin123" > .env
```

### Lỗi: "Port 3000 đã được sử dụng"
**Giải pháp 1:** Đổi port trong `.env`
```env
SHOP_PORT=3001
```

**Giải pháp 2:** Tắt ứng dụng đang dùng port 3000
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9
```

### Lỗi: "Prisma Client không tìm thấy"
```bash
npx prisma generate
```

### Lỗi: Database bị lỗi
```bash
# Xóa database và tạo lại
rm prisma/dev.db
npx prisma migrate deploy
npx prisma db seed
```

### Lỗi: "Cannot find module"
```bash
# Xóa node_modules và cài lại
rm -rf node_modules package-lock.json
npm install
```

---

## 🧪 Testing

Dự án có 178 unit tests covering:
- API routes (order creation, menu, tables)
- Order status transitions
- Bill aggregation
- Item cancellation logic

```bash
npm test                    # Chạy tất cả tests
npm run test:watch          # Watch mode
npm test -- order-status    # Chạy test cụ thể
```

---

## 🔐 Bảo mật

- ✅ Server-side price validation (không tin client)
- ✅ Admin password protection
- ✅ Input sanitization
- ✅ SQL injection prevention (Prisma ORM)
- ✅ XSS protection (React auto-escaping)

---

## 📊 Database Schema

### Models
- **MenuItem**: Món ăn/uống (name, price, category, available)
- **Table**: Bàn (number, name)
- **Order**: Đơn hàng (table, totalAmount, status, paid)
- **OrderItem**: Chi tiết đơn (menuItem, quantity, status, notes)

### Order Status Flow
```
PENDING → PREPARING → READY → SERVED
```

### Item Status Flow
```
PENDING → PREPARING → READY → SERVED
                    ↓
                CANCELLED
```

---

## 🌐 Real-time Updates

Ứng dụng sử dụng **Server-Sent Events (SSE)** để cập nhật real-time:
- Đơn hàng mới → Tự động hiện ở bar/bếp
- Thay đổi trạng thái → Cập nhật ngay lập tức
- Thanh toán → Xóa khỏi danh sách checkout

**Endpoint SSE:**
```
GET /api/staff/orders/stream?station=bar|kitchen|all
```

---

## 🎯 Roadmap

- [ ] Báo cáo doanh thu theo ngày/tháng
- [ ] Xuất hóa đơn PDF
- [ ] Tích hợp máy in nhiệt
- [ ] Quản lý nhân viên và ca làm việc
- [ ] Thống kê món bán chạy
- [ ] Dark mode

---

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón! Vui lòng:
1. Fork repository
2. Tạo branch mới (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

---

## 📝 License

Dự án này được phát hành dưới giấy phép MIT.

---

## 📞 Liên hệ

- **GitHub**: [@thanhthien0912](https://github.com/thanhthien0912)
- **Repository**: [TraSua](https://github.com/thanhthien0912/TraSua)

---

**Chúc quán kinh doanh thuận lợi! 🧋✨**
