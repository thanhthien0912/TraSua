---
estimated_steps: 21
estimated_files: 7
skills_used: []
---

# T01: Install QR/PDF deps, configure env vars, build admin auth with login page, and bundle Vietnamese font

Install qrcode + pdfkit for QR PDF generation, create the admin auth system (helpers, middleware, login page + API route), and bundle a Vietnamese-supporting TTF font for PDF labels. This unblocks all subsequent S03 tasks.

## Steps

1. Run `npm install qrcode pdfkit` and `npm install -D @types/pdfkit @types/qrcode` to add QR and PDF generation libraries
2. Add env vars to `.env` (append, don't overwrite existing DATABASE_URL): `ADMIN_PASSWORD=admin123`, `SHOP_IP=192.168.1.100`, `SHOP_PORT=3000`, `TABLE_COUNT=15`
3. Download a Vietnamese-supporting TTF font and save to `public/fonts/`. **Critical**: PDFKit's built-in Helvetica does NOT support Vietnamese diacritics (ă, ơ, ư, etc.). The font is required for 'Bàn N' labels in the PDF. Recommended: Inter or Noto Sans. Download from GitHub releases (e.g., `https://github.com/rsms/inter/releases`) or Google Fonts static files during development. The offline constraint R006 applies to runtime only — downloading during dev is fine since the font gets bundled in the repo.
4. Create `src/lib/auth.ts` with: `ADMIN_COOKIE_NAME` constant (e.g., 'trasua-admin'), `validateAdminPassword(password: string): boolean` (compares against `process.env.ADMIN_PASSWORD`), `checkAdminCookie(cookieHeader: string | null): boolean` (parses cookie header and checks for valid admin token). Keep Edge-runtime compatible — no Node.js-specific APIs.
5. Create `src/middleware.ts` — Next.js middleware that protects all `/admin/*` routes EXCEPT `/admin/login`. Also exclude `/api/admin/login` from protection (the login endpoint itself must be accessible). Use `NextResponse.redirect()` to send unauthenticated users to `/admin/login`. The middleware runs on Edge runtime — only simple cookie string comparison. Use `config.matcher` to scope to `/admin/:path*`.
6. Create `src/app/api/admin/login/route.ts` — POST handler: read password from JSON request body, validate via auth helper, on success set httpOnly cookie (sameSite: 'lax', path: '/', NO secure flag since this runs on HTTP local network), return JSON `{ success: true }`. On failure return JSON `{ success: false, error: 'Sai mật khẩu' }` with 401 status.
7. Create `src/app/admin/login/page.tsx` — Client component ('use client') with a password form. Vietnamese text: heading 'Đăng nhập Admin', input placeholder 'Mật khẩu', button 'Đăng nhập', error message 'Sai mật khẩu'. On submit, POST to `/api/admin/login`. On success, `window.location.href = '/admin'`. Use warm amber theme (amber-50 bg, amber-900 accents) consistent with existing pages. Mobile-first layout. Apply design polish: text-wrap: balance on heading, active:scale-[0.96] on button, min 40×40px hit area.
8. Verify: `npx tsc --noEmit` reports zero errors and `npm run build` succeeds.

## Must-Haves

- qrcode and pdfkit in package.json dependencies
- @types/pdfkit and @types/qrcode in devDependencies
- ADMIN_PASSWORD, SHOP_IP, SHOP_PORT, TABLE_COUNT appended to .env
- Vietnamese-supporting TTF font file at public/fonts/ (not empty, actual font)
- src/lib/auth.ts with Edge-compatible validateAdminPassword and checkAdminCookie
- src/middleware.ts scoped to /admin/* with login exemption
- Admin login page with Vietnamese text, amber theme, working form
- Login API route setting httpOnly cookie on success
- npx tsc --noEmit zero errors
- npm run build succeeds

## Inputs

- ``package.json` — existing deps to extend`
- ``.env` — existing DATABASE_URL to preserve`
- ``src/app/layout.tsx` — existing root layout with lang=vi and amber theme`
- ``src/app/globals.css` — existing Tailwind + amber color variables`

## Expected Output

- ``package.json` — qrcode, pdfkit, @types/pdfkit, @types/qrcode added`
- ``.env` — ADMIN_PASSWORD, SHOP_IP, SHOP_PORT, TABLE_COUNT appended`
- ``src/lib/auth.ts` — auth helper with validateAdminPassword + checkAdminCookie`
- ``src/middleware.ts` — Next.js middleware protecting /admin/* routes`
- ``src/app/admin/login/page.tsx` — Vietnamese login page with password form`
- ``src/app/api/admin/login/route.ts` — POST login handler setting httpOnly cookie`
- ``public/fonts/Inter.ttf` — Vietnamese-supporting font for PDFKit`

## Verification

npx tsc --noEmit && npm run build && grep -q ADMIN_PASSWORD .env && test -f src/middleware.ts && test -f src/lib/auth.ts && test -f src/app/admin/login/page.tsx && test -f src/app/api/admin/login/route.ts && ls public/fonts/*.ttf
