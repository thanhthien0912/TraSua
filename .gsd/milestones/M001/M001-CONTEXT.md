# M001: Project Foundation

**Gathered:** 2025-07-10
**Status:** Ready for planning

## Project Description

Set up the full Next.js project scaffolding, define the complete Prisma/SQLite database schema, seed realistic Vietnamese menu data, and deliver a working admin page with QR code PDF generation — establishing the foundation that all subsequent milestones (M002–M005) build on.

## Why This Milestone

Everything downstream depends on M001: customer ordering (M002) needs the menu schema, staff dashboard (M003) needs the order schema, billing (M004) needs the table/order relations. Building the full schema upfront avoids migration churn. The QR generator is the first tangible deliverable the shop owner can actually use — print and stick on tables before M002 even ships.

## User-Visible Outcome

### When this milestone is complete, the user can:

- Visit `/admin`, enter the admin password, and download a printable PDF sheet with QR codes for all 15 tables
- See a working Next.js app on `http://localhost:3000` with the database seeded with real Vietnamese menu items

### Entry point / environment

- Entry point: `http://localhost:3000/admin` (admin page with QR generator)
- Environment: local dev (shop's machine, accessed via local network)
- Live dependencies involved: none — fully local, SQLite file database

## Completion Class

- Contract complete means: Prisma schema has all models (MenuItem, Table, Order, OrderItem) with correct relations and enums. Seed script populates 15-20 real Vietnamese menu items. QR generation produces valid PDF with correct URLs.
- Integration complete means: Next.js App Router serves the `/admin` page, Prisma connects to SQLite, QR PDF download works end-to-end from button click to file download.
- Operational complete means: `npm run dev` starts cleanly, `npx prisma db seed` populates data, admin password gate works via env var.

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- Admin visits `/admin` → enters password → sees QR generator page → clicks "Generate" → downloads PDF → PDF contains 15 QR codes with correct URLs (`http://<SHOP_IP>:3000/order?table=N`) and table labels
- Scanning any generated QR code with a phone camera resolves to the correct URL with the right table number
- `npx prisma studio` shows MenuItem table populated with real Vietnamese items (trà sữa, trà trái cây, snacks) with VND prices

## Architectural Decisions

### Simple Menu Schema — Name + Price Per Row

**Decision:** Each menu item is a single row with name, category (DRINK/FOOD), price (VND), and availability toggle. No size/topping/sugar/ice customization system. Each size variant (e.g., "Trà sữa trân châu M", "Trà sữa trân châu L") is a separate menu item.

**Rationale:** Keeps the schema dead simple for a mid-range quán. Avoids the complexity of a customization engine. Shop owner manages variants as separate items in the admin panel (M005).

**Alternatives Considered:**
- Full customization (sizes, toppings, sugar/ice levels) — adds significant schema complexity, UI complexity, and order-processing logic that's overkill for this shop's needs

### Full Database Schema Upfront

**Decision:** Define all tables in M001 (MenuItem, Table, Order, OrderItem) with all enums, even though Order/OrderItem aren't used until M002/M003.

**Rationale:** One migration covers everything. Schema is settled early, downstream milestones just use it without migration churn. The schema is small enough that there's no cost to defining it now.

**Alternatives Considered:**
- Build only MenuItem + Table in M001, add Order/OrderItem in M002 — saves no real effort and adds an unnecessary migration step

### Admin Auth via Environment Variable

**Decision:** Admin pages protected by a single password stored in `ADMIN_PASSWORD` env var. Validated via middleware, stored in a cookie after first entry.

**Rationale:** Single-shop local-network system doesn't need user management, sessions, or OAuth. A hardcoded password in env is proportionate to the threat model (local WiFi only).

**Alternatives Considered:**
- No auth in M001 — leaves admin unprotected; bad habit even for local dev
- Full auth system (NextAuth, user table) — massive overkill for a single-shop setup

### Manual IP Configuration for QR Codes

**Decision:** Shop's local IP address configured via `SHOP_IP` env var. QR codes encode `http://<SHOP_IP>:3000/order?table=N`.

**Rationale:** Explicit is better than auto-detect. Machines with multiple network interfaces (WiFi + Ethernet) would make auto-detection unreliable. Admin sets the IP once during shop setup.

**Alternatives Considered:**
- Auto-detect IP via `os.networkInterfaces()` — unreliable on multi-NIC machines, confusing when it picks the wrong interface

### QR Output as Printable PDF

**Decision:** QR generator outputs a single PDF file with QR codes laid out in a grid (2×3 or 3×4 per A4 page), each with table number label ("Bàn 1", "Bàn 2"...) and scan instruction text.

**Rationale:** Shop owner prints one file, cuts, and sticks on tables. No manual layout needed. PDF is universally printable.

**Alternatives Considered:**
- Individual PNG images per table — requires manual layout for printing, more work for the shop owner

---

> See `.gsd/DECISIONS.md` for the full append-only register of all project decisions.

## Error Handling Strategy

M001 is a foundation milestone — error handling is straightforward:

- **Prisma errors:** Catch and display user-friendly messages on the admin page (e.g., "Database connection failed"). Log full errors to console.
- **QR generation errors:** If PDF generation fails, show an error toast on the admin page. No retry logic needed — user can click again.
- **Admin auth:** Invalid password shows a clear "Sai mật khẩu" message. No lockout mechanism (local network, low threat).
- **Missing env vars:** App should fail fast on startup with clear messages if `ADMIN_PASSWORD` or `SHOP_IP` are not set.
- **Seed script:** Idempotent — running twice doesn't duplicate data (upsert or clear-then-insert).

## Risks and Unknowns

- PDF generation in Next.js server-side — need to pick a library (`jspdf`, `pdfkit`, or `@react-pdf/renderer`). Low risk but needs a spike during implementation.
- QR code readability at print size — generated QR codes must be large enough to scan reliably when printed on A4 and cut to ~5cm squares.

## Existing Codebase / Prior Art

- No code exists yet — this is a greenfield project
- `.gsd/PROJECT.md` — project description and tech stack decisions
- `.gsd/DECISIONS.md` — D001 (tech stack), D002 (QR strategy), D003 (staff-only order modification)

## Relevant Requirements

- R005 — QR codes được tạo sẵn cho 10-20 bàn, in ra và dán tại bàn (M001 delivers the QR generator that fulfills this)
- R006 — Hệ thống chạy local trên mạng nội bộ quán (M001 establishes the local-first architecture with SQLite + manual IP config)
- R007 — Giao diện khách hàng tiếng Việt (M001 seeds Vietnamese menu data; customer UI is M002 but the data foundation is here)

## Scope

### In Scope

- Next.js 14+ App Router project setup with TypeScript and Tailwind CSS
- Prisma schema with SQLite: MenuItem, Table, Order, OrderItem models + enums (Category, OrderStatus, ItemStatus)
- Seed script with 15-20 real Vietnamese menu items (trà sữa, trà trái cây, đồ ăn/snacks) and realistic VND prices (25,000đ – 55,000đ)
- `/admin` page with password protection (env var auth via cookie)
- QR code PDF generator: generate printable A4 PDF sheet with QR codes for 15 tables, each labeled "Bàn N"
- Environment config: `SHOP_IP`, `SHOP_PORT`, `TABLE_COUNT`, `ADMIN_PASSWORD` in `.env.local`
- Table records seeded (1–15)

### Out of Scope / Non-Goals

- Customer-facing order UI (M002)
- Real-time order dashboard (M003)
- Billing and payment flow (M004)
- Menu management admin UI (M005)
- Size/topping/sugar/ice customization system
- Multi-shop support
- Cloud deployment
- Internationalization beyond Vietnamese

## Technical Constraints

- SQLite only — no external database server (per D001, R006)
- Must work on local network without internet (R006)
- QR codes must encode full HTTP URL with local IP, not relative paths
- Admin password is a single shared secret, not per-user auth
- PDF must be generated server-side (Next.js API route), not client-side

## Integration Points

- Prisma ↔ SQLite — ORM layer for all database access, single `prisma/dev.db` file
- `qrcode` npm package — generates QR code images from URLs
- PDF library (jspdf/pdfkit/react-pdf) — composes QR images into printable A4 layout
- Next.js App Router — serves admin page and API routes for QR generation

## Testing Requirements

- **Unit tests:** Prisma schema validation (model relations, enum values). QR URL generation logic (correct URL format for each table number).
- **Integration tests:** Seed script runs successfully and populates expected number of items. Admin auth middleware blocks without password, allows with correct password.
- **Manual verification:** Generated PDF opens correctly, QR codes scan to correct URLs on a phone camera. Admin page renders and functions in the browser.

## Acceptance Criteria

**Slice: Project Setup & Schema**
- `npm run dev` starts Next.js app without errors
- Prisma schema compiles, `npx prisma db push` creates all tables
- `npx prisma studio` shows all models with correct fields and relations

**Slice: Seed Data**
- `npx prisma db seed` populates 15-20 Vietnamese menu items with correct categories and VND prices
- Seed is idempotent — running twice doesn't create duplicates
- Table records 1–15 are seeded

**Slice: Admin Page & QR Generator**
- `/admin` redirects to login prompt when no password cookie
- Correct password grants access, incorrect shows "Sai mật khẩu"
- "Generate QR" button triggers PDF download
- PDF contains QR codes for all configured tables in a printable grid layout
- Each QR code encodes `http://<SHOP_IP>:<SHOP_PORT>/order?table=N`
- Each QR label shows "Bàn N"
- QR codes scan correctly on a phone camera

## Open Questions

- Which PDF library to use for server-side generation — `jspdf`, `pdfkit`, or `@react-pdf/renderer`. Will be resolved during implementation based on ease of use with QR image embedding in Next.js API routes.
