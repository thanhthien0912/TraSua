# M002: Customer Order Flow

**Vision:** Build the customer-facing mobile ordering flow — the destination for M001's QR codes. Customers scan a QR code at their table, browse the menu on their phone organized by category, build a cart with quantities and notes, submit the order to the SQLite database, and see a confirmation screen. Multiple orders per table visit are supported.

## Success Criteria

- Customer visits /order?table=5 → sees tabbed menu with 'Đồ uống' active, seeded drink items with VND-formatted prices
- Customer switches to 'Đồ ăn' tab → sees food items sorted by sortOrder
- Unavailable items show 'Hết hàng' badge and cannot be added to cart
- Customer adds items → sticky bottom bar shows count + total → taps to open slide-up cart sheet
- Cart sheet shows qty +/-, notes field per item, subtotals, grand total, 'Gửi đơn' button
- Customer taps 'Gửi đơn' → Order + OrderItems created in DB with correct tableId, menuItemId, quantity, notes, and server-computed totalAmount
- Confirmation screen shows order summary → 'Gọi thêm món' returns to menu → second order creates separate DB record
- /order?table=99 and /order (no param) both show Vietnamese error page — no ordering possible

## Slices

- [x] **S01: S01** `risk:low` `depends:[]`
  > After this: Customer visits /order?table=5 on a phone → sees tabbed menu with 'Đồ uống' active showing seeded drink items with VND prices → switches to 'Đồ ăn' → sees food items → unavailable items show 'Hết hàng' badge and are not tappable. Visiting /order?table=99 or /order shows Vietnamese error page.

- [ ] **S02: S02** `risk:medium` `depends:[]`
  > After this: Customer on /order?table=5 taps items → sticky bottom bar appears with count + total → taps bar → slide-up cart sheet with qty +/-, notes per item, subtotals → adds 'ít đường' note → taps 'Gửi đơn' → Order + OrderItems created in DB with correct FKs and server-computed total → confirmation screen → taps 'Gọi thêm món' → back to menu → submits second order → two separate Order records in DB.

## Boundary Map

## Horizontal Checklist\n\n| Concern | Status | Notes |\n|---------|--------|-------|\n| Requirements re-read | ✅ Done | R001, R005, R006, R007 mapped. R002-R004 explicitly out of scope. |\n| Decisions re-evaluated | ✅ Done | D001 (tech stack), D002 (QR = table identity), D003 (no customer cancel) all respected. |\n| Auth boundary | ✅ N/A | Customer /order routes are unprotected per middleware — QR scan = table identity (D002). No customer auth needed. |\n| Shared resources | ✅ Covered | VND formatter (src/lib/format.ts) created in S01, reused in S02. Prisma singleton from M001 reused. |\n| Revenue paths | ✅ N/A | No payment in M002. Order creation only — billing is M004. |\n| Graceful shutdown | ✅ N/A | Stateless customer UI writing to local SQLite. No long-running processes. |\n| Reconnection | ✅ N/A | Single HTTP requests — no persistent connections. Cart state in sessionStorage survives brief disconnects. |\n| Visual consistency | ✅ Covered | Both slices follow M001's amber/warm color scheme, gradient buttons, layered shadows, scale-on-press, tabular-nums for prices. |
