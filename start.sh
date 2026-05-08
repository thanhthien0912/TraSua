#!/bin/bash

# TraSuá App - Startup Script
# For macOS and Linux

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "========================================"
echo "   🧋 TraSuá App - Khởi động"
echo "========================================"
echo ""

# Check for .env file
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ LỖI: File .env không tìm thấy!${NC}"
    echo ""
    echo "Hãy tạo file .env trong thư mục gốc với nội dung:"
    echo ""
    echo 'DATABASE_URL="file:./prisma/dev.db"'
    echo 'ADMIN_PASSWORD=admin123'
    echo 'SHOP_IP=192.168.1.100'
    echo 'SHOP_PORT=3000'
    echo ""
    echo "Xem README.md để biết thêm chi tiết."
    echo ""
    exit 1
fi

# Load and validate env vars
ADMIN_PASSWORD=$(grep "^ADMIN_PASSWORD=" .env | cut -d'=' -f2- | tr -d '"')
SHOP_IP=$(grep "^SHOP_IP=" .env | cut -d'=' -f2- | tr -d '"')

# Validate ADMIN_PASSWORD
if [ -z "$ADMIN_PASSWORD" ]; then
    echo -e "${RED}❌ LỖI: ADMIN_PASSWORD chưa được cấu hình trong .env${NC}"
    echo ""
    echo "Thêm dòng sau vào file .env:"
    echo "  ADMIN_PASSWORD=admin123"
    echo ""
    exit 1
fi

# Validate SHOP_IP
if [ -z "$SHOP_IP" ]; then
    echo -e "${RED}❌ LỖI: SHOP_IP chưa được cấu hình trong .env${NC}"
    echo ""
    echo "Thêm dòng sau vào file .env:"
    echo "  SHOP_IP=192.168.1.100"
    echo ""
    echo "Thay 192.168.1.100 bằng địa chỉ IP thực của máy."
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Đã kiểm tra cấu hình${NC}"
echo "   ADMIN_PASSWORD: ****"
echo "   SHOP_IP: $SHOP_IP"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Đang cài đặt thư viện (lần đầu chạy)...${NC}"
    npm install
fi

# Run Prisma migration
echo -e "${YELLOW}🔄 Đang kiểm tra database...${NC}"
if ! npx prisma migrate deploy 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Migration có vấn đề, thử tạo mới...${NC}"
    rm -f prisma/dev.db
    npx prisma migrate dev --name init
    npx prisma db seed
fi

echo -e "${GREEN}✅ Database sẵn sàng${NC}"
echo ""

# Start the app
echo -e "${YELLOW}🚀 Đang khởi động ứng dụng...${NC}"
echo ""
echo "   Truy cập: http://localhost:3000"
echo "   Admin:    http://localhost:3000/admin (mk: ******)"
echo ""
echo "========================================"
echo ""

npm run dev