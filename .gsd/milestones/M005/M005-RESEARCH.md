# M005: Admin & Polish — Research

**Date:** 2025-07-20
**Status:** Complete

## Summary

M005 transforms TraSua from a developer-run prototype into a deployable shop system. The codebase is well-structured after M001–M004: 111 passing tests, clean patterns for API routes, client components, SSE real-time updates, and a polished amber/warm design system. The work breaks into three natural clusters: (1) admin CRUD for menu items and tables with a tabbed dashboard, (2) UX polish (toast notifications, skeleton loaders, error boundaries), and (3) deployment readiness (startup script, env validation, README).

The schema change is minimal — adding a single `hidden: Boolean @default(false)` field to `MenuItem`. The biggest implementation surface is the admin dashboard with three tabbed views (Menu, Tables, QR), backed by new CRUD API routes. All patterns have strong prior art in the existing staff dashboard and components. No new dependencies are needed — toast and skeleton components are pure React/Tailwind. The QR PDF generator needs a targeted refactor to read tables from DB instead of the `TABLE_COUNT` env var.

The primary risk is ensuring new admin CRUD operations interact correctly with the existing order system — particularly the table deletion guard (blocking deletion when unpaid orders exist) and the `hidden` field filtering (customer menu must exclude hidden items while preserving order history FK integrity). Both are well-scoped and testable.

## Recommendation

**Approach: Schema-first, then parallel admin + polish tracks.**

1. Start with the Prisma migration (add `hidden` field) since it unblocks all menu-related work.
2. Build the Toast component early as shared infrastructure — it's needed by every admin CRUD operation and staff/customer error feedback.
3. Build the admin dashboard layout + menu CRUD first (highest value, most complex).
4. Table management and QR refactor second (depends on menu patterns being established).
5. Skeleton loaders and error boundaries as a polish slice (can be done independently).
6. Startup script + README last (pure additive, no code dependencies).

This order retires the highest-risk work first (schema migration + CRUD correctness) while establishing patterns that downstream slices reuse.

## Implementation Landscape

### Key Files

**Schema & Data Layer:**
- `prisma/schema.prisma` — MenuItem model needs `hidden: Boolean @default(false)`. Table model already has `id`, `number`, `name` — no schema changes needed for tables. Migration must preserve all existing data and FK relationships to OrderItem.
- `prisma/seed.ts` — No changes needed. Seed data continues to work as initial setup.
- `src/lib/prisma.ts` — Singleton Prisma client with better-sqlite3 adapter. Used by all API routes. No changes needed.

**Admin Pages (need creation/refactoring):**
- `src/app/admin/page.tsx` — Currently a QR-only page reading `TABLE_COUNT` env var. Must be replaced by a redirect to `/admin/menu` or become the tabbed dashboard layout entry point.
- `src/app/admin/login/page.tsx` — Existing login page. No changes needed.
- `src/app/admin/layout.tsx` — **NEW.** Admin layout wrapping tabbed navigation. Pattern: copy `src/app/staff/layout.tsx` (simple `<>children + nav</>` wrapper with bottom padding).
- `src/app/admin/menu/page.tsx` — **NEW.** Menu management page — list, create, edit, toggle availability, soft-delete, restore.
- `src/app/admin/tables/page.tsx` — **NEW.** Table management — list, add, rename, remove (with unpaid-order guard).
- `src/app/admin/qr/page.tsx` — **NEW.** QR generation page — replaces the current admin page's QR functionality.

**Admin Navigation (new component):**
- `src/components/admin/AdminNav.tsx` — **NEW.** Bottom tab navigation. Pattern: replicate `src/app/staff/StaffNav.tsx` with tabs: Thực đơn (/admin/menu), Bàn (/admin/tables), QR Code (/admin/qr). Plus a logout link.

**Admin CRUD API Routes (all new):**
- `src/app/api/admin/menu/route.ts` — **NEW.** GET (list all including hidden, for admin), POST (create item).
- `src/app/api/admin/menu/[id]/route.ts` — **NEW.** PUT (update item), PATCH (toggle available/hidden), DELETE (soft-delete via hidden=true).
- `src/app/api/admin/tables/route.ts` — **NEW.** GET (list all tables), POST (add table — auto-number).
- `src/app/api/admin/tables/[id]/route.ts` — **NEW.** PUT (rename), DELETE (remove — with unpaid-order guard).

**Existing Files That Need Updates:**
- `src/app/order/page.tsx` — Add `where: { hidden: false }` to `prisma.menuItem.findMany()` query (line ~30). Currently returns all items.
- `src/app/api/staff/menu/route.ts` — Add `where: { hidden: false }` to exclude hidden items from the staff menu picker. Admin context gets its own API route.
- `src/app/api/admin/qr-pdf/route.ts` — Replace `TABLE_COUNT` env var read with `prisma.table.findMany()` DB query. Replace the table count loop with DB-driven table list. ~20 lines changed.
- `src/app/api/order/route.ts` — Add `hidden: false` check when validating menu items in order creation (prevents ordering hidden items even if client somehow sends the ID).
- `src/middleware.ts` — No changes needed. Existing `/admin/:path*` and `/api/admin/:path*` matchers already cover all new routes.

**Shared Components (new):**
- `src/components/ui/Toast.tsx` — **NEW.** Portal-based toast notification component. Slide-in from bottom, green/red variants, auto-dismiss 3s. Shared context provider + `useToast()` hook.
- `src/components/ui/Skeleton.tsx` — **NEW.** Reusable skeleton loader primitives (SkeletonLine, SkeletonCard, etc.) using Tailwind `animate-pulse`.

**Deployment Files (new):**
- `start.sh` — **NEW.** Bash startup script: env validation → prisma migrate → next build (if needed) → next start.
- `start.bat` — **NEW.** Windows equivalent.
- `README.md` — **NEW or REWRITE.** Vietnamese setup guide for non-developers.

### Existing Patterns to Reuse

| Pattern | Source | Reuse In |
|---------|--------|----------|
| Bottom tab navigation | `src/app/staff/StaffNav.tsx` | AdminNav component — same fixed-bottom, blur-backdrop, active indicator pill pattern |
| Layout with nav padding | `src/app/staff/layout.tsx` | Admin layout — `<div className="pb-20">{children}</div>` + nav |
| API route with Prisma | `src/app/api/staff/menu/route.ts` | All admin CRUD routes — same `prisma.X.findMany()` → `NextResponse.json()` pattern |
| Admin auth gate | `src/app/api/admin/qr-pdf/route.ts` | All admin API routes — `checkAdminCookie()` pattern (though middleware already covers /api/admin/*) |
| Two-tap confirmation | `src/components/staff/BillView.tsx` | Table deletion confirmation, menu item deletion |
| Tab bar (DRINK/FOOD) | `src/components/order/MenuView.tsx` | Admin menu list — category tabs for filtering |
| Modal slide-up | `src/components/staff/MenuPickerModal.tsx` | Menu item create/edit form modal |
| Loading spinner | `src/components/staff/BillView.tsx` | Reuse inline `animate-spin` pattern in admin pages |
| Error state with retry | `src/components/staff/BillView.tsx` | Admin error states — same ⚠️ + message + retry button |
| `formatVND()` | `src/lib/format.ts` | Price display in admin — already imported everywhere |
| Active scale-[0.96] | Throughout all components | Consistent button press feel |
| Vietnamese error messages | All API routes | Admin CRUD errors follow same pattern |
| `tabular-nums` | Throughout all price displays | Consistent number formatting |
| `textWrap: 'balance'` on headings | Throughout all pages | Consistent typography |
| Amber/warm color palette | Everywhere | `amber-50` background, `amber-900` text/primary, `amber-700` secondary |

### Build Order

**Phase 1: Schema + Shared Infrastructure (unblocks everything)**
- Prisma migration adding `hidden` field to MenuItem
- Toast component + ToastProvider at root layout level
- Skeleton loader primitives

**Phase 2: Admin Dashboard + Menu CRUD (highest value)**
- Admin layout + AdminNav (tabbed navigation)
- Admin menu API routes (CRUD)
- Admin menu page (list, create, edit, toggle, soft-delete)
- Update customer `/order` page and staff `/api/staff/menu` to filter hidden items
- Update order creation API to block hidden items

**Phase 3: Table Management + QR Refactor**
- Admin tables API routes (add, rename, remove with guard)
- Admin tables page
- QR PDF generator refactor (DB-driven instead of TABLE_COUNT)
- Admin QR page (replaces old admin page)

**Phase 4: UX Polish**
- Skeleton loaders on customer menu, staff stations, admin lists, checkout
- Error boundaries with Vietnamese messages
- Toast integration across all CRUD operations

**Phase 5: Deployment Readiness**
- Startup scripts (start.sh / start.bat) with env validation
- Vietnamese README
- Env validation on boot

### Verification Approach

**Unit Tests (Vitest):**
- Admin menu API: create → 201, update → 200, soft-delete → sets hidden=true, list returns hidden items for admin context, validation errors return 400
- Admin tables API: add → auto-numbered, rename → 200, delete with no orders → 200, delete with unpaid orders → 409 with Vietnamese error
- Toast component: renders, auto-dismisses after 3s, shows correct variant (success/error)
- Hidden item filtering: customer menu excludes hidden, order API rejects hidden item IDs

**Integration Verification:**
- `npx vitest run` — all existing 111 tests must pass + new tests (~20-30 new)
- `npm run build` — production build must succeed
- Manual verification: create item in admin → appears on customer menu → order it → staff sees it

**Build Verification:**
- `npm run build` at each slice boundary
- No new TypeScript errors
- No new ESLint warnings

## Constraints

- **No new dependencies.** Toast and skeleton components must be pure React + Tailwind CSS. The project explicitly avoids toast libraries (react-hot-toast, sonner, etc.).
- **SQLite single-writer.** All Prisma operations share one DB connection. Admin CRUD and staff order operations won't hit concurrency issues at single-shop scale, but the table deletion guard must be a single atomic check-then-delete query (not a check → wait → delete with a race window).
- **Next.js App Router conventions.** Admin pages follow Server Component + Client Component split. API routes use the `route.ts` convention.
- **Auth middleware already covers all admin routes.** The existing `matcher: ["/admin/:path*", "/api/admin/:path*"]` in `src/middleware.ts` means no auth changes needed — all new admin routes are automatically protected.
- **Prisma with better-sqlite3 adapter.** The generated client is in `generated/prisma/`. Migrations must be compatible with SQLite dialect (no enums in migrations, no advanced PostgreSQL features).
- **Windows development environment.** Startup scripts need both `.sh` and `.bat` variants. Path separators in scripts must handle Windows.

## Common Pitfalls

- **Forgetting `hidden: false` filter in customer queries.** The customer `/order` page and the order creation API both query menu items. Both must exclude hidden items. Missing either one creates a data integrity gap (customer sees deleted items, or can order them via stale cache). **Fix:** Add the filter in both places during the same slice, and write tests that verify hidden items are excluded.

- **Table auto-numbering gaps.** When tables are deleted and re-added, the auto-numbering must find the next available number (not just `count + 1`). Otherwise, deleting table 8 and adding a new table could create a duplicate "Bàn 15" if there are already 15 tables. **Fix:** Use `MAX(number) + 1` or find the first gap. The simpler `MAX + 1` approach is fine for a small shop.

- **QR PDF font path.** The existing QR PDF generator loads `public/fonts/Inter.ttf` via `path.join(process.cwd(), 'public', 'fonts', 'Inter.ttf')`. After the DB-driven refactor, this path dependency remains. The startup script must ensure the production build includes this font file.

- **Toast z-index conflicts.** The app has existing z-indexed elements: sticky headers (z-10), bottom nav (z-50), modals (z-50 via MenuPickerModal overlay). Toast must use z-[100] or higher to appear above everything. **Fix:** Portal-based toast container rendered in the root layout at `z-[100]`.

- **Prisma migration on existing dev.db.** The `@default(false)` on the `hidden` field means existing rows get `hidden = false` (visible). But the migration SQL needs to be verified — SQLite ALTER TABLE ADD COLUMN with DEFAULT is supported, but the Prisma migration generator may produce different SQL. **Fix:** Review the generated migration SQL before applying.

- **Cart sheet on customer page.** The CartSheet component uses a bottom slide-up modal pattern. If toast notifications also appear at the bottom, they could overlap with the cart sheet when it's open. **Fix:** Position toasts above the cart sheet's z-index, or use top-positioned toasts on the customer page specifically.

## Open Risks

- **Table deletion race condition.** The guard checks for unpaid orders, then deletes. In theory, a new order could be created between the check and the delete. At single-shop scale with one admin, this is extremely unlikely. If it occurs, the FK constraint on `Order.tableId` would prevent data loss (the delete would fail at the DB level). Acceptable risk — no mitigation needed beyond the guard query.

- **Startup script portability.** The project runs on a "shop machine" which could be Windows, macOS, or Linux. Node.js prerequisite handling differs across platforms. The README must clearly document Node.js installation as a prerequisite. The startup script can't install Node.js automatically.

- **DB file location in production.** The Prisma config uses `file:./prisma/dev.db` (relative to cwd). In production via `next start`, the cwd is the project root, so this path works. But if someone runs the start script from a different directory, the DB path breaks. The startup script must `cd` to the project root first.

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| Next.js App Router | `wshobson/agents@nextjs-app-router-patterns` (16.1K installs) | available — not installed |
| Next.js App Router | `react-best-practices` | installed (available in project) |
| Prisma ORM | `gocallum/nextjs16-agent-skills@prisma-orm-v7-skills` | available — not installed |
| Frontend Design | `frontend-design` | installed |
| UI Polish | `make-interfaces-feel-better` | installed |

**Note:** The existing installed skills (`react-best-practices`, `frontend-design`, `make-interfaces-feel-better`) cover the primary frontend concerns. The Next.js App Router patterns skill (16.1K installs) could be useful for the admin dashboard layout, but the existing codebase already demonstrates the patterns needed. The Prisma skill may help with migration best practices but the change is minimal. Both are optional.

## Requirements Analysis

### Active Requirements vs. M005 Scope

| Req | Status | M005 Impact |
|-----|--------|-------------|
| R005 (QR codes for tables) | active | **Completed by M005.** QR generation becomes DB-driven and integrated with table management UI. Full validation: admin manages tables → generates QR → scan works. |
| R006 (Local network operation) | active | **Maintained.** No new external dependencies. Startup script works offline. Admin features use only local SQLite. |
| R007 (Vietnamese mobile-first UI) | active | **Extended.** Loading states, error pages, and toast notifications all use Vietnamese text and work on mobile viewports. |

### Candidate Requirements to Surface

None identified. The M005 CONTEXT document comprehensively covers the scope. The existing requirements are well-mapped and no gaps in table-stakes, launchability, or failure-visibility expectations were found. The scope explicitly lists non-goals (no images, no analytics, no dark mode, no multi-user auth) which are appropriate for a local single-shop POS system.

### Observations

- **R005 will be fully validated** after M005 — the current "machine-verified" status upgrades to full scan-test validation once QR generation is DB-driven and tables are admin-managed.
- **R006 and R007 remain active** (constraints/quality attributes that persist beyond M005) but M005 demonstrates continued compliance.
- All 5 validated requirements (R001–R004, R008) are unaffected by M005 changes — the existing 111 tests guard against regressions.
