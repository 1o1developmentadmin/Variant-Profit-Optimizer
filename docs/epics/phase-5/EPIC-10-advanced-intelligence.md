# EPIC-10: Advanced Intelligence & Automation

**Phase:** 5  
**Milestone:** — Advanced Intelligence  
**Total Story Points:** 34  
**Phase Gate:** Merchants trust recommendations before automation is added. Scoring weights editable. Smarter confidence modeling.

> **Behavior rule:** Do not add automation before merchants trust recommendations. Phase 5 features require Phase 1–4 data being used reliably in production for a meaningful period.

---

## Epic Goal
Improve scoring accuracy, unlock merchant-configurable scoring weights, introduce trend anomaly detection, and lay groundwork for channel-aware recommendations and approval-gated automated playbooks.

## Phase 5 Completion Criteria
- Scoring weights configurable by merchant in Settings UI
- Trend anomaly detection identifies unusual variant movements
- Smarter confidence modeling reduces false high-confidence recommendations
- Channel-aware recommendations where channel attribution data exists
- Automated playbooks available with explicit merchant approval gates

---

## Tickets

---

### TICKET-10-01: Scoring Weights — Merchant-Configurable in Settings
**Story Points:** 8  
**Type:** Frontend + Backend  
**Priority:** P0

**Description:**  
Expose scoring weight controls in the Settings UI. Until this ticket ships, weights must remain read-only (per Phase 1–4 constraint).

**Acceptance Criteria:**
- [ ] `ThresholdSettingsForm.tsx` updated — scoring weights section becomes editable sliders or inputs
- [ ] Weight inputs: Performance %, Profit %, Refund Risk %, Inventory %
- [ ] Weights must sum to 100% — validate before save, show inline error if not
- [ ] "Reset to defaults" restores 35/35/15/15
- [ ] `POST /api/settings` now accepts `scoringWeights` in Phase 5 (no longer returns 400)
- [ ] Weight change stored in `merchant_settings.scoring_weights_json`
- [ ] Weight change triggers full variant score recompute for the shop
- [ ] Label "Customizable in a future update" removed

---

### TICKET-10-02: Trend Anomaly Detection
**Story Points:** 8  
**Type:** Backend  
**Priority:** P0

**Description:**  
Detect unusual variant performance movements (sudden spikes or drops not explained by seasonal patterns) and surface them as anomaly signals in recommendations.

**Acceptance Criteria:**
- [ ] Anomaly detection runs as part of daily metrics aggregation
- [ ] Anomaly types:
  - `performance_spike`: units_sold_last_7d > 2× the rolling 30d average
  - `performance_drop`: units_sold_last_7d < 0.5× the rolling 30d average
  - `refund_spike`: refund_rate_last_7d > 2× the rolling 30d refund rate
- [ ] Anomaly flags stored in `variant_daily_metrics` metadata or a new `variant_anomalies` table
- [ ] Anomaly signals visible in Variant detail page ("Unusual activity detected this week")
- [ ] Anomalies do NOT automatically change recommendation type — they inform confidence

---

### TICKET-10-03: Smarter Confidence Modeling
**Story Points:** 5  
**Type:** Backend  
**Priority:** P0

**Description:**  
Refine the confidence scoring model to reduce false high-confidence recommendations using longer trend history and anomaly context.

**Acceptance Criteria:**
- [ ] Confidence model updated:
  - Longer history (90+ days) boosts `sample_size_score`
  - Anomaly presence reduces `trend_consistency_score`
  - Merchant dismissal history (repeated dismissals of same recommendation type) reduces confidence for that type
- [ ] `settings.confidence_min_threshold` re-evaluated against improved model
- [ ] Average recommendation confidence tracked in product metrics (internal)

---

### TICKET-10-04: Channel-Aware Recommendations (Where Data Exists)
**Story Points:** 5  
**Type:** Backend  
**Priority:** P1

**Description:**  
If channel attribution data exists in orders (e.g., source_name, sales channel), use it to produce channel-specific variant recommendations.

**Acceptance Criteria:**
- [ ] `orders.source_name` used to segment performance by channel where sufficient volume exists
- [ ] Channel filter added to Recommendations page: "All channels", "Online Store", "POS", "Wholesale"
- [ ] Channel-specific scores computed when a channel has >= 10 orders for the variant
- [ ] Channel-specific recommendation labeled explicitly: "Recommendation for [channel]"
- [ ] Fallback to store-wide scores when channel data is insufficient

---

### TICKET-10-05: Automated Playbooks (Approval-Gated)
**Story Points:** 8  
**Type:** Backend + Frontend  
**Priority:** P2

**Description:**  
Enable merchants to set up automated actions triggered by consistent recommendation signals — always requiring explicit merchant approval before executing.

**Acceptance Criteria:**
- [ ] Playbook types:
  - "When a variant receives 'restock_soon' for 3 consecutive days, notify me via email"
  - "When a variant receives 'deprioritize' with confidence > 0.80, add it to a review queue"
- [ ] Each playbook has an **explicit approval step** — no automatic execution without confirmation
- [ ] Email notifications via Shopify email or configurable webhook destination
- [ ] Playbook history log accessible in Settings > Automation
- [ ] Maximum 5 active playbooks per shop in Phase 5
- [ ] Playbooks do NOT modify product data, inventory, or prices automatically

---

## Dependencies
- Phase 4 (EPIC-09) must be deployed before Phase 5 begins
- TICKET-10-01 unblocks early and does not depend on other Phase 5 tickets
- TICKET-10-04 requires `orders.source_name` data from existing sync (no new data ingestion needed)
- TICKET-10-05 is the last ticket — requires all other Phase 5 features to be stable first
