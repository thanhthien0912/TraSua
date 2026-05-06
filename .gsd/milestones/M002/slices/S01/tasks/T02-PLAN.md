---
estimated_steps: 19
estimated_files: 2
skills_used: []
---

# T02: Tabbed Menu View with Item Cards

Build the MenuView client component with category tabs and item cards.

**Steps:**
1. Create `src/components/order/MenuView.tsx` as a Client Component ('use client'):
   - Props: `{ menuItems: SerializedMenuItem[], table: { id: number, number: number, name: string } }` where SerializedMenuItem is `{ id: number, name: string, category: string, price: number, description: string | null, available: boolean, sortOrder: number }`
   - State: `activeTab: 'DRINK' | 'FOOD'` defaulting to 'DRINK'
   - Two tabs: 'Đồ uống' (DRINK) and 'Đồ ăn' (FOOD) — styled as pill/segment control with amber active state
   - Filter menuItems by activeTab category, render as item cards
   - Each item card shows: name (text-lg), description (text-sm, muted), price formatted with `formatVND()` using tabular-nums
   - Unavailable items: grayed out with 'Hết hàng' badge, no add-to-cart affordance (cart is S02, but card should not look tappable)
   - Available items: show an add button or tappable card affordance (non-functional placeholder for S02 — just visual)
2. Follow M001 visual patterns:
   - Amber-50 background, amber-900/950 text
   - Layered box-shadows on cards (not borders)
   - Rounded-2xl on cards with concentric border radius
   - min-height 48px on tappable elements
   - text-wrap: balance on item names, text-wrap: pretty on descriptions
   - scale(0.96) on press for available items
3. Wire MenuView into the /order page — pass serialized menu items from server component
4. Add a header showing table info: 'Bàn {number}' with table name

## Inputs

- `src/lib/format.ts (VND formatter from T01)`
- `src/app/order/page.tsx (page shell from T01)`
- `src/app/page.tsx (visual language reference)`
- `prisma/seed.ts (verify expected item count: 12 drinks, 6 food)`

## Expected Output

- `src/components/order/MenuView.tsx`
- `src/app/order/page.tsx (updated to render MenuView)`

## Verification

- `next build` completes without type errors
- Navigate to /order?table=5 at 375px viewport → see tabbed menu with 'Đồ uống' active
- Drink items display with VND-formatted prices
- Switch to 'Đồ ăn' tab → food items display
- Items sorted by sortOrder within each tab
- Unavailable items show 'Hết hàng' badge and appear grayed out
- All text in Vietnamese
