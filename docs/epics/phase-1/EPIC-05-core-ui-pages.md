# EPIC-05: Core UI Pages (Frontend-First)

**Phase:** 1  
**Milestone:** 5 — Core UI Pages  
**Total Story Points:** 55  
**Phase Gate:** Merchant can move from summary to action without confusion. Cost-missing variants clearly labeled. Pages fast using precomputed data.

---

## Epic Goal
Build all Phase 1 frontend pages using Polaris web components: Overview, Recommendations, Products, Product Detail, Variants, Variant Detail. All pages wire to their respective backend API endpoints. Frontend shells are built first (with mock data), then wired to real APIs.

## Phase 1 Completion Criteria for this Epic
- Overview page shows KPI cards and highlighted recommendations
- Recommendations page shows filterable table with detail panel
- Products page shows sortable table with drilldown
- Product detail page shows variant comparison matrix and insights
- Variants page shows store-wide filterable table
- Variant detail page shows full score breakdown and suggested actions
- All loading, empty, and error states handled
- `NoCostDataBadge` and `SingleVariantBadge` components in use
- "Gross profit (excl. fees & shipping)" label everywhere profit appears

---

## Sub-Phase: Frontend Shell First
> **Build order:** Build every page as a Polaris UI shell with mock/static data **before** wiring backend APIs. This allows visual QA and design iteration without waiting for full backend.

---

## Tickets

---

### TICKET-05-01: Shared UI Components Library
**Story Points:** 5  
**Type:** Frontend  
**Priority:** P0 — Blocker

**Description:**  
Build all shared components in `components/shared/` that all pages depend on. These are the building blocks for the entire UI.

**Acceptance Criteria:**
- [ ] `StatusBadge.tsx` — wraps `s-badge` with action/health semantics: `push`, `deprioritize`, `restock_soon`, `investigate_refunds`, `review_pricing`, `no_action`, `needs_more_data`
- [ ] `NoCostDataBadge.tsx` — shows "Profit data incomplete" label for variants without cost data
- [ ] `SingleVariantBadge.tsx` — shows "No sibling comparison available" for single-variant products
- [ ] `MetricTooltip.tsx` — wraps `s-tooltip` with metric definition text
- [ ] `DataTable.tsx` — reusable `s-table` wrapper with: sorting, pagination, row click handler, loading state, empty state, column config prop
- [ ] `PageFilters.tsx` — date range selector + product search + status filter chips for report pages
- [ ] All shared components support loading and empty states
- [ ] All badge variants tested and visually distinct

**Polaris Components Used:**
- `s-badge`, `s-tooltip`, `s-table`, `s-button`, `s-text`

---

### TICKET-05-02: Overview Page — KPI Summary Cards
**Story Points:** 5  
**Type:** Frontend + Backend Wire  
**Priority:** P0

**Description:**  
Build the Overview page Section 1: top summary KPI cards. Each card shows a count and links to a pre-filtered report.

**Acceptance Criteria:**
- [ ] Route: `/overview`
- [ ] `SummaryCards.tsx` component in `components/overview/`
- [ ] 5 KPI cards: Variants to Push, Variants to Deprioritize, Low Margin Variants, Refund Risk Variants, Stock Risk Variants
- [ ] Each card: metric count + helper text + click CTA that navigates to filtered report
- [ ] "Variants to Push" → Recommendations page filtered `action=push`
- [ ] "Low Margin Variants" → Variants page filtered `quickFilter=low_margin`
- [ ] Cards show spinner placeholder during load
- [ ] Cards show "—" gracefully if no data yet
- [ ] Wired to `GET /api/overview?range=30d` summary object
- [ ] Date range selector in page header affects all sections

**Polaris Components Used:**
- `s-section`, `s-heading`, `s-text`, `s-stack`, `s-button`

---

### TICKET-05-03: Overview Page — Decision Summary & Opportunity Products
**Story Points:** 5  
**Type:** Frontend + Backend Wire  
**Priority:** P0

**Description:**  
Build Overview page Sections 2 and 3: highlighted recommendations and top opportunity products table.

**Acceptance Criteria:**
- [ ] `HighlightedRecommendations.tsx` — shows 3–5 recommendation cards
  - Each card: product + variant name, recommended action badge, impact summary, reason chips, "View details" CTA
  - Reason chips as inline text badges (e.g., "High conversion", "Low refund risk")
- [ ] `OpportunityProductsTable.tsx` — lists products where variant decisions matter most
  - Columns: Product, Variants, Activity, Issues, Opportunities, CTA
  - Row click → Product detail page
- [ ] If no recommendations meet threshold: show "No urgent variant actions right now" message (not a forced empty state)
- [ ] If setup health is poor: `s-banner` warning that recommendations are partially estimated
- [ ] Recommendations appear above raw data tables
- [ ] Wired to `GET /api/overview` `highlightedRecommendations` and `topOpportunityProducts`

---

### TICKET-05-04: Recommendations Page — Table & Filters
**Story Points:** 8  
**Type:** Frontend + Backend Wire  
**Priority:** P0

**Description:**  
Build the full Recommendations page with filterable table, confidence display, and all score columns.

**Acceptance Criteria:**
- [ ] Route: `/recommendations`
- [ ] `RecommendationTable.tsx` in `components/recommendations/`
- [ ] Table columns: Product, Variant, Action, Confidence, Performance Score, Profit Score, Refund Score, Inventory Score, Reason Summary, CTA
- [ ] Profit Score column shows "N/A (no cost)" for `hasCostData = false` variants
- [ ] Confidence shown as percentage % with color coding (green ≥ 75%, yellow 55–74%, orange < 55%)
- [ ] Filters: Action type, Product search, Confidence level (high/medium/low), Risk/Opportunity type
- [ ] `RecommendationReasonChips.tsx` — renders reason codes as readable chips
- [ ] Wired to `GET /api/recommendations` with filter query params
- [ ] Pagination supported

---

### TICKET-05-05: Recommendations Page — Detail Panel
**Story Points:** 5  
**Type:** Frontend + Backend Wire  
**Priority:** P0

**Description:**  
Build the recommendation detail drawer/panel that opens when a recommendation row is clicked.

**Acceptance Criteria:**
- [ ] `RecommendationDetailPanel.tsx` in `components/recommendations/`
- [ ] Opens as a side drawer or detail page on row click
- [ ] Panel sections:
  - What we recommend (action + variant title)
  - Why we recommend it (plain language explanation)
  - What could happen if ignored (risk copy)
  - What data supports it (metric values)
  - Suggested next steps (e.g., "Set as default variant in Shopify")
- [ ] Reason chips displayed with icons
- [ ] Confidence percentage and verbalization
- [ ] "Profit data incomplete" label and badge shown when applicable
- [ ] "No sibling comparison" badge shown for single-variant products
- [ ] Close button returns to table

---

### TICKET-05-06: Products Page
**Story Points:** 5  
**Type:** Frontend + Backend Wire  
**Priority:** P0

**Description:**  
Build the Products page showing the store-wide product list with variant decision summaries.

**Acceptance Criteria:**
- [ ] Route: `/products`
- [ ] `ProductsTable.tsx` in `components/products/`
- [ ] Columns: Product, Total Variants, Revenue, Gross Profit (excl. fees & shipping), Best Variant, Worst Variant, Opportunities, Risks
- [ ] Sortable by: Revenue, Gross Profit, Opportunities, Risks
- [ ] Search by product title and SKU
- [ ] Row click → `/products/:id`
- [ ] Empty state if no products synced
- [ ] Wired to `GET /api/products`
- [ ] Pagination supported

---

### TICKET-05-07: Product Detail Page
**Story Points:** 8  
**Type:** Frontend + Backend Wire  
**Priority:** P0

**Description:**  
Build the Product detail page — the core analysis page for one product showing all variants in a comparison matrix.

**Acceptance Criteria:**
- [ ] Route: `/products/:id`
- [ ] `ProductHeader.tsx` — shows: product title, total variants, revenue, gross profit, recommendation count, cost coverage %
- [ ] Banner: "Cost data missing for [N] variants — profit scores for those variants are estimated" (when applicable)
- [ ] `ProductVariantMatrix.tsx` — table with columns: Variant, SKU, Orders, Units Sold, Conversion Score, Net Margin, Refund Rate, Stock Health, Action
- [ ] Net Margin column shows "—" with `NoCostDataBadge` when cost missing
- [ ] `ProductInsights.tsx` — shows grouped action insights above the table:
  - "One variant should become your default"
  - "One variant needs stock attention"
  - "One variant is losing margin after refunds"
- [ ] Best Variant Block: highlights strongest variant with reason
- [ ] Weakest Variant Block: highlights most problematic variant with reason
- [ ] Page readable without charts if data is limited
- [ ] Action summary appears above raw metrics
- [ ] Wired to `GET /api/products/:id`

---

### TICKET-05-08: Variants Page
**Story Points:** 5  
**Type:** Frontend + Backend Wire  
**Priority:** P0

**Description:**  
Build the store-wide Variants page for cross-product variant reporting with quick filters.

**Acceptance Criteria:**
- [ ] Route: `/variants`
- [ ] `VariantsTable.tsx` in `components/variants/`
- [ ] Columns: Product, Variant, SKU, Revenue, Gross Profit, Margin %, Refund Rate, Stock Health, Score, Action
- [ ] Gross Profit column labeled "Gross profit (excl. fees & shipping)"
- [ ] Quick filter chips: Push Now, Low Margin, High Refund Risk, Low Stock High Value, Negative Profit
- [ ] `NoCostDataBadge` inline when profit data unavailable
- [ ] `SingleVariantBadge` in action column for single-variant products
- [ ] Row click → `/variants/:id`
- [ ] Wired to `GET /api/variants` with filter params
- [ ] Pagination + date range filter

---

### TICKET-05-09: Variant Detail Page
**Story Points:** 8  
**Type:** Frontend + Backend Wire  
**Priority:** P0

**Description:**  
Build the Variant detail page — the single-source decision page for one variant.

**Acceptance Criteria:**
- [ ] Route: `/variants/:id`
- [ ] `VariantHeader.tsx` — shows: product/variant name, current status, action recommendation badge, confidence level
- [ ] Performance snapshot section: units sold, revenue, gross profit (excl. fees & shipping), margin %, refund rate, current stock
- [ ] `VariantScoreBreakdown.tsx` — shows 5 scores: conversion, profit, refund, inventory, overall priority
  - Profit score row: shows "Unavailable — cost data missing" when `profitScoreAvailable = false`
  - Does NOT show a 0 or placeholder score when data is absent
- [ ] `VariantActionPanel.tsx` — "Why this matters" plain English section + Suggested Actions list
  - Suggested actions examples: "Set as default option", "Feature in merchandising block", "Do not push in paid traffic", "Restock within 7 days"
- [ ] `SingleVariantBadge` shown prominently if single-variant product
- [ ] Page always ends with a merchant-readable recommendation, not just analytics
- [ ] Wired to `GET /api/variants/:id`

---

### TICKET-05-10: Global Filtering, Pagination & Date Range Patterns
**Story Points:** 3  
**Type:** Frontend  
**Priority:** P1

**Description:**  
Wire the shared `PageFilters` component across all report pages and ensure consistent filtering UX.

**Acceptance Criteria:**
- [ ] Date range selector available on: Overview, Recommendations, Products, Variants pages
- [ ] Active filters displayed as chips under the filter bar
- [ ] Clearing a filter chip removes it and re-fetches
- [ ] URL reflects active filters (query params) so deep-linking works
- [ ] All filters sent to backend as query params
- [ ] Pagination: `page` and `pageSize` in query params, total count shown
- [ ] "No results" empty state when filters return 0 results

---

## Dependencies
- TICKET-05-01 (shared components) must complete before all page tickets
- Page shell frontend work can begin while EPIC-04 backend is in progress (use mock data)
- Backend wire steps (POST /GET API calls) require EPIC-04 to be complete
- EPIC-06 (Settings) can be built in parallel with this epic
