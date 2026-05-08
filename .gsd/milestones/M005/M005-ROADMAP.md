# M005: Admin & Polish

**Vision:** Transform TraSua from a developer-run prototype into a deployable shop system. The shop owner manages menu items and tables through a browser-based admin dashboard, customers and staff see polished loading/error states, and the system boots via a simple startup script with clear error messages.

## Success Criteria

- Shop owner creates a new menu item in /admin/menu → it appears on customer /order page → can be ordered → staff receives it on the bar station
- Shop owner soft-deletes a menu item → it disappears from customer menu but remains in admin (grayed out) and order history is preserved
- Shop owner adds a new table in /admin/tables → generates QR PDF → new table's QR code appears with correct URL
- Table deletion is blocked when unpaid orders exist, with Vietnamese error toast
- Customer menu, staff stations, and admin lists show skeleton loaders during initial data fetch
- All CRUD operations show toast feedback (success/error) with Vietnamese messages
- App validates ADMIN_PASSWORD on boot and shows clear error if missing
- start.bat/start.sh starts the app; Vietnamese README documents full setup for a non-developer
- Existing 111 tests continue passing after all changes

## Slices

- [x] **S01: S01** `risk:high` `depends:[]`
  > After this: Shop owner logs into /admin, sees tabbed dashboard with 3 tabs. Creates a new drink item with name/price/category. Toggles an existing item to 'Hết hàng'. Soft-deletes an old item (grayed out in admin, gone from customer menu). Restores it. All operations show toast feedback. Customer /order page excludes hidden items. Existing 111 tests still pass.

- [x] **S02: S02** `risk:medium` `depends:[]`
  > After this: Shop owner navigates to Bàn tab, adds a new table (auto-numbered 'Bàn N'). Renames a table. Attempts to delete a table with unpaid orders — sees Vietnamese error toast. Deletes an empty table. Navigates to QR Code tab, generates PDF — new table appears, deleted table is gone.

- [x] **S03: S03** `risk:low` `depends:[]`
  > After this: On slow network (throttled in DevTools), customer menu shows skeleton cards during fetch. Staff station views show skeleton order cards. Admin lists show skeleton rows. Network error on any page shows Vietnamese error state with retry button.

- [x] **S04: S04** `risk:low` `depends:[]`
  > After this: Owner runs start.bat on Windows shop machine. Script validates env vars, runs migration, builds, and starts the app. If ADMIN_PASSWORD is missing, a clear Vietnamese error appears. Vietnamese README guides a non-developer through Node.js install, env setup, seed, and launch.

## Boundary Map

| Concern | Decision | Slice |\n|---------|----------|-------|\n| Auth boundary | Existing middleware covers /admin/* and /api/admin/* — no changes needed | All |\n| Schema migration | `hidden: Boolean @default(false)` preserves all existing data and FK integrity | S01 |\n| FK integrity | Soft-delete (hidden flag) preserves MenuItem→OrderItem references — no cascade deletes | S01 |\n| Table deletion guard | Check for unpaid orders (paidAt IS NULL) before allowing table deletion | S02 |\n| Toast z-index | Portal-based ToastProvider at root layout level, z-60+ to clear CartSheet (z-50) and modals | S01 |\n| Customer query filtering | All customer-facing queries must add `hidden: false` filter after migration | S01 |\n| Staff menu filtering | Staff menu picker must exclude hidden items | S01 |\n| Order creation guard | POST /api/order must reject hidden menu items even if client sends the ID | S01 |\n| QR source of truth | QR PDF reads tables from DB, TABLE_COUNT env var becomes optional/deprecated | S02 |\n| Existing test suite | 111 tests must pass after schema migration; run `vitest run` after S01 | S01 |\n| No new dependencies | Toast, skeleton components built with React + Tailwind only | S01, S03 |
