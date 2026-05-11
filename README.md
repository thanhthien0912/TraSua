# 🧋 TraSua - Hệ Thống Quản Lý Quán Trà Sữa

Ứng dụng quản lý quán trà sữa với đặt món QR, real-time tracking, và giao diện xanh tươi mát.

## ✨ Tính năng

- 📱 **Khách hàng**: Đặt món qua QR code
- 👨‍🍳 **Nhân viên**: Quầy bar, bếp, tính tiền, thêm đơn
- 👨‍💼 **Quản lý**: Thực đơn, bàn, QR code

## 🛠️ Tech Stack

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS v4 (Emerald/Teal theme)
- Prisma 7 + SQLite
- Server-Sent Events (SSE)

## 🚀 Cài đặt

```bash
# 1. Clone và cài đặt
git clone https://github.com/thanhthien0912/TraSua.git
cd TraSua
npm install

# 2. Tạo file .env
cat > .env << EOF
DATABASE_URL="file:./prisma/dev.db"
SHOP_IP=192.168.1.100
SHOP_PORT=3000
ADMIN_PASSWORD=admin123
TABLE_COUNT=15
EOF

# 3. Khởi tạo database
npx prisma migrate deploy
npx prisma db seed

# 4. Chạy ứng dụng
npm run dev
```

**Windows**: Chạy `start.bat`  
**Mac/Linux**: Chạy `./start.sh`

## 📱 Truy cập

| Trang | URL | Mô tả |
|-------|-----|-------|
| Khách hàng | `/order?table=1` | Đặt món qua QR |
| Quầy Bar | `/staff/bar` | Quản lý đồ uống |
| Bếp | `/staff/kitchen` | Quản lý đồ ăn |
| Tính tiền | `/staff/checkout` | Thanh toán |
| Quản lý | `/admin` | Thực đơn, bàn, QR (pass: `admin123`) |

## 🔧 Scripts

```bash
npm run dev          # Development
npm run build        # Build production
npm test             # Run tests (178 tests)
npx prisma studio    # Database GUI
```

## 🐛 Xử lý lỗi

**Port 3000 đã dùng:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Database lỗi:**
```bash
rm prisma/dev.db
npx prisma migrate deploy
npx prisma db seed
```

## 📊 Database

```
MenuItem → Order → OrderItem
Table    ↗

Status flow: PENDING → PREPARING → READY → SERVED
```

## 🌐 Real-time

SSE endpoint: `GET /api/staff/orders/stream?station=bar|kitchen|all`

---

**Chúc quán kinh doanh thuận lợi! 🧋**
# TraSua Online
