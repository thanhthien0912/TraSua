---
estimated_steps: 15
estimated_files: 4
skills_used: []
---

# T04: SSE payment integration + useOrderStream extension + unit tests

1. Extend useOrderStream (src/components/staff/useOrderStream.ts):
   - Add REMOVE_ORDERS action to reducer: removes orders by ID array
   - Add event listener for 'order-paid' SSE event
   - On order-paid: dispatch REMOVE_ORDERS with the paid orderIds → orders disappear from station views

2. Add SSE connection to checkout page:
   - Checkout page and BillView should refetch data when SSE events arrive (item-status-change affects bill totals, order-paid affects table list)
   - Use same EventSource connection pattern, listen for relevant events

3. Write unit tests:
   - src/lib/__tests__/bill-aggregation.test.ts: test calculateOrderTotal with multi-order item arrays, verify cancelled exclusion, verify correct totals
   - Test useOrderStream reducer REMOVE_ORDERS action: given orders [1,2,3], remove [1,2] → only order 3 remains

4. Verify full flow:
   - Two orders on same table → open bill → correct aggregation
   - Cancel item from bill → total updates → station sees change
   - Mark paid → stations clear → checkout page updates

5. Run full test suite to verify no regressions: npx vitest run

## Inputs

- `src/components/staff/useOrderStream.ts (current hook with ADD/UPDATE)`
- `src/lib/order-status.ts (calculateOrderTotal)`
- `src/lib/sse.ts (broadcast for reference)`

## Expected Output

- `Updated src/components/staff/useOrderStream.ts with REMOVE_ORDERS + order-paid listener`
- `src/lib/__tests__/bill-aggregation.test.ts`
- `Updated checkout/BillView with SSE reactivity`

## Verification

npx vitest run && npx next build
