---
phase: complete-milestone
phase_name: Bill & Checkout
project: TraSua
generated: 2026-05-06T15:35:00Z
counts:
  decisions: 4
  lessons: 4
  patterns: 5
  surprises: 1
missing_artifacts: []
---

# M004 Learnings

## Milestone Summary

M004 completed the order lifecycle with a staff checkout tab for bill aggregation, item management, and payment marking with real-time SSE propagation. 2 slices, 6 tasks, 111 tests, 0 deviations.

---

### Decisions

- **PAID is order-level override, not item-derived.** deriveOrderStatus() remains pure (item-status only). PAID is set exclusively by the mark-paid API. Item PATCH guards against modifications on PAID orders with 409.
  Source: M004-ROADMAP.md/Architecture Decisions, S01-SUMMARY.md/Key decisions

- **Add-item targets latest unpaid order (not new order).** Keeps order count manageable, bill aggregation handles multi-order transparently.
  Source: M004-CONTEXT.md/Architectural Decisions, S02-SUMMARY.md/Key decisions

- **Reuse item-status-change SSE event type for add-item broadcasts.** Stations already handle this event, so no client-side changes needed — zero regression risk.
  Source: S02-SUMMARY.md/Key decisions

- **Two-slice decomposition: bill-payment core first, add-item second.** S01 delivers R004 independently; S02 adds R008 extension. Follows D006 precedent (read path first, write path second).
  Source: M004-ROADMAP.md/Slices, S01-SUMMARY.md/Follow-ups

---

### Lessons

- **Bill totals should be computed from raw items, not stored totalAmount.** When aggregating across multiple orders, using stored per-order totals creates inconsistency if items are cancelled/added without re-persisting. Computing from flat item list (excluding CANCELLED) is always correct.
  Source: S01-SUMMARY.md/Key decisions

- **Exporting pure reducer functions enables jsdom-free unit testing.** The orderReducer was exported separately from the useOrderStream hook, allowing direct test coverage of REMOVE_ORDERS, ADD_ORDER, UPDATE_ORDER, SET_ORDERS without any DOM environment.
  Source: S01-SUMMARY.md/Patterns established

- **Playwright automation clicks don't reliably trigger React onClick.** React's synthetic event delegation means Playwright's native click doesn't always reach React handlers. Real browser clicks work fine — this is a test automation limitation, not a production issue.
  Source: S01-SUMMARY.md/Known limitations

- **Bottom-sheet modals work better than centered dialogs for mobile/tablet staff workflows.** MenuPickerModal's slide-up-from-bottom pattern provides better thumb reach on touch devices. Established as the default modal pattern for staff-facing item selection.
  Source: S02-SUMMARY.md/Key decisions

---

### Patterns

- **Two-tap confirmation for destructive actions.** 3-second auto-reset timer, color-coded confirmation state (amber default → emerald for pay, red for cancel). Reused for cancel-item, mark-paid, and extensible to future destructive actions.
  Source: S01-SUMMARY.md/Patterns established

- **Belt-and-suspenders real-time: SSE supplements polling.** Checkout page uses 10s polling as baseline with SSE for instant updates. If SSE disconnects, polling catches the gap. If polling is slow, SSE delivers instantly.
  Source: S01-SUMMARY.md/Patterns established

- **SSE event-driven UI removal via Set-based reducer action.** REMOVE_ORDERS converts orderIds to Set for O(1) lookup, then filters orders in a single pass. Efficient for clearing multiple paid orders simultaneously.
  Source: S01-SUMMARY.md/Patterns established

- **Prisma batched $transaction for atomic multi-record status transitions.** Mark-paid wraps updateMany (all orders → PAID) + timestamp assignment in a single $transaction. Add-item wraps createMany + recalculate + re-fetch. Pattern is consistent across M004.
  Source: S01-SUMMARY.md/Patterns established, S02-SUMMARY.md/Key decisions

- **Reuse existing SSE event types when new operations produce compatible payloads.** Add-item broadcasts via item-status-change (not a new event type) because stations already handle it. Eliminates client-side changes and regression risk.
  Source: S02-SUMMARY.md/Patterns established

---

### Surprises

- **Playwright click vs React event delegation mismatch.** Expected Playwright clicks to trigger React onClick handlers reliably, but React's synthetic event system sometimes doesn't fire on Playwright-simulated native clicks. Real browser clicks work fine. Workaround: rely on unit tests for logic, acceptance testing for full-stack flows in real browsers.
  Source: S01-SUMMARY.md/Known limitations
