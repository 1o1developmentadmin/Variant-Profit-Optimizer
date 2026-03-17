# EPIC-07: Refund Intelligence

**Phase:** 2  
**Milestone:** 7 — Refund Intelligence  
**Total Story Points:** 34  
**Phase Gate:** Merchant can identify refund-driven bad variants. Refunds nav item visible only when Phase 2 backend is live.

> **Important:** The Refunds nav item and `/refunds` page must NOT be built or shown until Phase 2 backend is complete. Do not ship empty states or placeholder pages in Phase 1.

---

## Epic Goal
Unlock refund-driven insights by activating transaction data, improving refund-adjusted margin calculations, adding the Refunds page, and delivering refund investigation recommendations with more precision than Phase 1.

## Phase 2 Completion Criteria
- Refunds nav item appears in app navigation
- Refunds page shows refund-heavy variants with adjusted margin impact
- Refund investigation recommendations more reliably triggered
- Pricing review recommendations enabled via refund-adjusted scoring
- Transaction data used to validate actual money-movement behind refunds

---

## Tickets

---

### TICKET-07-01: Activate Transaction-Based Refund Validation
**Story Points:** 5  
**Type:** Backend  
**Priority:** P0

**Description:**  
Activate the `transactions` table (stored but dormant in Phase 1) to validate whether a `refunds/create` webhook represents actual money movement. Distinguish financial refunds from return-only events.

**Acceptance Criteria:**
- [ ] `transactions` table queried to confirm `refund` kind with `success` status for each refund record
- [ ] `refunds` table gets new boolean: `is_financial_refund` (true when money actually moved)
- [ ] Refund scoring in Phase 2 uses only `is_financial_refund = true` records for margin impact
- [ ] Variant scores recomputed after this change is activated
- [ ] Existing Phase 1 refund scores are backwards-compatible (may improve precision, not break)

---

### TICKET-07-02: Refund-Adjusted Margin Calculations (Phase 2 Precision)
**Story Points:** 8  
**Type:** Backend  
**Priority:** P0

**Description:**  
Improve `lib/metrics/refunds.ts` with more precise refund attribution and margin adjustment logic.

**Acceptance Criteria:**
- [ ] Net margin = gross revenue − COGS − confirmed financial refund impact
- [ ] Refund impact allocated: `refund_subtotal / variant_revenue × 100`
- [ ] `refund_adjusted_margin_pct` field added to profitability rollup
- [ ] Variants that appear profitable pre-refund but go negative post-refund: flagged with `refund_margin_flip = true`
- [ ] `variant_daily_metrics` updated with refund-adjusted margin rolling fields
- [ ] Existing `gross_profit_amount` and `margin_pct` remain unchanged (these exclude fees/shipping per Phase 1 label)

---

### TICKET-07-03: Improved Refund Investigation Recommendations
**Story Points:** 5  
**Type:** Backend  
**Priority:** P0

**Description:**  
Tighten the `investigate_refunds` action rule using Phase 2's more precise refund data.

**Acceptance Criteria:**
- [ ] `investigate_refunds` recommendation triggered when:
  - Refund rate > `settings.high_refund_threshold_pct`
  - OR refund-adjusted margin is negative when gross margin was positive
  - OR refund rate is > 2× the product's median refund rate across siblings
- [ ] Explanation JSON includes: refund rate, refund-adjusted margin, comparison to sibling median
- [ ] Confidence for refund investigation increased when `is_financial_refund` data confirms money movement

---

### TICKET-07-04: Pricing Review Recommendations (Phase 2 Enabled)
**Story Points:** 3  
**Type:** Backend  
**Priority:** P0

**Description:**  
Enable the `review_pricing` recommendation type with more reliable data now that Phase 2 refund precision is available.

**Acceptance Criteria:**
- [ ] `review_pricing` recommendation triggered reliably when:
  - Strong performance (performance_score >= 0.7)
  - Weak or null profit score: profit_score < 0.45 OR null
  - Persistent trend (not a one-time dip — requires trend_consistency_score >= 0.5)
- [ ] Explanation: "This variant sells well but profit margins are thin — consider reviewing your pricing or cost structure"
- [ ] Recommendation included in `/api/recommendations` response

---

### TICKET-07-05: Refunds Nav Item & Refunds Page (Frontend)
**Story Points:** 8  
**Type:** Frontend  
**Priority:** P0

**Description:**  
Add the Refunds nav item and build the `/refunds` page. This nav item must not appear until this epic's backend is deployed.

**Acceptance Criteria:**
- [ ] Refunds nav item added to `AppAside.tsx` navigation (Phase 2 nav addition)
- [ ] Route: `/refunds`
- [ ] Page sections:
  - High refund rate variants table
  - Refund-adjusted margin losers table
  - Products with likely variant selection issues
- [ ] Columns: Product, Variant, Orders, Refund Rate, Refund Amount, Net Margin After Refunds, Recommendation
- [ ] Quick filters: High refund rate, Margin flip variants, Above threshold
- [ ] `s-badge` badges for `refund_margin_flip = true` variants
- [ ] Wired to `GET /api/refunds`
- [ ] Empty state if no refund data meets thresholds

---

### TICKET-07-06: Refunds API Endpoint
**Story Points:** 5  
**Type:** Backend  
**Priority:** P0

**Description:**  
Implement `GET /api/refunds` that powers the Refunds page.

**Acceptance Criteria:**
- [ ] Route: `api.refunds.ts`
- [ ] Returns: rows with all Refunds page columns, filters applied, pagination
- [ ] Response includes `refundCoveragePct` for setup health context
- [ ] Only returns variants where refunds are meaningful (at least 1 refund in window)
- [ ] Supports filter params: product search, refund rate range, margin flip filter

---

## Dependencies
- Phase 1 (all of EPIC-01 through EPIC-06) must be complete and deployed
- TICKET-07-01 (transaction activation) must complete before TICKET-07-02
- TICKET-07-05 (frontend) can be built in parallel with backend after backend spec is confirmed
