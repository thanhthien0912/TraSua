---
estimated_steps: 22
estimated_files: 2
skills_used: []
---

# T03: Admin Menu Page UI

Build the full menu management page at `/admin/menu`.

**Menu list view:**
1. Create `src/app/admin/menu/page.tsx` as a client component. Fetch menu items from GET /api/admin/menu on mount.
2. Display items in a card list grouped by category tabs (DRINK/FOOD — reuse tab pattern from MenuView). Show name, price (formatVND), category badge, availability status.
3. Hidden items show grayed out with a 'Đã ẩn' badge and a restore button.
4. Each item card has: edit button, availability toggle ('Hết hàng' / 'Còn hàng'), soft-delete button (with two-tap confirmation pattern from BillView).

**Create/Edit form:**
5. Create `src/components/admin/MenuItemForm.tsx` — modal form (slide-up pattern from MenuPickerModal). Fields: name (text, required), price (number, required), category (DRINK/FOOD select), description (textarea, optional), sortOrder (number, optional, default 0).
6. Form validation: name cannot be empty, price must be > 0. Vietnamese error messages inline.
7. On submit: POST /api/admin/menu (create) or PUT /api/admin/menu/[id] (edit). Show toast on success/error.

**Toast integration:**
8. All CRUD operations (create, edit, toggle, delete, restore) trigger toast.success() or toast.error() with Vietnamese messages.
9. After successful create/edit/delete, refetch the menu list to show updated state.

**Design:**
- Follow amber/warm color palette throughout
- Use scale-[0.96] active press on buttons
- tabular-nums on prices
- text-wrap: balance on headings
- 44px+ touch targets
- Concentric border radius on nested card elements
- Split and stagger enter animations on card list

**Verify:** Build passes. Navigate to /admin/menu — full CRUD cycle works visually.

## Inputs

- `src/components/order/MenuView.tsx (category tab pattern)`
- `src/components/staff/MenuPickerModal.tsx (modal form pattern)`
- `src/components/staff/BillView.tsx (two-tap confirmation pattern)`
- `src/components/ui/ToastProvider.tsx (useToast hook)`
- `src/lib/format.ts (formatVND)`

## Expected Output

- `src/app/admin/menu/page.tsx (full menu management page)`
- `src/components/admin/MenuItemForm.tsx (create/edit modal form)`

## Verification

npx next build
