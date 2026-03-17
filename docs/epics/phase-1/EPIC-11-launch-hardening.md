# EPIC-11: Launch Hardening & QA

**Phase:** 1 (Cross-cutting — runs at the end of Phase 1 before go-live)  
**Milestone:** 9 — Hardening and Launch Prep  
**Total Story Points:** 21  
**Phase Gate:** Stable beta-ready build. Trustworthy score explanations. No critical sync or rendering failures. Scope gating verified end-to-end.

---

## Epic Goal
Ensure Phase 1 is correctness-verified, performant, and ready for real merchant stores before public launch.

## Phase 1 Completion Criteria for this Epic
- Refund line items correctly attributed to variants via `__parentId` parsing (end-to-end test)
- Scope gating verified end-to-end (60-day cap when `read_all_orders` missing)
- Score calculations verified against known order and refund data
- Uninstall and compliance webhooks working
- No horizontal overflow or mobile-admin render issues

---

## Tickets

---

### TICKET-11-01: Seed Test Store & Verify Calculations
**Story Points:** 5  
**Type:** QA  
**Priority:** P0

**Description:**  
Create a test store with known product/variant/order/refund data. Verify that scores match manual calculations from the PRD formulas.

**Acceptance Criteria:**
- [ ] Test store seeded with: 3 products, 5–8 variants each, 100+ orders, 20+ refunds
- [ ] Manual score calculations performed for 3 selected variants using PRD section 22.6 formulas
- [ ] App-computed scores match manual calculations within ±2 points
- [ ] Refund line item attribution verified: correct variants credited with refunds
- [ ] Single-variant product policy verified: confidence capped at 0.60, reduced action set
- [ ] Missing-cost policy verified: null profit score, reweighted overall score

---

### TICKET-11-02: Verify JSONL Refund Line Item Ingestion
**Story Points:** 5  
**Type:** QA + Backend  
**Priority:** P0

**Description:**  
End-to-end test that refund line items are correctly ingested and attributed using `__parentId` from Job 3 bulk output.

**Acceptance Criteria:**
- [ ] Triggered a real or simulated refund in test store
- [ ] Job 3 bulk operation JSONL downloaded and inspected
- [ ] `__parentId` correctly links refund → order and refund line item → refund
- [ ] `refund_line_items` table contains correct `variant_gid` for all refunded items
- [ ] Refund impact visible in variant gross profit calculation
- [ ] Regression test added to prevent future breakage

---

### TICKET-11-03: Scope Gating End-to-End Test
**Story Points:** 3  
**Type:** QA  
**Priority:** P0

**Description:**  
Verify that sync range is correctly capped at 60 days when `read_all_orders` is not granted.

**Acceptance Criteria:**
- [ ] Test store without `read_all_orders` scope
- [ ] Onboarding Step 2: only 60-day option selectable, others grayed out
- [ ] Sync job does NOT attempt to fetch orders beyond 60-day range
- [ ] Date range selectors across app capped at 60 days
- [ ] Re-authorization CTA visible in Settings scope prompt
- [ ] After re-auth with scope, app updates `has_all_orders_scope = true` and allows extended ranges

---

### TICKET-11-04: Query Performance Optimization
**Story Points:** 5  
**Type:** Backend  
**Priority:** P1

**Description:**  
Profile and optimize the slowest queries to ensure pages load acceptably fast with real-size store data.

**Acceptance Criteria:**
- [ ] All API endpoints tested with a store of: 500 products, 50+ variants each, 10,000+ orders
- [ ] `GET /api/overview` responds in < 500ms (cached)
- [ ] `GET /api/recommendations` responds in < 800ms with full pagination
- [ ] `GET /api/variants` responds in < 800ms
- [ ] Slow queries identified with EXPLAIN ANALYZE and indexes added if missing
- [ ] N+1 query patterns eliminated in service layer

---

### TICKET-11-05: Uninstall & Compliance Webhook Verification
**Story Points:** 3  
**Type:** Backend + QA  
**Priority:** P0

**Description:**  
Verify that app uninstall and all three Shopify compliance webhooks are handled correctly.

**Acceptance Criteria:**
- [ ] `app/uninstalled` webhook marks `shops.uninstalled_at`, invalidates sessions
- [ ] `customers/data_request` returns 200 with an empty-or-stub response within 30s
- [ ] `customers/redact` returns 200 and logs deletion request
- [ ] `shop/redact` returns 200 and logs full shop data deletion request (or triggers deletion job)
- [ ] All compliance webhooks tested through Shopify Partners dashboard "Send test notification" tool

---

## Dependencies
- All Phase 1 epics (EPIC-01 through EPIC-06) must be feature-complete before this epic starts
- TICKET-11-01 through TICKET-11-03 are the most critical — prioritize before deployment
