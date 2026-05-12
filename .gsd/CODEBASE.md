# Codebase Map

Generated: 2026-05-12T02:47:45Z | Files: 108 | Described: 0/108
<!-- gsd:codebase-meta {"generatedAt":"2026-05-12T02:47:45Z","fingerprint":"9c3d859cd61277e14a64520dc1c4ccd4a1059355","fileCount":108,"truncated":false} -->

### (root)/
- `.gitignore`
- `.vercel-build-trigger`
- `.vercelignore`
- `AGENTS.md`
- `capacitor.config.ts`
- `CLAUDE.md`
- `eslint.config.mjs`
- `next-env.d.ts`
- `next.config.ts`
- `package-lock.json`
- `package.json`
- `postcss.config.mjs`
- `README.md`
- `tsconfig.json`
- `vitest.config.ts`

### .github/workflows/
- `.github/workflows/android-build.yml`

### android/
- `android/.gitignore`
- `android/build.gradle`
- `android/gradle.properties`
- `android/gradlew`
- `android/gradlew.bat`
- `android/settings.gradle`
- `android/variables.gradle`

### android/app/
- `android/app/.gitignore`
- `android/app/build.gradle`
- `android/app/proguard-rules.pro`

### android/app/src/androidTest/java/com/getcapacitor/myapp/
- `android/app/src/androidTest/java/com/getcapacitor/myapp/ExampleInstrumentedTest.java`

### android/app/src/main/
- `android/app/src/main/AndroidManifest.xml`

### android/app/src/main/java/com/trasua/app/
- `android/app/src/main/java/com/trasua/app/MainActivity.java`

### android/app/src/main/res/drawable/
- `android/app/src/main/res/drawable/ic_launcher_background.xml`

### android/app/src/main/res/drawable-v24/
- `android/app/src/main/res/drawable-v24/ic_launcher_foreground.xml`

### android/app/src/main/res/layout/
- `android/app/src/main/res/layout/activity_main.xml`

### android/app/src/main/res/mipmap-anydpi-v26/
- `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml`
- `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml`

### android/app/src/main/res/values/
- `android/app/src/main/res/values/ic_launcher_background.xml`
- `android/app/src/main/res/values/strings.xml`
- `android/app/src/main/res/values/styles.xml`

### android/app/src/main/res/xml/
- `android/app/src/main/res/xml/file_paths.xml`

### android/app/src/test/java/com/getcapacitor/myapp/
- `android/app/src/test/java/com/getcapacitor/myapp/ExampleUnitTest.java`

### android/gradle/wrapper/
- `android/gradle/wrapper/gradle-wrapper.jar`
- `android/gradle/wrapper/gradle-wrapper.properties`

### prisma/
- `prisma/schema.prisma`

### src/app/
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/app/page.tsx`

### src/app/admin/
- `src/app/admin/layout.tsx`
- `src/app/admin/page.tsx`

### src/app/admin/history/
- `src/app/admin/history/page.tsx`

### src/app/admin/menu/
- `src/app/admin/menu/page.tsx`

### src/app/admin/qr/
- `src/app/admin/qr/page.tsx`

### src/app/admin/tables/
- `src/app/admin/tables/page.tsx`

### src/app/api/admin/history/
- `src/app/api/admin/history/route.ts`

### src/app/api/admin/menu/
- `src/app/api/admin/menu/route.ts`

### src/app/api/admin/menu/[id]/
- `src/app/api/admin/menu/[id]/route.ts`

### src/app/api/admin/menu/__tests__/
- `src/app/api/admin/menu/__tests__/menu-crud.test.ts`

### src/app/api/admin/qr-pdf/
- `src/app/api/admin/qr-pdf/route.ts`

### src/app/api/admin/qr-pdf/__tests__/
- `src/app/api/admin/qr-pdf/__tests__/qr-pdf.test.ts`

### src/app/api/admin/tables/
- `src/app/api/admin/tables/route.ts`

### src/app/api/admin/tables/[id]/
- `src/app/api/admin/tables/[id]/route.ts`

### src/app/api/admin/tables/__tests__/
- `src/app/api/admin/tables/__tests__/table-crud.test.ts`

### src/app/api/order/
- `src/app/api/order/route.ts`

### src/app/api/staff/checkout/
- `src/app/api/staff/checkout/route.ts`

### src/app/api/staff/menu/
- `src/app/api/staff/menu/route.ts`

### src/app/api/staff/orders/
- `src/app/api/staff/orders/route.ts`

### src/app/api/staff/orders/[orderId]/items/
- `src/app/api/staff/orders/[orderId]/items/route.ts`

### src/app/api/staff/orders/[orderId]/items/[itemId]/
- `src/app/api/staff/orders/[orderId]/items/[itemId]/route.ts`

### src/app/api/staff/tables/[tableId]/bill/
- `src/app/api/staff/tables/[tableId]/bill/route.ts`

### src/app/api/staff/tables/[tableId]/pay/
- `src/app/api/staff/tables/[tableId]/pay/route.ts`

### src/app/order/
- `src/app/order/page.tsx`

### src/app/staff/
- `src/app/staff/layout.tsx`
- `src/app/staff/page.tsx`
- `src/app/staff/StaffNav.tsx`

### src/app/staff/add-order/
- `src/app/staff/add-order/page.tsx`

### src/app/staff/bar/
- `src/app/staff/bar/page.tsx`

### src/app/staff/checkout/
- `src/app/staff/checkout/page.tsx`

### src/app/staff/kitchen/
- `src/app/staff/kitchen/page.tsx`

### src/components/admin/
- `src/components/admin/AdminNav.tsx`
- `src/components/admin/MenuItemForm.tsx`

### src/components/order/
- `src/components/order/CartBar.tsx`
- `src/components/order/CartProvider.tsx`
- `src/components/order/CartSheet.tsx`
- `src/components/order/CartUI.tsx`
- `src/components/order/ErrorPage.tsx`
- `src/components/order/MenuView.tsx`
- `src/components/order/OrderConfirmation.tsx`

### src/components/staff/
- `src/components/staff/AddOrderModal.tsx`
- `src/components/staff/BillView.tsx`
- `src/components/staff/MenuPickerModal.tsx`
- `src/components/staff/OrderCard.tsx`
- `src/components/staff/StationView.tsx`
- `src/components/staff/useNotification.ts`
- `src/components/staff/useOrderStream.ts`

### src/components/staff/__tests__/
- `src/components/staff/__tests__/orderReducer.test.ts`

### src/components/ui/
- `src/components/ui/Skeleton.tsx`
- `src/components/ui/Toast.tsx`
- `src/components/ui/ToastProvider.tsx`

### src/lib/
- `src/lib/categorize-orders.ts`
- `src/lib/format.ts`
- `src/lib/order-status.ts`
- `src/lib/prisma.ts`

### src/lib/__tests__/
- `src/lib/__tests__/add-item-api.test.ts`
- `src/lib/__tests__/bill-aggregation.test.ts`
- `src/lib/__tests__/cancel-recalculation.test.ts`
- `src/lib/__tests__/categorize-orders.test.ts`
- `src/lib/__tests__/hidden-menu-filter.test.ts`
- `src/lib/__tests__/order-status-paid.test.ts`
- `src/lib/__tests__/order-status.test.ts`
- `src/lib/__tests__/sse.test.ts`
