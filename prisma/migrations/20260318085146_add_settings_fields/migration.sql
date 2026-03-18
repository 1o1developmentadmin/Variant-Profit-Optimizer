-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MerchantSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shopDomain" TEXT NOT NULL,
    "lowMarginThreshold" REAL NOT NULL DEFAULT 15,
    "refundRiskThreshold" REAL NOT NULL DEFAULT 8,
    "stockoutThreshold" INTEGER NOT NULL DEFAULT 10,
    "scoringWeightsJson" TEXT,
    "confidenceMinThreshold" REAL NOT NULL DEFAULT 0.40,
    "costSourceMode" TEXT NOT NULL DEFAULT 'shopify',
    "allowManualCostOverrides" BOOLEAN NOT NULL DEFAULT false,
    "recommendationRulesJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MerchantSettings_shopDomain_fkey" FOREIGN KEY ("shopDomain") REFERENCES "Shop" ("shopDomain") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_MerchantSettings" ("confidenceMinThreshold", "createdAt", "id", "lowMarginThreshold", "refundRiskThreshold", "scoringWeightsJson", "shopDomain", "stockoutThreshold", "updatedAt") SELECT "confidenceMinThreshold", "createdAt", "id", "lowMarginThreshold", "refundRiskThreshold", "scoringWeightsJson", "shopDomain", "stockoutThreshold", "updatedAt" FROM "MerchantSettings";
DROP TABLE "MerchantSettings";
ALTER TABLE "new_MerchantSettings" RENAME TO "MerchantSettings";
CREATE UNIQUE INDEX "MerchantSettings_shopDomain_key" ON "MerchantSettings"("shopDomain");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
