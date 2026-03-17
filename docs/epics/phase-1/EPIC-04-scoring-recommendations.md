# EPIC-04: Scoring & Recommendations Engine

**Phase:** 1  
**Milestone:** 4 — Scoring and Recommendations v1  
**Total Story Points:** 42  
**Phase Gate:** Every eligible variant has a score; single-variant products capped; cost-missing variants null; recommendations queryable by action and confidence.

---

## Epic Goal
Implement the full 4-factor weighted scoring engine, confidence modeling with policy caps, action-selection rules, explanation generation, and the recommendation persistence service that transforms raw scores into merchant-facing recommendations.

## Phase 1 Completion Criteria for this Epic
- Each variant receives: `performance_score`, `profit_score` (nullable), `refund_score`, `inventory_score`, `opportunity_score`, `risk_score`, `confidence_score`, `recommended_action`
- Single-variant products: `is_single_variant_product = true`, confidence capped at 0.60, reduced action set
- Missing-cost variants: `profit_score = null`, scores reweighted (perf 50%, refund 25%, inv 25%), confidence capped at 0.55
- `variant_scores` → `recommendations` write flow working with lifecycle state management
- Reason chips and explanation JSON generated per recommendation

---

## Tickets

---

### TICKET-04-01: Scoring Engine Foundation & Normalization Helpers
**Story Points:** 5  
**Type:** Backend  
**Priority:** P0 — Blocker

**Description:**  
Build the base scoring module with normalization and inverse-normalization helper functions per PRD section 22.6.

**Acceptance Criteria:**
- [ ] File: `lib/scoring/variantScoring.ts`
- [ ] `normalize(value, min, max)` implemented per PRD formula:
  - Returns 0.5 when `max <= min`
  - Returns `clamp((value - min) / (max - min), 0, 1)` otherwise
- [ ] `inverse_normalize(value, min, max)` = `1 - normalize(...)`
- [ ] `clamp(value, min=0, max=1)` utility
- [ ] Unit tests for edge cases: negative values, equal min/max, out-of-range values
- [ ] Functions exported and used by all score sub-modules

---

### TICKET-04-02: Trend Score & Trend Consistency Helpers
**Story Points:** 5  
**Type:** Backend  
**Priority:** P0

**Description:**  
Implement the `trend_score` and `trend_consistency_score` functions that read from `variant_daily_metrics`.

**Acceptance Criteria:**
- [ ] File: `lib/scoring/trendScore.ts`
- [ ] `trend_score(units_sold_last_14d, units_sold_prior_14d)` per PRD:
  - prior = 0 and last > 0 → 0.75 (growing from zero)
  - prior = 0 and last = 0 → 0.5 (no data)
  - ratio >= 1.25 → 1.0
  - ratio >= 1.05 → 0.75
  - ratio >= 0.80 → 0.5
  - ratio >= 0.50 → 0.25
  - else → 0.0
- [ ] `trend_consistency_score(variantId, windowDays)`:
  - Returns 0.5 if fewer than 28 days of data available
  - Splits history into 4 rolling 7-day buckets
  - Counts direction changes
  - 0 changes → 1.0; 1 change → 0.70; 2 changes → 0.40; else → 0.20
- [ ] Reads `units_sold_last_14d`, `units_sold_prior_14d` from `variant_daily_metrics`
- [ ] Unit tests with mock data covering all ratio bands

---

### TICKET-04-03: Performance Score
**Story Points:** 3  
**Type:** Backend  
**Priority:** P0

**Description:**  
Implement the performance score formula using sibling normalization context.

**Acceptance Criteria:**
- [ ] `performance_score = 0.45 * normalize(units_sold) + 0.35 * normalize(revenue) + 0.20 * trend_score`
- [ ] Uses sibling context from `computeSiblingContext()` (EPIC-03)
- [ ] Single-variant products use store-wide normalization fallback
- [ ] Output is float 0.0–1.0

---

### TICKET-04-04: Profit Score with Missing-Cost Policy
**Story Points:** 5  
**Type:** Backend  
**Priority:** P0

**Description:**  
Implement profit score with the explicit null handling policy for variants without cost data.

**Acceptance Criteria:**
- [ ] File: `lib/scoring/missingCostPolicy.ts`
- [ ] `profit_score = 0.55 * normalize(gross_profit) + 0.45 * normalize(margin_pct)`
- [ ] When `has_cost_data = false`:
  - `profit_score = null` (not 0, not 0.5)
  - `cost_estimated = false` flag set in score output
  - Overall score reweighted: performance 50%, refund 25%, inventory 25%
- [ ] When `has_cost_data = true`: standard 35/35/15/15 weighting
- [ ] `variant_scores.profit_score` column is nullable
- [ ] Unit test: variant with no cost data returns null profit score and reweighted overall score

**Technical Notes:**
- PRD section 9.4 defines this policy precisely — implement exactly as specified

---

### TICKET-04-05: Refund Score
**Story Points:** 3  
**Type:** Backend  
**Priority:** P0

**Description:**  
Implement the refund score using inverse normalization of refund rate and per-unit refund amount.

**Acceptance Criteria:**
- [ ] `refund_score = 0.70 * inverse_normalize(refund_rate_pct) + 0.30 * inverse_normalize(refund_amount_per_unit)`
- [ ] Sibling context provides `min_refund_rate`, `max_refund_rate`, `min_refund_per_unit`, `max_refund_per_unit`
- [ ] Variants with 0 refund rate receive `refund_score = 1.0` (perfect)
- [ ] Handles case where all siblings have same refund rate (normalize returns 0.5)

---

### TICKET-04-06: Inventory Score
**Story Points:** 5  
**Type:** Backend  
**Priority:** P0

**Description:**  
Implement the inventory score using stock-sufficiency scoring and relative stock normalization.

**Acceptance Criteria:**
- [ ] When `sales_velocity_30d <= 0`: `inventory_score = 0.4` (default for non-selling variants)
- [ ] Otherwise:
  - `days_left = current_stock / max(sales_velocity_30d / 30, epsilon)`
  - `inventory_score = 0.60 * stock_sufficiency_score(days_left) + 0.40 * normalize(current_stock)`
- [ ] `stock_sufficiency_score(days_left)` thresholds per PRD:
  - `< 7` → 0.2; `< 14` → 0.5; `<= 45` → 0.9; `<= 90` → 0.7; else → 0.4
- [ ] File: `lib/scoring/variantScoring.ts` (or separate inventory module)

---

### TICKET-04-07: Overall Opportunity Score, Risk Score & Action Selection
**Story Points:** 5  
**Type:** Backend  
**Priority:** P0

**Description:**  
Combine component scores into the overall opportunity and risk scores, then apply action-selection rules per PRD section 22.6.

**Acceptance Criteria:**
- [ ] When profit_score is null: `opportunity_score = 0.50*perf + 0.25*refund + 0.25*inventory`
- [ ] When profit_score is present: `opportunity_score = 0.35*perf + 0.35*profit + 0.15*refund + 0.15*inventory`
- [ ] `risk_score = 0.40*(1 - (profit_score ?? 0.5)) + 0.35*(1 - refund_score) + 0.25*inventory_risk`
- [ ] Action selection rules from PRD section 22.6:
  - If `confidence < settings.confidence_min_threshold` → `needs_more_data`
  - If single-variant product → reduced action set only (restock_soon, investigate_refunds, review_pricing, no_action)
  - Multi-variant full set: push, restock_soon, deprioritize, investigate_refunds, review_pricing, no_action
- [ ] `bundle_pairing` action NOT included anywhere (deferred to Phase 4)

---

### TICKET-04-08: Confidence Score with Policy Caps
**Story Points:** 5  
**Type:** Backend  
**Priority:** P0

**Description:**  
Implement the confidence score formula with mandatory caps for missing cost data and single-variant products.

**Acceptance Criteria:**
- [ ] File: `lib/scoring/confidence.ts`
- [ ] `base_confidence = 0.40*sample_size_score + 0.30*data_coverage_score + 0.30*trend_consistency_score`
- [ ] `sample_size_score`: orders >= 50 → 1.0; >= 20 → 0.75; >= 10 → 0.5; else → 0.25
- [ ] `data_coverage_score`:
  - Start: 1.0
  - No cost data: -0.35
  - No refund data: -0.20
  - Not tracked: -0.15
  - Floor at 0.0
- [ ] Hard caps applied AFTER base calculation:
  - `has_cost_data = false` → cap at 0.55
  - `is_single_variant_product = true` → cap at 0.60
- [ ] Both caps can apply simultaneously (lower cap wins)
- [ ] Unit tests for all cap scenarios

---

### TICKET-04-09: Single-Variant Product Policy
**Story Points:** 3  
**Type:** Backend  
**Priority:** P0

**Description:**  
Implement the explicit handling rules for single-variant products per PRD section 9.3.

**Acceptance Criteria:**
- [ ] File: `lib/scoring/singleVariantPolicy.ts`
- [ ] Products with exactly 1 active variant detected at score time
- [ ] `is_single_variant_product = true` set on `variant_scores`
- [ ] Store-wide normalization used instead of sibling normalization
- [ ] Confidence hard-capped at 0.60
- [ ] Permitted actions only: `restock_soon`, `investigate_refunds`, `review_pricing`, `no_action`
- [ ] "Push" and "deprioritize" never recommended for single-variant products
- [ ] Badge data: `"No sibling comparison available"` included in `explanation_json`

---

### TICKET-04-10: Explanation & Reason Chip Generation
**Story Points:** 3  
**Type:** Backend  
**Priority:** P0

**Description:**  
Generate the `explanation_json` and reason chips for each variant score, used by the UI recommendation detail panel.

**Acceptance Criteria:**
- [ ] File: `lib/scoring/explanations.ts`
- [ ] Reason codes generated per PRD section 22.6 explanation rules:
  - `high_performance`, `healthy_margin`, `margin_data_unavailable`, `low_refund_risk`
  - `healthy_stock`, `weak_margin`, `high_refund_risk`, `stock_risk`, `no_sibling_comparison`
- [ ] `explanation_json` stored in `variant_scores.explanation_json`:
  ```json
  {
    "whatWeRecommend": "Push Black / Large",
    "whyWeRecommendIt": "...",
    "riskIfIgnored": "...",
    "reasonCodes": ["high_performance", "healthy_margin"],
    "dataSupporting": { "conversionProxy": 86, "marginPct": 28.6 }
  }
  ```
- [ ] Low-confidence recommendations use softened language: "Possible opportunity" or "Needs more data"

---

### TICKET-04-11: Recommendations Service (variant_scores → recommendations)
**Story Points:** 5  
**Type:** Backend  
**Priority:** P0

**Description:**  
Build the `recommendations.service.ts` that reads `variant_scores` and writes to the `recommendations` table with full lifecycle state management.

**Acceptance Criteria:**
- [ ] File: `lib/services/recommendations.service.ts`
- [ ] After each score recompute:
  - For each variant where `confidence >= settings.confidence_min_threshold`:
    - If no existing active recommendation for `(variant_id, recommendation_type)`: create new record with `status = active`, `first_seen_at = now`
    - If existing active recommendation matches same type: update `last_seen_at`
    - If existing active recommendation changes action type: set old to `status = resolved`, create new record
- [ ] UI reads only from `recommendations` table, never directly from `variant_scores`
- [ ] `GET /api/recommendations` filters by `status = active` only
- [ ] Dismissed recommendations (`status = dismissed`) not re-created unless action type changes
- [ ] `recommendations.repo.ts` created in `lib/db/repositories/`

---

### TICKET-04-12: Score Recompute Job & API Integration
**Story Points:** 3  
**Type:** Backend  
**Priority:** P0

**Description:**  
Wire the scoring engine into the scheduled job runner and connect API endpoints to query scored data.

**Acceptance Criteria:**
- [ ] `jobs/recomputeVariantScores.job.ts` triggers after `recomputeDailyMetrics.job.ts` completes
- [ ] Per-variant scores written to `variant_scores` (upsert on `shop_id + variant_id + score_window`)
- [ ] Recommendations service called after scoring completes
- [ ] `GET /api/overview` summary counts sourced from `recommendations` table (action + status = active)
- [ ] `GET /api/recommendations` filters work: by action, confidence level, product
- [ ] `GET /api/variants/:id` returns full `scoreBreakdown` from `variant_scores`

---

## Dependencies
- EPIC-03, TICKET-03-01 must complete before this epic starts (daily metrics required)
- Tickets 04-01 through 04-09 can largely run in parallel after normalization helpers exist
- TICKET-04-11 depends on TICKET-04-07 (action selection) and TICKET-04-10 (explanations)
- EPIC-05 (UI pages) can start its frontend shell while scoring is being built in parallel
