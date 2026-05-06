---
estimated_steps: 28
estimated_files: 3
skills_used: []
---

# T03: Build Vietnamese TraSua landing page and verify full stack

Replace the default Next.js home page with a TraSua-branded Vietnamese landing page. This directly advances R007 (Vietnamese UI, mobile-first). Also serves as full-stack verification — confirms Next.js + Tailwind + Prisma all work together.

## Steps

1. **Update `src/app/layout.tsx`:** Change `lang="en"` to `lang="vi"` on the `<html>` element. Update the metadata title to 'TraSua - Đặt Món' and description to a Vietnamese string.
2. **Replace `src/app/page.tsx`** with a simple TraSua landing page:
   - Vietnamese heading: 'Chào mừng đến TraSua' or similar
   - Brief description in Vietnamese about the ordering system
   - Mobile-first layout using Tailwind — should look good at 375px (iPhone SE)
   - Use Tailwind utility classes for responsive design (text sizing, padding, layout)
   - Include a simple visual element (emoji or SVG icon for bubble tea)
   - Keep it simple — this is a placeholder landing page, not the final UI
3. **Clean up `src/app/globals.css`:** Keep the Tailwind imports (`@import "tailwindcss"`) and any base styles. Remove any default Next.js demo styles that might conflict.
4. **Verify the full stack works:**
   - Run `npx tsc --noEmit` — must pass with zero errors
   - Run `npm run build` — must complete successfully
   - Confirm the page source contains Vietnamese text

## Must-Haves

- [ ] `src/app/layout.tsx` has `lang="vi"` on the html element
- [ ] `src/app/page.tsx` contains Vietnamese text (not default Next.js content)
- [ ] Page uses Tailwind for mobile-first responsive layout
- [ ] `npm run build` succeeds with zero errors
- [ ] `npx tsc --noEmit` passes with zero errors

## Important constraints

- Use Tailwind v4 CSS patterns — `@import "tailwindcss"` in globals.css, utility classes in JSX
- Mobile-first: design for 375px width first, scale up. Use Tailwind responsive prefixes (sm:, md:, lg:)
- All user-facing text must be in Vietnamese
- Do NOT import or use the Prisma client on the landing page — it's just a static welcome page
- Do NOT add any fonts that require internet download — stick with system fonts for R006 compliance
- Tailwind v4 may not have a `tailwind.config.ts` — configuration is CSS-based. Check what the scaffold created and work with it.

## Inputs

- ``src/app/layout.tsx` — scaffold layout from T01, needs lang="vi"`
- ``src/app/page.tsx` — scaffold default page from T01, will be replaced`
- ``src/app/globals.css` — Tailwind imports from T01`

## Expected Output

- ``src/app/layout.tsx` — root layout with lang="vi" and Vietnamese metadata`
- ``src/app/page.tsx` — TraSua Vietnamese landing page with mobile-first Tailwind`
- ``src/app/globals.css` — cleaned up Tailwind styles`

## Verification

npx tsc --noEmit && npm run build && node -e "const fs=require('fs');const p=fs.readFileSync('src/app/layout.tsx','utf8');if(!p.includes('lang=\"vi\"'))throw new Error('Missing lang=vi');const pg=fs.readFileSync('src/app/page.tsx','utf8');if(!pg.includes('TraSua'))throw new Error('Missing TraSua branding');console.log('Landing page OK')"
