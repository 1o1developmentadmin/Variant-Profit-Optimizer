# EPIC-01: App Shell, Auth & Onboarding

**Phase:** 1  
**Milestone:** 1 — App Shell and Auth  
**Total Story Points:** 34  
**Phase Gate:** App installs, auth works with `read_all_orders`, merchant lands inside embedded shell with Phase 1 nav.

---

## Epic Goal
Scaffold the Shopify embedded app, configure App Bridge, implement OAuth with mandatory `read_all_orders` scope, build the Phase 1 navigation shell, and deliver the onboarding flow that gates sync range on scope presence.

## Phase 1 Completion Criteria for this Epic
- App installs successfully with `read_all_orders` scope
- `has_all_orders_scope` stored on shop record
- Merchant lands in embedded app shell after OAuth
- Phase 1 nav (Overview, Recommendations, Products, Variants, Settings) renders
- Onboarding steps 1–6 functional (welcome → sync progress)
- Scope-gated sync range selection working
- Empty states shown when no data yet

---

## Tickets

---

### TICKET-01-01: Scaffold Shopify Embedded App (Remix)
**Story Points:** 5  
**Type:** Setup  
**Priority:** P0 — Blocker

**Description:**  
Initialize the Shopify embedded app using `@shopify/shopify-app-remix`. Set up the project structure following the folder layout from section 22.7 of the PRD.

**Acceptance Criteria:**
- [ ] `npx create-@shopify/app@latest` scaffolded with Remix
- [ ] Project structure matches PRD section 22.7 folder layout
- [ ] `shopify.app.toml` configured with app name `variant-profit-optimizer`
- [ ] Dev server starts with `npm run dev`
- [ ] App loads in Shopify Partners dev store iframe (partner dashboard preview)
- [ ] `app.css` created in `styles/` with base reset

**Technical Notes:**
- Use `@shopify/shopify-app-remix` not the legacy Express adapter
- Typescript from day 1
- Set up Prisma for DB (will be expanded in EPIC-02)

---

### TICKET-01-02: Configure App Bridge & Scopes
**Story Points:** 3  
**Type:** Feature  
**Priority:** P0 — Blocker

**Description:**  
Register mandatory OAuth scopes including `read_all_orders`. Store whether `read_all_orders` was granted on the shop record after install.

**Acceptance Criteria:**
- [ ] `shopify.app.toml` scopes include: `read_products`, `read_inventory`, `read_orders`, `read_all_orders`
- [ ] Compliance webhook handlers registered: `customers/data_request`, `customers/redact`, `shop/redact`
- [ ] After OAuth, `has_all_orders_scope` boolean stored on `shops` table
- [ ] App Bridge initialized in root layout
- [ ] `useAppBridge()` accessible from all route components
- [ ] If merchant denies `read_all_orders`, app still installs but scope flag is `false`

**Technical Notes:**
- See PRD sections 10.2 and 22.3 for scope requirements
- Use `shopify.authenticate.admin()` in loaders
- Store scope on the `shops` table (created in EPIC-02, add column now as placeholder)

---

### TICKET-01-03: App Shell Layout & Phase 1 Navigation
**Story Points:** 5  
**Type:** Frontend  
**Priority:** P0 — Blocker

**Description:**  
Build the persistent app shell using Polaris web components. Implement Phase 1 navigation only: Overview, Recommendations, Products, Variants, Settings.

**Acceptance Criteria:**
- [ ] `AppPage.tsx` wrapper component using `s-page` as root
- [ ] `AppAside.tsx` nav component with Phase 1 items only: Overview, Recommendations, Products, Variants, Settings
- [ ] No Refunds or Inventory nav items rendered (even as disabled)
- [ ] Active nav item highlighted on each route
- [ ] Page title set via App Bridge `TitleBar` per route
- [ ] App shell loads immediately; inner content loads async
- [ ] Responsive layout works in Shopify admin iframe widths
- [ ] No horizontal overflow at standard admin widths (1024px–1280px)

**Polaris Components Used:**
- `s-page`, `s-section`, `s-heading`, `s-text`, `s-stack`
- App Bridge `NavMenu` or equivalent embedded nav

**Technical Notes:**
- Phase 2 Refunds nav and Phase 3 Inventory nav will be added in their respective epics
- See PRD sections 7.1 and 7.2

---

### TICKET-01-04: Onboarding Flow — Step 1 & 2 (Welcome + Scope Gate)
**Story Points:** 5  
**Type:** Frontend + Backend  
**Priority:** P0

**Description:**  
Build the onboarding Welcome screen and the Scope & Sync Range selection step. Gate sync range options on `read_all_orders` presence.

**Acceptance Criteria:**
- [ ] Route: `/onboarding` renders a stepper or card-based flow
- [ ] Step 1: Welcome — one-sentence product pitch, CTA to continue
- [ ] Step 2: Sync range selector
  - If `has_all_orders_scope = true`: show all options (60d, 90d, 180d, 365d), default 180d selected
  - If `has_all_orders_scope = false`: only 60d is selectable; longer options are disabled and grayed out
  - Inline explanation copy: *"To sync more than 60 days, re-authorize with extended history access"*
  - Re-authorization CTA button shown inline when scope is missing
- [ ] Merchant-selected sync range is stored in `merchant_settings`
- [ ] Onboarding state tracked so completed merchants redirect to Overview

**Polaris Components Used:**
- `s-banner` for scope warning
- `s-button` for CTA
- `s-badge` for disabled state indicators
- Radio group or select for sync range

**Technical Notes:**
- PRD section 14 defines all onboarding steps
- `read_all_orders` check reads from `shops.has_all_orders_scope`

---

### TICKET-01-05: Onboarding Flow — Step 3 & 4 (Cost Setup + Thresholds)
**Story Points:** 5  
**Type:** Frontend + Backend  
**Priority:** P1

**Description:**  
Build onboarding Step 3 (Cost Setup) and Step 4 (Threshold Setup). These steps help the merchant understand data quality and set default decision thresholds.

**Acceptance Criteria:**
- [ ] Step 3: Cost setup
  - Show cost coverage percentage inline: *"Cost data found for X% of your variants"*
  - Coverage < 50% shows warning banner: *"Profit scores will be unavailable for many variants..."*
  - Option to use Shopify inventory cost (default) or enter manual overrides
  - Manual override link navigates to Settings > Cost Settings after onboarding
- [ ] Step 4: Threshold setup (merchant can accept defaults or customize)
  - Low margin threshold (default: 15%)
  - Refund risk threshold (default: 8%)
  - Stockout threshold (default: 10 days)
  - Scoring weight controls NOT shown (deferred to Phase 5)
- [ ] Defaults are pre-filled
- [ ] Values saved to `merchant_settings` on "Continue"

**Polaris Components Used:**
- `s-banner` for cost coverage warning
- Number inputs for thresholds
- Progress indicator (step 3 of 6)

---

### TICKET-01-06: Onboarding Flow — Step 5 & 6 (Sync Progress + First Recommendations)
**Story Points:** 5  
**Type:** Frontend + Backend  
**Priority:** P1

**Description:**  
Build the sync progress screen (Step 5) and the first-recommendations reveal (Step 6). Show progress as sync jobs run in the background.

**Acceptance Criteria:**
- [ ] Step 5: Sync Progress page
  - Shows current sync stage: products, orders, inventory, refunds, transactions
  - Job progress percentage or stage label
  - Lists pages that become available as data arrives
  - Auto-refreshes poll every 3–5s using client-side fetch
- [ ] Step 6: First Recommendations
  - Once enough data exists, auto-redirect to Overview or show first decision summary here
  - If data is still syncing, show "Calculating your first insights..." placeholder
- [ ] Onboarding complete flag stored on shop record after Step 6
- [ ] Returning merchants bypass onboarding and go directly to Overview

**Polaris Components Used:**
- `s-banner` for progress/status
- Spinner or progress bar pattern
- `s-text` for stage labels

**Technical Notes:**
- Sync jobs are triggered from EPIC-02; this ticket only needs to poll their status
- PRD section 14, steps 5–6

---

### TICKET-01-07: Global Empty State, Error & Loading Patterns
**Story Points:** 3  
**Type:** Frontend  
**Priority:** P1

**Description:**  
Build shared components for loading, empty, and error states that all pages will use.

**Acceptance Criteria:**
- [ ] `EmptyState.tsx` — educational empty state: explains what data is needed, provides onboarding CTA
- [ ] `LoadingBlock.tsx` — spinner or skeleton placeholder for KPI cards and tables
- [ ] `BannerMessage.tsx` — wraps `s-banner` for recoverable errors, sync warnings, scope prompts
- [ ] Global error behavior: inline banner for recoverable errors, retry CTA for data fetch failures
- [ ] No broken charts or empty tables with no context — always show a reason and a CTA
- [ ] All shared components exported from `components/shared/`

**Polaris Components Used:**
- `s-banner`, `s-spinner` (or equivalent), `s-button` for retry CTA

**Technical Notes:**
- PRD section 7.2 for global behavior rules
- These components are consumed by EPIC-05 tickets

---

### TICKET-01-08: Setup Health Page (Shell)
**Story Points:** 3  
**Type:** Frontend  
**Priority:** P1

**Description:**  
Build the `/setup-health` route that surfaces data quality and sync state for the merchant.

**Acceptance Criteria:**
- [ ] Route: `/setup-health` accessible from nav or banner CTA
- [ ] Shows: cost coverage %, last full sync timestamp, scope status, inventory coverage %, refund data availability
- [ ] Uses `GET /api/setup-health` response shape (PRD section 22.2)
- [ ] `SetupHealthCard.tsx` component in `components/overview/`
- [ ] Warnings displayed as `s-banner` with yellow/critical tone
- [ ] If sync is in progress, shows banner: *"Sync in progress — [stage]. Some data may be incomplete."*
- [ ] Retry sync CTA if last sync failed

**API:**
- `GET /api/setup-health` (stub response acceptable for this ticket; wired in EPIC-02)

---

## Dependencies
- TICKET-01-01 must complete before all others (scaffold)
- TICKET-01-02 must complete before TICKET-01-03 and TICKET-01-04 (auth needed for onboarding)
- EPIC-02 (sync jobs) provides real data for TICKET-01-06 and TICKET-01-08
