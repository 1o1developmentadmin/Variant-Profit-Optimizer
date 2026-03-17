# Variant Profit Optimizer

## Product Requirements Document

### Document purpose
This PRD is written for product, design, engineering, and Claude Code. It defines the product behavior, frontend structure, data requirements, decision logic, and phase-wise implementation plan for a Shopify embedded app built primarily in **App Home** using **Polaris web components**.

---

## 1. Product summary

### Working product name
Variant Profit Optimizer

### One-line promise
Help merchants decide which variant to show, push, restock, discount, bundle, or deprioritize based on conversion, margin, refunds, and inventory.

### Core idea
This product combines two ideas into one system:
- **Variant Intelligence**
- **Variant-Level Profitability**

Instead of optimizing variants only for conversion or only for reporting, the product should optimize for **business performance**.

### Core merchant question this app answers
Which variant should I push right now?

### Product answer
Not the variant with only the most clicks.
Not the variant with only the most sales.
Not the variant with only the most stock.

The app should identify the variant with the best balance of:
- conversion performance
- profit margin
- refund risk
- inventory health
- merchandising opportunity

---

## 2. Product goals

### Primary goal
Give merchants a clear, actionable variant decision engine inside Shopify Admin.

### Secondary goals
- improve conversion by showing better default variants
- reduce profit leakage from low-margin variants
- reduce refund-driven decision mistakes
- help merchants push better variants in merchandising and paid traffic
- create a strong embedded Shopify app that feels native and fast

### Non-goals for early phases
- deep attribution modeling
- automated repricing without merchant approval
- full AI forecasting engine from day one
- carrier-level logistics optimization
- theme editor replacement
- bundle pairing logic (deferred to Phase 4)

---

## 3. Product principles

1. **One product, one promise**
   The app should feel like a single decision product, not two unrelated modules.

2. **Action first**
   The merchant should always know what to do next.

3. **Explain every recommendation**
   Every recommendation must show the reason behind it.

4. **Native Shopify feel**
   The app should look and behave like part of Shopify Admin using Polaris web components and App Bridge.

5. **Progressive complexity**
   Phase 1 should be useful in a few minutes. More advanced intelligence can layer in later.

---

## 4. Target users

### Primary users
- Shopify merchants with multi-variant products
- founders and operators of DTC brands
- ecommerce managers
- merchandising teams

### Best-fit verticals
- fashion
- footwear
- beauty
- furniture
- accessories
- any store with meaningful size, color, style, or material options

### Best-fit merchant profile
- enough order volume to compare variants meaningfully
- multi-variant catalog
- cares about CRO and margin
- wants simple recommendations, not another spreadsheet tool

---

## 5. Product positioning

### Customer-facing category
Variant optimization for profit

### Better positioning than
- variant analytics app
- variant CRO app
- variant reporting tool

### Best messaging direction
"We tell you which variants to show, push, and deprioritize based on real business performance."

---

## 6. Shopify frontend direction

Shopify's current guidance for **App Home** recommends **App Bridge** plus **Polaris web components**, and Polaris itself is now positioned as a web-components-based UI system across Shopify surfaces.

### Frontend stack
- Shopify embedded app
- Shopify App Home as the primary surface
- App Bridge for navigation, title/actions, and embedded behavior
- Polaris web components for page structure and UI controls
- Framework can be React or Remix, but UI should use Polaris web components directly

### Why this matters
- native Shopify visual language
- consistent behavior inside admin
- component model aligned with Shopify direction
- easier long-term maintenance than mixing old and new UI patterns unnecessarily

---

## 7. Frontend-first PRD

This section defines how the app should look, behave, and respond before backend implementation details.

# 7.1 Information architecture

### Phase 1 nav (shipped at launch)
- Overview
- Recommendations
- Products
- Variants
- Settings

### Phase 2 nav addition
- Refunds (added when Phase 2 backend ships)

### Phase 3 nav addition
- Inventory (added when Phase 3 backend ships)

### Nav behavior
- On first install, merchant lands on onboarding
- After onboarding, merchant lands on Overview
- If sync is incomplete, top banner shows sync progress with CTA to view setup health
- App should remember last visited page within the session
- Nav items for Refunds and Inventory must not appear until their respective phase backend is live. Do not ship empty states or placeholder pages for these nav items in Phase 1.

---

# 7.2 Frontend global behavior

### Page shell
Use `s-page` as main page wrapper with sections and responsive layout.

### Global layout behavior
- fixed page title via App Bridge
- contextual primary action per page
- card-based sections using Polaris structure components
- responsive layout that works in admin iframe widths
- no horizontal overflow on standard admin widths

### Global loading behavior
- app shell loads immediately
- section-level loading states instead of blank whole page where possible
- use spinner or skeleton-like placeholder patterns for KPI cards and tables
- slow queries should not block the whole page

### Global empty-state behavior
If store has no useful variant history yet:
- show educational empty state
- explain what data is needed
- provide onboarding CTA or data sync CTA
- avoid showing broken charts or empty tables with no context

### Global error behavior
- show inline banner for recoverable errors
- show retry CTA for data fetch failures
- show clear store-level sync errors in Setup Health page, not random silent failures

### Global filtering behavior
Across report pages:
- date range selector
- product search
- product type / collection filter where feasible later
- status filters such as profitable, low margin, high return risk, low stock, top performer
- all active filters visible in the UI

### Global drilldown behavior
Every high-level metric should link to a deeper page or modal.

Examples:
- "Variants to push" card opens Recommendations page pre-filtered to `action = push`
- "Low margin variants" opens Variants page filtered to margin risk
- "Refund-heavy variants" opens Refunds page pre-filtered to top refund risk variants (Phase 2+)

---

# 7.3 Polaris web component guidance

Use Polaris web components and patterns recommended for App Home.

### Expected component usage by page type

#### Top-level pages
- `s-page`
- `s-section`
- `s-heading`
- `s-text`
- `s-stack`

#### KPI + summary cards
- section containers
- badges for health states
- text and heading for metrics
- buttons or links for drilldown

#### Tables and reports
- `s-table`
- inline filters using form controls
- clickable rows or row actions

#### System messages
- `s-banner`
- `s-badge`
- `s-tooltip`

#### Settings forms
- standard HTML forms with Polaris form elements
- controlled inputs where validation or dependency is needed
- uncontrolled inputs for simpler forms where possible

### Interaction rules
- prefer `s-button` and `s-link` over custom clickable wrappers
- use tooltips for metric definitions, not long inline paragraphs
- destructive-looking actions should require confirmation
- table row click should not conflict with inline actions

---

# 7.4 Overview page behavior

### Goal of page
In under 10 seconds, the merchant should understand:
- which variants are winning
- which variants are hurting profit
- what action to take next

### Page sections

#### Section 1: top summary bar
KPI cards:
- Variants to Push
- Variants to Deprioritize
- Low Margin Variants
- Refund Risk Variants
- Stock Risk Variants

Each card must include:
- metric count
- short helper text
- click behavior to open filtered report

#### Section 2: decision summary
Show 3–5 highlighted recommendations.

Each recommendation card contains:
- product + variant name
- recommended action
- impact summary
- reason chips
- CTA: View details

Example:
- Push Black / Large
- High conversion, healthy margin, low refund risk, stock available

#### Section 3: top opportunity products
List products where variant decisions matter most.

Each row:
- product title
- variant count
- traffic / sales activity proxy
- number of variant issues or opportunities
- CTA to view product detail

#### Section 4: setup health
Show data quality and setup coverage:
- cost coverage
- inventory sync health
- refund data availability
- event tracking coverage if enabled later

### Behavior rules
- If recommendations are available, they must appear above raw data tables
- If setup health is poor, show a banner warning that recommendations are partially estimated
- If no recommendation meets threshold, app should say "No urgent variant actions right now" instead of forcing bad suggestions

---

# 7.5 Recommendations page behavior

### Goal of page
This is the action engine of the product.

### Recommendation categories (Phase 1)
- Push
- Deprioritize
- Restock soon
- Investigate refunds
- Consider price review

> **Note:** "Consider bundle pairing" is deferred to Phase 4 and must not appear in Phase 1 UI, copy, or recommendation outputs.

### Table columns
- Product
- Variant
- Recommended action
- Confidence score
- Conversion score
- Profit score
- Refund score
- Inventory score
- Reason summary
- CTA

### Filters
- by action type
- by product
- by confidence level
- by risk/opportunity type

### Detail drawer or page behavior
When user clicks a recommendation:
- open detail panel or detail page
- explain recommendation in plain language
- show performance trend
- show why action is recommended
- show what merchant should do in Shopify or theme

### Recommendation explanation pattern
Every recommendation should have:
- What we recommend
- Why we recommend it
- What could happen if ignored
- What data supports it

Example:
- Recommend: push Blue / Medium as default variant
- Why: highest add-to-cart rate, strong net margin, low return rate, healthy stock
- Risk if ignored: traffic continues going to lower-margin default variant
- Evidence: 30d conversion 4.9%, margin 28%, refund rate 2.1%

---

# 7.6 Products page behavior

### Purpose
Let merchants compare products where variant decisions matter.

### Default table columns
- Product
- Total variants
- Revenue
- Net profit
- Best variant
- Worst variant
- Opportunity count
- Risk count

### Row behavior
Clicking a product opens product detail page.

### Sorting
- by revenue
- by net profit
- by opportunity count
- by risk count

### Search behavior
Search should match product title and SKU where feasible.

---

# 7.7 Product detail page behavior

### Purpose
This is the core analysis page for one product.

### Sections

#### Header summary
- product title
- total variants
- product revenue
- product net profit
- number of recommendations

#### Variant comparison matrix
Show all variants in a table.

Columns:
- Variant
- SKU
- Orders
- Units sold
- Conversion score or sales proxy in phase 1
- Net margin
- Refund rate
- Stock health
- Recommended action

#### Best variant block
Show current strongest variant and why.

#### Weakest variant block
Show current most problematic variant and why.

#### Action insights
Short grouped insights such as:
- one variant should become default
- one variant needs stock attention
- one variant is losing margin after refunds

### Behavior rules
- product detail must be readable without charts if data is limited
- app should not require merchants to interpret complicated scoring manually
- action summary must appear before raw metrics

---

# 7.8 Variants page behavior

### Purpose
Variant-level reporting across the whole store.

### Default table columns
- Product
- Variant
- SKU
- Revenue
- Net profit
- Margin %
- Refund rate
- Stock health
- Score
- Recommended action

### Quick filters
- Push now
- Low margin
- High refund risk
- Low stock high value
- Negative profit

### Row click behavior
Open variant detail page.

---

# 7.9 Variant detail page behavior

### Purpose
Single-source decision page for one variant.

### Sections

#### Summary strip
- Product / variant name
- current status
- action recommendation
- confidence level

#### Performance snapshot
- units sold
- revenue
- margin % (shown as estimated if cost data is partial; see section 9.3)
- refund rate
- current stock

#### Score breakdown
- conversion score
- profit score
- refund score
- inventory score
- overall priority score

#### Why this matters
Short human explanation.

#### Suggested actions
Examples:
- set as default option
- feature in merchandising block
- do not push in paid traffic
- restock within 7 days
- review pricing
- improve size guidance or messaging

### Behavior rule
The detail page should always end with a merchant-readable recommendation, not just analytics.

---

# 7.10 Inventory page behavior

> **Phase 3 only.** This page and its nav item must not be built or shown until Phase 3 backend is complete.

### Purpose
Surface stock-aware variant decisions.

### Sections
- variants at stockout risk but worth pushing
- overstocked low-performing variants
- high-value variants with weak conversion

> **Note:** "Dead stock candidates" is removed from scope. Dead-stock detection requires a definition of minimum sales velocity thresholds and aging logic that is not defined in Phase 1–3 data models. This can be added as a discrete Phase 3 sub-feature once the definition is agreed.

### Table columns
- Product
- Variant
- On hand
- Days of stock left
- Sales velocity
- Inventory value
- Margin
- Recommended action

### Behavior rule
Inventory insights should be tied to business value, not just quantity.

---

# 7.11 Refunds page behavior

> **Phase 2 only.** This page and its nav item must not be built or shown until Phase 2 backend is complete.

### Purpose
Show which variants appear profitable until returns/refunds are considered.

### Sections
- high refund rate variants
- refund-adjusted margin losers
- products with likely variant selection issues

### Table columns
- Product
- Variant
- Orders
- Refund rate
- Refund amount
- Net margin after refunds
- Recommendation

### Behavior rule
Refund page should help answer whether a variant should stop being pushed, needs better guidance, or needs pricing review.

---

# 7.12 Settings page behavior

### Sections
- Data sources
- Cost settings
- Scoring thresholds
- Recommendation rules

> **Note:** Scoring weight controls (adjusting the 35/35/15/15 weighting) are a Phase 5 feature and must not be exposed in the Settings UI until Phase 5. The data model stores `scoring_weights_json` for forward compatibility, but the UI should show read-only defaults in Phase 1–4 with a label such as "Customizable in a future update."

### Settings behavior
- every settings group saved independently
- show unsaved changes state
- show last updated timestamp
- offer reset-to-default only where safe

### Important settings
- cost source preference
- manual cost overrides
- low margin threshold
- high refund risk threshold
- stockout threshold
- confidence threshold for showing recommendations

---

## 8. Core product behavior

This section defines how the app should think and act.

### Core behavior model
The app is not only a dashboard.
It is a recommendation engine.

### Inputs considered
- variant sales performance
- variant revenue
- variant profit or margin
- refund behavior
- stock availability
- relative strength within the product

### Outputs produced (Phase 1)
- push
- deprioritize
- restock
- investigate refunds
- review pricing
- no action

> **Removed from Phase 1 outputs:** "consider bundling" — deferred to Phase 4.

### Behavior principle
The app should never recommend an action unless at least one clear rule or score threshold supports it.

---

## 9. Scoring and decision engine

### 9.1 Initial score model
Use a weighted score per variant.

#### Inputs
- conversion/sales performance score
- profit score
- refund score
- inventory score

#### Weighting for Phase 1 (fixed, not merchant-configurable until Phase 5)
- performance score: 35%
- profit score: 35%
- refund score: 15%
- inventory score: 15%

### 9.2 Score outputs
- overall opportunity score
- overall risk score
- action recommendation
- confidence level

### 9.3 Single-variant product policy

Products with only one active variant cannot be scored using sibling-relative normalization because there are no siblings to compare against. These products must be handled explicitly:

- Do not apply sibling normalization to single-variant products.
- Score performance and profit scores using store-wide percentile normalization (compare the variant against all other store variants of the same general product type if available, or all store variants as a fallback).
- Set confidence score to a maximum of 0.60 regardless of order volume, because the absence of sibling comparison reduces recommendation reliability.
- Do not recommend "push" or "deprioritize" for single-variant products — these actions only have meaning in a multi-variant context. Permitted recommendations are: restock_soon, investigate_refunds, review_pricing, no_action.
- Surface single-variant products in the Variants table with a badge indicating "No sibling comparison available."

### 9.4 Missing cost data policy

Cost data absence directly affects the profit score (35% of overall score). The following rules govern behavior when cost is missing:

**When unit cost is missing for a variant:**
- Set profit score to `null` (not 0 and not 0.5 — null is different from a low score).
- Reweight the remaining scores proportionally for overall_opportunity_score: performance 50%, refund 25%, inventory 25%.
- Cap confidence score at 0.55 regardless of order volume.
- Flag the variant with `cost_estimated: false` in the score output.
- Show a visible "Profit data incomplete" label on any UI element displaying margin or profit score for this variant.

**When unit cost is partial (some variants in a product have cost, others do not):**
- Score variants with cost data normally.
- Score variants without cost using the fallback above.
- In the Product detail page, show a banner: "Cost data is missing for [N] variants. Profit scores for those variants are estimated."

**The net profit definition for Phase 1:**
Net profit = Gross revenue from line items − COGS (from Shopify inventory cost) − refund impact.

Payment fee allocation and shipping cost allocation are explicitly excluded from Phase 1 net profit. Do not display a metric labeled "net profit" that implies fees or shipping are included. Use the label "Gross profit (excl. fees & shipping)" in all UI where this metric appears, until a later phase adds those components.

### 9.5 Action rules

#### Push
Recommend push when:
- performance score high
- profit score high (or null with reweighted score still high and confidence acceptable)
- refund risk low
- inventory acceptable
- product has more than one active variant

#### Deprioritize
Recommend deprioritize when:
- performance low or falling
- low margin or negative margin
- refund risk high
- better sibling variant exists
- product has more than one active variant

#### Restock soon
Recommend restock when:
- strong score
- stock running low
- sales velocity healthy

#### Investigate refunds
Recommend when:
- refund rate high relative to sibling variants
- refund-adjusted margin poor

#### Review pricing
Recommend when:
- strong demand but weak margin
- persistent low profit despite sales

### 9.6 Confidence behavior
High confidence if:
- enough order/sample volume exists
- data coverage is complete (cost present, refund data available)
- trend is consistent over selected window

Low confidence if:
- low volume
- missing costs (capped at 0.55 per section 9.4)
- single-variant product (capped at 0.60 per section 9.3)
- incomplete refund or inventory data

If confidence is low, recommendation should be softened:
- "Possible opportunity"
- "Needs more data"

---

## 10. Data requirements

## 10.1 Shopify as primary source
Use Shopify GraphQL Admin API as the core store data source.

### Core entities needed
- Products
- Product variants
- Inventory items
- Inventory levels
- Orders
- Order line items
- Refunds and refund line items
- Transactions

---

## 10.2 Historical sync behavior

### Required OAuth scope: `read_all_orders`

`read_all_orders` is a **mandatory scope** for this app, not optional. Shopify's default `read_orders` scope only returns the last 60 days of orders. Since the minimum useful sync window is 90 days and the default recommended window is 180 days, `read_all_orders` must be requested at install time.

**Implementation requirement:** During onboarding, if `read_all_orders` is not granted, the app must:
1. Show a clear explanation that order history beyond 60 days requires this permission.
2. Block the merchant from selecting a sync range greater than 60 days.
3. Show a persistent banner prompting the merchant to re-authorize with the full scope.
4. Cap all date range selectors across the app at 60 days until the scope is granted.

Do not silently proceed with a 90-day or 180-day sync using only `read_orders` — the data will be incomplete and recommendations will be wrong.

### Initial sync flow
1. Merchant installs app
2. Merchant completes onboarding
3. App requests or starts historical sync
4. Bulk queries run for required entities (see section 22.5 for corrected query structure)
5. JSONL output is downloaded and parsed
6. Data is normalized into DB tables
7. Initial scores and recommendations are computed
8. UI becomes available progressively as data arrives

### Sync range options
- 60 days (available with `read_orders` scope only — fallback)
- 90 days (requires `read_all_orders`)
- 180 days (requires `read_all_orders`, recommended default)
- 365 days (requires `read_all_orders`)

Default: 180 days when `read_all_orders` is granted; 60 days otherwise with a scope upgrade prompt.

---

## 10.3 Incremental sync behavior

### Ongoing updates
After backfill, app should stay up to date using Shopify webhooks plus selective follow-up API fetches.

### Likely webhook topics
- orders/create
- orders/updated
- refunds/create
- products/update
- inventory_levels/update
- app/uninstalled

### Incremental update behavior
- webhook arrives
- verify HMAC
- enqueue processing job
- update affected raw records
- recompute impacted aggregates and variant scores only
- refresh relevant dashboard caches

---

## 11. Data model

### Core tables
- shops
- products
- variants
- inventory_items
- inventory_levels
- orders
- order_line_items
- refunds
- refund_line_items
- transactions
- variant_daily_metrics
- variant_scores
- product_scores
- recommendations
- merchant_settings
- sync_jobs

### Relationship between `variant_scores` and `recommendations`

These two tables serve distinct purposes and have a defined ownership relationship:

**`variant_scores`** is the engine output layer. It stores the raw computed scores for each variant per scoring window. It is overwritten on each recompute. It is never shown directly to merchants. It is the source of truth for score values.

**`recommendations`** is the merchant-facing persistence layer. A recommendation record is created from a variant_score when the computed action meets the confidence threshold and is surfaced to the UI. It tracks lifecycle state (first seen, dismissed, acted on). It is never overwritten — it is updated with `last_seen_at` on subsequent recomputes if the recommendation persists, or soft-closed if the action changes.

**Write flow:**
1. Score engine writes to `variant_scores`.
2. Recommendation service reads `variant_scores` and upserts `recommendations` using `variant_id + recommendation_type` as the natural key.
3. If an existing recommendation changes action type, the old record is closed (`status = resolved`) and a new record is created.
4. UI reads only from `recommendations`, never directly from `variant_scores`.

### Key derived datasets
- variant profitability rollups
- sibling comparison rollups
- refund-adjusted margin rollups
- stock health rollups
- recommendation snapshots

---

## 12. Metric definitions

### Revenue by variant
Sum of line-item revenue attributable to the variant (gross, before refunds).

### Gross profit by variant (Phase 1 label)
Revenue minus estimated or actual COGS. **Excludes** payment fee allocation and shipping cost allocation. Displayed in UI as "Gross profit (excl. fees & shipping)" — never as "net profit" until fee and shipping data is incorporated in a later phase.

### Margin %
Gross profit divided by revenue. Same exclusion applies.

### Refund rate by variant
Refunded units divided by sold units within the reporting window.

### Stock health
A composite indicator based on current stock, recent sales velocity, and stockout risk.

### Performance score
In Phase 1, use a store-relative sales and order performance proxy. See section 22.6 for formula.

### Profit score
Relative score based on gross profit and margin compared with sibling variants. Null when cost data is absent (see section 9.4).

### Refund score
Inverse score where higher refunds reduce variant quality.

### Inventory score
Higher when stock is sufficient for a strong performer and lower when overstocked poor performers or at-risk winning variants exist.

---

## 13. Merchant decision logic examples

### Example 1: Push variant
Variant has:
- best revenue trend among siblings
- healthy margin
- low refund rate
- enough stock

Result:
- recommend making this the default or featuring it in merchandising

### Example 2: Deprioritize variant
Variant has:
- weaker sales than siblings
- poor or negative margin
- high refund rate

Result:
- recommend stopping promotion or reviewing product content

### Example 3: Restock variant
Variant has:
- strong performance
- strong margin
- low inventory

Result:
- recommend restocking soon

### Example 4: Investigate variant
Variant has:
- decent sales
- weak refund-adjusted margin
- high refund rate relative to sibling variants

Result:
- recommend refund investigation or better guidance

---

## 14. Onboarding behavior

### Step 1: Welcome
Explain product in one sentence.

### Step 2: Scope and data sync selection

**Scope gate (required):**
Before presenting sync range options, the app must check whether `read_all_orders` has been granted.
- If granted: show all range options (60 / 90 / 180 / 365 days) with 180d pre-selected.
- If not granted: show only the 60-day option as available, gray out longer ranges, and show an inline explanation: "To sync more than 60 days of orders, re-authorize the app with extended order history access." Provide a re-authorization CTA inline.

### Step 3: Cost setup
- use Shopify inventory cost where available
- allow manual cost overrides for missing data
- show cost coverage percentage inline: "Cost data found for X% of your variants"
- if coverage is below 50%, show a warning: "Profit scores will be unavailable for many variants. Consider adding cost data in Shopify before proceeding."

### Step 4: Threshold setup
Merchant can accept defaults or customize:
- low margin threshold (default: 15%)
- refund risk threshold (default: 8%)
- stockout threshold (default: 10 days)

Scoring weight controls are not shown in onboarding or settings in Phase 1 (deferred to Phase 5).

### Step 5: First sync progress
Show progress page with:
- current sync stage
- estimated completeness label
- pages available when partial data is enough

### Step 6: First recommendations
Once enough data exists, show first decision summary immediately.

### Onboarding behavior rule
Time to first meaningful insight should be prioritized over perfect completeness.

---

## 15. Phase-wise implementation plan

# Phase 1: Core Variant Decision Dashboard

### Goal
Ship a credible, narrow product that recommends which variants to push or deprioritize.

### Main user promise
See which variants deserve attention right now.

### Scope
- onboarding with scope gate
- historical sync (gated on read_all_orders)
- core variant metrics
- variant score calculation
- overview page
- recommendations page
- products page
- product detail page
- variants page
- variant detail page
- settings for thresholds and costs (no scoring weight controls)

### Nav in Phase 1
Overview, Recommendations, Products, Variants, Settings only. No Refunds or Inventory nav items.

### Data sources in Phase 1
- Shopify products and variants
- Shopify orders and line items
- Shopify refunds and refund line items (via separate bulk query)
- Shopify inventory items and inventory levels

### Behavior in Phase 1
- performance uses sales/order proxies instead of richer session analytics
- recommendations are rule-based + weighted-score driven
- every recommendation explains why
- low-confidence recommendations are labeled clearly
- single-variant products receive limited recommendation set (see section 9.3)
- missing cost variants receive capped confidence and "Gross profit (excl. fees & shipping)" label (see section 9.4)
- bundle pairing does not appear anywhere in Phase 1

### Success criteria
- merchant can identify top variants to push
- merchant can identify weak variants to stop pushing
- merchant can compare variants within a product
- recommendations feel understandable, not magic

### Frontend deliverables
- all Phase 1 nav pages with Polaris web components
- responsive tables and filter states
- recommendation detail interaction
- setup health banners
- cost coverage warnings
- scope upgrade prompts where applicable

### Backend deliverables
- auth with read_all_orders scope
- sync jobs with scope-aware range gating
- separate bulk queries for products/variants, orders, inventory, and refunds
- raw + normalized data tables
- aggregate jobs including variant_daily_metrics population
- score engine v1 with single-variant and missing-cost handling
- recommendations service with variant_scores → recommendations write flow
- recommendations API

---

# Phase 2: Profitability and Refund Intelligence

### Goal
Make recommendations financially smarter.

### New scope
- Refunds nav item and page (now ships)
- refund-adjusted margin reporting
- better cost allocation rules
- low-margin detection
- refund investigation recommendations
- improved profit score using refund-adjusted margin

### New behavior
The app should now distinguish between:
- high-selling good variants
- high-selling but bad business variants

### Key changes
- profit score becomes more important
- refund score becomes more reliable
- more precise deprioritize logic
- pricing review recommendations become available

### Success criteria
- merchant can see which variants looked good before refunds but are actually weak
- app can identify margin killers more confidently

---

# Phase 3: Inventory-Aware Optimization

### Goal
Tie recommendations to stock availability and capital efficiency.

### New scope
- Inventory nav item and page (now ships)
- overstock and stockout risk signals
- restock urgency logic
- dead-stock detection (definition must be agreed before build: minimum velocity threshold + aging period)

### New behavior
The app should now tell merchants:
- this variant is worth pushing but stock is low
- this variant has too much stock and weak performance
- this winning variant needs restock soon

### Success criteria
- merchants can use app for both merchandising and inventory prioritization

---

# Phase 4: Merchandising Actions and Integrations

### Goal
Move from insight to workflow support.

### New scope
- export/share recommendation lists
- theme integration hints
- bundle pairing logic (first appearance — requires definition of pairing signal before build)
- optional helper scripts or app blocks later where relevant

### New behavior
- app becomes more operational
- merchants can move from recommendation to execution faster

### Success criteria
- less friction between insight and action
- more recurring daily usage

---

# Phase 5: Advanced Intelligence

### Goal
Improve accuracy and automation.

### Possible scope
- scoring weight controls exposed in Settings UI
- richer scoring models
- trend anomaly detection
- smarter confidence modeling
- channel-aware recommendations if data exists
- automated playbooks later with approval gates

### Behavior rule
Do not add automation before merchants trust recommendations.

---

## 16. Backend implementation sequence

1. Scaffold Shopify embedded app
2. Add App Bridge integration
3. Build frontend pages with Polaris web components shell (Phase 1 nav only)
4. Implement auth with `read_all_orders` as mandatory scope
5. Create DB schema
6. Implement bulk sync jobs with corrected query structure (see section 22.5)
7. Implement JSONL ingestion
8. Implement webhook receiver
9. Create daily aggregates and sibling comparison jobs (populate `variant_daily_metrics`)
10. Build score engine v1 with single-variant handling and missing-cost fallback
11. Build recommendations service (variant_scores → recommendations write flow)
12. Build recommendations API
13. Wire Overview, Recommendations, Products, Variants pages
14. Add profitability logic
15. Add refund intelligence (Phase 2)
16. Add inventory optimization logic (Phase 3)

---

## 17. API design expectations for Claude Code

### API style
Internal backend endpoints should be simple and page-oriented.

### Example endpoints
- GET `/api/overview`
- GET `/api/recommendations`
- GET `/api/products`
- GET `/api/products/:id`
- GET `/api/variants`
- GET `/api/variants/:id`
- GET `/api/inventory` (Phase 3)
- GET `/api/refunds` (Phase 2)
- GET `/api/settings`
- POST `/api/settings`

### Response expectations
Every page API should return:
- summary data
- filter metadata
- table rows
- recommendation explanation where relevant
- setup health info when relevant

---

## 18. UX writing rules

- use direct language
- avoid jargon where not needed
- explain recommendations in plain English
- show uncertainty honestly
- always label partial-cost metrics as "Gross profit (excl. fees & shipping)"

Examples:
- Good: "Push this variant. It sells well, stays profitable, and has healthy stock."
- Bad: "This SKU exhibits superior weighted composite performance."
- Good: "Profit score unavailable — cost data missing for this variant."
- Bad: showing a profit score of 0 when cost data is simply absent

---

## 19. Risks and guardrails

### Risk 1: False confidence
Guardrail:
Always show confidence and data coverage. Cap confidence when cost or scope data is incomplete (see sections 9.3 and 9.4).

### Risk 2: Missing cost data
Guardrail:
Show setup health and partial-estimate warnings. Use null profit score (not 0) when cost is absent. Reweight scores transparently.

### Risk 3: Too much complexity at launch
Guardrail:
Keep Phase 1 focused on decision quality, not feature count. Scoring weights, bundle pairing, and dead-stock detection are explicitly deferred.

### Risk 4: Dashboard without action value
Guardrail:
Always lead with recommendations, not raw tables.

### Risk 5: Incomplete order history due to missing scope
Guardrail:
Gate sync range on `read_all_orders` presence. Never silently fetch 90+ days with only `read_orders`.

### Risk 6: Misleading profit labeling
Guardrail:
Never label COGS-only margin as "net profit." Use "Gross profit (excl. fees & shipping)" until fee and shipping data is incorporated.

---

## 20. Success metrics

### Product metrics
- install to first recommendation time
- recommendation click-through rate
- daily active merchants
- repeat usage of Recommendations page
- settings completion rate

### Trust metrics
- percentage of recommendations with high confidence
- merchant override or dismissal patterns later
- support tickets about inaccurate recommendations

### Business metrics
- trial to paid conversion
- retention by store size
- usage depth across pages

---

## 21. Claude Code build handoff

Build a Shopify embedded app called **Variant Profit Optimizer**.

### Frontend requirements
- Use Shopify App Home
- Use App Bridge
- Use Polaris web components for all major UI
- Use `s-page` as page shell
- Build responsive summary cards, tables, banners, tooltips, settings forms
- Do not rely on old Polaris React abstractions unless absolutely necessary for plumbing
- Phase 1 nav: Overview, Recommendations, Products, Variants, Settings only

### Product behavior requirements
- The app is recommendation-first
- Every key page must surface actions, not just metrics
- Every recommendation must include explanation and confidence
- Every major metric must be drillable
- Empty and partial-data states must be clean and helpful
- Single-variant products receive a reduced recommendation set (section 9.3)
- Missing cost variants show null profit scores with clear UI labeling (section 9.4)
- Profit is labeled "Gross profit (excl. fees & shipping)" throughout Phase 1

### Phase 1 build requirements
- onboarding with `read_all_orders` scope gate
- sync flow with separate bulk queries per entity type
- variant scoring with single-variant and missing-cost handling
- recommendations page
- products and variants reporting
- settings and thresholds (no scoring weight controls)

### Important implementation rule
Do not overbuild advanced analytics before the recommendation workflow is useful.

### Output quality bar
A merchant should be able to open the app and quickly understand:
- which variant to push
- which variant to stop pushing
- which variant needs stock attention
- which variant may be harming profit

---

## 22. Technical implementation appendix

This section adds the execution detail needed for Claude Code.

---

### 22.1 Database schema

Below is the recommended relational schema for the first production version.

#### shops
Purpose:
Store shop-level identity, install state, and sync health.

Fields:
- id
- shop_domain
- shop_gid
- access_token_encrypted
- installed_at
- uninstalled_at
- timezone
- currency_code
- plan_name
- sync_status
- last_full_sync_at
- last_incremental_sync_at
- data_health_score
- has_all_orders_scope (boolean — tracks whether read_all_orders was granted at install)
- created_at
- updated_at

Indexes:
- unique shop_domain
- shop_gid

#### sync_jobs
Purpose:
Track bulk imports, retries, and job progress.

Fields:
- id
- shop_id
- job_type
- job_scope
- status
- started_at
- finished_at
- bulk_operation_id
- result_url
- records_processed
- error_message
- metadata_json
- created_at
- updated_at

Indexes:
- shop_id + status
- bulk_operation_id

#### products
Purpose:
Canonical product records.

Fields:
- id
- shop_id
- product_gid
- title
- handle
- vendor
- product_type
- status
- tags_json
- total_variants
- published_at
- created_at_shopify
- updated_at_shopify
- created_at
- updated_at

Indexes:
- shop_id + product_gid unique
- shop_id + title

#### variants
Purpose:
Canonical variant records and core merchandising entity.

Fields:
- id
- shop_id
- product_id
- variant_gid
- inventory_item_gid
- sku
- title
- option1
- option2
- option3
- price
- compare_at_price
- taxable
- barcode
- is_tracked
- is_active
- position
- created_at_shopify
- updated_at_shopify
- created_at
- updated_at

Indexes:
- shop_id + variant_gid unique
- product_id
- shop_id + sku
- inventory_item_gid

#### inventory_items
Purpose:
Store cost and inventory linkage.

Fields:
- id
- shop_id
- inventory_item_gid
- sku
- tracked
- unit_cost_amount
- unit_cost_currency
- has_cost_data (boolean — true when unit_cost_amount is present and non-zero)
- country_code_of_origin
- harmonized_system_code
- created_at_shopify
- updated_at_shopify
- created_at
- updated_at

Indexes:
- shop_id + inventory_item_gid unique
- shop_id + sku

#### inventory_levels
Purpose:
Store per-location inventory state.

Fields:
- id
- shop_id
- inventory_item_id
- location_gid
- available_quantity
- on_hand_quantity
- committed_quantity
- reserved_quantity
- incoming_quantity
- updated_at_shopify
- created_at
- updated_at

Indexes:
- shop_id + inventory_item_id + location_gid unique
- shop_id + location_gid

#### orders
Purpose:
Order-level commercial record.

Fields:
- id
- shop_id
- order_gid
- order_number
- name
- created_at_shopify
- processed_at_shopify
- cancelled_at_shopify
- financial_status
- fulfillment_status
- currency_code
- subtotal_amount
- total_discount_amount
- total_shipping_amount
- total_tax_amount
- total_amount
- net_payment_amount
- customer_gid
- source_name
- app_id
- tags_json
- is_test
- created_at
- updated_at

Indexes:
- shop_id + order_gid unique
- shop_id + created_at_shopify
- shop_id + order_number

#### order_line_items
Purpose:
Attribution of revenue and units to variants.

Fields:
- id
- shop_id
- order_id
- line_item_gid
- product_gid
- variant_gid
- sku
- title
- variant_title
- quantity
- original_unit_price_amount
- discounted_unit_price_amount
- total_discount_amount
- total_tax_amount
- created_at
- updated_at

Indexes:
- shop_id + line_item_gid unique
- order_id
- shop_id + variant_gid

#### refunds
Purpose:
Refund event tracking.

Fields:
- id
- shop_id
- refund_gid
- order_id
- created_at_shopify
- processed_at_shopify
- note
- total_refunded_amount
- restock_flag
- payload_json
- created_at
- updated_at

Indexes:
- shop_id + refund_gid unique
- order_id
- shop_id + created_at_shopify

#### refund_line_items
Purpose:
Line-item refund attribution to variants.

Fields:
- id
- shop_id
- refund_id
- refund_line_item_gid
- order_line_item_gid
- variant_gid
- quantity
- subtotal_amount
- total_tax_amount
- restock_type
- location_gid
- created_at
- updated_at

Indexes:
- refund_id
- shop_id + variant_gid
- shop_id + refund_line_item_gid unique

#### transactions
Purpose:
Track captures, refunds, and transaction state for financial validation.

> **Phase 1 usage note:** Transactions are ingested and stored during the initial sync but are not used directly in Phase 1 scoring. Their primary purpose is to validate refund financial state in Phase 2 (distinguishing a refund event from actual money movement). Do not build transaction-based logic in Phase 1 — the table should be populated but left dormant in the scoring engine until Phase 2.

Fields:
- id
- shop_id
- transaction_gid
- order_id
- parent_transaction_gid
- kind
- status
- gateway
- amount
- processed_at_shopify
- created_at
- updated_at

Indexes:
- shop_id + transaction_gid unique
- order_id
- shop_id + kind + status

#### merchant_settings
Purpose:
Store thresholds and scoring behavior.

Fields:
- id
- shop_id
- cost_source_mode
- allow_manual_cost_overrides
- low_margin_threshold_pct
- high_refund_threshold_pct
- low_stock_days_threshold
- confidence_min_threshold
- scoring_weights_json (stored for forward compatibility; not merchant-editable until Phase 5)
- recommendation_rules_json
- created_at
- updated_at

Indexes:
- unique shop_id

#### variant_daily_metrics
Purpose:
Precomputed daily metrics for performant reporting and trend calculation.

> **Population requirement:** This table must be populated by a scheduled daily aggregation job that runs after each incremental sync. It must also be backfilled for all historical data during the initial sync. The scoring engine depends on this table — specifically on `units_sold_last_14d` and `units_sold_prior_14d` fields — for trend scoring. Do not build the score engine until this table is populated and its aggregation job is tested.

Fields:
- id
- shop_id
- variant_id
- metric_date
- orders_count
- units_sold
- gross_revenue_amount
- net_revenue_amount
- cogs_amount
- refund_amount
- gross_profit_amount (revenue minus cogs minus refund impact; excludes fees and shipping)
- margin_pct
- ending_stock_quantity
- sales_velocity_7d
- sales_velocity_30d
- units_sold_last_14d (rolling sum; used for trend scoring)
- units_sold_prior_14d (rolling sum of the 14 days before last_14d; used for trend scoring)
- created_at
- updated_at

Indexes:
- shop_id + variant_id + metric_date unique
- shop_id + metric_date

#### variant_scores
Purpose:
Latest decision-engine output per variant. Source of truth for score values. Overwritten on recompute.

Fields:
- id
- shop_id
- variant_id
- score_window
- is_single_variant_product (boolean)
- has_cost_data (boolean — copied from inventory_items at score time)
- performance_score
- profit_score (nullable — null when cost data absent)
- refund_score
- inventory_score
- opportunity_score
- risk_score
- confidence_score
- recommended_action
- explanation_json
- computed_at
- created_at
- updated_at

Indexes:
- shop_id + variant_id + score_window unique
- shop_id + recommended_action
- shop_id + confidence_score

#### recommendations
Purpose:
Merchant-facing persistence layer. Created from variant_scores by the recommendations service. Tracks lifecycle state. Never overwritten — updated via status transitions.

Fields:
- id
- shop_id
- product_id
- variant_id
- recommendation_type
- title
- summary
- explanation_json
- confidence_score
- status (active, resolved, dismissed)
- first_seen_at
- last_seen_at
- dismissed_at
- acted_at
- created_at
- updated_at

Indexes:
- shop_id + recommendation_type + status
- shop_id + variant_id

---

### 22.2 API contracts

The backend should expose page-oriented APIs optimized for UI rendering.

#### GET /api/setup-health
Response shape:
```json
{
  "syncStatus": "complete",
  "lastFullSyncAt": "2026-03-17T09:30:00Z",
  "hasAllOrdersScope": true,
  "coverage": {
    "costCoveragePct": 82,
    "refundCoveragePct": 100,
    "inventoryCoveragePct": 96
  },
  "warnings": [
    {
      "code": "LOW_COST_COVERAGE",
      "message": "18% of variants are missing cost data. Profit scores for those variants are unavailable."
    }
  ]
}
```

#### GET /api/overview?range=30d
Response shape:
```json
{
  "summary": {
    "variantsToPush": 14,
    "variantsToDeprioritize": 9,
    "lowMarginVariants": 17,
    "refundRiskVariants": 6,
    "stockRiskVariants": 11
  },
  "highlightedRecommendations": [
    {
      "id": "rec_123",
      "productId": "prod_1",
      "variantId": "var_1",
      "productTitle": "Classic Hoodie",
      "variantTitle": "Black / Large",
      "action": "push",
      "confidence": 0.87,
      "reasons": ["high_conversion", "healthy_margin", "low_refund_risk", "stock_available"],
      "summary": "Push this variant. It converts well, stays profitable, and has healthy stock."
    }
  ],
  "topOpportunityProducts": [],
  "setupHealth": {}
}
```

#### GET /api/recommendations?range=30d&action=push&confidence=high
Response shape:
```json
{
  "filters": {
    "range": "30d",
    "action": "push",
    "confidence": "high"
  },
  "rows": [
    {
      "id": "rec_123",
      "productId": "prod_1",
      "variantId": "var_1",
      "productTitle": "Classic Hoodie",
      "variantTitle": "Black / Large",
      "action": "push",
      "confidenceScore": 0.87,
      "performanceScore": 86,
      "profitScore": 82,
      "refundScore": 91,
      "inventoryScore": 77,
      "hasCostData": true,
      "isSingleVariantProduct": false,
      "summary": "Best balance of sales, margin, and stock."
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 25,
    "total": 112
  }
}
```

#### GET /api/products
Response shape:
```json
{
  "rows": [
    {
      "id": "prod_1",
      "title": "Classic Hoodie",
      "totalVariants": 8,
      "revenue": 12940.23,
      "grossProfit": 3112.90,
      "grossProfitLabel": "Gross profit (excl. fees & shipping)",
      "bestVariant": "Black / Large",
      "worstVariant": "Blue / Small",
      "opportunityCount": 3,
      "riskCount": 2
    }
  ],
  "pagination": {}
}
```

#### GET /api/products/:id
Response shape:
```json
{
  "product": {
    "id": "prod_1",
    "title": "Classic Hoodie",
    "totalVariants": 8,
    "revenue": 12940.23,
    "grossProfit": 3112.90,
    "recommendationCount": 4,
    "costCoveragePct": 100
  },
  "bestVariant": {},
  "weakestVariant": {},
  "variantRows": [],
  "insights": []
}
```

#### GET /api/variants
Response shape:
```json
{
  "rows": [
    {
      "id": "var_1",
      "productTitle": "Classic Hoodie",
      "variantTitle": "Black / Large",
      "sku": "HD-BLK-L",
      "revenue": 4200.11,
      "grossProfit": 1200.32,
      "marginPct": 28.6,
      "refundRatePct": 2.1,
      "stockHealth": "healthy",
      "score": 84,
      "recommendedAction": "push",
      "hasCostData": true,
      "isSingleVariantProduct": false
    }
  ],
  "pagination": {}
}
```

#### GET /api/variants/:id
Response shape:
```json
{
  "variant": {
    "id": "var_1",
    "productTitle": "Classic Hoodie",
    "variantTitle": "Black / Large",
    "recommendedAction": "push",
    "confidenceScore": 0.87,
    "hasCostData": true,
    "isSingleVariantProduct": false
  },
  "snapshot": {
    "unitsSold": 181,
    "revenue": 4200.11,
    "grossProfit": 1200.32,
    "grossProfitLabel": "Gross profit (excl. fees & shipping)",
    "marginPct": 28.6,
    "refundRatePct": 2.1,
    "currentStock": 57
  },
  "scoreBreakdown": {
    "performanceScore": 86,
    "profitScore": 82,
    "profitScoreAvailable": true,
    "refundScore": 91,
    "inventoryScore": 77,
    "overallScore": 84
  },
  "explanation": {
    "whyThisMatters": "This variant is the strongest commercial option in the product family.",
    "suggestedActions": [
      "Set as default variant",
      "Feature in merchandising blocks"
    ]
  }
}
```

#### GET /api/settings
Response shape:
```json
{
  "costSourceMode": "shopify_inventory_cost_first",
  "lowMarginThresholdPct": 15,
  "highRefundThresholdPct": 8,
  "lowStockDaysThreshold": 10,
  "confidenceMinThreshold": 0.6,
  "scoringWeightsEditable": false,
  "scoringWeights": {
    "performance": 0.35,
    "profit": 0.35,
    "refund": 0.15,
    "inventory": 0.15
  }
}
```

#### POST /api/settings
Request shape:
```json
{
  "lowMarginThresholdPct": 18,
  "highRefundThresholdPct": 7,
  "lowStockDaysThreshold": 12,
  "confidenceMinThreshold": 0.65
}
```

> Note: `scoringWeights` is not accepted in POST /api/settings in Phase 1. The endpoint must reject any request body that includes `scoringWeights` with a 400 and message: "Scoring weights are not customizable in this version."

Response shape:
```json
{
  "ok": true,
  "updatedAt": "2026-03-17T12:00:00Z"
}
```

---

### 22.3 Shopify scopes

#### Mandatory scopes
- `read_products`
- `read_inventory`
- `read_orders`
- `read_all_orders` — **required**, not optional. See section 10.2 for rationale and gating behavior.

#### Mandatory compliance scopes
These must be registered per Shopify app requirements regardless of app functionality:
- Webhook handler for `customers/data_request`
- Webhook handler for `customers/redact`
- Webhook handler for `shop/redact`

#### Optional later scopes
- `read_reports` if ShopifyQL/reporting endpoints are used later.

---

### 22.4 Webhook list

Mandatory compliance webhooks:
- `customers/data_request`
- `customers/redact`
- `shop/redact`

Operational webhooks:
- `orders/create`
- `orders/updated`
- `refunds/create`
- `products/update`
- `inventory_levels/update`
- `app/uninstalled`

Webhook config guidance:
- pin app webhooks to the latest stable webhook API version in app config
- keep payload handling version-aware
- process asynchronously via queue

---

### 22.5 Bulk query examples

Shopify bulk operations return JSONL output with parent-child relationships expressed via `__parentId` fields — nested objects are **not** returned inline. Each entity type must be queried separately or with explicit nesting limited to one level. Do not attempt to nest refunds → refund line items inside an orders bulk query — the result will be flattened and refund line items will be missing.

#### Required bulk queries (run as separate jobs)

**Job 1: Products and variants**
```graphql
mutation {
  bulkOperationRunQuery(
    query: """
    {
      products {
        edges {
          node {
            id
            title
            handle
            vendor
            productType
            status
            tags
            publishedAt
            updatedAt
            variants {
              edges {
                node {
                  id
                  title
                  sku
                  price
                  compareAtPrice
                  taxable
                  barcode
                  position
                  inventoryItem {
                    id
                    sku
                    tracked
                    unitCost {
                      amount
                      currencyCode
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    """
  ) {
    bulkOperation { id status }
    userErrors { field message }
  }
}
```

**Job 2: Orders and line items**
```graphql
mutation {
  bulkOperationRunQuery(
    query: """
    {
      orders(query: "created_at:>=2025-09-01") {
        edges {
          node {
            id
            name
            createdAt
            processedAt
            cancelledAt
            displayFinancialStatus
            displayFulfillmentStatus
            currencyCode
            currentSubtotalPriceSet {
              shopMoney { amount currencyCode }
            }
            currentTotalDiscountsSet {
              shopMoney { amount currencyCode }
            }
            currentTotalTaxSet {
              shopMoney { amount currencyCode }
            }
            currentTotalPriceSet {
              shopMoney { amount currencyCode }
            }
            lineItems {
              edges {
                node {
                  id
                  title
                  variantTitle
                  quantity
                  sku
                  discountedUnitPriceSet {
                    shopMoney { amount currencyCode }
                  }
                  originalUnitPriceSet {
                    shopMoney { amount currencyCode }
                  }
                  variant { id }
                  product { id }
                }
              }
            }
          }
        }
      }
    }
    """
  ) {
    bulkOperation { id status }
    userErrors { field message }
  }
}
```

**Job 3: Refunds and refund line items (separate job)**

Refund line items cannot be reliably retrieved by nesting inside the orders bulk query due to JSONL flattening behavior. Run refunds as a dedicated bulk job using the `orders` root query with `refunds` and `refundLineItems` explicitly requested.

```graphql
mutation {
  bulkOperationRunQuery(
    query: """
    {
      orders(query: "created_at:>=2025-09-01") {
        edges {
          node {
            id
            refunds {
              edges {
                node {
                  id
                  createdAt
                  processedAt
                  note
                  totalRefundedSet {
                    shopMoney { amount currencyCode }
                  }
                  refundLineItems {
                    edges {
                      node {
                        id
                        quantity
                        restockType
                        lineItem {
                          id
                          variant { id }
                          sku
                        }
                        subtotalSet {
                          shopMoney { amount currencyCode }
                        }
                        totalTaxSet {
                          shopMoney { amount currencyCode }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    """
  ) {
    bulkOperation { id status }
    userErrors { field message }
  }
}
```

> **Implementation note:** When parsing the JSONL output from Job 3, use the `__parentId` field to associate each refund with its parent order and each refund line item with its parent refund. Do not assume nested structure in the output file.

**Job 4: Inventory levels**
```graphql
mutation {
  bulkOperationRunQuery(
    query: """
    {
      inventoryItems {
        edges {
          node {
            id
            sku
            tracked
            unitCost {
              amount
              currencyCode
            }
            inventoryLevels {
              edges {
                node {
                  id
                  location { id name }
                  quantities(names: ["available", "on_hand", "committed", "reserved", "incoming"]) {
                    name
                    quantity
                  }
                  updatedAt
                }
              }
            }
          }
        }
      }
    }
    """
  ) {
    bulkOperation { id status }
    userErrors { field message }
  }
}
```

**Job 5: Transactions (ingest only — not used in Phase 1 scoring)**
```graphql
mutation {
  bulkOperationRunQuery(
    query: """
    {
      orders(query: "created_at:>=2025-09-01") {
        edges {
          node {
            id
            transactions {
              edges {
                node {
                  id
                  kind
                  status
                  gateway
                  amountSet {
                    shopMoney { amount currencyCode }
                  }
                  processedAt
                  parentTransaction { id }
                }
              }
            }
          }
        }
      }
    }
    """
  ) {
    bulkOperation { id status }
    userErrors { field message }
  }
}
```

> **Implementation note:** Only one bulk operation can run at a time per shop. Jobs 1–5 must be queued and run sequentially. The sync_jobs table tracks status per job. Do not attempt to run multiple bulk operations in parallel for the same shop.

---

### 22.6 Scoring formulas in pseudo-code

#### Normalization helpers
```text
normalize(value, min, max):
  if max <= min:
    return 0.5
  return clamp((value - min) / (max - min), 0, 1)

inverse_normalize(value, min, max):
  return 1 - normalize(value, min, max)
```

#### Base sibling context
```text
For each product:
  gather all active variants where sibling_count > 1
  compute sibling metrics for selected window
  compute min/max/median for:
    units_sold
    revenue
    gross_profit
    margin_pct
    refund_rate_pct
    days_of_stock_left

  if sibling_count == 1:
    use store-wide percentile normalization instead
    (compare against all store variants as fallback cohort)
    flag is_single_variant_product = true
```

#### Trend score helper
```text
trend_score(units_sold_last_14d, units_sold_prior_14d):
  if units_sold_prior_14d == 0:
    if units_sold_last_14d > 0:
      return 0.75  # growing from zero — treat as positive but not maximum
    else:
      return 0.5   # no data in either window — neutral
  ratio = units_sold_last_14d / units_sold_prior_14d
  if ratio >= 1.25:
    return 1.0    # growing 25%+ — strong positive trend
  if ratio >= 1.05:
    return 0.75   # slight growth
  if ratio >= 0.80:
    return 0.5    # stable within 20%
  if ratio >= 0.50:
    return 0.25   # declining
  return 0.0      # declining sharply (>50% drop)
```

> **Data dependency:** `units_sold_last_14d` and `units_sold_prior_14d` are read from `variant_daily_metrics`. This table must be populated before the scoring engine runs. See schema note in section 22.1.

#### Performance score
```text
performance_score =
  0.45 * normalize(variant.units_sold, sibling.min_units_sold, sibling.max_units_sold)
+ 0.35 * normalize(variant.revenue, sibling.min_revenue, sibling.max_revenue)
+ 0.20 * trend_score(variant.units_sold_last_14d, variant.units_sold_prior_14d)
```

#### Profit score
```text
if variant.has_cost_data == false:
  profit_score = null
  # Reweight overall_opportunity_score: performance 50%, refund 25%, inventory 25%
else:
  profit_score =
    0.55 * normalize(variant.gross_profit, sibling.min_gross_profit, sibling.max_gross_profit)
  + 0.45 * normalize(variant.margin_pct, sibling.min_margin_pct, sibling.max_margin_pct)
```

#### Refund score
```text
refund_score =
  0.70 * inverse_normalize(variant.refund_rate_pct, sibling.min_refund_rate, sibling.max_refund_rate)
+ 0.30 * inverse_normalize(variant.refund_amount_per_unit, sibling.min_refund_per_unit, sibling.max_refund_per_unit)
```

#### Inventory score
```text
if variant.sales_velocity_30d <= 0:
  inventory_score = 0.4
else:
  days_left = variant.current_stock / max(variant.sales_velocity_30d / 30, epsilon)

  inventory_score =
    0.60 * stock_sufficiency_score(days_left)
  + 0.40 * normalize(variant.current_stock, sibling.min_stock, sibling.max_stock)
```

Stock sufficiency helper:
```text
stock_sufficiency_score(days_left):
  if days_left < 7:  return 0.2
  if days_left < 14: return 0.5
  if days_left <= 45: return 0.9
  if days_left <= 90: return 0.7
  return 0.4
```

#### Overall opportunity score
```text
if profit_score is null:
  overall_opportunity_score =
    0.50 * performance_score
  + 0.25 * refund_score
  + 0.25 * inventory_score
else:
  overall_opportunity_score =
    0.35 * performance_score
  + 0.35 * profit_score
  + 0.15 * refund_score
  + 0.15 * inventory_score
```

#### Risk score
```text
risk_score =
  0.40 * (1 - (profit_score ?? 0.5))
+ 0.35 * (1 - refund_score)
+ 0.25 * inventory_risk_component
```

#### Confidence score
```text
base_confidence =
  0.40 * sample_size_score
+ 0.30 * data_coverage_score
+ 0.30 * trend_consistency_score

confidence_score = base_confidence

# Apply caps
if variant.has_cost_data == false:
  confidence_score = min(confidence_score, 0.55)
if variant.is_single_variant_product == true:
  confidence_score = min(confidence_score, 0.60)
```

Sample-size score:
```text
sample_size_score:
  if orders_count >= 50: return 1.0
  if orders_count >= 20: return 0.75
  if orders_count >= 10: return 0.5
  return 0.25
```

Data coverage score:
```text
data_coverage_score:
  score = 1.0
  if not has_cost_data:      score -= 0.35
  if refund_data_available == false: score -= 0.20
  if inventory_tracked == false:    score -= 0.15
  return max(score, 0.0)
```

Trend consistency score:
```text
trend_consistency_score(variant, window_days):
  # Measures how consistent the trend direction is across sub-windows
  # Requires variant_daily_metrics to have at least 28 days of data
  if available_days < 28:
    return 0.5  # insufficient history — neutral

  # Split available history into 4 rolling 7-day buckets
  buckets = [units_sold for each of 4 consecutive 7-day windows, oldest first]

  # Count how many consecutive windows moved in the same direction
  direction_changes = 0
  for i in 1..3:
    if sign(buckets[i] - buckets[i-1]) != sign(buckets[i-1] - buckets[i-2]):
      direction_changes += 1

  if direction_changes == 0: return 1.0   # perfectly consistent trend
  if direction_changes == 1: return 0.70  # minor wobble
  if direction_changes == 2: return 0.40  # unstable
  return 0.20                              # volatile — low confidence
```

#### Action selection
```text
if confidence_score < settings.confidence_min_threshold:
  action = "needs_more_data"
else if is_single_variant_product:
  # Reduced action set for single-variant products
  if inventory_score < 0.4 and sales_velocity_30d > 0:
    action = "restock_soon"
  else if refund_score < 0.35:
    action = "investigate_refunds"
  else if performance_score >= 0.7 and (profit_score == null or profit_score < 0.45):
    action = "review_pricing"
  else:
    action = "no_action"
else:
  # Multi-variant products — full action set
  if overall_opportunity_score >= 0.75 and refund_score >= 0.6 and inventory_score >= 0.5:
    action = "push"
  else if overall_opportunity_score >= 0.7 and inventory_score < 0.4:
    action = "restock_soon"
  else if (profit_score != null and profit_score < 0.35) and refund_score < 0.45:
    action = "deprioritize"
  else if profit_score == null and refund_score < 0.45 and performance_score < 0.4:
    action = "deprioritize"  # can deprioritize on performance + refund even without cost data
  else if refund_score < 0.35:
    action = "investigate_refunds"
  else if performance_score >= 0.7 and (profit_score == null or profit_score < 0.45):
    action = "review_pricing"
  else:
    action = "no_action"
```

#### Explanation generation
```text
reasons = []
if performance_score >= 0.75: reasons.push("high_performance")
if profit_score != null and profit_score >= 0.75: reasons.push("healthy_margin")
if profit_score == null: reasons.push("margin_data_unavailable")
if refund_score >= 0.75: reasons.push("low_refund_risk")
if inventory_score >= 0.65: reasons.push("healthy_stock")
if profit_score != null and profit_score < 0.4: reasons.push("weak_margin")
if refund_score < 0.4: reasons.push("high_refund_risk")
if inventory_score < 0.4: reasons.push("stock_risk")
if is_single_variant_product: reasons.push("no_sibling_comparison")
```

---

### 22.7 Frontend folder structure

```text
app/
  routes/
    _index.tsx
    overview.tsx
    recommendations.tsx
    products.tsx
    products.$id.tsx
    variants.tsx
    variants.$id.tsx
    settings.tsx
    setup-health.tsx
    onboarding.tsx
    api.overview.ts
    api.recommendations.ts
    api.products.ts
    api.products.$id.ts
    api.variants.ts
    api.variants.$id.ts
    api.settings.ts
    # inventory.tsx and refunds.tsx are NOT created in Phase 1

  components/
    layout/
      AppPage.tsx
      AppAside.tsx
      PageFilters.tsx
    overview/
      SummaryCards.tsx
      HighlightedRecommendations.tsx
      OpportunityProductsTable.tsx
      SetupHealthCard.tsx
    recommendations/
      RecommendationTable.tsx
      RecommendationDetailPanel.tsx
      RecommendationReasonChips.tsx
    products/
      ProductsTable.tsx
      ProductHeader.tsx
      ProductVariantMatrix.tsx
      ProductInsights.tsx
    variants/
      VariantsTable.tsx
      VariantHeader.tsx
      VariantScoreBreakdown.tsx
      VariantActionPanel.tsx
    settings/
      ThresholdSettingsForm.tsx
      CostSettingsForm.tsx
      RecommendationRulesForm.tsx
    shared/
      BannerMessage.tsx
      EmptyState.tsx
      LoadingBlock.tsx
      MetricTooltip.tsx
      StatusBadge.tsx
      DataTable.tsx
      NoCostDataBadge.tsx
      SingleVariantBadge.tsx

  lib/
    shopify/
      auth.server.ts
      client.server.ts
      scopes.ts
      webhook.server.ts
      bulk.server.ts
      queries/
        productsBulk.ts
        ordersBulk.ts
        refundsBulk.ts      # separate from ordersBulk
        transactionsBulk.ts
        inventoryBulk.ts
    db/
      schema.ts
      migrations/
      repositories/
        shops.repo.ts
        products.repo.ts
        variants.repo.ts
        orders.repo.ts
        recommendations.repo.ts
    scoring/
      variantScoring.ts
      trendScore.ts         # trend_score and trend_consistency_score helpers
      confidence.ts
      explanations.ts
      recommendationRules.ts
      singleVariantPolicy.ts
      missingCostPolicy.ts
    metrics/
      aggregates.ts
      profitability.ts
      refunds.ts
      inventory.ts
      dailyMetrics.ts       # variant_daily_metrics population job
    services/
      onboarding.service.ts
      sync.service.ts
      setupHealth.service.ts
      overview.service.ts
      recommendations.service.ts  # reads variant_scores, writes recommendations
      products.service.ts
      variants.service.ts
    utils/
      currency.ts
      dateRange.ts
      pagination.ts
      filters.ts
      validation.ts

  jobs/
    fullSync.job.ts
    incrementalSync.job.ts
    recomputeVariantScores.job.ts
    recomputeDailyMetrics.job.ts   # must run before recomputeVariantScores

  styles/
    app.css
```

---

### 22.8 Task breakdown by milestone

#### Milestone 1: App shell and auth
Tasks:
- scaffold embedded Shopify app
- configure App Bridge
- register scopes including `read_all_orders` as mandatory
- install auth flow with scope presence check
- store `has_all_orders_scope` flag on shop record after install
- create base page shell with `s-page`
- create Phase 1 nav only (Overview, Recommendations, Products, Variants, Settings)
- implement setup-health placeholder page

Exit criteria:
- app installs successfully with read_all_orders scope
- scope presence stored on shop record
- merchant lands inside embedded app shell
- routes render with Polaris web components

#### Milestone 2: Database and sync foundation
Tasks:
- create DB schema and migrations
- create shop/session persistence
- implement sync_jobs table and job runner with sequential queue enforcement
- build separate bulk operation submitters for each entity type (Jobs 1–5)
- build JSONL ingestion pipeline with `__parentId` parsing for refunds
- normalize products, variants, inventory, orders, refunds (with refund line items), transactions
- build webhook receiver with HMAC verification

Exit criteria:
- store data backfills into DB including refund line items
- incremental webhook updates work
- sync job states visible in UI
- transactions stored but not used in scoring

#### Milestone 3: Metrics engine
Tasks:
- implement `variant_daily_metrics` population job (backfill + daily schedule)
- populate `units_sold_last_14d` and `units_sold_prior_14d` rolling fields
- compute sibling comparison rollups
- implement gross profitability calculations (COGS only; no fees or shipping)
- implement refund-adjusted metrics
- implement stock-health calculations
- create setup health service

Exit criteria:
- `variant_daily_metrics` is fully populated before scoring engine is built
- gross profit metrics can be queried per product and variant
- cost coverage gaps are surfaced clearly
- 14-day rolling fields verified against known order data

#### Milestone 4: Scoring and recommendations v1
Tasks:
- implement trend_score helper
- implement trend_consistency_score helper
- implement performance/profit/refund/inventory scores
- implement missing-cost null handling and score reweighting
- implement single-variant product policy (store-wide normalization + reduced action set)
- implement confidence scoring with caps
- implement action-selection rules
- generate explanations and reason chips
- implement recommendations service (variant_scores → recommendations write flow)
- persist recommendation snapshots with lifecycle state

Exit criteria:
- each eligible variant receives score output
- single-variant products receive capped confidence and reduced action set
- cost-missing variants receive null profit score and reweighted overall score
- recommendations can be queried by action and confidence
- variant_scores and recommendations tables have clean separation of concerns

#### Milestone 5: Core UI pages
Tasks:
- build Overview page
- build Recommendations page
- build Products page
- build Product detail page
- build Variants page
- build Variant detail page
- add filters, sorting, pagination
- add loading, empty, and error states
- add NoCostDataBadge and SingleVariantBadge shared components
- display "Gross profit (excl. fees & shipping)" label wherever margin appears

Exit criteria:
- merchant can move from summary to action without confusion
- cost-missing variants are clearly labeled
- single-variant products are distinguished in the table
- pages are fast using precomputed data

#### Milestone 6: Settings and merchant controls
Tasks:
- build cost settings form
- build threshold settings form
- show scoring weights as read-only (not editable until Phase 5)
- add save, reset, validation, and unsaved state handling
- add scope upgrade prompt in settings if `read_all_orders` not granted

Exit criteria:
- merchant can adjust thresholds and see updated recommendations after recompute
- scoring weights display as informational only
- scope upgrade path is clear

#### Milestone 7: Refund intelligence (Phase 2)
Tasks:
- add Refunds nav item and page
- add refund investigation recommendation logic
- improve refund-adjusted margin calculations
- add refund risk filters
- activate transaction data for financial validation

Exit criteria:
- merchant can identify refund-driven bad variants
- Refunds nav item is only visible now that backend is ready

#### Milestone 8: Inventory optimization (Phase 3)
Tasks:
- add Inventory nav item and page
- add stockout risk and overstock logic
- add restock recommendations
- agree and implement dead-stock detection definition

Exit criteria:
- merchant can see stock-aware action recommendations
- Inventory nav item is only visible now that backend is ready

#### Milestone 9: Hardening and launch prep
Tasks:
- seed test stores
- verify calculations against known orders and refunds
- verify refund line item ingestion via JSONL __parentId parsing
- verify sync range gating against read_all_orders scope
- optimize slow queries
- add audit logging for sync/recompute jobs
- improve UX copy and help text
- handle uninstall and compliance webhooks

Exit criteria:
- stable beta-ready build
- trustworthy score explanations
- no critical sync or rendering failures
- refund line items correctly attributed to variants
- scope gating verified end-to-end

---

## 23. Final recommendation

Launch this as a **decision product**, not as an analytics product.

The app should behave like a sharp merchandising advisor inside Shopify Admin.
Not like another reporting dashboard.
