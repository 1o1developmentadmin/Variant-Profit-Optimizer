/**
 * Regression tests for JSONL parser — TICKET-11-02
 *
 * Verifies that refund line items are correctly attributed to variants via
 * the __parentId chain: RefundLineItem.__parentId → refundGid,
 * Refund.__parentId → orderGid, and variantGid extracted from
 * record.lineItem.variant.id (inlined sub-object, not a separate JSONL line).
 */
import { describe, it, expect } from "vitest";
import {
  parseJsonlLines,
  groupByParentId,
  gidToId,
  parseMoney,
  parseDate,
} from "./jsonl-parser";

// ---------------------------------------------------------------------------
// parseJsonlLines
// ---------------------------------------------------------------------------
describe("parseJsonlLines", () => {
  it("parses valid JSONL", () => {
    const raw = `{"id":"gid://shopify/Order/1","name":"#1001"}\n{"id":"gid://shopify/Refund/2","__parentId":"gid://shopify/Order/1"}`;
    const records = parseJsonlLines(raw);
    expect(records).toHaveLength(2);
    expect(records[0].id).toBe("gid://shopify/Order/1");
    expect(records[1].__parentId).toBe("gid://shopify/Order/1");
  });

  it("skips blank lines", () => {
    const raw = `{"id":"gid://shopify/Order/1"}\n\n{"id":"gid://shopify/Refund/2","__parentId":"gid://shopify/Order/1"}\n`;
    expect(parseJsonlLines(raw)).toHaveLength(2);
  });

  it("returns empty array for empty string", () => {
    expect(parseJsonlLines("")).toHaveLength(0);
  });

  it("returns empty array for whitespace-only string", () => {
    expect(parseJsonlLines("   \n  \n  ")).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// groupByParentId
// ---------------------------------------------------------------------------
describe("groupByParentId", () => {
  it("groups top-level records under empty string key", () => {
    const records = [
      { id: "gid://shopify/Order/1" },
      { id: "gid://shopify/Order/2" },
    ];
    const map = groupByParentId(records);
    expect(map.get("")).toHaveLength(2);
  });

  it("groups child records by __parentId", () => {
    const records = [
      { id: "gid://shopify/Order/1" },
      { id: "gid://shopify/Refund/10", __parentId: "gid://shopify/Order/1" },
      { id: "gid://shopify/Refund/11", __parentId: "gid://shopify/Order/1" },
      { id: "gid://shopify/Refund/20", __parentId: "gid://shopify/Order/2" },
    ];
    const map = groupByParentId(records);
    expect(map.get("gid://shopify/Order/1")).toHaveLength(2);
    expect(map.get("gid://shopify/Order/2")).toHaveLength(1);
    expect(map.get("")).toHaveLength(1);
  });

  it("returns empty map for empty input", () => {
    expect(groupByParentId([])).toEqual(new Map());
  });
});

// ---------------------------------------------------------------------------
// gidToId
// ---------------------------------------------------------------------------
describe("gidToId", () => {
  it("extracts numeric id from gid", () => {
    expect(gidToId("gid://shopify/Product/123")).toBe("123");
    expect(gidToId("gid://shopify/ProductVariant/456")).toBe("456");
    expect(gidToId("gid://shopify/RefundLineItem/789")).toBe("789");
  });

  it("returns the whole string if no slash", () => {
    expect(gidToId("plainid")).toBe("plainid");
  });
});

// ---------------------------------------------------------------------------
// parseMoney
// ---------------------------------------------------------------------------
describe("parseMoney", () => {
  it("parses valid money strings", () => {
    expect(parseMoney("19.99")).toBe(19.99);
    expect(parseMoney("0.00")).toBe(0);
    expect(parseMoney("100")).toBe(100);
  });

  it("returns null for null/undefined", () => {
    expect(parseMoney(null)).toBeNull();
    expect(parseMoney(undefined)).toBeNull();
  });

  it("returns null for non-numeric strings", () => {
    expect(parseMoney("not-a-number")).toBeNull();
  });

  it("parses numeric values directly", () => {
    expect(parseMoney(42)).toBe(42);
  });
});

// ---------------------------------------------------------------------------
// parseDate
// ---------------------------------------------------------------------------
describe("parseDate", () => {
  it("parses valid ISO date strings", () => {
    const d = parseDate("2024-01-15T10:30:00Z");
    expect(d).toBeInstanceOf(Date);
    expect(d!.getFullYear()).toBe(2024);
  });

  it("returns null for null/undefined/empty", () => {
    expect(parseDate(null)).toBeNull();
    expect(parseDate(undefined)).toBeNull();
    expect(parseDate("")).toBeNull();
  });

  it("returns null for invalid date strings", () => {
    expect(parseDate("not-a-date")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// REGRESSION: Refund JSONL attribution via __parentId chain
// ---------------------------------------------------------------------------
describe("Refund line item __parentId attribution (TICKET-11-02 regression)", () => {
  /**
   * Real Shopify bulk operation JSONL structure for refunds:
   *
   * Level 0: Order           { id: orderGid, ... }
   * Level 1: Refund          { id: refundGid, __parentId: orderGid, ... }
   * Level 2: RefundLineItem  { id: rliGid, __parentId: refundGid,
   *                            lineItem: { id: lineItemGid, variant: { id: variantGid } },
   *                            quantity, subtotalSet, ... }
   *
   * lineItem is an INLINED sub-object (not a separate JSONL line).
   */
  const ORDER_GID = "gid://shopify/Order/1001";
  const REFUND_GID = "gid://shopify/Refund/2001";
  const REFUND_LINE_ITEM_GID = "gid://shopify/RefundLineItem/3001";
  const LINE_ITEM_GID = "gid://shopify/LineItem/4001";
  const VARIANT_GID = "gid://shopify/ProductVariant/5001";

  const SAMPLE_JSONL = [
    JSON.stringify({
      id: ORDER_GID,
      name: "#1001",
      processedAt: "2024-01-10T12:00:00Z",
    }),
    JSON.stringify({
      id: REFUND_GID,
      __parentId: ORDER_GID,
      note: "Customer return",
      processedAt: "2024-01-12T09:00:00Z",
      createdAt: "2024-01-12T09:00:00Z",
      totalRefundedSet: { shopMoney: { amount: "29.99", currencyCode: "USD" } },
    }),
    JSON.stringify({
      id: REFUND_LINE_ITEM_GID,
      __parentId: REFUND_GID,
      quantity: 1,
      restockType: "RETURN",
      lineItem: {
        id: LINE_ITEM_GID,
        variant: { id: VARIANT_GID },
      },
      subtotalSet: { shopMoney: { amount: "29.99", currencyCode: "USD" } },
      totalTaxSet: { shopMoney: { amount: "0.00", currencyCode: "USD" } },
    }),
  ].join("\n");

  it("parses all three record types from JSONL", () => {
    const records = parseJsonlLines(SAMPLE_JSONL);
    expect(records).toHaveLength(3);
  });

  it("order record has no __parentId (top-level)", () => {
    const records = parseJsonlLines(SAMPLE_JSONL);
    const order = records.find((r) => r.id === ORDER_GID);
    expect(order).toBeDefined();
    expect(order!.__parentId).toBeUndefined();
  });

  it("refund record has __parentId = orderGid (Level 1)", () => {
    const records = parseJsonlLines(SAMPLE_JSONL);
    const refund = records.find((r) => r.id === REFUND_GID);
    expect(refund).toBeDefined();
    expect(refund!.__parentId).toBe(ORDER_GID);
    expect(refund!.id).toContain("gid://shopify/Refund/");
  });

  it("refund line item has __parentId = refundGid (Level 2)", () => {
    const records = parseJsonlLines(SAMPLE_JSONL);
    const rli = records.find((r) => r.id === REFUND_LINE_ITEM_GID);
    expect(rli).toBeDefined();
    expect(rli!.__parentId).toBe(REFUND_GID);
    expect(rli!.id).toContain("gid://shopify/RefundLineItem/");
  });

  it("refund line item variantGid is extracted from inlined lineItem sub-object", () => {
    const records = parseJsonlLines(SAMPLE_JSONL);
    const rli = records.find((r) => r.id === REFUND_LINE_ITEM_GID);
    // Critical: variant comes from record.lineItem.variant.id (inlined, not a separate JSONL line)
    const variantGid: string | null = rli!.lineItem?.variant?.id ?? null;
    expect(variantGid).toBe(VARIANT_GID);
  });

  it("refund line item orderLineItemGid is extracted from inlined lineItem sub-object", () => {
    const records = parseJsonlLines(SAMPLE_JSONL);
    const rli = records.find((r) => r.id === REFUND_LINE_ITEM_GID);
    const orderLineItemGid: string | null = rli!.lineItem?.id ?? null;
    expect(orderLineItemGid).toBe(LINE_ITEM_GID);
  });

  it("groupByParentId correctly chains order → refund → refundLineItem", () => {
    const records = parseJsonlLines(SAMPLE_JSONL);
    const byParent = groupByParentId(records);

    // Orders are at the top level
    expect(byParent.get("")?.map((r) => r.id)).toContain(ORDER_GID);

    // Refund is under the order
    const refundsUnderOrder = byParent.get(ORDER_GID) ?? [];
    expect(refundsUnderOrder.map((r) => r.id)).toContain(REFUND_GID);

    // RefundLineItem is under the refund
    const itemsUnderRefund = byParent.get(REFUND_GID) ?? [];
    expect(itemsUnderRefund.map((r) => r.id)).toContain(REFUND_LINE_ITEM_GID);
  });

  it("handles multiple refunds per order with separate line item chains", () => {
    const REFUND_GID_2 = "gid://shopify/Refund/2002";
    const RLI_GID_2 = "gid://shopify/RefundLineItem/3002";
    const VARIANT_GID_2 = "gid://shopify/ProductVariant/5002";

    const raw = [
      JSON.stringify({ id: ORDER_GID, name: "#1001" }),
      JSON.stringify({ id: REFUND_GID, __parentId: ORDER_GID }),
      JSON.stringify({ id: REFUND_GID_2, __parentId: ORDER_GID }),
      JSON.stringify({
        id: REFUND_LINE_ITEM_GID,
        __parentId: REFUND_GID,
        lineItem: { id: LINE_ITEM_GID, variant: { id: VARIANT_GID } },
      }),
      JSON.stringify({
        id: RLI_GID_2,
        __parentId: REFUND_GID_2,
        lineItem: { id: "gid://shopify/LineItem/4002", variant: { id: VARIANT_GID_2 } },
      }),
    ].join("\n");

    const records = parseJsonlLines(raw);
    const byParent = groupByParentId(records);

    // Two refunds under order
    expect(byParent.get(ORDER_GID)).toHaveLength(2);

    // One line item per refund, linked to the correct variant
    const rli1 = byParent.get(REFUND_GID)?.[0];
    const rli2 = byParent.get(REFUND_GID_2)?.[0];
    expect(rli1?.lineItem?.variant?.id).toBe(VARIANT_GID);
    expect(rli2?.lineItem?.variant?.id).toBe(VARIANT_GID_2);
  });

  it("handles refund line item with no variant (custom line item)", () => {
    const raw = [
      JSON.stringify({ id: ORDER_GID }),
      JSON.stringify({ id: REFUND_GID, __parentId: ORDER_GID }),
      JSON.stringify({
        id: REFUND_LINE_ITEM_GID,
        __parentId: REFUND_GID,
        lineItem: { id: LINE_ITEM_GID, variant: null },
      }),
    ].join("\n");

    const records = parseJsonlLines(raw);
    const rli = records.find((r) => r.id === REFUND_LINE_ITEM_GID);
    const variantGid: string | null = rli!.lineItem?.variant?.id ?? null;
    // Should be null — not an error
    expect(variantGid).toBeNull();
  });

  it("handles refund line item with missing lineItem entirely", () => {
    const raw = [
      JSON.stringify({ id: ORDER_GID }),
      JSON.stringify({ id: REFUND_GID, __parentId: ORDER_GID }),
      JSON.stringify({
        id: REFUND_LINE_ITEM_GID,
        __parentId: REFUND_GID,
        quantity: 1,
        // lineItem omitted
      }),
    ].join("\n");

    const records = parseJsonlLines(raw);
    const rli = records.find((r) => r.id === REFUND_LINE_ITEM_GID);
    expect(rli!.lineItem?.variant?.id ?? null).toBeNull();
  });

  it("parseMoney correctly parses refund subtotal from JSONL", () => {
    const records = parseJsonlLines(SAMPLE_JSONL);
    const rli = records.find((r) => r.id === REFUND_LINE_ITEM_GID);
    const subtotal = parseMoney(rli!.subtotalSet?.shopMoney?.amount);
    expect(subtotal).toBe(29.99);
  });

  it("parseDate correctly parses refund processedAt from JSONL", () => {
    const records = parseJsonlLines(SAMPLE_JSONL);
    const refund = records.find((r) => r.id === REFUND_GID);
    const d = parseDate(refund!.processedAt);
    expect(d).toBeInstanceOf(Date);
    expect(d!.getFullYear()).toBe(2024);
    expect(d!.getMonth()).toBe(0); // January
  });
});
