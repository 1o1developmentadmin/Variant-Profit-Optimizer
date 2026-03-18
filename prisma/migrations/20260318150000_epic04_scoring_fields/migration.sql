-- Add columns to VariantScore
ALTER TABLE "VariantScore" ADD COLUMN "performanceScore" REAL;
ALTER TABLE "VariantScore" ADD COLUMN "refundScore" REAL;
ALTER TABLE "VariantScore" ADD COLUMN "inventoryScore" REAL;
ALTER TABLE "VariantScore" ADD COLUMN "opportunityScore" REAL;
ALTER TABLE "VariantScore" ADD COLUMN "riskScore" REAL;
ALTER TABLE "VariantScore" ADD COLUMN "confidenceScore" REAL;
ALTER TABLE "VariantScore" ADD COLUMN "recommendedAction" TEXT;
ALTER TABLE "VariantScore" ADD COLUMN "isSingleVariantProduct" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "VariantScore" ADD COLUMN "hasCostData" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "VariantScore" ADD COLUMN "costEstimated" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "VariantScore" ADD COLUMN "scoreWindow" TEXT NOT NULL DEFAULT '30d';
ALTER TABLE "VariantScore" ADD COLUMN "explanationJson" TEXT;
-- Add columns to Recommendation
ALTER TABLE "Recommendation" ADD COLUMN "firstSeenAt" DATETIME;
ALTER TABLE "Recommendation" ADD COLUMN "lastSeenAt" DATETIME;
ALTER TABLE "Recommendation" ADD COLUMN "confidenceScore" REAL;
ALTER TABLE "Recommendation" ADD COLUMN "productGid" TEXT;
ALTER TABLE "Recommendation" ADD COLUMN "variantTitle" TEXT;
-- Add column to MerchantSettings
ALTER TABLE "MerchantSettings" ADD COLUMN "confidenceMinThreshold" REAL NOT NULL DEFAULT 0.40;
