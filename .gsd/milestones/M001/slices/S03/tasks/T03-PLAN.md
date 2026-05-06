---
estimated_steps: 18
estimated_files: 1
skills_used: []
---

# T03: Build Vietnamese admin page at /admin with QR generator UI and PDF download button

Create the admin main page — the user-facing integration point that wires the QR PDF API to a polished Vietnamese interface. This is a Server Component that reads env vars and provides a download link.

## Steps

1. Create `src/app/admin/page.tsx` as a React Server Component (no 'use client' needed — reads env vars from process.env server-side and renders a download link)
2. Read configuration from env vars: `TABLE_COUNT` (default '15'), `SHOP_IP` (show actual value or 'Chưa cấu hình'), `SHOP_PORT` (default '3000')
3. Render page structure: heading 'Quản lý QR Code' (text-wrap: balance), description explaining the feature in Vietnamese
4. Display configuration info card: 'Số bàn: {TABLE_COUNT}', 'Địa chỉ: http://{SHOP_IP}:{SHOP_PORT}', 'Mẫu URL: http://{SHOP_IP}:{SHOP_PORT}/order?table=N'
5. Add primary CTA: `<a href="/api/admin/qr-pdf" className="...">Tạo QR Code (PDF)</a>` — the browser will handle the download when it receives the PDF Content-Disposition header. No JavaScript needed. Style as a prominent button (amber-900 bg, amber-50 text, rounded-xl, h-12+, active:scale-[0.96])
6. Add a 'Đăng xuất' (Logout) link or note — can simply clear the cookie and redirect to /admin/login, OR just link to /admin/login. For simplicity, a link is fine for now.
7. Apply design polish following warm amber theme: amber-50 background, cards with bg-white/70 and shadow, generous spacing, mobile-first layout (full-width on mobile → max-w-lg centered on desktop). Use sm:/md: Tailwind breakpoints. Apply text-wrap: balance on headings, text-wrap: pretty on body text. Minimum 40×40px hit areas on interactive elements.
8. Verify final build: `npx tsc --noEmit` and `npm run build` both succeed with zero errors.

## Must-Haves

- Vietnamese headings and labels throughout ('Quản lý QR Code', 'Tạo QR Code', etc.)
- Displays TABLE_COUNT and SHOP_IP configuration
- Download button/link triggers PDF download from /api/admin/qr-pdf
- Mobile-first responsive layout with Tailwind sm:/md: breakpoints
- Warm amber theme consistent with existing landing page
- npx tsc --noEmit zero errors
- npm run build succeeds

## Inputs

- ``src/app/api/admin/qr-pdf/route.ts` — PDF API endpoint to link to`
- ``src/lib/auth.ts` — auth helpers (for potential logout feature)`
- ``src/app/globals.css` — existing Tailwind + amber color variables`
- ``src/app/layout.tsx` — root layout with lang=vi and system font`

## Expected Output

- ``src/app/admin/page.tsx` — Vietnamese admin page with QR generator UI and PDF download link`

## Verification

npx tsc --noEmit && npm run build && grep -q 'Tạo QR' src/app/admin/page.tsx && grep -q 'qr-pdf' src/app/admin/page.tsx
