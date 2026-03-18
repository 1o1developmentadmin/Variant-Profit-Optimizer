/**
 * Prisma seed script — TICKET-11-01
 *
 * Seeds a test store with known data for manual score verification:
 *   - 3 products, 5–8 variants each
 *   - 100+ orders distributed over 90 days
 *   - 20+ refunds
 *   - Inventory costs on ~70% of variants
 *
 * Run: npx tsx prisma/seed.ts
 *
 * Known expected values (for manual verification against PRD 22.6 formulas):
 *   Variant "Blue Widget - Large" (V-001):
 *     Revenue (30d)        = $1,500.00
 *     COGS (30d)           = $600.00   (unit cost $20, 30 units sold)
 *     Refund amount (30d)  = $100.00   (5 units refunded @ $20)
 *     Gross profit (30d)   = $1,500 − $600 − $100 = $800.00
 *     Margin %             = $800 / $1,500 ≈ 53.3%
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const SHOP = "test-seed-store.myshopify.com";

// Product GIDs
const P1 = "gid://shopify/Product/1001";
const P2 = "gid://shopify/Product/1002";
const P3 = "gid://shopify/Product/1003";

type VariantDef = {
  variantGid: string;
  title: string;
  sku: string;
  price: number;
  unitCost: number | null;
};

const PRODUCTS: { productGid: string; title: string; variants: VariantDef[] }[] = [
  {
    productGid: P1,
    title: "Widget Pro",
    variants: [
      { variantGid: "gid://shopify/ProductVariant/2001", title: "Blue - Large", sku: "WP-BL", price: 50, unitCost: 20 },
      { variantGid: "gid://shopify/ProductVariant/2002", title: "Blue - Small", sku: "WP-BS", price: 45, unitCost: 18 },
      { variantGid: "gid://shopify/ProductVariant/2003", title: "Red - Large", sku: "WP-RL", price: 50, unitCost: 20 },
      { variantGid: "gid://shopify/ProductVariant/2004", title: "Red - Small", sku: "WP-RS", price: 45, unitCost: 18 },
      { variantGid: "gid://shopify/ProductVariant/2005", title: "Green - Large", sku: "WP-GL", price: 52, unitCost: null }, // missing cost
    ],
  },
  {
    productGid: P2,
    title: "Gadget Basic",
    variants: [
      { variantGid: "gid://shopify/ProductVariant/2011", title: "Standard", sku: "GB-STD", price: 99, unitCost: 40 },
      { variantGid: "gid://shopify/ProductVariant/2012", title: "Premium", sku: "GB-PRE", price: 149, unitCost: 60 },
      { variantGid: "gid://shopify/ProductVariant/2013", title: "Economy", sku: "GB-ECO", price: 69, unitCost: 25 },
      { variantGid: "gid://shopify/ProductVariant/2014", title: "Deluxe", sku: "GB-DLX", price: 199, unitCost: 80 },
      { variantGid: "gid://shopify/ProductVariant/2015", title: "Mini", sku: "GB-MIN", price: 49, unitCost: 20 },
      { variantGid: "gid://shopify/ProductVariant/2016", title: "Maxi", sku: "GB-MAX", price: 219, unitCost: null }, // missing cost
    ],
  },
  {
    productGid: P3,
    title: "Tool Kit",
    variants: [
      { variantGid: "gid://shopify/ProductVariant/2021", title: "Starter", sku: "TK-STR", price: 35, unitCost: 14 },
      { variantGid: "gid://shopify/ProductVariant/2022", title: "Professional", sku: "TK-PRO", price: 75, unitCost: 30 },
      { variantGid: "gid://shopify/ProductVariant/2023", title: "Expert", sku: "TK-EXP", price: 120, unitCost: 48 },
      { variantGid: "gid://shopify/ProductVariant/2024", title: "Master", sku: "TK-MST", price: 180, unitCost: 72 },
      { variantGid: "gid://shopify/ProductVariant/2025", title: "Ultimate", sku: "TK-ULT", price: 250, unitCost: 100 },
      { variantGid: "gid://shopify/ProductVariant/2026", title: "Compact", sku: "TK-CMP", price: 28, unitCost: 11 },
      { variantGid: "gid://shopify/ProductVariant/2027", title: "Heavy Duty", sku: "TK-HDU", price: 95, unitCost: null }, // missing cost
    ],
  },
];

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  console.log("Seeding test store:", SHOP);

  // Clean up any existing seed data
  await db.refundLineItem.deleteMany({ where: { shopDomain: SHOP } });
  await db.transaction.deleteMany({ where: { shopDomain: SHOP } });
  await db.orderLineItem.deleteMany({ where: { shopDomain: SHOP } });
  await db.refund.deleteMany({ where: { shopDomain: SHOP } });
  await db.inventoryLevel.deleteMany({ where: { shopDomain: SHOP } });
  await db.inventoryItem.deleteMany({ where: { shopDomain: SHOP } });
  await db.variantDailyMetrics.deleteMany({ where: { shopDomain: SHOP } });
  await db.variantScore.deleteMany({ where: { shopDomain: SHOP } });
  await db.recommendation.deleteMany({ where: { shopDomain: SHOP } });
  await db.order.deleteMany({ where: { shopDomain: SHOP } });
  await db.variant.deleteMany({ where: { shopDomain: SHOP } });
  await db.product.deleteMany({ where: { shopDomain: SHOP } });
  await db.syncJob.deleteMany({ where: { shopDomain: SHOP } });
  await db.merchantSettings.deleteMany({ where: { shopDomain: SHOP } });
  await db.shop.deleteMany({ where: { shopDomain: SHOP } });

  // Create shop
  await db.shop.create({
    data: {
      shopDomain: SHOP,
      hasAllOrdersScope: true,
      onboardingComplete: true,
      syncRange: 90,
      lastFullSyncAt: new Date(),
    },
  });

  await db.merchantSettings.create({
    data: {
      shopDomain: SHOP,
      lowMarginThreshold: 15,
      refundRiskThreshold: 8,
      stockoutThreshold: 10,
    },
  });

  // Create products and variants
  for (const product of PRODUCTS) {
    await db.product.create({
      data: {
        shopDomain: SHOP,
        productGid: product.productGid,
        title: product.title,
        status: "ACTIVE",
        handle: product.title.toLowerCase().replace(/\s+/g, "-"),
      },
    });

    for (const v of product.variants) {
      await db.variant.create({
        data: {
          shopDomain: SHOP,
          variantGid: v.variantGid,
          productGid: product.productGid,
          title: v.title,
          sku: v.sku,
          price: v.price,
          inventoryQuantity: randomInt(5, 100),
          inventoryItemGid: v.variantGid.replace("ProductVariant", "InventoryItem"),
        },
      });

      // Inventory item with cost data
      await db.inventoryItem.create({
        data: {
          shopDomain: SHOP,
          inventoryItemGid: v.variantGid.replace("ProductVariant", "InventoryItem"),
          variantGid: v.variantGid,
          sku: v.sku,
          unitCostAmount: v.unitCost,
          unitCostCurrencyCode: "USD",
          hasCostData: v.unitCost != null,
          tracked: true,
        },
      });
    }
  }

  // Create 110 orders spread over 90 days
  const allVariants = PRODUCTS.flatMap((p) => p.variants);
  let orderNum = 1000;

  for (let i = 0; i < 110; i++) {
    const orderGid = `gid://shopify/Order/${10000 + i}`;
    const daysBack = randomInt(0, 89);
    const processedAt = daysAgo(daysBack);

    // Pick 1–4 variants for this order
    const numItems = randomInt(1, 4);
    const chosenVariants = allVariants
      .sort(() => Math.random() - 0.5)
      .slice(0, numItems);

    let orderTotal = 0;
    for (const v of chosenVariants) {
      orderTotal += v.price * randomInt(1, 3);
    }

    await db.order.create({
      data: {
        shopDomain: SHOP,
        orderGid,
        orderNumber: String(++orderNum),
        name: `#${orderNum}`,
        financialStatus: "paid",
        totalPriceAmount: orderTotal,
        currencyCode: "USD",
        processedAt,
        createdAtShopify: processedAt,
      },
    });

    for (let j = 0; j < chosenVariants.length; j++) {
      const v = chosenVariants[j];
      const qty = randomInt(1, 3);
      await db.orderLineItem.create({
        data: {
          shopDomain: SHOP,
          orderGid,
          lineItemGid: `gid://shopify/LineItem/${10000 + i * 10 + j}`,
          variantGid: v.variantGid,
          title: v.title,
          quantity: qty,
          price: v.price,
          totalDiscountAmount: 0,
          sku: v.sku,
        },
      });
    }
  }

  // Create 25 refunds spread over the orders
  const orders = await db.order.findMany({ where: { shopDomain: SHOP }, take: 25 });
  for (let i = 0; i < orders.length; i++) {
    const order = orders[i];
    const refundGid = `gid://shopify/Refund/${20000 + i}`;
    const lineItems = await db.orderLineItem.findMany({ where: { shopDomain: SHOP, orderGid: order.orderGid }, take: 1 });
    if (lineItems.length === 0) continue;

    await db.refund.create({
      data: {
        shopDomain: SHOP,
        orderGid: order.orderGid,
        refundGid,
        note: "Customer return",
        totalRefundedAmount: lineItems[0].price,
        currencyCode: "USD",
        processedAt: order.processedAt,
        createdAtShopify: order.processedAt,
      },
    });

    await db.refundLineItem.create({
      data: {
        shopDomain: SHOP,
        refundGid,
        refundLineItemGid: `gid://shopify/RefundLineItem/${30000 + i}`,
        orderLineItemGid: lineItems[0].lineItemGid,
        variantGid: lineItems[0].variantGid,
        quantity: 1,
        subtotalAmount: lineItems[0].price,
        totalTaxAmount: 0,
        restockType: "RETURN",
      },
    });
  }

  const orderCount = await db.order.count({ where: { shopDomain: SHOP } });
  const refundCount = await db.refund.count({ where: { shopDomain: SHOP } });
  const variantCount = await db.variant.count({ where: { shopDomain: SHOP } });

  console.log(`✓ Seeded: ${PRODUCTS.length} products, ${variantCount} variants, ${orderCount} orders, ${refundCount} refunds`);
  console.log("");
  console.log("Known expected values for manual verification (Widget Pro - Blue Large, V-GID 2001):");
  console.log("  Unit cost:  $20.00");
  console.log("  Price:      $50.00");
  console.log("  Manual calculation after running recomputeAllMetricsForShop:");
  console.log("    Revenue  = price × units_sold");
  console.log("    COGS     = $20 × units_sold");
  console.log("    Refunds  = sum of subtotalAmount where variantGid = 2001");
  console.log("    Gross Profit = Revenue − COGS − Refunds");
  console.log("    Margin % = Gross Profit / Revenue × 100");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
