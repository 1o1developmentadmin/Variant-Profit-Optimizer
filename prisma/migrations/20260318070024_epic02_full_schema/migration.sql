-- AlterTable
ALTER TABLE "MerchantSettings" ADD COLUMN "scoringWeightsJson" TEXT;

-- CreateTable
CREATE TABLE "SyncJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopDomain" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "bulkOperationId" TEXT,
    "recordsProcessed" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" DATETIME,
    "finishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SyncJob_shopDomain_fkey" FOREIGN KEY ("shopDomain") REFERENCES "Shop" ("shopDomain") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopDomain" TEXT NOT NULL,
    "productGid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "handle" TEXT,
    "status" TEXT,
    "productType" TEXT,
    "vendor" TEXT,
    "createdAtShopify" DATETIME,
    "updatedAtShopify" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_shopDomain_fkey" FOREIGN KEY ("shopDomain") REFERENCES "Shop" ("shopDomain") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Variant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopDomain" TEXT NOT NULL,
    "variantGid" TEXT NOT NULL,
    "productGid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sku" TEXT,
    "price" REAL NOT NULL DEFAULT 0,
    "compareAtPrice" REAL,
    "inventoryItemGid" TEXT,
    "inventoryQuantity" INTEGER,
    "createdAtShopify" DATETIME,
    "updatedAtShopify" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Variant_shopDomain_productGid_fkey" FOREIGN KEY ("shopDomain", "productGid") REFERENCES "Product" ("shopDomain", "productGid") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopDomain" TEXT NOT NULL,
    "inventoryItemGid" TEXT NOT NULL,
    "variantGid" TEXT,
    "sku" TEXT,
    "unitCostAmount" REAL,
    "unitCostCurrencyCode" TEXT,
    "hasCostData" BOOLEAN NOT NULL DEFAULT false,
    "tracked" BOOLEAN NOT NULL DEFAULT false,
    "requiresShipping" BOOLEAN,
    "createdAtShopify" DATETIME,
    "updatedAtShopify" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "InventoryLevel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopDomain" TEXT NOT NULL,
    "inventoryItemGid" TEXT NOT NULL,
    "locationGid" TEXT NOT NULL,
    "available" INTEGER NOT NULL DEFAULT 0,
    "onHand" INTEGER,
    "committed" INTEGER,
    "reserved" INTEGER,
    "incoming" INTEGER,
    "updatedAtShopify" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InventoryLevel_shopDomain_inventoryItemGid_fkey" FOREIGN KEY ("shopDomain", "inventoryItemGid") REFERENCES "InventoryItem" ("shopDomain", "inventoryItemGid") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopDomain" TEXT NOT NULL,
    "orderGid" TEXT NOT NULL,
    "orderNumber" TEXT,
    "name" TEXT,
    "email" TEXT,
    "financialStatus" TEXT,
    "fulfillmentStatus" TEXT,
    "totalPriceAmount" REAL,
    "subtotalAmount" REAL,
    "currencyCode" TEXT,
    "isTest" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" DATETIME,
    "cancelledAtShopify" DATETIME,
    "closedAt" DATETIME,
    "createdAtShopify" DATETIME,
    "updatedAtShopify" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_shopDomain_fkey" FOREIGN KEY ("shopDomain") REFERENCES "Shop" ("shopDomain") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OrderLineItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopDomain" TEXT NOT NULL,
    "orderGid" TEXT NOT NULL,
    "lineItemGid" TEXT NOT NULL,
    "variantGid" TEXT,
    "title" TEXT,
    "variantTitle" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "price" REAL NOT NULL DEFAULT 0,
    "totalDiscountAmount" REAL,
    "sku" TEXT,
    "isGiftCard" BOOLEAN,
    "requiresShipping" BOOLEAN,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OrderLineItem_shopDomain_orderGid_fkey" FOREIGN KEY ("shopDomain", "orderGid") REFERENCES "Order" ("shopDomain", "orderGid") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Refund" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopDomain" TEXT NOT NULL,
    "orderGid" TEXT NOT NULL,
    "refundGid" TEXT NOT NULL,
    "note" TEXT,
    "totalRefundedAmount" REAL,
    "currencyCode" TEXT,
    "createdAtShopify" DATETIME,
    "processedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Refund_shopDomain_orderGid_fkey" FOREIGN KEY ("shopDomain", "orderGid") REFERENCES "Order" ("shopDomain", "orderGid") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RefundLineItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopDomain" TEXT NOT NULL,
    "refundGid" TEXT NOT NULL,
    "orderLineItemGid" TEXT,
    "variantGid" TEXT,
    "refundLineItemGid" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "subtotalAmount" REAL,
    "totalTaxAmount" REAL,
    "restockType" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RefundLineItem_shopDomain_refundGid_fkey" FOREIGN KEY ("shopDomain", "refundGid") REFERENCES "Refund" ("shopDomain", "refundGid") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopDomain" TEXT NOT NULL,
    "orderGid" TEXT NOT NULL,
    "transactionGid" TEXT NOT NULL,
    "parentTransactionGid" TEXT,
    "kind" TEXT,
    "status" TEXT,
    "gateway" TEXT,
    "amount" REAL,
    "currencyCode" TEXT,
    "processedAtShopify" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Transaction_shopDomain_orderGid_fkey" FOREIGN KEY ("shopDomain", "orderGid") REFERENCES "Order" ("shopDomain", "orderGid") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VariantDailyMetrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopDomain" TEXT NOT NULL,
    "variantGid" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "unitsSold" INTEGER NOT NULL DEFAULT 0,
    "revenue" REAL NOT NULL DEFAULT 0,
    "refundCount" INTEGER NOT NULL DEFAULT 0,
    "refundAmount" REAL NOT NULL DEFAULT 0,
    "unitsSoldLast14d" INTEGER NOT NULL DEFAULT 0,
    "unitsSoldPrior14d" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "VariantScore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopDomain" TEXT NOT NULL,
    "variantGid" TEXT NOT NULL,
    "profitScore" REAL,
    "marginPct" REAL,
    "refundRate" REAL,
    "stockoutRisk" REAL,
    "velocityScore" REAL,
    "scoredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Recommendation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopDomain" TEXT NOT NULL,
    "variantGid" TEXT NOT NULL,
    "type" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "titleText" TEXT,
    "bodyText" TEXT,
    "metadata" TEXT,
    "resolvedAt" DATETIME,
    "dismissedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Shop" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shopDomain" TEXT NOT NULL,
    "hasAllOrdersScope" BOOLEAN NOT NULL DEFAULT false,
    "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "syncRange" INTEGER NOT NULL DEFAULT 180,
    "lastFullSyncAt" DATETIME,
    "installedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uninstalledAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Shop" ("createdAt", "hasAllOrdersScope", "id", "onboardingComplete", "shopDomain", "syncRange", "updatedAt") SELECT "createdAt", "hasAllOrdersScope", "id", "onboardingComplete", "shopDomain", "syncRange", "updatedAt" FROM "Shop";
DROP TABLE "Shop";
ALTER TABLE "new_Shop" RENAME TO "Shop";
CREATE UNIQUE INDEX "Shop_shopDomain_key" ON "Shop"("shopDomain");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "SyncJob_shopDomain_status_idx" ON "SyncJob"("shopDomain", "status");

-- CreateIndex
CREATE INDEX "SyncJob_shopDomain_createdAt_idx" ON "SyncJob"("shopDomain", "createdAt");

-- CreateIndex
CREATE INDEX "Product_shopDomain_idx" ON "Product"("shopDomain");

-- CreateIndex
CREATE UNIQUE INDEX "Product_shopDomain_productGid_key" ON "Product"("shopDomain", "productGid");

-- CreateIndex
CREATE INDEX "Variant_shopDomain_idx" ON "Variant"("shopDomain");

-- CreateIndex
CREATE INDEX "Variant_shopDomain_inventoryItemGid_idx" ON "Variant"("shopDomain", "inventoryItemGid");

-- CreateIndex
CREATE UNIQUE INDEX "Variant_shopDomain_variantGid_key" ON "Variant"("shopDomain", "variantGid");

-- CreateIndex
CREATE INDEX "InventoryItem_shopDomain_idx" ON "InventoryItem"("shopDomain");

-- CreateIndex
CREATE INDEX "InventoryItem_shopDomain_variantGid_idx" ON "InventoryItem"("shopDomain", "variantGid");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_shopDomain_inventoryItemGid_key" ON "InventoryItem"("shopDomain", "inventoryItemGid");

-- CreateIndex
CREATE INDEX "InventoryLevel_shopDomain_idx" ON "InventoryLevel"("shopDomain");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryLevel_shopDomain_inventoryItemGid_locationGid_key" ON "InventoryLevel"("shopDomain", "inventoryItemGid", "locationGid");

-- CreateIndex
CREATE INDEX "Order_shopDomain_idx" ON "Order"("shopDomain");

-- CreateIndex
CREATE INDEX "Order_shopDomain_processedAt_idx" ON "Order"("shopDomain", "processedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Order_shopDomain_orderGid_key" ON "Order"("shopDomain", "orderGid");

-- CreateIndex
CREATE INDEX "OrderLineItem_shopDomain_idx" ON "OrderLineItem"("shopDomain");

-- CreateIndex
CREATE INDEX "OrderLineItem_shopDomain_variantGid_idx" ON "OrderLineItem"("shopDomain", "variantGid");

-- CreateIndex
CREATE UNIQUE INDEX "OrderLineItem_shopDomain_lineItemGid_key" ON "OrderLineItem"("shopDomain", "lineItemGid");

-- CreateIndex
CREATE INDEX "Refund_shopDomain_idx" ON "Refund"("shopDomain");

-- CreateIndex
CREATE INDEX "Refund_shopDomain_orderGid_idx" ON "Refund"("shopDomain", "orderGid");

-- CreateIndex
CREATE UNIQUE INDEX "Refund_shopDomain_refundGid_key" ON "Refund"("shopDomain", "refundGid");

-- CreateIndex
CREATE INDEX "RefundLineItem_shopDomain_idx" ON "RefundLineItem"("shopDomain");

-- CreateIndex
CREATE INDEX "RefundLineItem_shopDomain_variantGid_idx" ON "RefundLineItem"("shopDomain", "variantGid");

-- CreateIndex
CREATE INDEX "RefundLineItem_shopDomain_refundGid_idx" ON "RefundLineItem"("shopDomain", "refundGid");

-- CreateIndex
CREATE INDEX "RefundLineItem_shopDomain_orderLineItemGid_idx" ON "RefundLineItem"("shopDomain", "orderLineItemGid");

-- CreateIndex
CREATE UNIQUE INDEX "RefundLineItem_shopDomain_refundLineItemGid_key" ON "RefundLineItem"("shopDomain", "refundLineItemGid");

-- CreateIndex
CREATE INDEX "Transaction_shopDomain_idx" ON "Transaction"("shopDomain");

-- CreateIndex
CREATE INDEX "Transaction_shopDomain_orderGid_idx" ON "Transaction"("shopDomain", "orderGid");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_shopDomain_transactionGid_key" ON "Transaction"("shopDomain", "transactionGid");

-- CreateIndex
CREATE INDEX "VariantDailyMetrics_shopDomain_idx" ON "VariantDailyMetrics"("shopDomain");

-- CreateIndex
CREATE INDEX "VariantDailyMetrics_shopDomain_variantGid_idx" ON "VariantDailyMetrics"("shopDomain", "variantGid");

-- CreateIndex
CREATE UNIQUE INDEX "VariantDailyMetrics_shopDomain_variantGid_date_key" ON "VariantDailyMetrics"("shopDomain", "variantGid", "date");

-- CreateIndex
CREATE INDEX "VariantScore_shopDomain_idx" ON "VariantScore"("shopDomain");

-- CreateIndex
CREATE UNIQUE INDEX "VariantScore_shopDomain_variantGid_key" ON "VariantScore"("shopDomain", "variantGid");

-- CreateIndex
CREATE INDEX "Recommendation_shopDomain_status_idx" ON "Recommendation"("shopDomain", "status");

-- CreateIndex
CREATE INDEX "Recommendation_shopDomain_variantGid_idx" ON "Recommendation"("shopDomain", "variantGid");
