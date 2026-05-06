---
phase: complete-milestone
phase_name: M002 Milestone Completion
project: TraSua
generated: 2025-07-19T00:00:00Z
counts:
  decisions: 4
  lessons: 3
  patterns: 4
  surprises: 1
missing_artifacts: []
---

# M002 Learnings — Customer Order Flow

### Decisions

- **Two-slice decomposition along read/write boundary:** Split M002 into S01 (menu browsing — read path) and S02 (cart + order submission — write path) instead of three slices with a standalone API slice. The read path is independently valuable (QR codes lead to a real menu), and the API belongs with the cart because they form a single demoable capability.
  Source: M002-ROADMAP.md/Slices

- **Route Handler over Server Action for order creation:** Used POST /api/order with JSON request/response and explicit status codes (400/404/409) instead of Server Actions. Cart submission is a JSON payload from client-side state, not a form — Server Actions would require workarounds for custom error shapes.
  Source: M002-CONTEXT.md/Architectural Decisions

- **Server-side totalAmount computation — never trust client:** POST /api/order always re-computes totalAmount from DB prices with full FK validation chain. This prevents price manipulation and ensures data integrity regardless of client state.
  Source: S02-SUMMARY.md/Key decisions

- **CartUI children-wrapping with ViewState discriminated union:** Restructured CartUI to accept children (server components) and manage menu↔confirmation transitions via ViewState, keeping page.tsx as a server component. This deviation from the original T02 plan was necessary because the confirmation screen swap required a client boundary that could coordinate both views.
  Source: S02-SUMMARY.md/Deviations

### Lessons

- **Children-wrapping pattern for client boundaries:** When a server component page needs client-side view transitions, wrap server component children in a client wrapper managing ViewState — avoids converting the page itself to a client component. This was discovered during S02/T03 when the confirmation screen swap demanded a unified client boundary.
  Source: S02-SUMMARY.md/What Happened

- **sessionStorage keyed by domain entity prevents cross-entity contamination:** Keying cart persistence by `trasua-cart-{tableId}` ensures table isolation with zero additional infrastructure. Simple but effective — the key naming convention is the whole pattern.
  Source: S02-SUMMARY.md/Key decisions

- **Unavailable item handling needs seed data for visual QA:** The 'Hết hàng' badge was code-verified but never visually confirmed in browser because no seed data items have `available: false`. For future milestones, seed data should cover all UI states, not just the happy path.
  Source: S01-SUMMARY.md/Known Limitations

### Patterns

- **CartProvider useReducer + sessionStorage hydration guard:** Five-action reducer (ADD_ITEM, REMOVE_ITEM, UPDATE_QUANTITY, UPDATE_NOTES, CLEAR_CART) with payload wrapper objects. sessionStorage keyed by tableId. `useIsHydrated` guard prevents initial empty state from overwriting stored cart on mount. Reusable for any client-side state needing persistence across page navigations.
  Source: S02-SUMMARY.md/Patterns established

- **Spring-like cubic-bezier(0.32, 0.72, 0, 1) for staggered entrance animations:** Used for OrderConfirmation's 5-element staggered fadeSlideUp (0→350ms delays) and CartSheet slide-up. Produces a natural, spring-like deceleration that feels polished on mobile. Reuse for any entrance animation in the app.
  Source: S02-SUMMARY.md/Patterns established

- **Server-side price computation with full FK validation chain:** API route validates: body shape → quantity positivity → table existence → menuItem existence → menuItem availability, then computes totals from DB prices. Each validation returns a specific HTTP status code. This chain pattern should be applied to all order-modifying endpoints.
  Source: S02-SUMMARY.md/Patterns established

- **Dead-end error page pattern for invalid URL params:** ErrorPage renders a full-screen Vietnamese message with no navigation links — no escape routes to valid content. Prevents users from reaching ordering functionality without a valid QR scan. Apply this pattern to any entry-point validation.
  Source: S01-SUMMARY.md/Key decisions

### Surprises

- **CartUI required restructuring mid-slice:** The original T02 plan had CartUI as a thin sibling wrapper, but the confirmation screen (T03) needed a client boundary that could manage both MenuView and OrderConfirmation rendering — this forced a restructure to a children-wrapping pattern with ViewState. The deviation was small in code but conceptually important: it revealed that view-transition requirements should be considered during slice planning, not discovered during task implementation.
  Source: S02-SUMMARY.md/Deviations
