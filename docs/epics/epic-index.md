# Variant Profit Optimizer — Epic Index

## Product Overview
Shopify embedded app that recommends which variants to push, deprioritize, restock, or investigate based on conversion performance, profit margin, refund risk, and inventory health.

**Frontend:** Polaris web components + App Bridge + Remix/React  
**Backend:** Shopify GraphQL Admin API, bulk operations, webhook-driven incremental sync  
**Scoring:** Weighted 4-factor model (performance 35%, profit 35%, refund 15%, inventory 15%)

---

## Phase Map

| Phase | Goal | Epics |
|-------|------|-------|
| **Phase 1** | Core Variant Decision Dashboard | EPIC-01 → EPIC-06 |
| **Phase 2** | Profitability & Refund Intelligence | EPIC-07 |
| **Phase 3** | Inventory-Aware Optimization | EPIC-08 |
| **Phase 4** | Merchandising Actions & Integrations | EPIC-09 |
| **Phase 5** | Advanced Intelligence | EPIC-10 |

---

## Phase 1: Core Variant Decision Dashboard

> **Phase completion gate:** At the end of Phase 1, a merchant can install the app, sync their store, see variant scores, and receive actionable recommendations — all end to end.

| Epic | Title | Story Points | File |
|------|-------|-------------|------|
| EPIC-01 | App Shell, Auth & Onboarding | 34 SP | [phase-1/EPIC-01-app-shell-auth.md](./phase-1/EPIC-01-app-shell-auth.md) |
| EPIC-02 | Database & Sync Foundation | 55 SP | [phase-1/EPIC-02-database-sync.md](./phase-1/EPIC-02-database-sync.md) |
| EPIC-03 | Metrics Engine | 34 SP | [phase-1/EPIC-03-metrics-engine.md](./phase-1/EPIC-03-metrics-engine.md) |
| EPIC-04 | Scoring & Recommendations Engine | 42 SP | [phase-1/EPIC-04-scoring-recommendations.md](./phase-1/EPIC-04-scoring-recommendations.md) |
| EPIC-05 | Core UI Pages (Frontend-First) | 55 SP | [phase-1/EPIC-05-core-ui-pages.md](./phase-1/EPIC-05-core-ui-pages.md) |
| EPIC-06 | Settings & Merchant Controls | 21 SP | [phase-1/EPIC-06-settings-controls.md](./phase-1/EPIC-06-settings-controls.md) |
| EPIC-11 | Launch Hardening & QA | 21 SP | [phase-1/EPIC-11-launch-hardening.md](./phase-1/EPIC-11-launch-hardening.md) |

**Phase 1 Total: ~262 SP**

---

## Phase 2: Profitability & Refund Intelligence

| Epic | Title | Story Points | File |
|------|-------|-------------|------|
| EPIC-07 | Refund Intelligence | 34 SP | [phase-2/EPIC-07-refund-intelligence.md](./phase-2/EPIC-07-refund-intelligence.md) |

**Phase 2 Total: ~34 SP**

---

## Phase 3: Inventory-Aware Optimization

| Epic | Title | Story Points | File |
|------|-------|-------------|------|
| EPIC-08 | Inventory Optimization | 34 SP | [phase-3/EPIC-08-inventory-optimization.md](./phase-3/EPIC-08-inventory-optimization.md) |

**Phase 3 Total: ~34 SP**

---

## Phase 4: Merchandising Actions & Integrations

| Epic | Title | Story Points | File |
|------|-------|-------------|------|
| EPIC-09 | Merchandising Actions & Integrations | 21 SP | [phase-4/EPIC-09-merchandising-integrations.md](./phase-4/EPIC-09-merchandising-integrations.md) |

**Phase 4 Total: ~21 SP**

---

## Phase 5: Advanced Intelligence

| Epic | Title | Story Points | File |
|------|-------|-------------|------|
| EPIC-10 | Advanced Intelligence & Automation | 34 SP | [phase-5/EPIC-10-advanced-intelligence.md](./phase-5/EPIC-10-advanced-intelligence.md) |

**Phase 5 Total: ~34 SP**

---

## Story Point Scale

| Points | Meaning |
|--------|---------|
| 1 | Trivial — config change or copy update |
| 2 | Very small — one file edit, known pattern |
| 3 | Small — straightforward feature |
| 5 | Medium — cross-file work, light logic |
| 8 | Large — multiple files, non-trivial logic |
| 13 | Very large — consider splitting |
| 21 | Epic-level — must be split into tickets |

---

## Key Implementation Rules (all phases)

1. **Frontend-first per phase** — build all Polaris UI for each phase before wiring backend
2. **Phase gate** — each phase must be fully functional end-to-end before the next starts
3. **No Refunds or Inventory nav items in Phase 1**
4. **Profit labeled as** `"Gross profit (excl. fees & shipping)"` throughout Phase 1+
5. **Scoring weights are NOT merchant-editable until Phase 5**
6. **`read_all_orders`** scope is mandatory — gate sync ranges on its presence
7. **Bundle pairing** deferred to Phase 4 — must not appear anywhere in Phase 1–3 UI
