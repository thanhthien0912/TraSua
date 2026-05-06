# S03: QR Code Generator — UAT

**Milestone:** M001
**Written:** 2026-05-06T03:37:11.750Z

# S03: QR Code Generator — UAT

**Milestone:** M001
**Written:** 2025-07-13

## UAT Type

- UAT mode: mixed (artifact-driven for build/types/content, live-runtime for auth flow and PDF generation)
- Why this mode is sufficient: Build verification confirms code compiles and routes register. Live-runtime testing needed for actual auth flow, PDF generation, and QR code scanning.

## Preconditions

- `npm run dev` running on localhost:3000
- `.env` contains: ADMIN_PASSWORD=admin123, SHOP_IP=192.168.1.100, SHOP_PORT=3000, TABLE_COUNT=15
- `public/fonts/Inter.ttf` present (334KB)

## Smoke Test

Navigate to http://localhost:3000/admin — should redirect to /admin/login. Log in with "admin123" → should redirect to /admin showing table config and QR download button.

## Test Cases

### 1. Login redirect for unauthenticated users

1. Open http://localhost:3000/admin in a browser (no cookies)
2. **Expected:** Redirected to /admin/login with Vietnamese login form

### 2. Wrong password shows Vietnamese error

1. On /admin/login, enter "wrongpassword" and submit
2. **Expected:** Red error message "Sai mật khẩu" appears with shake animation. No redirect.

### 3. Correct password authenticates and redirects

1. On /admin/login, enter "admin123" and submit
2. **Expected:** Redirected to /admin. Page shows "Quản lý QR Code" heading, config card with "15" tables and "192.168.1.100:3000" address.

### 4. Admin page displays configuration correctly

1. After login, inspect /admin page content
2. **Expected:** Table count shows 15, shop address shows 192.168.1.100:3000, example URL shows "http://192.168.1.100:3000/order?table=1"

### 5. QR PDF download works

1. Click "📄 Tạo QR Code (PDF)" button on /admin
2. **Expected:** Browser downloads "trasua-qr-codes.pdf" (Content-Disposition: attachment)
3. Open the PDF — should contain 15 QR codes in a 3×5 grid layout on one page
4. Each QR has "Bàn N" label with Vietnamese diacritics (not boxes/squares)
5. Each QR has "Quét để đặt món" subtitle

### 6. QR codes encode correct URLs

1. Scan any QR code from the downloaded PDF with a phone
2. **Expected:** QR decodes to `http://192.168.1.100:3000/order?table=N` where N matches the "Bàn N" label

### 7. API route protection works

1. Open http://localhost:3000/api/admin/qr-pdf directly without login cookie
2. **Expected:** Returns 401 Unauthorized (not the PDF)

### 8. Middleware protects all admin routes

1. Clear cookies, navigate to http://localhost:3000/admin
2. **Expected:** Redirect to /admin/login
3. Navigate to http://localhost:3000/api/admin/qr-pdf
4. **Expected:** Redirect to /admin/login

## Edge Cases

### Missing SHOP_IP env var

1. Remove SHOP_IP from .env, restart dev server
2. Navigate to /admin after login
3. **Expected:** Admin page shows "Chưa cấu hình" in red for shop address
4. Click QR download
5. **Expected:** API returns 400 error (SHOP_IP required)

### TABLE_COUNT=0

1. Set TABLE_COUNT=0 in .env, restart dev server
2. Click QR download after login
3. **Expected:** API returns 400 error (no tables to generate)

### Large table count (50+ tables)

1. Set TABLE_COUNT=50, restart, download PDF
2. **Expected:** PDF has 4 pages (50 tables / 15 per page = 3.33 → 4 pages), all QR codes readable

## Failure Signals

- Login form submits but nothing happens (JS error in client component)
- PDF download returns HTML instead of PDF (auth or route misconfiguration)
- QR codes in PDF show squares instead of Vietnamese text (font not loaded)
- /admin accessible without login (middleware not working)
- Build fails with TypeScript errors

## Not Proven By This UAT

- The /order?table=N page does not exist yet — QR codes link to it but it won't be functional until M002
- Real phone QR scanning on local network (requires devices on same WiFi)
- Cookie expiry behavior after 24 hours
- Logout flow (clearAdminCookie helper exists but no dedicated logout API route)
- Performance under concurrent PDF generation requests
- Print quality of QR codes on actual paper

## Notes for Tester

- The admin password is "admin123" (set in .env as ADMIN_PASSWORD)
- Vietnamese diacritics in PDF require Inter.ttf font — if you see boxes, the font file may be corrupted
- The middleware deprecation warning in Next.js 16 console is expected and not a bug
- QR codes will link to /order?table=N which returns 404 until M002 is built — this is by design
