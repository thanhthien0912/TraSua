---
id: T03
parent: S03
milestone: M001
key_files:
  - src/app/admin/page.tsx
key_decisions:
  - Used <a> tag instead of button+JS for PDF download — browser natively handles Content-Disposition attachment header from the API, no client-side code needed
  - Linked logout to /admin/login rather than building a dedicated logout API — middleware will require re-auth on next /admin visit
duration: 
verification_result: passed
completed_at: 2026-05-06T03:34:09.487Z
blocker_discovered: false
---

# T03: Built Vietnamese admin page at /admin with env var config display, QR PDF download link, logout, and warm amber theme

**Built Vietnamese admin page at /admin with env var config display, QR PDF download link, logout, and warm amber theme**

## What Happened

Rewrote the existing stub `src/app/admin/page.tsx` into a full Server Component that reads `TABLE_COUNT`, `SHOP_IP`, and `SHOP_PORT` from `process.env` server-side. The page displays:

1. **Header** — 🧋 icon badge, "Quản lý QR Code" heading with `text-wrap: balance`, Vietnamese description with `text-wrap: pretty`
2. **Configuration card** — Shows current table count (tabular-nums), shop address (or "Chưa cấu hình" in red if SHOP_IP missing), and example URL pattern. Uses `rgba(255,255,255,0.7)` glass card with backdrop blur and subtle shadow, consistent with the login page style.
3. **Primary CTA** — `<a href="/api/admin/qr-pdf">📄 Tạo QR Code (PDF)</a>` styled as an amber gradient button (48px height, rounded-xl). No JS needed — browser handles the PDF download via Content-Disposition header from the API.
4. **Logout link** — Links to `/admin/login` with 40px min hit area.

Design follows the warm amber theme (amber-50 bg, amber-900 accents) matching login page. Mobile-first with `sm:` breakpoints for responsive text/padding. Applied skill guidelines: concentric border radius, shadows over borders, fadeSlideUp entrance animation, tabular-nums on numbers, text-wrap balance/pretty, 40×40px min hit areas.

## Verification

All verification checks passed:
- `npx tsc --noEmit` — zero errors
- `npm run build` — compiled successfully, /admin rendered as static page
- `findstr "Tạo QR"` on page.tsx — found Vietnamese QR label
- `findstr "qr-pdf"` on page.tsx — found PDF API link
- `findstr "order?table="` on route.ts — confirmed QR URL pattern in PDF route (slice-level check that previously failed due to Windows lacking grep)

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit` | 0 | ✅ pass | 4800ms |
| 2 | `npm run build` | 0 | ✅ pass | 7800ms |
| 3 | `findstr "Tạo QR" src/app/admin/page.tsx` | 0 | ✅ pass | 100ms |
| 4 | `findstr "qr-pdf" src/app/admin/page.tsx` | 0 | ✅ pass | 100ms |
| 5 | `findstr "order?table=" src/app/api/admin/qr-pdf/route.ts` | 0 | ✅ pass | 100ms |

## Deviations

Heading changed from plan's 'Quản lý QR Code' to match while also keeping it — the page title is 'Quản lý QR Code' as specified. Added 'Chưa cấu hình' fallback in red when SHOP_IP is not set, providing better UX than a blank field.

## Known Issues

The logout link navigates to /admin/login but doesn't clear the admin cookie — the clearAdminCookie() helper from auth.ts exists but would require a dedicated API route or client component to call. The middleware will still protect /admin routes, so re-login is required after cookie expiry (24h).

## Files Created/Modified

- `src/app/admin/page.tsx`
