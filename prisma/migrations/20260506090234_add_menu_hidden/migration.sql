-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_menu_items" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "description" TEXT,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_menu_items" ("available", "category", "createdAt", "description", "id", "name", "price", "sortOrder") SELECT "available", "category", "createdAt", "description", "id", "name", "price", "sortOrder" FROM "menu_items";
DROP TABLE "menu_items";
ALTER TABLE "new_menu_items" RENAME TO "menu_items";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
