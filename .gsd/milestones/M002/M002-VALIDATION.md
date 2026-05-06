---
verdict: needs-attention
remediation_round: 0
---

# Milestone Validation: M002

## Success Criteria Checklist
| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| 1 | Customer visits /order?table=5 → sees tabbed menu with 'Đồ uống' active, seeded drink items with VND-formatted prices | ✅ MET | S01/T01+T02: browser verified at 390×844, 18 items, VND prices |
| 2 | Customer switches to 'Đồ ăn' tab → sees food items sorted by sortOrder | ✅ MET | S01/T02: clicked 'Đồ ăn' → 6 food items, sortOrder verified |
| 3 | Unavailable items show 'Hết hàng' badge and cannot be added to cart | ⚠️ PARTIAL | Code structurally verified (opacity-55 + badge + no button) but no unavailable items in seed data — never rendered in browser. Server 409 rejection works. |
| 4 | Customer adds items → sticky bottom bar shows count + total → taps to open slide-up cart sheet | ✅ MET | S02/T03: full UI flow at 390px verified |
| 5 | Cart sheet shows qty +/-, notes field per item, subtotals, grand total, 'Gửi đơn' button | ✅ MET | S02/T02+T03: all elements present, notes "ít đường" stored/displayed |
| 6 | Customer taps 'Gửi đơn' → Order + OrderItems created in DB with correct tableId, menuItemId, quantity, notes, and server-computed totalAmount | ✅ MET | S02/T03: curl 201, FK integrity, totalAmount 35000×2+40000=110000 ✓ |
| 7 | Confirmation screen → 'Gọi thêm món' → menu → second order creates separate DB record | ✅ MET | S02/T03: two separate Order records (id:3, id:4) confirmed in DB |
| 8 | /order?table=99 and /order (no param) both show Vietnamese error page | ✅ MET | S01/T01: both URLs → 'Không tìm thấy bàn' dead-end error page |

**Score: 7/8 fully met, 1/8 partially met (criterion #3 — visual verification gap for 'Hết hàng' badge)**

## Slice Delivery Audit
| Slice | SUMMARY.md | UAT.md | Verification | Assessment | Notes |
|-------|-----------|--------|-------------|-----------|-------|
| S01 — Menu Browsing | ✅ Present | ✅ Present | ✅ passed | ✅ pass | Known limitation: no unavailable items in seed data for visual QA of 'Hết hàng' badge |
| S02 — Cart + Order Submission | ✅ Present | ✅ Present | ✅ passed | ✅ pass | Known limitation: no concurrent order testing, inline toast (no formal toast system), no drag-to-dismiss |

Both slices have complete artifact chains (PLAN → task SUMMARYs → slice SUMMARY → UAT). All verification results: passed. Follow-ups documented are correctly scoped to M003/M004.

## Cross-Slice Integration
All 6 cross-slice boundaries HONORED:

| Boundary | Producer (S01) | Consumer (S02) | Status |
|----------|---------------|----------------|--------|
| MenuView component + SerializedMenuItem type | Exported from MenuView.tsx | S02 wired useCart dispatch into MenuView | HONORED |
| formatVND() utility | src/lib/format.ts | Used in 4 S02 files (CartBar, CartSheet, OrderConfirmation) | HONORED |
| ErrorPage component | ErrorPage.tsx dead-end page | page.tsx renders ErrorPage before CartProvider wrapping | HONORED |
| Table validation in page.tsx | 3-gate validation (string → parseInt → DB lookup) | tableInfo.id flows to CartProvider → sessionStorage key → POST body → API re-validates | HONORED |
| Tab-based DRINK/FOOD filtering | useState + ARIA tablist/tab/tabpanel | S02 added cart wiring without breaking tab UX | HONORED |
| Plus button placeholder → Cart dispatch | tabIndex=-1 placeholder in S01 | S02 removed tabIndex=-1, wired onClick → ADD_ITEM dispatch | HONORED |

**End-to-end flow verified:** QR scan → /order?table=5 → table validation → menu fetch + serialization → CartProvider + CartUI wrapping → tab navigation → add items → cart bar → cart sheet → 'Gửi đơn' → POST /api/order → DB transaction → confirmation → 'Gọi thêm món' → second order → separate DB record.

No integration gaps found. Server/client boundary clean (no Prisma class leaks). tableId FK chain intact from DB validation through to Order record. formatVND shared correctly across all 6 call sites.

## Requirement Coverage
| Requirement | Scope | Status | Evidence |
|-------------|-------|--------|----------|
| **R001** — Scan QR → menu → order | M002: scan → menu → submit (M003: staff receives) | **COVERED** | S01: /order?table=5 renders 18-item tabbed menu. S02: full write-path POST /api/order → 201, Order+OrderItems with PENDING status, multi-order verified |
| **R005** — QR codes link to /order?table=N | M002: destination page works | **COVERED** | S01: 3 scenarios verified — valid table → menu, invalid table → error, no param → error. Dead-end ErrorPage prevents ordering without valid QR |
| **R007** — Vietnamese UI, mobile-first | M002: customer ordering screens | **COVERED** | S01+S02: all text Vietnamese (zero English), 375-390px viewport tested, tabular-nums prices, touch targets ≥44px (S01) / ≥48px (S02), safe-area-inset-bottom for notched phones, amber branding throughout |
| R002 — Station routing | M003 | N/A — not in scope | — |
| R003 — Staff dashboard | M003 | N/A — not in scope | — |
| R004 — Billing | M004 | N/A — not in scope | — |
| R006 — Local network | Infrastructure | N/A — not in scope | — |
| R008 — Staff order edit | M003 | N/A — not in scope | — |

All 3 in-scope requirements COVERED. No requirements invalidated or re-scoped. R001 partially advanced (M002 portion complete; 'nhân viên nhận được' deferred to M003 as designed).

## Verification Class Compliance
| Class | Planned Check | Evidence | Verdict |
|---|---|---|---|
| **Contract** | API integration tests: menu fetch returns correct items by category, order creation persists correct records with FK integrity, invalid inputs rejected | S02/T03: 7 curl checks — 201 (valid), 400 (empty items, qty=0, qty<0), 404 (invalid table), 409 (unavailable item). FK integrity + server-computed totalAmount verified in DB. S01/T01: menu fetch returns 18 items sorted by sortOrder, serialized as plain objects. | ✅ PASS |
| **Integration** | Full flow at 375px viewport: QR → menu → cart → submit → DB verify → confirmation → multi-order | S02/T03: complete flow at 390px mobile viewport verified — add items → cart bar → sheet → notes → 'Gửi đơn' → confirmation → 'Gọi thêm món' → second order → two DB records. S01/T02: tab switching at 390×844. | ✅ PASS |
| **Operational** | N/A — stateless customer UI, local SQLite | N/A as planned. console.error logging for Prisma transaction failures as only observability surface — appropriate. | ✅ PASS (N/A) |
| **UAT** | Manual walkthrough: scan QR, browse menu, add items with notes, submit, confirm, second order, DB verify | S01-UAT.md: 7 tests + 3 edge cases. S02-UAT.md: 8 tests + 5 edge cases. Full flow evidence in T03-SUMMARY. | ✅ PASS |


## Verdict Rationale
Verdict: needs-attention. Three parallel reviewers assessed M002. Reviewer A (Requirements Coverage): PASS — all 3 in-scope requirements (R001, R005, R007) fully covered. Reviewer B (Cross-Slice Integration): PASS — all 6 boundaries honored, full E2E flow traced with no gaps. Reviewer C (Assessment & Acceptance Criteria): NEEDS-ATTENTION — 7/8 success criteria fully met, but criterion #3 ('Hết hàng' badge for unavailable items) was only structurally verified in code, never rendered in a browser because seed data contains zero unavailable items. All 4 verification classes pass. The gap is low-risk (straightforward conditional rendering) and quick to remediate (add one unavailable seed item, re-seed, visually verify). A minor lint failure (EADDRINUSE transient issue) was also flagged but does not affect functionality since next build passes TypeScript checks.
