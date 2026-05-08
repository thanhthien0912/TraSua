# S03: Skeleton Loaders + Error UX Polish — UAT

**Milestone:** M005
**Written:** 2026-05-08T04:17:39.836Z

## UAT: Skeleton Loaders + Error UX Polish (S03)

### Setup
1. Start app: `npm run dev`
2. For network throttling: open DevTools → Network tab → select "Slow 3G"
3. Login to admin: http://localhost:3000/admin → password: admin123

### Test Cases

#### 1. Admin Menu Skeleton
- [ ] Navigate to /admin/menu
- [ ] Before data loads: skeleton rows visible (not spinner)
- [ ] Skeleton rows animate with shimmer effect
- [ ] Data loads → skeleton disappears, items appear

#### 2. Admin Tables Skeleton
- [ ] Navigate to /admin/tables
- [ ] Before data loads: skeleton table cards visible
- [ ] Header (title + add button) visible during skeleton
- [ ] Data loads → skeleton disappears, table list appears

#### 3. Admin QR Skeleton
- [ ] Navigate to /admin/qr
- [ ] Before data loads: skeleton count visible
- [ ] Data loads → skeleton disappears, actual count appears

#### 4. Staff Checkout Skeleton
- [ ] Navigate to /staff/checkout
- [ ] Before data loads: skeleton cards visible (matching card structure)
- [ ] Data loads → skeleton disappears, table list appears

#### 5. Error State — Admin Tables
- [ ] (Cannot easily test without stopping server)
- [ ] If network error occurs: error state shows with ⚠️ icon
- [ ] Retry button appears and works

#### 6. Error State — Staff Checkout
- [ ] If network error occurs: error state shows with ⚠️ icon
- [ ] "Thử lại" button appears and works

### Expected Results
- All skeleton loaders use amber/cream shimmer animation
- No spinner-only loading states in admin pages
- Error states always show in Vietnamese
- 178 tests pass: `npx vitest run`
