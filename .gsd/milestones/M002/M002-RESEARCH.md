# M002: Customer Order Flow — Research

**Date:** 2025-07-18

## Summary

M002 builds the customer-facing ordering flow — the destination for M001's QR codes. The codebase is well-prepared: the Prisma schema has all four models (MenuItem, Table, Order, OrderItem) with correct relationships and enums, 18 menu items and 15 tables are seeded, and the middleware explicitly leaves `/order` unprotected. No schema migrations, no new dependencies, no external services are needed.

The core architecture is a Server Component page at `/order` that validates the table parameter against the database and fetches the menu, passing data down to Client Components that handle cart state, tab switching, the slide-up cart sheet, and order submission. The mutation path uses a Route Handler (`POST /api/order`) rather than a Server Action, because the cart submission is a JSON payload from client-side state (not a form), and the Route Handler pattern gives clean control over validation, error responses, and status codes.

The main risks are CSS animation performance on low-end Android phones (mitigate by keeping the cart sheet simple with CSS transforms only) and the `searchParams` API change in Next.js 16 where it's now a `Promise` that must be awaited. The scope is well-bounded — customer write path only, no staff dashboard, no real-time updates.

## Recommendation

**Approach:** Build the flow in three natural slices ordered by dependency and risk:

1. **API + Data layer first** — Route Handler for order creation, menu fetch utility, table validation, VND formatter. This is the foundation everything else depends on and can be verified with integration tests against the SQLite DB without any UI.
2. **Menu browsing UI** — The `/order` page with table validation, error states, tabbed menu display. Server Component for data fetching, Client Components for tab switching. This proves the read path works end-to-end on a phone.
3. **Cart + Order submission** — Client-side cart state (with sessionStorage persistence), sticky bottom bar, slide-up cart sheet, order submission calling the API, confirmation screen. This is the riskiest slice (most client-side state, most UI complexity) but depends on both prior slices.

**Why this order:** The API slice retires the biggest unknown first (can we create orders with correct FK integrity?) and unblocks everything else. The menu UI is a natural prerequisite for the cart — you need something to add items from. The cart slice is last because it's pure client-side work that doesn't affect the data layer.

## Implementation Landscape

### Key Files

- `prisma/schema.prisma` — Complete schema: MenuItem (category, price, available, sortOrder), Table (number, name), Order (tableId, status, totalAmount), OrderItem (orderId, menuItemId, quantity, status, notes). **No changes needed.**
- `prisma/seed.ts` — 12 DRINK items (25,000–40,000₫), 6 FOOD items (20,000–35,000₫), 15 tables. All with sortOrder. Provides realistic test data.
- `src/lib/prisma.ts` — PrismaClient singleton using `@prisma/adapter-better-sqlite3` with `file:prisma/dev.db`. Standard import pattern: `import { prisma } from '@/lib/prisma'`.
- `generated/prisma/client.ts` — Generated Prisma client with full type exports for MenuItem, Order, OrderItem, Table, Category, OrderStatus, ItemStatus enums.
- `src/app/layout.tsx` — Root layout with `lang="vi"`, `antialiased` class, `min-h-full flex flex-col` body. Sets the shell for all pages.
- `src/app/globals.css` — Tailwind v4 import with CSS custom properties: `--background: #fffbeb` (amber-50), `--foreground: #451a03` (amber-950). Dark mode variant defined but not actively used in M001 pages.
- `src/app/page.tsx` — Landing page establishing the visual language: amber-50 bg, amber-900/950 text, rounded-2xl/3xl cards, `text-wrap: balance` on headings, `text-wrap: pretty` on body, layered box-shadows, `active:scale-[0.96]` on buttons.
- `src/middleware.ts` — Protects `/admin/:path*` and `/api/admin/:path*` only. `/order` and `/api/order` routes are unprotected — correct for customer access.
- `src/app/admin/login/page.tsx` — Client Component reference for interaction patterns: gradient buttons (`linear-gradient(145deg, #f59e0b, #d97706)`), layered shadows, `scale(0.96)` on press, `cubic-bezier(0.2, 0, 0, 1)` easing, `fadeSlideUp` animation on mount.

### New Files to Create

- `src/app/order/page.tsx` — Server Component. Validates `table` searchParam (awaits the Promise — **Next.js 16 breaking change**), queries DB for table + menu items, renders error page or passes data to client components.
- `src/app/order/layout.tsx` — Optional order-specific layout (mobile viewport meta, order-specific styles).
- `src/components/order/MenuView.tsx` — Client Component. Tabbed menu (Đồ uống / Đồ ăn), item cards, add-to-cart buttons. Receives menu items as serialized props from server.
- `src/components/order/CartProvider.tsx` — Client Component context provider. Cart state management with useReducer + sessionStorage persistence. Wraps the order page.
- `src/components/order/CartBar.tsx` — Client Component. Sticky bottom bar showing item count + total. Taps to open cart sheet.
- `src/components/order/CartSheet.tsx` — Client Component. Slide-up sheet with item list, qty +/-, notes per item, subtotals, grand total, "Gửi đơn" button.
- `src/components/order/OrderConfirmation.tsx` — Client Component. Success screen with order summary and "Gọi thêm món" button.
- `src/components/order/ErrorPage.tsx` — Server or Client Component. Vietnamese error display for invalid/missing table.
- `src/app/api/order/route.ts` — Route Handler. POST endpoint for order creation. Validates table, validates items exist and are available, creates Order + OrderItems in a transaction, computes totalAmount server-side.
- `src/lib/format.ts` — VND price formatter utility: `formatVND(45000)` → `"45,000đ"`. Uses `Intl.NumberFormat('vi-VN')` — no external deps.

### Build Order

1. **Prove data integrity first:** Build the `POST /api/order` route handler with Prisma transaction creating Order + OrderItems. Verify FK integrity, server-side price computation, and rejection of invalid tables/items. This unblocks the cart submission and is testable without UI.
2. **Prove the read path:** Build the `/order` page with table validation and menu display. Verify seeded items render correctly in category tabs on a mobile viewport. This unblocks cart work.
3. **Prove the write path end-to-end:** Build the cart (state management + UI) and wire it to the API. Verify the full flow: browse → add → review → submit → confirmation → order in DB.

### Verification Approach

- **API integration tests:** Hit `POST /api/order` with valid/invalid payloads, verify DB records with Prisma queries. Check: correct tableId FK, correct menuItemId FKs, quantity/notes persisted, totalAmount computed correctly, unavailable items rejected, invalid table rejected.
- **Build verification:** `next build` succeeds without type errors — confirms Server/Client component boundaries are correct.
- **Mobile viewport check:** Navigate to `/order?table=5` at 375px viewport width, verify tabs are tappable and cart sheet is usable.
- **Error path check:** `/order?table=99` and `/order` (no param) both show Vietnamese error page.
- **Multi-order check:** Submit two orders for the same table, verify both exist as separate records.

## Don't Hand-Roll

| Problem | Existing Solution | Why Use It |
|---------|------------------|------------|
| VND formatting | `Intl.NumberFormat('vi-VN')` | Built-in, no dependency, handles thousand separators correctly |
| Cart state | `useReducer` + `sessionStorage` | Standard React pattern, no library needed for this scope |
| Slide-up sheet | CSS `transform: translateY()` + transitions | Pure CSS is lighter and more performant than a sheet library. No need for radix-ui or similar — the sheet is simple (open/close, no drag-to-dismiss needed in M002) |
| Prisma transaction | `prisma.$transaction()` | Built into Prisma, ensures Order + OrderItems are created atomically |

## Constraints

- **Next.js 16.2.4 `searchParams` is a Promise:** `const { table } = await searchParams` — not direct property access. The page component must be `async`. This is a breaking change from earlier Next.js versions.
- **Next.js 16.2.4 `params` is also a Promise:** Same pattern for route params if dynamic routes are used.
- **Prisma v7 with better-sqlite3 adapter:** The client is generated to `generated/prisma/client` (not `@prisma/client`). Import types and client from `../../generated/prisma/client` or use the `@/lib/prisma` singleton.
- **SQLite single-connection:** No concurrent write concerns at tea shop scale, but Prisma transactions are still recommended for atomic Order + OrderItems creation.
- **No `page.tsx` and `route.ts` at the same path:** Can't have both `/order/page.tsx` and `/order/route.ts`. The API must be at `/api/order/route.ts`.
- **R006 — No external resources:** All JS/CSS must be bundled. No CDN fonts, no external API calls. System-ui fonts already configured in globals.css.
- **Tailwind v4:** Uses `@import "tailwindcss"` and `@theme inline` blocks. Custom colors defined via CSS custom properties, not tailwind.config.

## Common Pitfalls

- **Forgetting to `await searchParams`** — In Next.js 16, accessing `searchParams.table` without await will return a Promise object, not the value. The page must be `async function Page({ searchParams }: { searchParams: Promise<...> })`.
- **Client Component importing Prisma** — Any file importing from `@/lib/prisma` or the generated client becomes server-only. Keep the data fetching in the Server Component page and pass serialized props to Client Components. Dates and enums need to be serialized (pass as strings or pre-format).
- **Cart sheet z-index vs sticky bar** — The slide-up sheet must layer above the sticky bottom bar. Use a shared z-index scale (e.g., bar at z-30, sheet at z-40, backdrop at z-30).
- **VND price as integer** — Prices are stored as integers (VND has no decimals). The formatter should accept `number` and output `"45,000đ"`. Don't accidentally divide by 100.
- **Server-side totalAmount re-computation** — The client computes total for display, but the API must re-compute from DB prices to prevent manipulation. Never trust client-sent prices.
- **SessionStorage vs localStorage for cart** — sessionStorage is tab-scoped and clears when the tab closes. This is correct behavior — a cart should not persist across visits/tabs. localStorage would cause stale carts for different tables.
- **Category enum matching** — The schema uses `DRINK` and `FOOD` enums. Filter with `category: 'DRINK'` not lowercase. Tab labels are Vietnamese: "Đồ uống" / "Đồ ăn".

## Open Risks

- **Slide-up cart sheet on older Android WebView:** CSS `transform: translateY()` with `transition` should be performant, but devices with <2GB RAM may struggle with the backdrop blur if used. Mitigation: use a semi-transparent overlay without blur for the cart sheet backdrop, or add `will-change: transform` sparingly.
- **sessionStorage availability:** Some in-app browsers or strict privacy modes disable sessionStorage. The cart should degrade gracefully — work without persistence, just lose state on refresh. Wrap sessionStorage access in try/catch.
- **Stale availability race condition:** A customer adds an available item, but staff marks it unavailable before submission. The API validates availability at submission time and returns which items are no longer available. The UX for this error needs careful design — highlight the problem items in the cart sheet and let the customer remove them.

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| Next.js App Router | `wshobson/agents@nextjs-app-router-patterns` | available (16.1K installs) — useful for Server/Client component patterns |
| Prisma | `prisma/skills@prisma-client-api` | available (7.3K installs) — useful for transaction patterns |
| Tailwind CSS mobile | `josiahsiegel/claude-plugin-marketplace@tailwindcss-mobile-first` | available (1.4K installs) — relevant for mobile-first patterns |
| React best practices | Already installed as `react-best-practices` | installed |
| UI polish | Already installed as `make-interfaces-feel-better` | installed |

## Candidate Requirements

The following gaps surfaced during research. They are **advisory** — not auto-binding:

1. **Cart persistence across tab refresh (candidate):** sessionStorage persist layer for cart state. Low cost, meaningful UX improvement. The CONTEXT already leans toward this. Recommend including in M002 scope.
2. **Server-side price re-computation (table stakes):** Already implied by the CONTEXT's "Open Questions" section. The API must never trust client-sent prices. This is a security concern, not optional.
3. **Stale availability handling (table stakes):** The CONTEXT describes this in the error handling section. The API must validate item availability at submission time and return actionable errors. Essential for correctness.
4. **Loading states / skeletons (quality):** Not explicitly mentioned in CONTEXT but implied by R007 (mobile-first, good UX). A loading.tsx for the order page would show a skeleton while menu data loads. Low cost, noticeable UX improvement.

## Existing Pattern Reuse

- **Visual language:** Amber/warm color scheme, gradient buttons (`linear-gradient(145deg, #f59e0b, #d97706)`), layered shadows, `scale(0.96)` on press, `cubic-bezier(0.2, 0, 0, 1)` easing, `fadeSlideUp` mount animation — all established in M001's admin pages. M002 should follow the same patterns for visual consistency.
- **Font smoothing:** `antialiased` already on `<html>` in root layout.
- **Text wrapping:** `text-wrap: balance` on headings, `text-wrap: pretty` on body text — used in landing page and admin pages.
- **Tabular numbers:** `font-variant-numeric: tabular-nums` used in admin page for numeric displays — should be applied to prices in the menu and cart.
- **Hit areas:** M001 buttons use `min-height: 48px` — maintain this for all tappable elements on the order page.
- **Box shadows over borders:** M001 uses layered shadows with transparency (`0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(120,53,15,0.06)`) instead of hard borders. Follow this pattern for menu item cards and the cart sheet.

## Boundary Contracts

- **Server → Client data contract:** The order page (Server Component) fetches menu items and table info, serializes them as plain objects (no Prisma instances, no Date objects), and passes them as props to Client Components. The shape: `{ table: { id, number, name }, menuItems: { id, name, category, price, description, available, sortOrder }[] }`.
- **Client → API contract:** `POST /api/order` expects `{ tableId: number, items: { menuItemId: number, quantity: number, notes?: string }[] }`. Returns `{ order: { id, totalAmount, items: [...] } }` on success, `{ error: string, details?: {...} }` on failure.
- **M002 → M003 contract:** M002 creates Order records with `status: PENDING` and OrderItem records with `status: PENDING`. M003 reads these records to display on the staff dashboard. No schema changes needed — the existing enums and relations are sufficient.
