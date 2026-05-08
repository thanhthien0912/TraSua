---
id: T03
parent: S01
milestone: M005
key_files:
  - src/app/admin/menu/page.tsx
  - src/components/admin/MenuItemForm.tsx
  - src/app/globals.css
key_decisions:
  - Two-tap delete reuses BillView's 3-second auto-reset pattern for consistency across admin and staff pages
  - Hidden items sorted to bottom of list (not filtered out) so admin can always see and restore them
  - Category tabs show non-hidden item counts to give admin quick visibility into active menu size
  - Staggered card animations use CSS @keyframes with inline animation-delay instead of a JS animation library — keeps bundle lean
duration: 
verification_result: passed
completed_at: 2026-05-06T09:11:17.422Z
blocker_discovered: false
---

# T03: Built full admin menu management page with category tabs, item cards, create/edit modal form, availability toggle, two-tap soft-delete, restore, and staggered card animations — all with toast feedback and Vietnamese labels.

**Built full admin menu management page with category tabs, item cards, create/edit modal form, availability toggle, two-tap soft-delete, restore, and staggered card animations — all with toast feedback and Vietnamese labels.**

## What Happened

Replaced the stub `/admin/menu` page with a fully functional menu management UI.\n\n**MenuItemForm (`src/components/admin/MenuItemForm.tsx`):**\n- Slide-up modal reusing the MenuPickerModal pattern (cubic-bezier enter/exit, overlay backdrop, drag handle)\n- Fields: name (text, required), price (number, required), category (DRINK/FOOD tab toggle), description (textarea, optional), sortOrder (number, optional default 0)\n- Inline Vietnamese validation: name cannot be empty, price must be > 0\n- On submit: POST to `/api/admin/menu` for create or PUT to `/api/admin/menu/[id]` for edit\n- Auto-focuses name field after modal open animation\n- Console logging on all operations for observability\n\n**AdminMenuPage (`src/app/admin/menu/page.tsx`):**\n- Client component that fetches all menu items (including hidden) from GET /api/admin/menu on mount\n- Category tabs (DRINK/FOOD) with item counts, reusing the exact tab pattern from MenuView\n- Each card shows: name, description, price (tabular-nums), sortOrder badge, availability badge ('Hết hàng'), hidden badge ('Đã ẩn')\n- Hidden items sorted to bottom, rendered with 55% opacity and slate 'Đã ẩn' badge\n- Action buttons per card:\n  - **Edit**: Opens MenuItemForm pre-populated with item data\n  - **Toggle availability**: PATCH `{field:'available', value:bool}` — button label flips between 'Hết hàng' and 'Còn hàng'\n  - **Soft-delete**: Two-tap confirmation (BillView pattern) — first tap turns button red with 'Xác nhận xoá?', auto-resets after 3s. Second tap calls DELETE endpoint\n  - **Restore** (hidden items only): PATCH `{field:'hidden', value:false}` — green button with undo arrow icon\n- All operations trigger `toast.success()` or `toast.error()` with Vietnamese messages\n- After any successful mutation, refetches the full list to sync state\n- Staggered card enter animation via CSS @keyframes with per-card delay (50ms × index)\n- '+Thêm' button in header for new item creation\n- Empty state with category-specific emoji and 'Thêm món đầu tiên' CTA\n\n**Design polish applied:**\n- Amber/warm palette throughout (amber-50 bg, amber-900 accents, amber-700 buttons)\n- `active:scale-[0.96]` on all interactive elements\n- `tabular-nums` on all prices\n- `text-wrap: balance` on headings\n- 44px+ min-height touch targets on all buttons\n- Concentric border radius (2xl cards, xl inner buttons)\n- Staggered enter animation on card list (`adminCardEnter` keyframes in globals.css)

## Verification

Build passes (`npx next build` — TypeScript OK, compiled successfully). All 111 existing vitest tests pass (`npx vitest run` — 8 suites, 111 tests, 0 failures). No type errors introduced.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx next build` | 0 | ✅ pass | 10800ms |
| 2 | `npx vitest run` | 0 | ✅ pass | 612ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `src/app/admin/menu/page.tsx`
- `src/components/admin/MenuItemForm.tsx`
- `src/app/globals.css`
