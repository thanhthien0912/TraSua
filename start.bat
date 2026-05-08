@echo off
chcp 65001 >nul 2>&1

echo.
echo ========================================
echo    🧋 TraSuá App - Khởi động
echo ========================================
echo.

:: Check for required env vars
if not exist ".env" (
    echo ❌ LỖI: File .env không tìm thấy!
    echo.
    echo Hãy tạo file .env trong thư mục gốc với nội dung:
    echo.
    echo   DATABASE_URL="file:./prisma/dev.db"
    echo   ADMIN_PASSWORD=admin123
    echo   SHOP_IP=192.168.1.100
    echo   SHOP_PORT=3000
    echo.
    echo Xem README.md để biết thêm chi tiết.
    echo.
    pause
    exit /b 1
)

:: Load .env file
for /f "usebackq tokens=1,2 delims==" %%i in (`findstr /r "^ADMIN_PASSWORD= ^SHOP_IP=" .env`) do (
    if "%%i"=="ADMIN_PASSWORD" set ADMIN_PASSWORD=%%j
    if "%%i"=="SHOP_IP" set SHOP_IP=%%j
)

:: Validate ADMIN_PASSWORD
if not defined ADMIN_PASSWORD (
    echo ❌ LỖI: ADMIN_PASSWORD chưa được cấu hình trong .env
    echo.
    echo Thêm dòng sau vào file .env:
    echo   ADMIN_PASSWORD=admin123
    echo.
    pause
    exit /b 1
)

:: Validate SHOP_IP
if not defined SHOP_IP (
    echo ❌ LỖI: SHOP_IP chưa được cấu hình trong .env
    echo.
    echo Thêm dòng sau vào file .env:
    echo   SHOP_IP=192.168.1.100
    echo.
    echo Thay 192.168.1.100 bằng địa chỉ IP thực của máy.
    echo.
    pause
    exit /b 1
)

echo ✅ Đã kiểm tra cấu hình
echo    ADMIN_PASSWORD: ****
echo    SHOP_IP: %SHOP_IP%
echo.

:: Check if node_modules exists
if not exist "node_modules" (
    echo 📦 Đang cài đặt thư viện (lần đầu chạy)...
    call npm install
    if errorlevel 1 (
        echo ❌ LỖI: Cài đặt thư viện thất bại
        pause
        exit /b 1
    )
)

:: Run Prisma migration
echo 🔄 Đang kiểm tra database...
npx prisma migrate deploy >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Migration có vấn đề, thử tạo mới...
    if exist "prisma\dev.db" del "prisma\dev.db"
    call npx prisma migrate dev --name init
    if errorlevel 1 (
        echo ❌ LỖI: Không thể tạo database
        pause
        exit /b 1
    )
    call npx prisma db seed
)

echo ✅ Database sẵn sàng
echo.

:: Start the app
echo 🚀 Đang khởi động ứng dụng...
echo.
echo    Truy cập: http://localhost:3000
echo    Admin:    http://localhost:3000/admin (mk: %ADMIN_PASSWORD%)
echo.
echo ========================================
echo.

npm run dev

pause