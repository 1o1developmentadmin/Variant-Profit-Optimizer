import db from "../../db.server";

export async function findByDomain(shopDomain: string) {
  return db.shop.findUnique({ where: { shopDomain } });
}

export async function upsertByDomain(
  shopDomain: string,
  data: Partial<{
    hasAllOrdersScope: boolean;
    onboardingComplete: boolean;
    syncRange: number;
    lastFullSyncAt: Date;
    uninstalledAt: Date | null;
  }>,
) {
  return db.shop.upsert({
    where: { shopDomain },
    update: data,
    create: { shopDomain, ...data },
  });
}

export async function updateSyncStatus(
  shopDomain: string,
  lastFullSyncAt: Date,
) {
  return db.shop.update({
    where: { shopDomain },
    data: { lastFullSyncAt },
  });
}

export async function markUninstalled(shopDomain: string) {
  return db.shop.update({
    where: { shopDomain },
    data: { uninstalledAt: new Date() },
  });
}
