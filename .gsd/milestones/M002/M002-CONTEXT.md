# M002: Customer Order Flow

**Gathered:** 2025-07-18
**Status:** Ready for planning

## Project Description

The customer-facing mobile ordering flow for TraSua — a local-network POS system for a bubble tea shop. Customers scan a pre-printed QR code at their table, browse the menu on their phone, build a cart, and submit their order. The order is persisted to the SQLite database for staff to pick up in M003.

## Why This Milestone

M001 established the foundation: Next.js app, Prisma schema with all 4 models (MenuItem, Table, Order, OrderItem), 18 seeded menu items, 15 tables, admin auth, and QR PDF generator. The QR codes point to `/order?table=N` — but that route doesn't exist yet. M002 builds the customer-facing write path so the ordering system actually works end-to-end from the customer's perspective. Without this, the QR codes are dead links.

## User-Visible Outcome

### When this milestone is complete, the user can:

- Scan a QR code at their table and see the full menu on their phone, organized by Đồ uống (drinks) and Đồ ăn (food)
- Add items to a cart with quantities and free-text notes (e.g. "ít đường, nhiều đá"), review the cart, and submit the order
- See a confirmation screen after ordering, then tap "Gọi thêm món" to go back and order more items later

### Entry point / environment

- Entry point: `http://<local-ip>:3000/order?table=N` (reached via QR scan)
- Environment: Customer's phone browser over shop WiFi — mobile-first
- Live dependencies involved: SQLite database (local), no external services

## Completion Class

- Contract complete means: API endpoints return correct menu data for valid tables, reject invalid tables, and create Order + OrderItem records with correct foreign keys, quantities, notes, and computed totals. Verifiable via integration tests against the SQLite DB.
- Integration complete means: The full flow works in a real phone browser — QR scan opens the page, menu loads with real seeded data, cart works, order submission persists to the database, confirmation displays correctly.
- Operational complete means: None for M002 — this is a stateless customer UI writing to a local DB. No long-running processes or lifecycle concerns.

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- A phone browser hitting `/order?table=5` shows the tabbed menu with real seeded items, allows adding multiple items with notes to a cart, submitting, and the resulting Order + OrderItems are correctly persisted in the SQLite database with the right tableId, menuItemId, quantity, notes, and totalAmount.
- Visiting `/order?table=99` (non-existent) or `/order` (no param) shows the Vietnamese error page — no ordering is possible.
- After submitting an order, the customer can tap "Gọi thêm món", return to the menu, and submit a second order for the same table — both orders exist as separate records in the DB.

## Architectural Decisions

### Order flow pattern: Browse → Cart → Submit

**Decision:** Customers browse a tabbed menu, tap items to add to a client-side cart (shown as a sticky bottom bar), review in a slide-up sheet, and submit.

**Rationale:** This is the standard e-commerce pattern — familiar, forgiving (customers can review before committing), and works well on mobile. The bottom bar + slide-up sheet keeps the customer on the menu page, which feels native on phones.

**Alternatives Considered:**
- Quick-add per item (each tap sends immediately) — Too many separate orders, no review step, higher error rate
- Single-page form with quantity spinners — Works for tiny menus but doesn't scale, no progressive disclosure

### Customization via free-text notes only

**Decision:** Each cart item has a free-text "Ghi chú" field. No structured sugar/ice/topping selectors in M002.

**Rationale:** `OrderItem.notes` already exists in the schema. Free text is flexible enough to cover "ít đường, nhiều đá, thêm trân châu" without adding new models or UI complexity. Staff reads the notes on the dashboard.

**Alternatives Considered:**
- Structured options (ItemOption/OptionValue models) — Adds schema complexity and UI scope far beyond M002's core goal
- No customization at all — Too restrictive for a bubble tea shop where sugar/ice levels are expected

### Multiple orders per table visit

**Decision:** Each "Gửi đơn" creates a new Order record. A table can have multiple active (non-PAID) orders simultaneously.

**Rationale:** Real behavior at a tea shop — customers order drinks first, food later. The schema already supports this (Table has `orders Order[]`). Billing aggregation is M004's responsibility.

**Alternatives Considered:**
- One active order per table (append items to existing) — Requires find-or-create logic, complicates the write path, and doesn't match real ordering behavior

### Sold-out items: visible but disabled

**Decision:** Items with `available = false` are shown grayed out with a "Hết hàng" badge. They cannot be added to the cart.

**Rationale:** Customers see the full menu (so they know what normally exists) but can't order unavailable items. Better than hiding — which makes customers wonder where items went.

**Alternatives Considered:**
- Hidden completely — Simpler but confusing when regulars don't see their usual order
- Pushed to bottom of list — Awkward UX, mixed signals

### M002 scope: customer write path only

**Decision:** M002 builds only the customer-facing ordering UI. No staff dashboard, no real-time updates, no order status changes, no station routing.

**Rationale:** Clean boundary — M002 proves orders land in the database correctly. M003 builds the staff read path. Keeping them separate avoids scope creep and makes each milestone independently testable.

**Alternatives Considered:**
- Include a basic /admin/orders list page — Blurs the M002/M003 boundary without adding real value

---

> See `.gsd/DECISIONS.md` for the full append-only register of all project decisions.

## Error Handling Strategy

**Invalid table:** Server-side validation — query `Table` where `number = N`. If not found or param missing/non-numeric, render a Vietnamese error page: "Bàn không hợp lệ. Vui lòng scan lại mã QR tại bàn của bạn." Dead-end — no ordering possible.

**Order submission failure:** If the API call to create the order fails (DB error, network issue), show an inline error toast on the cart sheet: "Không gửi được đơn. Vui lòng thử lại." Cart contents are preserved (client-side state) so the customer doesn't lose their selections.

**Empty menu / all items unavailable:** If the menu query returns zero available items, show a friendly message: "Quán hiện chưa có món nào. Vui lòng quay lại sau." This shouldn't happen in practice but handles the edge case.

**Stale availability:** If a customer adds an item and it becomes unavailable before they submit, the API should reject those items and return an error indicating which items are no longer available. The cart sheet should highlight the problem items.

## Risks and Unknowns

- Slide-up cart sheet performance on older Android phones — CSS animations and touch interactions may feel janky on low-end devices over shop WiFi. Mitigation: keep the sheet simple, prefer CSS transforms over layout-triggering properties.
- Client-side cart state loss on page refresh — if the customer's phone kills the browser tab, they lose their cart. Acceptable for M002 (orders are usually quick), but could use sessionStorage as a simple persist layer.
- VND price formatting — numbers like 45000 need to display as "45,000đ" consistently. Need a shared formatter utility.

## Existing Codebase / Prior Art

- `prisma/schema.prisma` — Full ordering schema already defined: MenuItem (with category, price, available, sortOrder), Table, Order (with status, totalAmount), OrderItem (with quantity, status, notes). No schema changes needed for M002.
- `prisma/seed.ts` — 18 menu items (12 DRINK, 6 FOOD) with VND prices and 15 tables already seeded.
- `src/lib/prisma.ts` — PrismaClient singleton with globalThis caching for HMR. Standard import for all DB access.
- `src/app/page.tsx` — Landing page with amber/warm Tailwind branding, Vietnamese text, mobile-first responsive design. Establishes the visual language M002 should follow.
- `src/app/layout.tsx` — Root layout with Tailwind v4 setup, system-ui fonts.
- `src/middleware.ts` — Edge middleware protecting `/admin/*` routes. Customer `/order` routes are NOT protected (no auth needed — QR = table identity, per D003).

## Relevant Requirements

- R001 — "Khách hàng scan QR code tại bàn để mở menu và đặt món trên điện thoại" — M002 delivers this requirement end-to-end from the customer's perspective. The menu browsing, cart, and order submission are the core of R001.
- R005 — "QR codes được tạo sẵn cho 10-20 bàn, in ra và dán tại bàn" — M001 delivered the QR generation. M002 builds the destination those QR codes point to (`/order?table=N`).
- R006 — "Hệ thống chạy local trên mạng nội bộ quán — không cần internet" — All assets and data are local. No CDN, no external API calls. Must work on shop WiFi without internet.
- R007 — "Giao diện khách hàng tiếng Việt, tối ưu mobile-first" — M002 is the primary customer-facing UI. Must be Vietnamese throughout and optimized for phone screens (iPhone SE 375px through tablet).

## Scope

### In Scope

- `/order?table=N` page — table validation, menu display, cart, order submission, confirmation
- Tabbed menu layout: Đồ uống (default tab) / Đồ ăn — items sorted by `sortOrder`
- Each item card: name, price (formatted VND), description, "Hết hàng" badge for unavailable
- Client-side cart: add/remove items, adjust quantity, add notes per item
- Sticky bottom bar showing cart item count + total, tap to open slide-up cart sheet
- Cart sheet: item list with qty +/-, notes field per item, subtotals, grand total, "Gửi đơn" button
- POST API endpoint to create Order + OrderItems from cart data
- Server-side table validation (query DB, reject invalid)
- Confirmation screen after successful order: order summary, "Gọi thêm món" button
- Error page for invalid/missing table parameter
- VND price formatting utility
- Mobile-first responsive design following existing amber/warm branding

### Out of Scope / Non-Goals

- Staff dashboard or any staff-facing UI (M003)
- Real-time order updates or SSE/polling (M003)
- Station routing — bar vs kitchen split (M003)
- Order status changes beyond initial creation (M003)
- Bill aggregation and payment marking (M004)
- Menu management / admin CRUD for menu items (M005)
- Item images or rich media (MenuItem has no imageUrl field)
- Structured customization options (sugar/ice/topping selectors)
- Customer authentication or session management
- Order history for customers
- Push notifications

## Technical Constraints

- Next.js 16.2.4 App Router — use Server Components for data fetching, Client Components for cart interactivity
- SQLite via Prisma 7.8.0 — single-connection, no concurrent write issues at tea shop scale
- No external dependencies for runtime (R006) — all assets served locally
- Mobile-first: must work on iPhone SE (375px) viewport and up
- Vietnamese text throughout customer UI
- Follow existing Tailwind v4 + amber color scheme from M001

## Integration Points

- Prisma/SQLite — MenuItem read (menu display), Table read (validation), Order + OrderItem create (submission)
- QR codes from M001 — point to `/order?table=N`, M002 builds that destination
- M003 (downstream) — will read the Order/OrderItem records M002 creates to display on the staff dashboard
- M004 (downstream) — will aggregate multiple Orders per table for billing

## Testing Requirements

- **Integration tests:** API endpoints tested against real SQLite DB — menu fetch returns correct items by category with availability, order creation persists correct records with FK integrity, invalid table returns appropriate error.
- **Edge case tests:** Empty notes field handled, quantity of 0 or negative rejected, non-existent menuItemId rejected, unavailable items in submission rejected.
- **Mobile viewport verification:** Page renders correctly at 375px width (iPhone SE), tabs are tappable, cart sheet is usable.

## Acceptance Criteria

- Customer scans QR (hits `/order?table=5`) → sees tabbed menu with "Đồ uống" active, showing seeded drink items with prices in VND format
- Customer switches to "Đồ ăn" tab → sees food items
- Unavailable items show "Hết hàng" badge and cannot be added to cart
- Customer taps items → bottom bar appears showing count + total
- Customer taps bottom bar → slide-up sheet shows cart with qty controls, notes field, subtotals
- Customer adds note "ít đường" to an item → note is visible in cart
- Customer taps "Gửi đơn" → Order and OrderItems created in DB with correct data
- Confirmation screen shows order summary with table number
- Customer taps "Gọi thêm món" → returns to menu, can submit another order
- Second order creates a separate Order record for the same table
- `/order?table=99` → Vietnamese error page
- `/order` (no param) → Vietnamese error page

## Open Questions

- Cart persistence across page refresh — sessionStorage as a quick persist layer, or accept cart loss on refresh? Leaning toward sessionStorage for a better UX at low implementation cost.
- Price calculation — compute totalAmount client-side for display, but re-compute server-side on submission for integrity? Yes, this is standard practice. Server is the source of truth.
