---
estimated_steps: 3
estimated_files: 6
skills_used: []
---

# T01: Add skeleton loaders to all pages

Add skeleton loaders to customer /order page, staff station pages, and admin pages. Show skeleton cards during initial data fetch (loading state). Use CSS-based skeleton animations (no JS library). Use amber/cream color scheme matching the app's warm palette.

**Files:** src/app/order/page.tsx, src/components/order/MenuView.tsx, src/components/staff/StationView.tsx, src/app/admin/menu/page.tsx, src/app/admin/tables/page.tsx, src/app/admin/qr/page.tsx

**Verification:** DevTools throttling (Slow 3G) shows skeleton cards instead of spinner during fetch. Build succeeds.

## Inputs

- `S01 admin shell, S02 table management`

## Expected Output

- `Skeleton loader components and loading states across all pages`

## Verification

DevTools throttling shows skeletons; build succeeds
