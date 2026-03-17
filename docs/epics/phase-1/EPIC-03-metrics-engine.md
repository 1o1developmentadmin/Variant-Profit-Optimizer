# EPIC-03: Metrics Engine

**Phase:** 1  
**Milestone:** 3 — Metrics Engine  
**Total Story Points:** 34  
**Phase Gate:** `variant_daily_metrics` fully populated, gross profit metrics queryable, cost gaps surfaced, 14-day rolling fields verified.

---

## Epic Goal
Build the aggregation layer that transforms raw ingested data into the precomputed daily metrics that power all scoring, reporting, and trend calculations. The scoring engine in EPIC-04 cannot run until this is complete.

## Phase 1 Completion Criteria for this Epic
- `variant_daily_metrics` backfilled for all historical data
- Daily aggregation job runs after each incremental sync
- `units_sold_last_14d` and `units_sold_prior_14d` rolling fields populated and verified
- Sibling comparison rollups computed per product
- Gross profit calculations (COGS only — no fees/shipping) available per variant
- Stock health calculations available
- Setup health service reads cost coverage correctly

---

## Tickets

---

### TICKET-03-01: Variant Daily Metrics Population Job (Backfill + Schedule)
**Story Points:** 8  
**Type:** Backend  
**Priority:** P0 — Blocker for scoring engine

**Description:**  
Build the `recomputeDailyMetrics.job.ts` that aggregates raw order, line item, refund, and inventory data into `variant_daily_metrics`. This job must run **before** the scoring engine.

**Acceptance Criteria:**
- [ ] Job file: `jobs/recomputeDailyMetrics.job.ts`
- [ ] Service: `lib/metrics/dailyMetrics.ts`
- [ ] For each variant, for each day in the sync window:
  - `orders_count` = distinct orders with this variant's line items
  - `units_sold` = sum of line item quantities (non-refunded)
  - `gross_revenue_amount` = sum of `discounted_unit_price × quantity`
  - `cogs_amount` = `unit_cost_amount × units_sold` (0 if no cost data)
  - `refund_amount` = sum of refund line item subtotals for this variant on this day
  - `gross_profit_amount` = `gross_revenue - cogs - refund_amount`
  - `margin_pct` = `gross_profit / gross_revenue × 100` (null if no cost data)
  - `sales_velocity_7d` = rolling 7-day units sold average
  - `sales_velocity_30d` = rolling 30-day units sold average
- [ ] Rolling field: `units_sold_last_14d` = sum of units_sold for the 14 most recent metric_dates
- [ ] Rolling field: `units_sold_prior_14d` = sum of units_sold for the 14 days before that
- [ ] Backfill runs over all historical data on first run
- [ ] Incremental run recalculates only affected variant-days after webhook sync
- [ ] Job is triggered before `recomputeVariantScores.job.ts`
- [ ] Upsert with `shop_id + variant_id + metric_date` unique constraint

**Technical Notes:**
- PRD section 22.1 notes this table must be populated before scoring engine is built
- `gross_profit_amount` excludes payment fees and shipping (PRD section 9.4)
- Label in DB comments: "Gross profit (excl. fees & shipping)"

---

### TICKET-03-02: Sibling Comparison Rollups
**Story Points:** 5  
**Type:** Backend  
**Priority:** P0

**Description:**  
Compute per-product sibling context (min/max values across all active variants of the same product) used by the normalization functions in the scoring engine.

**Acceptance Criteria:**
- [ ] Service: `lib/metrics/aggregates.ts` exports `computeSiblingContext(productId, shopId, window)`
- [ ] For each product with >1 active variant:
  - `min_units_sold`, `max_units_sold`
  - `min_revenue`, `max_revenue`
  - `min_gross_profit`, `max_gross_profit`
  - `min_margin_pct`, `max_margin_pct`
  - `min_refund_rate`, `max_refund_rate`
  - `min_stock`, `max_stock`
  - `min_refund_per_unit`, `max_refund_per_unit`
- [ ] Single-variant products flag `is_single_variant_product = true` and use **store-wide** percentile normalization fallback
- [ ] Store-wide fallback = compare across all active variants in the shop (not just the product)
- [ ] Results stored in-memory during scoring run (not persisted) or in a temporary rollup table

**Technical Notes:**
- PRD sections 9.3 and 22.6 define sibling vs. store-wide normalization

---

### TICKET-03-03: Refund-Adjusted Metrics
**Story Points:** 5  
**Type:** Backend  
**Priority:** P0

**Description:**  
Compute refund-adjusted revenue, profit, and margin per variant for the scoring and reporting layer.

**Acceptance Criteria:**
- [ ] Service: `lib/metrics/refunds.ts`
- [ ] `refund_rate_pct` per variant per window = `refunded_units / sold_units × 100`
- [ ] `refund_amount_per_unit` = total refund amount / units sold
- [ ] Net revenue after refunds available for reporting
- [ ] Refund-adjusted `gross_profit_amount` in `variant_daily_metrics` already accounts for `refund_amount`
- [ ] Variants with no refunds scored correctly (refund_rate = 0, not null)
- [ ] Variants with 0 units sold have refund_rate = 0 (avoid division by zero)

---

### TICKET-03-04: Stock Health Calculations
**Story Points:** 5  
**Type:** Backend  
**Priority:** P0

**Description:**  
Build the stock health computation that determines `days_of_stock_left` and applies the stock sufficiency scoring from PRD section 22.6.

**Acceptance Criteria:**
- [ ] Service: `lib/metrics/inventory.ts`
- [ ] `current_stock` = sum of `available_quantity` across all locations for a variant's inventory item
- [ ] `days_of_stock_left` = `current_stock / max(sales_velocity_30d / 30, epsilon)`
  - epsilon = 0.0001 to avoid division by zero
  - If `sales_velocity_30d <= 0`, inventory_score defaults to 0.4 per PRD
- [ ] `stock_health` label derived from `days_of_stock_left`:
  - `< 7 days` → `"critical"`
  - `7–14 days` → `"low"`
  - `14–45 days` → `"healthy"`
  - `45–90 days` → `"overstocked"`
  - `> 90 days` → `"excess"`
- [ ] `ending_stock_quantity` in `variant_daily_metrics` updated daily

---

### TICKET-03-05: Profitability Service
**Story Points:** 5  
**Type:** Backend  
**Priority:** P0

**Description:**  
Create the profitability module that produces per-variant and per-product profit summaries for the Products and Variants API responses.

**Acceptance Criteria:**
- [ ] Service: `lib/metrics/profitability.ts`
- [ ] Per-variant in window:
  - `revenue` = gross revenue from line items
  - `gross_profit` = revenue - COGS - refund impact
  - `margin_pct` = gross_profit / revenue × 100
  - All labeled `"Gross profit (excl. fees & shipping)"` in API response field names
- [ ] Per-product rollup:
  - Sum across all variants
  - Identifies best variant (highest `opportunity_score`) and worst variant (highest `risk_score`)
- [ ] `cost_estimated: false` flag on variants missing cost data
- [ ] Returns `null` for `gross_profit` and `margin_pct` when no cost data — not 0

---

### TICKET-03-06: Setup Health Service
**Story Points:** 3  
**Type:** Backend  
**Priority:** P1

**Description:**  
Build `lib/services/setupHealth.service.ts` that computes coverage percentages for cost, refund, and inventory data, feeding the `GET /api/setup-health` endpoint.

**Acceptance Criteria:**
- [ ] `costCoveragePct` = variants with `has_cost_data = true` / total active variants × 100
- [ ] `inventoryCoveragePct` = variants with tracked inventory / total active variants × 100
- [ ] `refundCoveragePct` = always reported as 100% in Phase 1 (all refund data available from sync)
- [ ] Warnings generated:
  - `LOW_COST_COVERAGE` when `costCoveragePct < 50`
  - `INCOMPLETE_INVENTORY` when `inventoryCoveragePct < 70`
- [ ] `lastFullSyncAt` from `shops.last_full_sync_at`
- [ ] Result cached for 60s

---

### TICKET-03-07: Gross Profit API Integration (Products + Variants Endpoints)
**Story Points:** 3  
**Type:** Backend  
**Priority:** P1

**Description:**  
Wire the profitability service into `GET /api/products` and `GET /api/variants` responses so they include gross profit and margin data with correct labels.

**Acceptance Criteria:**
- [ ] `GET /api/products` rows include: `revenue`, `grossProfit`, `grossProfitLabel: "Gross profit (excl. fees & shipping)"`
- [ ] `GET /api/variants` rows include: `revenue`, `grossProfit`, `marginPct`, `hasCostData`
- [ ] When `hasCostData = false`: `grossProfit = null`, `marginPct = null` (not 0)
- [ ] `GET /api/products/:id` includes `costCoveragePct` for the product
- [ ] Product detail shows banner when cost data missing for N variants

---

## Dependencies
- EPIC-02 (all ingestion jobs) must be complete before TICKET-03-01 can run
- TICKET-03-01 must complete before EPIC-04 (scoring engine) can start
- TICKET-03-02 through TICKET-03-05 can run in parallel after TICKET-03-01
