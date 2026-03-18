/**
 * Stock Health Calculations — TICKET-03-04
 */
import db from "../../db.server";

export type StockHealth = "critical" | "low" | "healthy" | "overstocked" | "excess";

export interface InventoryMetrics {
  variantGid: string;
  currentStock: number;
  salesVelocity30d: number;
  daysOfStockLeft: number;
  stockHealth: StockHealth;
}

const EPSILON = 0.0001;

function labelStockHealth(daysLeft: number): StockHealth {
  if (daysLeft < 7) return "critical";
  if (daysLeft < 14) return "low";
  if (daysLeft < 45) return "healthy";
  if (daysLeft < 90) return "overstocked";
  return "excess";
}

export async function computeInventoryMetrics(
  shopDomain: string,
  variantGid: string,
): Promise<InventoryMetrics> {
  const variant = await db.variant.findUnique({
    where: { shopDomain_variantGid: { shopDomain, variantGid } },
  });

  // Get current stock from all inventory levels
  let currentStock = 0;
  if (variant?.inventoryItemGid) {
    const levels = await db.inventoryLevel.findMany({
      where: { shopDomain, inventoryItemGid: variant.inventoryItemGid },
    });
    currentStock = levels.reduce(
      (s: number, l: { available: number }) => s + l.available, 0,
    );
  }

  // Get latest sales velocity from daily metrics
  const latest = await db.variantDailyMetrics.findFirst({
    where: { shopDomain, variantGid },
    orderBy: { date: "desc" },
    select: { salesVelocity30d: true },
  });
  const salesVelocity30d = latest?.salesVelocity30d ?? 0;

  // days_of_stock_left = current_stock / max(salesVelocity30d / 30, epsilon)
  const dailyRate = Math.max(salesVelocity30d / 30, EPSILON);
  const daysOfStockLeft = currentStock / dailyRate;

  const stockHealth = labelStockHealth(daysOfStockLeft);

  return {
    variantGid,
    currentStock,
    salesVelocity30d,
    daysOfStockLeft,
    stockHealth,
  };
}
