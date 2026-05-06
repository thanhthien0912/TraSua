---
estimated_steps: 26
estimated_files: 3
skills_used: []
---

# T01: Create kitchen page, overview page, and staff layout with navigation tabs

Create the three new files that complete the station page topology: kitchen page, overview page, and a shared staff layout with navigation.

## Steps

1. Create `src/app/staff/kitchen/page.tsx` — Server Component, exact same pattern as bar page:
   ```tsx
   import type { Metadata } from 'next'
   import StationView from '@/components/staff/StationView'
   export const metadata: Metadata = { title: 'TraSua - Bếp', description: 'Quản lý đơn hàng đồ ăn — Bếp' }
   export default function KitchenStationPage() { return <StationView station="kitchen" /> }
   ```

2. Create `src/app/staff/page.tsx` — Server Component for overview:
   ```tsx
   import type { Metadata } from 'next'
   import StationView from '@/components/staff/StationView'
   export const metadata: Metadata = { title: 'TraSua - Tổng quan', description: 'Tổng quan đơn hàng — Tất cả trạm' }
   export default function OverviewPage() { return <StationView station="all" /> }
   ```

3. Create `src/app/staff/layout.tsx` — Shared layout wrapping all staff pages. Extract a `StaffNav` client component (needs `usePathname()` for active state). Navigation has three links: Quầy Bar (`/staff/bar`), Bếp (`/staff/kitchen`), Tổng quan (`/staff`). Active link highlighted. Touch targets ≥44px. Vietnamese text.

4. Run `npx tsc --noEmit` to verify TypeScript compiles cleanly.

## Must-Haves

- [ ] Kitchen page renders StationView with station='kitchen'
- [ ] Overview page renders StationView with station='all'
- [ ] Staff layout has navigation tabs for all three stations
- [ ] Active tab is visually highlighted based on current pathname
- [ ] All text is Vietnamese
- [ ] Touch targets ≥44px for tablet use
- [ ] TypeScript compiles cleanly

## Inputs

- `src/app/staff/bar/page.tsx`
- `src/components/staff/StationView.tsx`

## Expected Output

- `src/app/staff/kitchen/page.tsx`
- `src/app/staff/page.tsx`
- `src/app/staff/layout.tsx`

## Verification

npx tsc --noEmit && test -f src/app/staff/kitchen/page.tsx && test -f src/app/staff/page.tsx && test -f src/app/staff/layout.tsx
