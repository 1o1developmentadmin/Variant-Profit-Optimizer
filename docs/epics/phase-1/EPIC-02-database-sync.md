# EPIC-02: Database & Sync Foundation

**Phase:** 1  
**Milestone:** 2 — Database and Sync Foundation  
**Total Story Points:** 55  
**Phase Gate:** Store data backfills into DB including refund line items; incremental webhook updates work; transactions stored but not used in scoring.

---

## Epic Goal
Design and migrate the full relational schema, implement a sequentially-queued bulk sync pipeline (5 separate bulk operation jobs), build the JSONL ingestion parser with `__parentId` handling, and create webhook receivers for incremental updates.

## Phase 1 Completion Criteria for this Epic
- All 15 core tables created and migrated
- Sequential job queue enforced (only one bulk op per shop at a time)
- 5 separate bulk jobs (products, orders, refunds, inventory, transactions) complete successfully
- Refund line items correctly attributed to variants via `__parentId` parsing
- HMAC-verified webhook processing pipeline in place
- Sync progress visible in the Setup Health page
- Transactions stored but not activated in scoring

---

## Tickets

---

### TICKET-02-01: Database Schema & Migrations (All Core Tables)
**Story Points:** 8  
**Type:** Backend  
**Priority:** P0 — Blocker

**Description:**  
Create the full Prisma schema and initial migration for all 15 core tables defined in PRD section 22.1.

**Acceptance Criteria:**
- [ ] Prisma schema file (`lib/db/schema.ts` or `prisma/schema.prisma`) contains all 15 tables:
  - `shops`, `sync_jobs`, `products`, `variants`, `inventory_items`, `inventory_levels`
  - `orders`, `order_line_items`, `refunds`, `refund_line_items`, `transactions`
  - `variant_daily_metrics`, `variant_scores`, `recommendations`, `merchant_settings`
- [ ] All indexes defined per PRD section 22.1
- [ ] `shops.has_all_orders_scope` boolean column present
- [ ] `inventory_items.has_cost_data` boolean column present
- [ ] `variant_scores.profit_score` is nullable (not 0 when cost absent)
- [ ] `recommendations.status` enum: `active`, `resolved`, `dismissed`
- [ ] `variant_daily_metrics.units_sold_last_14d` and `units_sold_prior_14d` rolling fields present
- [ ] Migration runs cleanly with `npx prisma migrate dev`
- [ ] Seeder script creates a test shop record

**Technical Notes:**
- See PRD section 22.1 for complete field list
- Use Postgres (not SQLite) for production readiness
- `merchant_settings.scoring_weights_json` stored for forward compatibility but not surfaced in UI

---

### TICKET-02-02: Shop & Session Persistence Layer
**Story Points:** 3  
**Type:** Backend  
**Priority:** P0

**Description:**  
Implement the shop session and identity persistence using the Shopify App Remix adapter. Create the `shops.repo.ts` repository for CRUD operations on the `shops` table.

**Acceptance Criteria:**
- [ ] Shop record created or updated on every auth/install event
- [ ] `access_token_encrypted` stored securely (not plaintext)
- [ ] `has_all_orders_scope` updated after OAuth based on granted scopes
- [ ] `shops.repo.ts` exposes: `findByDomain`, `upsertByDomain`, `updateSyncStatus`
- [ ] Session storage uses Prisma session adapter (not in-memory)
- [ ] `app/uninstalled` webhook marks `uninstalled_at` on shop record

---

### TICKET-02-03: Sync Job Queue & Sequential Enforcement
**Story Points:** 5  
**Type:** Backend  
**Priority:** P0

**Description:**  
Build the sync job runner that enforces sequential bulk operation execution (only one bulk op per shop at a time). Implement the `sync_jobs` table integration.

**Acceptance Criteria:**
- [ ] `sync.service.ts` maintains job queue per shop
- [ ] New bulk job is NOT started if another job for the same shop has `status = running`
- [ ] Job transitions: `pending` → `running` → `completed` / `failed`
- [ ] `sync_jobs` table updated with `started_at`, `finished_at`, `records_processed`, `error_message`
- [ ] If a job fails, subsequent queued jobs are paused (not auto-cancelled)
- [ ] Scheduler triggers full sync on install and daily incremental sync
- [ ] Jobs 1–5 run sequentially in order: products → orders → refunds → inventory → transactions
- [ ] `bulk_operation_id` stored per job for Shopify polling

**Technical Notes:**
- PRD section 22.5 notes: "Only one bulk operation can run at a time per shop"
- Use `remix-utils` or a custom async queue; no external queue infrastructure required for Phase 1

---

### TICKET-02-04: Bulk Job 1 — Products & Variants Ingestion
**Story Points:** 5  
**Type:** Backend  
**Priority:** P0

**Description:**  
Implement the GraphQL bulk operation and JSONL ingestion pipeline for products and variants (including inventory item cost data).

**Acceptance Criteria:**
- [ ] `lib/shopify/queries/productsBulk.ts` contains the Job 1 mutation from PRD section 22.5
- [ ] Bulk operation submitted via `bulkOperationRunQuery` mutation
- [ ] Job polled until `status = COMPLETED`
- [ ] JSONL output downloaded from `resultUrl`
- [ ] Each JSONL line parsed: products and their child variants
- [ ] `inventoryItem.unitCost` ingested into `inventory_items.unit_cost_amount`
- [ ] `inventory_items.has_cost_data` set to `true` if `unit_cost_amount` is present and non-zero
- [ ] Products normalized into `products` table; variants into `variants` table
- [ ] Upsert logic: existing records updated, new records inserted
- [ ] `sync_jobs` record updated on completion with `records_processed`

**Technical Notes:**
- Variants are child nodes of products in the JSONL — use `__parentId` to link them
- See PRD section 22.5, Job 1

---

### TICKET-02-05: Bulk Job 2 — Orders & Line Items Ingestion
**Story Points:** 5  
**Type:** Backend  
**Priority:** P0

**Description:**  
Implement the bulk operation and JSONL pipeline for orders and order line items.

**Acceptance Criteria:**
- [ ] `lib/shopify/queries/ordersBulk.ts` contains the Job 2 mutation from PRD section 22.5
- [ ] Date range filter applied based on merchant's selected sync window and `has_all_orders_scope`
- [ ] If `has_all_orders_scope = false` and requested window > 60 days: cap at 60 days, log warning
- [ ] Orders normalized into `orders` table
- [ ] Line items normalized into `order_line_items` table with `variant_gid` attribution
- [ ] Test orders (`is_test = true`) excluded from aggregation but stored
- [ ] Cancelled orders stored with `cancelled_at_shopify` populated
- [ ] `sync_jobs` updated on completion

**Technical Notes:**
- Line items are child nodes of orders — use `__parentId`
- PRD section 10.2 for scope-gated sync range behavior

---

### TICKET-02-06: Bulk Job 3 — Refunds & Refund Line Items Ingestion (Separate Job)
**Story Points:** 8  
**Type:** Backend  
**Priority:** P0

**Description:**  
Implement the dedicated bulk operation for refunds and refund line items. This MUST be a separate job from orders. Use `__parentId` parsing to correctly attribute refund line items to their parent refunds and orders.

**Acceptance Criteria:**
- [ ] `lib/shopify/queries/refundsBulk.ts` contains the Job 3 mutation from PRD section 22.5
- [ ] Refunds normalized into `refunds` table with `order_id` FK
- [ ] Refund line items normalized into `refund_line_items` table with:
  - `refund_id` FK
  - `variant_gid` attributed from nested `lineItem.variant.id`
  - `order_line_item_gid` from nested `lineItem.id`
- [ ] `__parentId` used to associate each refund with its parent order and each refund line item with its parent refund
- [ ] Does NOT attempt to nest refunds inside the orders batch query (separate job only)
- [ ] Handles JSONL flattening correctly — no assumption of nested JSON structure
- [ ] Restock type stored in `refund_line_items.restock_type`
- [ ] `sync_jobs` updated on completion

**Technical Notes:**
- This is the highest-risk ingestion step — refund line item attribution is critical to scoring
- PRD section 22.5, Job 3: explicit warning about JSONL flattening

---

### TICKET-02-07: Bulk Job 4 — Inventory Levels Ingestion
**Story Points:** 5  
**Type:** Backend  
**Priority:** P0

**Description:**  
Implement the bulk operation for inventory items and inventory levels per location.

**Acceptance Criteria:**
- [ ] `lib/shopify/queries/inventoryBulk.ts` contains the Job 4 mutation from PRD section 22.5
- [ ] `inventory_items` upserted with cost data and tracking state
- [ ] `inventory_levels` upserted per `inventory_item_id + location_gid`
- [ ] Quantity types correctly mapped: `available`, `on_hand`, `committed`, `reserved`, `incoming`
- [ ] Location GID stored for future location-specific features
- [ ] `sync_jobs` updated on completion

---

### TICKET-02-08: Bulk Job 5 — Transactions Ingestion (Store Only)
**Story Points:** 3  
**Type:** Backend  
**Priority:** P1

**Description:**  
Implement the bulk operation for transactions. Transactions are ingested and stored but NOT used in Phase 1 scoring — they become active in Phase 2.

**Acceptance Criteria:**
- [ ] `lib/shopify/queries/transactionsBulk.ts` contains the Job 5 mutation from PRD section 22.5
- [ ] Transactions normalized into `transactions` table
- [ ] `transaction_gid`, `order_id`, `kind`, `status`, `gateway`, `amount`, `processed_at_shopify` all stored
- [ ] `parent_transaction_gid` stored for refund chain validation (Phase 2)
- [ ] Scoring engine does NOT read from `transactions` in Phase 1
- [ ] `sync_jobs` updated on completion

---

### TICKET-02-09: Webhook Receiver — Incremental Updates
**Story Points:** 8  
**Type:** Backend  
**Priority:** P0

**Description:**  
Build the webhook receiver that handles all operational webhooks for incremental data updates after the initial backfill.

**Acceptance Criteria:**
- [ ] Webhook endpoint at `/webhooks` (or per-topic routes)
- [ ] HMAC verification on every incoming webhook — reject non-verified requests with 401
- [ ] Async processing: acknowledge webhook immediately (200), enqueue processing job
- [ ] Handlers for:
  - `orders/create` → upsert order + line items
  - `orders/updated` → update existing order record
  - `refunds/create` → upsert refund + refund line items for affected variants
  - `products/update` → update product and variant records
  - `inventory_levels/update` → update inventory level record
  - `app/uninstalled` → mark shop `uninstalled_at`
- [ ] Compliance webhooks handled (return 200): `customers/data_request`, `customers/redact`, `shop/redact`
- [ ] After processing, recompute impacted variant scores and aggregates for affected variants only

---

### TICKET-02-10: Setup Health API Endpoint
**Story Points:** 3  
**Type:** Backend  
**Priority:** P1

**Description:**  
Implement `GET /api/setup-health` that the Setup Health page and onboarding Step 5 polls.

**Acceptance Criteria:**
- [ ] Returns shape per PRD section 22.2:
  ```json
  {
    "syncStatus": "complete|running|pending|failed",
    "lastFullSyncAt": "ISO8601 or null",
    "hasAllOrdersScope": true,
    "coverage": { "costCoveragePct": 82, "refundCoveragePct": 100, "inventoryCoveragePct": 96 },
    "warnings": [{ "code": "LOW_COST_COVERAGE", "message": "..." }]
  }
  ```
- [ ] `costCoveragePct` = `inventory_items` with `has_cost_data = true` / total variants × 100
- [ ] `LOW_COST_COVERAGE` warning emitted when < 50%
- [ ] `syncStatus` reflects the most recent `sync_jobs` record for the shop
- [ ] Response cached for 60s to avoid expensive recalculation on every poll

---

## Dependencies
- TICKET-02-01 must complete before all other tickets in this epic
- TICKET-02-03 (job queue) must complete before TICKET-02-04 through TICKET-02-08
- TICKET-02-06 is the most complex — schedule sufficient review time
- EPIC-03 (Metrics Engine) cannot start until TICKET-02-04 through TICKET-02-06 are complete
