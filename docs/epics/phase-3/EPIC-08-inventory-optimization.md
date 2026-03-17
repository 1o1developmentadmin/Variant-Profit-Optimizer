# EPIC-08: Inventory-Aware Optimization

**Phase:** 3  
**Milestone:** 8 — Inventory Optimization  
**Total Story Points:** 34  
**Phase Gate:** Merchant can see stock-aware action recommendations. Inventory nav item visible only when Phase 3 backend is live.

> **Important:** The Inventory nav item and `/inventory` page must NOT be built or shown until Phase 3 backend is complete.

> **Note:** "Dead stock candidates" requires an agreed definition (minimum velocity threshold + aging logic) before implementation. This is NOT assumed — must be defined before TICKET-08-03 starts.

---

## Epic Goal
Tie recommendations to stock availability and capital efficiency. Surface variants that are worth pushing but running low, and variants with excess stock that underperform.

## Phase 3 Completion Criteria
- Inventory nav item appears in navigation
- Inventory page shows stock-aware variant decisions
- Restock urgency recommendations reliably triggered
- Overstock detection working for low-performing variants
- Dead-stock detection defined and implemented (if definition agreed)

---

## Tickets

---

### TICKET-08-01: Overstock & Stockout Risk Logic
**Story Points:** 8  
**Type:** Backend  
**Priority:** P0

**Description:**  
Expand the inventory score model to explicitly detect and classify overstock and stockout risk scenarios.

**Acceptance Criteria:**
- [ ] `stockout_risk` flag: `true` when `days_of_stock_left < 14` AND `performance_score >= 0.60`
- [ ] `overstock_risk` flag: `true` when `days_of_stock_left > 90` AND `performance_score < 0.40`
- [ ] Both flags stored in `variant_scores.explanation_json`
- [ ] Variant summary in API responses includes `stockoutRisk` and `overstockRisk` booleans
- [ ] `restock_soon` recommendation more precisely triggered when `stockout_risk = true`
- [ ] Overstock variants deprioritized more aggressively in `deprioritize` action rules

---

### TICKET-08-02: Restock Urgency Recommendations (Phase 3 Precision)
**Story Points:** 5  
**Type:** Backend  
**Priority:** P0

**Description:**  
Improve restock urgency logic using Phase 3 stock data enrichment.

**Acceptance Criteria:**
- [ ] `restock_soon` recommendation triggered when:
  - `stockout_risk = true` (< 14 days AND strong score)
  - AND recommendation not already dismissed by merchant
- [ ] Explanation updated: "This variant is performing well but stock is running low — restock within [N] days"
- [ ] Days remaining added to explanation_json
- [ ] Confidence for restock reflects stock data freshness (last inventory sync was recent)

---

### TICKET-08-03: Dead Stock Detection (Definition Required First)
**Story Points:** 8  
**Type:** Backend  
**Priority:** P1

**Description:**  
Implement dead-stock detection once the definition is formally agreed.

> **⚠️ Gate:** This ticket cannot start until the following is agreed by product:
> - Minimum sales velocity threshold (e.g., "< X units in the last 90 days")
> - Aging period (e.g., "in stock for > Y days with no movement")
> - Whether dead-stock candidates receive a new recommendation type or use `deprioritize`

**Acceptance Criteria (pending definition agreement):**
- [ ] Definition documented in this ticket before implementation begins
- [ ] `dead_stock_candidate` flag computed per agreed velocity + aging rules
- [ ] Recommendation type determined per agreement
- [ ] Explanation: "[Variant] has not sold in [X] days and has [N] units on hand"
- [ ] UI badge or indicator in Inventory page for dead-stock candidates

---

### TICKET-08-04: Inventory Nav Item & Inventory Page (Frontend)
**Story Points:** 8  
**Type:** Frontend  
**Priority:** P0

**Description:**  
Add the Inventory nav item and build the `/inventory` page. Must not ship until Phase 3 backend is deployed.

**Acceptance Criteria:**
- [ ] Inventory nav item added to `AppAside.tsx` (Phase 3 nav addition)
- [ ] Route: `/inventory`
- [ ] Page sections:
  - Variants at stockout risk but worth pushing
  - Overstocked low-performing variants
  - High-value variants with weak conversion
  - Dead-stock candidates (if definition agreed)
- [ ] Columns: Product, Variant, On Hand, Days of Stock Left, Sales Velocity, Inventory Value, Margin, Action
- [ ] Inventory value = `on_hand × unit_cost_amount` (shown as "— " if no cost data)
- [ ] `s-badge` for `stockout_risk` in critical/warning tone
- [ ] `s-badge` for `overstock_risk` in neutral/muted tone
- [ ] Wired to `GET /api/inventory`
- [ ] Empty state if no inventory signals

---

### TICKET-08-05: Inventory API Endpoint
**Story Points:** 5  
**Type:** Backend  
**Priority:** P0

**Description:**  
Implement `GET /api/inventory` that powers the Inventory page.

**Acceptance Criteria:**
- [ ] Route: `api.inventory.ts`
- [ ] Returns rows with columns from Inventory page spec (PRD section 7.10)
- [ ] Filter params: `stockout_risk`, `overstock_risk`, `dead_stock`, product search
- [ ] `days_of_stock_left` computed fresh or from daily metrics cache
- [ ] Pagination supported

---

## Dependencies
- Phase 2 (EPIC-07) must be complete before Phase 3 begins
- TICKET-08-03 explicitly blocked on product definition agreement
- TICKET-08-04 (frontend) can be built concurrently with backend after spec confirmed
