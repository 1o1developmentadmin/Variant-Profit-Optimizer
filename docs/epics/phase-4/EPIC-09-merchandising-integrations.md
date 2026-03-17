# EPIC-09: Merchandising Actions & Integrations

**Phase:** 4  
**Milestone:** 9 — Merchandising Actions  
**Total Story Points:** 21  
**Phase Gate:** Less friction between insight and action. More recurring daily usage through export and workflow integration features.

> **Note:** Bundle pairing logic — first appearance in Phase 4. Requires a formal definition of the pairing signal before implementation begins (just like dead-stock in Phase 3). Must NOT appear anywhere in Phases 1–3 UI, copy, or recommendations.

---

## Epic Goal
Move the app from pure insight to workflow support. Enable merchants to export recommendations, get theme integration hints, and use bundle pairing when defined.

## Phase 4 Completion Criteria
- Recommendation list export (CSV or shareable link) functional
- Theme integration hints visible on recommendation detail panels
- Bundle pairing feature defined and built (if pairing signal agreed)
- Operational feel: merchant can move from recommendation to execution faster

---

## Tickets

---

### TICKET-09-01: Recommendation List Export (CSV)
**Story Points:** 5  
**Type:** Frontend + Backend  
**Priority:** P0

**Description:**  
Allow merchants to export their current recommendation list to CSV for use in external workflows (buying decisions, marketing briefings, Shopify bulk editor).

**Acceptance Criteria:**
- [ ] "Export CSV" button on Recommendations page
- [ ] CSV columns: Product, Variant, SKU, Action, Confidence, Performance Score, Profit Score, Refund Score, Inventory Score, Reason Summary
- [ ] Filtered view exports only the current filtered set
- [ ] File named: `variant-recommendations-YYYY-MM-DD.csv`
- [ ] Backend endpoint: `GET /api/recommendations/export?format=csv&...filters`
- [ ] Rate limited to prevent abuse (1 export per 30s per shop)

---

### TICKET-09-02: Theme Integration Hints on Recommendation Details
**Story Points:** 5  
**Type:** Frontend  
**Priority:** P0

**Description:**  
Add Shopify theme integration guidance to the recommendation detail panel to help merchants act on recommendations directly in Shopify.

**Acceptance Criteria:**
- [ ] `RecommendationDetailPanel.tsx` updated with a "Next Steps in Shopify" section
- [ ] For `push` recommendations: instructions to set variant as default option or feature in Online Store
- [ ] For `deprioritize` recommendations: guidance to adjust variant display order or remove from featured collections
- [ ] For `restock_soon` recommendations: link to inventory management in Shopify Admin
- [ ] Instructions are plain-language, not technical
- [ ] Links use `s-link` with `external` prop to open in new tab (Shopify Admin deep links where possible)
- [ ] No code blocks or developer-facing instructions — merchant-friendly only

---

### TICKET-09-03: Bundle Pairing Logic (Pairing Signal Required)
**Story Points:** 8  
**Type:** Backend + Frontend  
**Priority:** P1

**Description:**  
Implement bundle pairing recommendations once the pairing signal definition is agreed.

> **⚠️ Gate:** This ticket cannot start until the following is agreed by product:
> - What defines a pairing signal (e.g., frequently bought together within the same order?)
> - Minimum co-purchase frequency threshold
> - Whether bundle recommendations appear as a new recommendation type or augment existing ones

**Acceptance Criteria (pending definition):**
- [ ] Pairing signal computed from `order_line_items` co-purchase analysis
- [ ] `bundle_pairing` recommendation type added to `recommendation_type` enum
- [ ] Bundle pairing appears in the Settings > Recommendation Rules toggle (Phase 4 addition)
- [ ] Bundle pairing shown in Recommendations page table and detail panel
- [ ] Explanation: "[Variant A] is frequently bought with [Variant B] — consider featuring them together"

---

### TICKET-09-04: Variant Shareable Summary (Optional Link)
**Story Points:** 3  
**Type:** Frontend + Backend  
**Priority:** P2

**Description:**  
Generate a read-only shareable summary link for a specific variant's recommendation, for use in Slack/email/buying briefs.

**Acceptance Criteria:**
- [ ] "Share" button on Variant detail page generates a short-lived link
- [ ] Shared page shows: variant title, action, scores, reason summary, suggested next steps
- [ ] Link is public but token-based (obscure URL)
- [ ] Link expires after 7 days
- [ ] No edit or action capabilities on the shared view

---

## Dependencies
- Phase 3 (EPIC-08) must be complete before Phase 4 begins
- TICKET-09-03 explicitly blocked on product pairing signal definition
- TICKET-09-01 and TICKET-09-02 can run in parallel
