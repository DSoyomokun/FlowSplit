# FlowSplit — Technical Design Doc (FastAPI) (MVP)

This document describes the **system architecture**, **data model**, **API surface**, and **worker/job flows** for the FlowSplit MVP described in `flowsplit_prd.md`.

---

## 0) Summary

**Goal:** When a posted deposit is detected, compute a **split plan** from user-defined buckets, request user confirmation, then execute bucket actions:
- **Internal transfers** (automated) where supported
- **External-link actions** (manual completion) with **amount-prefilled URL templates** (e.g., Pushpay)

**Core guarantees:**
- **Idempotent processing**: a deposit is handled once
- **Auditability**: immutable split plan snapshots per deposit
- **Safety**: confirmation gates execution

---

## 1) System Architecture

### 1.1 Components

1. **API Service (FastAPI)**
   - Auth + user profile
   - Bucket CRUD
   - Deposit feed + split plan review
   - Confirm split plan + override amounts (per deposit)
   - History / ledger views

2. **Worker Service**
   - Ingests deposit events (polling or webhook)
   - Computes split plans
   - Sends notifications (SMS)
   - Executes confirmed actions (transfers, external links)
   - Retries + backoff, idempotency enforcement

3. **Database (Postgres)**
   - Source of truth for deposits, buckets, split plans, actions
   - Idempotency constraints and unique indexes

4. **Queue / Scheduler (one of)**
   - MVP-simple: APScheduler + DB locks
   - Recommended: **Arq** (Redis) or **RQ** (Redis) or Celery
   - This doc assumes **Redis + Arq** for clarity (but the design works for others)

5. **SMS Provider**
   - Twilio (send alerts and optional quick approval links)

### 1.2 High-level flow

**Deposit ingestion → Split proposal**
1. Bank provider notifies (webhook) or worker polls
2. Worker upserts `deposits`
3. Worker creates `split_plans` (PROPOSED) + `split_actions` (PENDING)
4. Worker notifies user (SMS and/or in-app notifications)

**User confirmation → Execution**
1. User reviews split plan
2. User optionally overrides some action amounts
3. User confirms plan (status → CONFIRMED)
4. Worker picks up confirmed plan and executes actions
5. Plan becomes COMPLETED or FAILED (with per-action details)

---

## 2) Data Model (Postgres)

### 2.1 Conventions
- Use `uuid` primary keys
- Use `timestamptz` for all timestamps
- Store money as `numeric(18,2)` in **account currency** (MVP: USD only is fine, but schema supports currency)
- Keep immutable snapshots (don’t recompute past plans)

### 2.2 Tables

#### users
- `id` (uuid, PK)
- `email` (text, unique)
- `created_at` (timestamptz)

#### bank_accounts
- `id` (uuid, PK)
- `user_id` (uuid, FK users)
- `provider` (text)  — e.g., plaid
- `provider_account_id` (text)
- `name` (text)
- `mask` (text, nullable)
- `currency` (text, default 'USD')
- `is_active` (bool)
- `created_at`, `updated_at`

**Index:** `(user_id, is_active)`

#### deposits
- `id` (uuid, PK)
- `user_id` (uuid, FK users)
- `bank_account_id` (uuid, FK bank_accounts)
- `provider` (text)
- `provider_txn_id` (text)  — idempotency key from provider
- `amount` (numeric(18,2))   — positive for incoming
- `currency` (text)
- `posted_at` (timestamptz)
- `description` (text, nullable)
- `raw` (jsonb, nullable)    — store provider payload for debugging
- `created_at`

**Unique:** `(provider, provider_txn_id)`  
**Index:** `(user_id, posted_at desc)`

#### buckets
User-defined allocation rules.

- `id` (uuid, PK)
- `user_id` (uuid, FK users)
- `name` (text)
- `allocation_type` (text) — 'percentage' | 'fixed'
- `allocation_value` (numeric(18,6)) — pct like 0.10 OR fixed dollars (store in dollars; precision ok)
- `delivery_method` (text) — 'internal_transfer' | 'external_link' | 'manual_only'
- `delivery_metadata` (jsonb) — method-specific config
  - internal_transfer: `{ "destination_bank_account_id": "<uuid>" }`
  - external_link: `{ "url_template": "https://...{{amount}}..." }`
- `priority` (int) — higher runs earlier (or lower = earlier; pick one and document)
- `is_active` (bool)
- `created_at`, `updated_at`

**Index:** `(user_id, is_active, priority)`

#### split_plans
Snapshot per deposit.

- `id` (uuid, PK)
- `user_id` (uuid, FK users)
- `deposit_id` (uuid, FK deposits, unique)
- `status` (text) — 'proposed' | 'confirmed' | 'executing' | 'completed' | 'failed'
- `created_at`, `confirmed_at`, `executed_at`
- `confirmation_channel` (text, nullable) — 'app' | 'sms'
- `version` (int, default 1) — for future migrations

**Unique:** `(deposit_id)`  
**Index:** `(user_id, created_at desc)`

#### split_actions
One row per bucket per split plan.

- `id` (uuid, PK)
- `split_plan_id` (uuid, FK split_plans)
- `bucket_id` (uuid, FK buckets, nullable) — nullable if bucket deleted later
- `bucket_name_snapshot` (text) — store bucket name at time of plan
- `execution_type` (text) — 'transfer' | 'external_link' | 'manual_only'
- `amount` (numeric(18,2))
- `status` (text) — 'pending' | 'ready' | 'sent' | 'completed' | 'failed'
- `external_link` (text, nullable) — populated when generated
- `provider_transfer_id` (text, nullable) — if internal transfer
- `error_code` (text, nullable)
- `error_message` (text, nullable)
- `created_at`, `updated_at`

**Unique:** `(split_plan_id, bucket_id)` (use a partial unique if bucket_id nullable)  
**Index:** `(split_plan_id)`, `(status)`

#### audit_events (optional but recommended MVP)
- `id` (uuid, PK)
- `user_id` (uuid)
- `entity_type` (text) — 'deposit'|'split_plan'|'split_action'|'bucket'
- `entity_id` (uuid)
- `event_type` (text) — 'created'|'confirmed'|'executed'|'failed'|'updated'
- `data` (jsonb)
- `created_at`

---

## 3) Allocation Engine

### 3.1 Inputs
- Deposit amount `D`
- Active buckets sorted by `priority`
- Each bucket has:
  - allocation type + value
  - delivery method + metadata

### 3.2 Constraints (MVP)
- Sum of **percentage buckets** must be `<= 1.0` (100%)
- If fixed buckets + percent buckets exceed deposit, plan becomes **PROPOSED** but requires user override before confirmation OR blocks confirmation with validation error.

### 3.3 Rounding policy (MVP default)
User preference: **round up**, remainder stays in source account.

To avoid negative remainder:
1. Compute raw amounts for each bucket
2. Round **up** to cents for each bucket amount
3. If `sum(rounded) > D`, adjust by subtracting the overage from the **lowest-priority** bucket (or a designated “adjustment sink” bucket if product adds it later)
4. Ensure no bucket goes negative; if adjustment causes negative, fail validation and require user edit.

**Note:** For a clean MVP, you can enforce “percent-only buckets” initially, which makes step (4) rare.

### 3.4 Split plan snapshot
Store:
- bucket names snapshot
- computed amounts per action
- generated external links (if applicable) as part of action execution step

---

## 4) Worker Jobs & Execution

### 4.1 Job types

1. **ingest_deposits**
   - Poll provider for new posted deposits OR handle webhook payload
   - Upsert into `deposits` with unique(provider, provider_txn_id)

2. **create_split_plan(deposit_id)**
   - Check if split plan exists for deposit_id → no-op if yes
   - Load active buckets
   - Compute actions
   - Insert `split_plans` (PROPOSED) and `split_actions` (PENDING)
   - Notify user

3. **execute_confirmed_split_plan(split_plan_id)**
   - Transition plan to EXECUTING (compare-and-set)
   - For each action:
     - internal_transfer → call provider, store transfer id
     - external_link → generate link from template (amount formatted)
     - manual_only → mark as SENT (or stays READY) and await user completion
   - Mark actions and plan states accordingly

4. **retry_failed_actions**
   - Retry transient failures with backoff
   - Never duplicate transfers: use provider idempotency where possible + DB constraints

### 4.2 Concurrency / locking
Use DB row-level locking or compare-and-set updates:
- When executing a plan:
  - `UPDATE split_plans SET status='executing' WHERE id=:id AND status='confirmed'`
  - if affected rows = 0 → another worker already picked it up or not ready

### 4.3 Retry policy (MVP)
- Retry on network errors, provider 5xx, timeouts
- Do not retry on validation errors (bad destination account, insufficient funds)
- Max attempts: 5
- Backoff: exponential (e.g., 30s, 2m, 10m, 30m, 2h)

---

## 5) API Design (FastAPI)

### 5.1 Auth (MVP options)
- Simple JWT auth (email/password) OR magic link
- Keep it minimal for MVP, but ensure secure session handling

### 5.2 REST Endpoints (MVP)

#### Buckets
- `GET /v1/buckets`
- `POST /v1/buckets`
- `GET /v1/buckets/{bucket_id}`
- `PATCH /v1/buckets/{bucket_id}`
- `DELETE /v1/buckets/{bucket_id}` (soft delete by setting is_active=false)

**Bucket payload**
```json
{
  "name": "Tithe",
  "allocation_type": "percentage",
  "allocation_value": 0.10,
  "delivery_method": "external_link",
  "delivery_metadata": {
    "url_template": "https://pushpay.com/g/victorynorcross?a={{amount}}"
  },
  "priority": 10,
  "is_active": true
}
```

#### Deposits + Split Plans
- `GET /v1/deposits?limit=50&cursor=...`
- `GET /v1/split-plans?status=proposed|confirmed|...`
- `GET /v1/split-plans/{split_plan_id}`

#### Confirm split plan (with optional overrides)
- `POST /v1/split-plans/{split_plan_id}/confirm`

Payload supports per-action overrides:
```json
{
  "confirmation_channel": "app",
  "overrides": [
    { "split_action_id": "uuid", "amount": 173.46 }
  ]
}
```

Server behavior:
- Validate totals (no over-allocation)
- Transition plan status proposed → confirmed
- Mark actions pending → ready
- Enqueue execution job

#### Mark manual/external action complete
- `POST /v1/split-actions/{split_action_id}/complete`
```json
{ "notes": "Completed via Pushpay" }
```

#### Optional SMS quick approval (safe pattern)
Instead of replying with sensitive info, use a signed approval link:
- `GET /v1/approve/{token}` → confirms plan (token maps to plan_id)
- Token is short-lived, HMAC-signed, and single-use

---

## 6) Notifications (SMS)

### 6.1 Message templates

**Deposit detected**
> Deposit posted: $1,734.56  
> Proposed split ready. Review/confirm: {app_link}

**After confirmation**
> Split confirmed. Savings transfer queued. Tithe link: {external_link}

### 6.2 Safe approval approach
Avoid “reply YES” parsing for MVP if you want simplicity:
- SMS contains a **secure link** to approve
- Approval happens on the backend with token validation

---

## 7) Security & Privacy

### 7.1 Secrets
- Store provider API keys in a secrets manager (or env vars for early MVP)
- Encrypt any long-lived tokens at rest (KMS if available)

### 7.2 Do not collect 2FA codes
External sites that use 2FA must remain manual completion.

### 7.3 PII
- Keep provider raw payload minimal and redact where possible
- Log carefully (no tokens, no full bank account numbers)

---

## 8) Observability

### 8.1 Logs
- Structured JSON logs with correlation id:
  - `deposit_id`, `split_plan_id`, `split_action_id`

### 8.2 Metrics (MVP essentials)
- deposits_ingested_total
- split_plans_created_total
- split_plans_confirmed_total
- actions_executed_total by type
- action_failures_total by provider error category
- execution_latency_seconds (deposit posted → plan created → confirmed → executed)

---

## 9) Deployment (MVP)

### 9.1 Suggested stack
- API: FastAPI on Render/Fly.io
- Worker: same platform, separate process
- Postgres: managed Postgres (Render/Fly/Neon)
- Redis: managed Redis (Upstash or provider-managed)
- Twilio for SMS

### 9.2 Process model
- `web`: uvicorn FastAPI
- `worker`: arq worker
- `scheduler` (optional): periodic deposit poller

---

## 10) Acceptance Criteria (Engineering)

1. **Idempotency**
   - Given duplicate provider transaction events, only one deposit row exists and only one split plan exists.

2. **Safety gate**
   - No action is executed until the split plan is confirmed.

3. **Rounding & totals**
   - Total action amounts must never exceed the deposit amount after rounding adjustments.

4. **External link correctness**
   - Amount is formatted to two decimals and substituted into `url_template`.

5. **Audit trail**
   - Every state transition is recorded (split_plan status, split_action status), with timestamps.

---

## 11) Test Plan (MVP)

### Unit tests
- allocation calculation (percent-only)
- allocation with rounding + adjustment sink
- validation failures when over-allocated

### Integration tests
- deposit ingestion upsert with unique constraints
- create split plan idempotency
- confirm plan transitions + enqueue execution
- execute internal transfer stubbed provider success/fail
- external link generation formatting

### End-to-end (staging)
- deposit arrives → plan proposed → confirm → transfers + external link delivered

---

## 12) Appendix — Pydantic Models (Sketch)

**BucketCreate**
- name: str
- allocation_type: Literal['percentage','fixed']
- allocation_value: Decimal
- delivery_method: Literal['internal_transfer','external_link','manual_only']
- delivery_metadata: dict
- priority: int
- is_active: bool = True

**SplitPlanConfirm**
- confirmation_channel: Literal['app','sms']
- overrides: List[{split_action_id: UUID, amount: Decimal}] = []

---

**Status:** Technical design ready for implementation.
