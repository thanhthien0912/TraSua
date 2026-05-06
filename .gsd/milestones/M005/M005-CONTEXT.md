# M005: Admin & Polish

**Gathered:** 2025-07-20
**Status:** Ready for planning

## Project Description

TraSua is a local-network POS and order management system for a bubble tea shop. Customers scan QR codes at tables to browse and order; staff manage orders on a real-time dashboard with station routing. M001–M004 delivered the full ordering loop from QR scan through payment. M005 is the final milestone — transforming the system from a dev project into a deployable shop system with admin capabilities, UX polish, and deployment readiness.

## Why This Milestone

The core ordering loop works end-to-end, but the shop owner has no way to manage the menu or tables without editing code. Menu items are seed-data only. Tables are env-var driven. There's no loading/error UX to handle real-world WiFi hiccups. The system can't be started by a non-developer. M005 closes all of these gaps — making TraSua actually usable in a real shop.

## User-Visible Outcome

### When this milestone is complete, the user can:

- **Shop owner** logs into /admin, adds a new menu item with name/price/category, toggles an existing item as "Hết hàng", soft-deletes an old item, adds a new table, removes an unused table, and regenerates QR codes — all through the browser UI
- **Customers and staff** see skeleton loaders during data fetches, get toast feedback on actions, see friendly error pages when something goes wrong — a polished experience on a local WiFi network
- **Shop owner** runs a startup script on the shop machine and the system boots with env validation and clear error messages if something's misconfigured

### Entry point / environment

- Entry point: `http://localhost:3000/admin` (admin dashboard), `http://SHOP_IP:3000/order?table=N` (customer), `http://SHOP_IP:3000/staff` (staff dashboard)
- Environment: Local network — laptop/PC/tablet at the shop, customers on shop WiFi
- Live dependencies involved: SQLite database (local file), no external services

## Completion Class

- Contract complete means: Admin CRUD APIs return correct responses for all operations (create, read, update, soft-delete menu items; add, remove, rename tables). Toast component renders success/error feedback. Skeleton loaders appear during data fetches. All provable via unit tests + build verification.
- Integration complete means: Menu changes in admin immediately reflect on the customer /order page. Table additions appear in the QR PDF. Table deletion is blocked when unpaid orders exist. SSE continues working after admin changes.
- Operational complete means: The app starts cleanly via startup script, validates required env vars on boot, shows a graceful error if DB is missing, and the Vietnamese README contains enough information for a non-developer to set up the system.

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- Shop owner adds a new drink item in admin → customer scanning QR immediately sees it on the menu → orders it → staff receives it on the bar station. Full loop through the new admin surface.
- Shop owner adds a new table in admin → generates QR PDF → the new table's QR code appears in the PDF with the correct URL.
- Staff/customer pages show skeleton loaders during initial data fetch and toast notifications on actions — verified visually on a mobile viewport.
- The app starts successfully via the startup script with correct env vars, and shows a clear Vietnamese error message when ADMIN_PASSWORD is missing.

## Architectural Decisions

### Admin Dashboard Layout — Tabbed Navigation

**Decision:** The admin area at `/admin` becomes a tabbed dashboard with three tabs: Thực đơn (Menu), Bàn (Tables), QR Code. Reuses the bottom-tab pattern from the StaffNav component.

**Rationale:** The staff dashboard already established a tabbed navigation pattern that works well on tablets. Three tabs is the right size for this admin scope. Avoids the complexity of a sidebar layout for what is fundamentally a simple admin interface.

**Alternatives Considered:**
- Sidebar navigation — heavier implementation, justified for larger admin panels but overkill for three sections
- Single-page admin with accordion sections — less navigable, harder to deep-link

### Menu Item Soft-Delete with Hidden Flag

**Decision:** Add a `hidden: Boolean @default(false)` field to the MenuItem model. Hidden items are excluded from the customer menu but preserved in the database for order history integrity. Admin UI shows hidden items (grayed out) with a restore option.

**Rationale:** Existing OrderItems have foreign key references to MenuItem. Hard-deleting a menu item would orphan order history or require cascade deletes that destroy business data. Soft-delete preserves referential integrity while letting the owner "remove" items from the active menu.

**Alternatives Considered:**
- Hard delete with FK cascade — simple but destroys order history, unacceptable for a POS system
- Hard delete with SET NULL on FK — loses which item was ordered, making bill history meaningless

### Table Deletion Guard — Block When Unpaid Orders Exist

**Decision:** The API refuses to delete a table that has any unpaid (non-PAID) orders. Admin must clear all bills for the table before deletion is allowed.

**Rationale:** Deleting a table with active orders would orphan those orders and make them unrecoverable from the checkout flow. The guard is simple to implement (check order count where paidAt is null) and prevents data loss.

**Alternatives Considered:**
- Soft-delete tables too — adds complexity (inactive flag, UI for restoration) without clear benefit since tables don't have the same FK history concern as menu items
- Allow deletion, orphan orders — risks losing revenue from unpaid bills

### QR Generator — DB-Driven Instead of Env-Driven

**Decision:** The QR PDF generator reads the table list from the database instead of the TABLE_COUNT environment variable. Generates QR codes for all tables currently in the DB. No preview or table selection UI.

**Rationale:** Once tables are managed in the admin UI, the source of truth moves from env vars to the database. A simple "generate for all" matches the current one-button UX and avoids unnecessary selection UI. TABLE_COUNT env var is no longer needed.

**Alternatives Considered:**
- Preview + select tables — useful for temporary table closures, but adds UI complexity for a rare use case. The owner can just remove the table and re-add later.

### Error/Success Feedback — Toast Notifications

**Decision:** CRUD operations use slide-in toast notifications at the bottom of the screen. Green for success, red for error. Auto-dismiss after 3 seconds. No sound (unlike the staff station chime). Reusable Toast component shared across admin, staff, and customer pages.

**Rationale:** Non-blocking feedback that doesn't disrupt the admin's workflow. The app already has a notification pattern (useNotification hook for staff chimes) — toast extends this to visual feedback. Consistent across all page types.

**Alternatives Considered:**
- Inline status messages — more visible but takes up layout space and doesn't work well for operations triggered from list views

---

> See `.gsd/DECISIONS.md` for the full append-only register of all project decisions.

## Error Handling Strategy

**Loading states:** Skeleton loaders on all data-fetching views — customer menu, staff station views, admin lists, checkout/bill views. Implemented as dedicated Skeleton components matching the layout shape of each page.

**API errors (admin CRUD):** Toast notifications with Vietnamese error messages. Specific error shapes: 400 (validation — "Tên món không được để trống"), 404 (not found), 409 (conflict — "Không thể xóa bàn có đơn chưa thanh toán"). Client catches and displays via toast.

**Network/SSE errors:** SSE disconnect banner already exists — polish with better reconnection UX. API fetch failures show retry-capable error states rather than blank screens.

**Startup errors:** Env validation on boot — missing ADMIN_PASSWORD shows a clear console error and prevents startup. Missing DB file shows a Vietnamese error page directing the owner to run the seed command.

**No retry policies for CRUD** — admin operations are user-initiated and idempotent enough that manual retry (via toast "try again" or re-submitting) is sufficient.

## Risks and Unknowns

- **Schema migration** — Adding `hidden` field to MenuItem requires a Prisma migration on existing data. Risk: migration must preserve all existing menu items and order history. Mitigation: `@default(false)` ensures existing items remain visible.
- **Table management + order system interaction** — Deleting/adding tables while orders are in flight. Risk: race conditions between table deletion check and new order creation. Mitigation: deletion guard query is sufficient for local single-user admin; no concurrent admin sessions expected.
- **Toast component is new shared infrastructure** — Must work across all three page types (admin, staff, customer) with different layouts. Risk: z-index conflicts with existing overlays (cart sheet, MenuPickerModal). Mitigation: Use a portal-based toast container at the root layout level.

## Existing Codebase / Prior Art

- `src/app/admin/page.tsx` — Current admin page (QR-only). Will be replaced by a tabbed dashboard layout with redirect to /admin/menu.
- `src/app/admin/login/page.tsx` + `src/middleware.ts` — Existing auth system. No changes needed — new admin tabs are covered by the existing /admin/* middleware matcher.
- `src/app/staff/StaffNav.tsx` — Bottom tab navigation component. Pattern to replicate for admin tabs.
- `src/app/staff/layout.tsx` — Staff layout wrapping StaffNav. Pattern for admin layout.
- `prisma/schema.prisma` — MenuItem model already has `name`, `category`, `price`, `description`, `available`, `sortOrder`. Needs only `hidden` field addition.
- `prisma/seed.ts` — Current menu seeding. Will remain as initial data setup.
- `src/app/api/admin/qr-pdf/route.ts` — QR PDF generator. Needs modification to read tables from DB instead of TABLE_COUNT env.
- `src/app/api/staff/menu/route.ts` — Existing GET endpoint for menu items. Admin CRUD will extend this pattern.
- `src/components/staff/` — Reusable staff components (StationView, OrderCard). Pattern for admin components.
- `src/lib/sse.ts` — SSE subscriber registry. May need new event types for menu/table changes if real-time sync is desired (likely not needed — admin changes are infrequent).

## Relevant Requirements

- R005 — QR codes for tables. Currently "active" — M005 completes this by making QR generation DB-driven and integrated with table management.
- R006 — Local network operation. M005 must maintain this constraint — no external dependencies in admin features, startup script works offline.
- R007 — Vietnamese mobile-first customer UI. M005 extends this with loading/error states that are also Vietnamese and mobile-optimized.

## Scope

### In Scope

- Admin tabbed dashboard layout (/admin with Menu / Bàn / QR Code tabs)
- Menu CRUD: create, read, update, soft-delete menu items (name, price, category, description, available, sortOrder)
- Menu availability toggle ("Hết hàng" / available)
- Soft-delete with `hidden` field on MenuItem model + Prisma migration
- Table management: add tables (auto-numbered), remove tables (with unpaid-order guard), rename tables
- QR PDF generator updated to read from DB instead of TABLE_COUNT env
- Toast notification component (reusable, bottom slide-in, auto-dismiss)
- Skeleton loaders on customer menu, staff station views, admin lists, checkout
- Error boundaries with Vietnamese messages
- Startup script (start.bat / start.sh)
- Vietnamese README with setup instructions
- Env validation on boot (ADMIN_PASSWORD, SHOP_IP)
- Graceful error page if DB is missing

### Out of Scope / Non-Goals

- Menu item images / photo upload
- Reporting / analytics / revenue stats
- Dark mode
- Multi-user admin auth (roles, permissions)
- Cloud deployment / Docker / PM2
- Order history export / printing bills
- Customer-facing order modifications (cancel/edit from phone)
- Internationalization beyond Vietnamese
- Real-time admin sync (SSE for admin changes) — admin changes are infrequent, page refresh is sufficient

## Technical Constraints

- SQLite single-writer — admin CRUD and staff order operations share the same DB. No concurrent write issues expected at single-shop scale.
- Next.js App Router — admin pages follow the same Server Component + Client Component split as existing pages.
- No new dependencies preferred — toast and skeleton components should be built with existing Tailwind + React. No toast library needed.
- Local network only — startup script must work without npm/node globally installed (or document the Node.js prerequisite clearly).

## Integration Points

- **Customer /order page** — must exclude `hidden: true` menu items and respect `available` toggle.
- **Staff /api/staff/menu** — currently returns all menu items. Must be updated to exclude hidden items (or include with a flag for admin context).
- **QR PDF generator** — switches from TABLE_COUNT env to DB query for table list.
- **Prisma schema** — migration adds `hidden` field. Must run cleanly on existing dev.db with seeded data.
- **Auth middleware** — no changes needed. New admin routes under /admin/* are already protected.
- **SSE system** — no changes needed. Menu/table admin changes don't require real-time broadcast (infrequent operations, page refresh sufficient).

## Testing Requirements

- **Unit tests:** CRUD API route handlers for menu items (create, update, soft-delete, list with hidden filter). Table management API handlers (add, remove with guard, rename). Toast component rendering and auto-dismiss behavior.
- **Integration tests:** Menu item created in admin → visible on customer /order page. Item marked hidden → disappears from customer menu. Table deleted → excluded from QR PDF.
- **Existing test suite (111 tests):** Must continue passing. Schema migration must not break existing order/item tests.
- **Coverage:** All new API routes have at least happy-path + primary error-case tests. Aim for ~130+ total tests.

## Acceptance Criteria

**Menu Management:**
- Admin can create a menu item with name, price, category (DRINK/FOOD), description, and it appears on the customer menu
- Admin can edit any field of an existing menu item
- Admin can toggle availability — "Hết hàng" badge appears on customer UI, item is unorderable
- Admin can soft-delete an item — it disappears from customer menu but remains in admin (grayed out) and order history is preserved
- Admin can restore a soft-deleted item

**Table Management:**
- Admin can add a new table (auto-numbered, auto-named "Bàn N")
- Admin can rename a table
- Admin can remove a table with no unpaid orders
- Attempting to remove a table with unpaid orders shows an error toast with Vietnamese message
- After adding/removing tables, QR PDF generates with the updated table list

**Loading/Error UX:**
- Customer menu page shows skeleton loader during initial fetch
- Staff station views show skeleton loader during initial fetch
- Admin list pages show skeleton loader during initial fetch
- All CRUD operations show toast feedback (success or error) with Vietnamese messages
- Error pages display Vietnamese text with retry/refresh options

**Deployment Readiness:**
- App validates ADMIN_PASSWORD on boot — shows clear error if missing
- `start.sh` / `start.bat` script starts the app with production build
- Vietnamese README documents: Node.js prerequisite, install steps, env setup, first-run seed, starting the app

## Open Questions

- None — all key decisions resolved during interview.
