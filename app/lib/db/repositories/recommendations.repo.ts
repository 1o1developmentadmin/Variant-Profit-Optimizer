/**
 * Recommendations Repository — EPIC-04
 */
import db from "../../../db.server";

export async function findActiveRecommendation(
  shopDomain: string,
  variantGid: string,
  type: string,
) {
  return db.recommendation.findFirst({
    where: { shopDomain, variantGid, type, status: "active" },
  });
}

export async function createRecommendation(data: {
  shopDomain: string;
  variantGid: string;
  type: string;
  priority: number;
  titleText: string;
  bodyText: string;
  confidenceScore: number;
  productGid?: string;
  variantTitle?: string;
}) {
  const now = new Date();
  return db.recommendation.create({
    data: { ...data, status: "active", firstSeenAt: now, lastSeenAt: now },
  });
}

export async function touchRecommendation(id: string) {
  return db.recommendation.update({
    where: { id },
    data: { lastSeenAt: new Date() },
  });
}

export async function resolveRecommendation(id: string) {
  return db.recommendation.update({
    where: { id },
    data: { status: "resolved", resolvedAt: new Date() },
  });
}

export async function getActiveRecommendations(
  shopDomain: string,
  filters?: {
    type?: string;
    productGid?: string;
    minConfidence?: number;
  },
) {
  return db.recommendation.findMany({
    where: {
      shopDomain,
      status: "active",
      ...(filters?.type ? { type: filters.type } : {}),
      ...(filters?.productGid ? { productGid: filters.productGid } : {}),
      ...(filters?.minConfidence
        ? { confidenceScore: { gte: filters.minConfidence } }
        : {}),
    },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  });
}
