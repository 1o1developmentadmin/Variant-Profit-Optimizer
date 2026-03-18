-- AlterTable
ALTER TABLE "VariantDailyMetrics" ADD COLUMN "ordersCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "VariantDailyMetrics" ADD COLUMN "cogsAmount" REAL NOT NULL DEFAULT 0;
ALTER TABLE "VariantDailyMetrics" ADD COLUMN "grossProfitAmount" REAL;
ALTER TABLE "VariantDailyMetrics" ADD COLUMN "marginPct" REAL;
ALTER TABLE "VariantDailyMetrics" ADD COLUMN "salesVelocity7d" REAL NOT NULL DEFAULT 0;
ALTER TABLE "VariantDailyMetrics" ADD COLUMN "salesVelocity30d" REAL NOT NULL DEFAULT 0;
ALTER TABLE "VariantDailyMetrics" ADD COLUMN "endingStockQuantity" INTEGER;
