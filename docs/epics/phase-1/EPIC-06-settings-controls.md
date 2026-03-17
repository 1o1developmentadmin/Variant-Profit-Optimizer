# EPIC-06: Settings & Merchant Controls

**Phase:** 1  
**Milestone:** 6 — Settings and Merchant Controls  
**Total Story Points:** 21  
**Phase Gate:** Merchant can adjust thresholds, scoring weights show as read-only informational only, scope upgrade path clear.

---

## Epic Goal
Build the Settings page with cost configuration, threshold controls, and read-only scoring weight display. Settings changes trigger recommendation recompute.

## Phase 1 Completion Criteria for this Epic
- Settings page accessible from Phase 1 nav
- Cost source preference and manual override settings functional
- Threshold settings (margin, refund, stockout) saveable and immediately applied to recommendations
- Scoring weights displayed as informational read-only (not editable until Phase 5)
- Scope upgrade prompt shown if `read_all_orders` not granted
- API rejects `scoringWeights` in POST body with 400

---

## Tickets

---

### TICKET-06-01: Settings Page Shell & Layout
**Story Points:** 3  
**Type:** Frontend  
**Priority:** P0

**Description:**  
Build the Settings page layout with section tabs/cards for: Data Sources, Cost Settings, Scoring Thresholds, Recommendation Rules.

**Acceptance Criteria:**
- [ ] Route: `/settings`
- [ ] Polaris card-based layout with 4 setting sections
- [ ] Each section saves independently (not one global Save button)
- [ ] "Unsaved changes" state shown when fields are modified but not saved
- [ ] Last updated timestamp shown per section
- [ ] Loading state shown while settings are being fetched
- [ ] Error banner if save fails (with retry CTA)
- [ ] Wired to `GET /api/settings`

**Polaris Components Used:**
- `s-page`, `s-section`, `s-banner` for unsaved state, `s-button`

---

### TICKET-06-02: Cost Settings Form
**Story Points:** 3  
**Type:** Frontend + Backend  
**Priority:** P0

**Description:**  
Build the Cost Settings section for configuring how variant unit costs are sourced.

**Acceptance Criteria:**
- [ ] `CostSettingsForm.tsx` in `components/settings/`
- [ ] Option: "Use Shopify inventory cost (default)" vs "Manual cost overrides"
- [ ] `allow_manual_cost_overrides` toggle
- [ ] When manual overrides enabled: link to variant cost override management (simple table of variant → cost, editable)
- [ ] Cost coverage % shown inline: "Cost data found for X% of your variants"
- [ ] If coverage < 50%: `s-banner` warning displayed in this section
- [ ] Saved to `merchant_settings.cost_source_mode`

---

### TICKET-06-03: Threshold Settings Form
**Story Points:** 5  
**Type:** Frontend + Backend  
**Priority:** P0

**Description:**  
Build the threshold controls that affect which variants are flagged or receive certain recommendation types.

**Acceptance Criteria:**
- [ ] `ThresholdSettingsForm.tsx` in `components/settings/`
- [ ] Low margin threshold field (default: 15%, shows as %)
- [ ] Refund risk threshold field (default: 8%, shows as %)
- [ ] Stockout threshold field (default: 10, shows as "days")
- [ ] Confidence minimum threshold field (default: 0.60)
- [ ] Validation: all values must be positive numbers within reasonable ranges (margin 1–100%, refund 1–100%, stockout 1–365 days, confidence 0.1–1.0)
- [ ] "Reset to defaults" button per section (safe action — no confirmation needed)
- [ ] Save updates `merchant_settings` and triggers background score recompute
- [ ] Saved to `POST /api/settings`
- [ ] After save, show: "Recommendations will update shortly as your new thresholds are applied"

---

### TICKET-06-04: Scoring Weights Read-Only Display
**Story Points:** 3  
**Type:** Frontend  
**Priority:** P1

**Description:**  
Display the scoring weights as informational read-only content in Settings. Do NOT expose edit controls.

**Acceptance Criteria:**
- [ ] Section header: "Scoring Weights"
- [ ] Displays 4 weights as read-only: Performance 35%, Profit 35%, Refund Risk 15%, Inventory 15%
- [ ] Label: "Customizable in a future update"
- [ ] No input fields, sliders, or edit buttons
- [ ] `s-tooltip` explains what each weight controls
- [ ] No API call to update scoring weights (POST /api/settings rejects scoringWeights with 400)

---

### TICKET-06-05: Scope Upgrade Prompt in Settings
**Story Points:** 3  
**Type:** Frontend + Backend  
**Priority:** P1

**Description:**  
Show a scope upgrade prompt in Settings when merchant hasn't granted `read_all_orders`.

**Acceptance Criteria:**
- [ ] When `shop.has_all_orders_scope = false`:
  - `s-banner` with warning tone: "Extended order history is not enabled. You can only sync up to 60 days of orders."
  - CTA: "Enable extended order history" → triggers OAuth re-authorization flow
  - Shows current sync range cap
- [ ] When scope is granted: banner not shown
- [ ] Scope status sourced from `GET /api/settings` response or `GET /api/setup-health`
- [ ] Date range selectors across the app capped at 60 days while scope is missing

---

### TICKET-06-06: Settings API (GET + POST)
**Story Points:** 3  
**Type:** Backend  
**Priority:** P0

**Description:**  
Implement `GET /api/settings` and `POST /api/settings` per PRD section 22.2.

**Acceptance Criteria:**
- [ ] `GET /api/settings` returns full shape from PRD 22.2 including `scoringWeightsEditable: false`
- [ ] `POST /api/settings` accepts: `lowMarginThresholdPct`, `highRefundThresholdPct`, `lowStockDaysThreshold`, `confidenceMinThreshold`
- [ ] `POST /api/settings` with `scoringWeights` in body → returns 400: "Scoring weights are not customizable in this version"
- [ ] Input validation: number ranges, types
- [ ] After save: triggers `recomputeVariantScores.job` in background (fire and forget)
- [ ] Returns `{ ok: true, updatedAt: "ISO8601" }`
- [ ] Route files: `api.settings.ts`

---

### TICKET-06-07: Recommendation Rules Form (Shell)
**Story Points:** 2  
**Type:** Frontend  
**Priority:** P2

**Description:**  
Build the Recommendation Rules section of Settings — shell only in Phase 1. Controls for enabling/disabling specific recommendation categories.

**Acceptance Criteria:**
- [ ] `RecommendationRulesForm.tsx` in `components/settings/`
- [ ] Toggle controls for: Push recommendations on/off, Deprioritize recommendations on/off, Restock recommendations on/off, Refund investigation recommendations on/off
- [ ] Saved to `merchant_settings.recommendation_rules_json`
- [ ] "Bundle pairing" toggle does NOT appear in Phase 1 (deferred to Phase 4)

---

## Dependencies
- TICKET-06-01 before TICKET-06-02 through TICKET-06-07
- TICKET-06-06 (API) needed before backend wire steps
- EPIC-04 score engine needed for threshold changes to have visible effect
