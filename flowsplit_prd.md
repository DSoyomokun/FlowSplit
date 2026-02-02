# FlowSplit — Hybrid PRD (MVP + Engineering Spec)

**One-liner:** Detect new deposits, propose (and optionally execute) a split into user-defined “buckets,” and streamline manual payments (e.g., tithing) via prefilled external links.

**Primary user value:** *Money allocation happens automatically at deposit-time, with user confirmation to keep it safe and accurate.*

---

## 1) Problem

People intend to allocate money (tithe, save, invest, give, etc.) but deposits arrive and get spent before allocation happens. The friction is deciding amounts, doing transfers, and repeating the process every time—especially with inconsistent income.

---

## 2) Target Users

- Anyone who wants “set once, allocate forever” for incoming money.
- Users with **inconsistent income** (gig work, variable paychecks, gifts) who still want consistent allocation behavior.
- Users who want to **tithe one-time** (not recurring) but want the amount calculated and the giving flow streamlined.

---

## 3) Core Concepts

### 3.1 Deposit
A posted (settled) incoming transaction into a connected bank account.

### 3.2 Bucket
A user-defined allocation rule + delivery method.

**Buckets are generic** (no special-cased “tithe” variable in code). “Tithe” is just a bucket the user creates.

### 3.3 Split Plan (Snapshot)
A computed, immutable record of how a specific deposit should be allocated at that moment in time.

- Bucket percentage changes affect **future deposits**, not already-created split plans.
- Split plans are created once per deposit (idempotent).

### 3.4 Remainder
Any funds not allocated to buckets **remain in the source account**.  
There may be *no explicit remainder bucket* object—remainder is implicit.

---

## 4) Goals & Non-Goals

### Goals (MVP)
- Detect posted deposits and create a split proposal.
- Let users create/edit buckets and allocation rules.
- Require user confirmation before execution (initially).
- Execute internal transfers where supported.
- Support “external link” buckets (e.g., Pushpay) with **amount prefilled**.
- Prevent duplicate execution (idempotency) and keep a full audit trail.

### Non-Goals (MVP)
- Bypassing or automating 2FA for third-party sites.
- Automatic brokerage trades or crypto buys.
- ML-based classification (“is this a paycheck?”) beyond simple heuristics.
- Shared household accounts / multi-user budgeting.
- Complex recurring schedules (users can use external platforms for that).

---

## 5) User Stories (MVP)

### US1 — Create Buckets
As a user, I can create buckets (name + rule + delivery method) so my deposits can be allocated.

**Example buckets:**
- “Tithe” — 10% — delivery: external link (prefilled Pushpay URL template)
- “Savings” — 15% — delivery: internal transfer to savings account
- “Investing” — 10% — delivery: internal transfer (or manual-only if not supported)

### US2 — Deposit Detected → Proposal
As a user, when a deposit posts, I receive a proposed split plan and can confirm it.

### US3 — Confirm & Execute
As a user, I can confirm the proposal in-app (primary) or via SMS (secondary). Once confirmed:
- internal transfer buckets execute automatically
- external link buckets generate a prefilled link for me to complete manually

### US4 — View History
As a user, I can view a timeline of:
- deposits detected
- split plans created
- actions executed / pending
- errors / retries / manual completions

### US5 — Override / Edit Before Confirming
As a user, before confirming a split plan, I can override amounts (e.g., adjust tithe) for that one deposit.

---

## 6) Allocation Rules (How Much Each Bucket Gets)

### Supported allocation types (MVP)
1. **Percentage**: bucket_amount = deposit_amount × percentage
2. **Fixed amount** (optional but supported): bucket_amount = fixed_value
3. **Manual-only** bucket: amount is suggested or entered at confirmation time (optional)

### Constraints (recommended for MVP simplicity)
- Total percentage buckets must be **≤ 100%**.
- Fixed amount buckets are allowed, but if they cause over-allocation, the plan requires user correction at confirmation.
- Remainder stays in source account automatically.

---

## 7) Rounding Strategy (MVP Default)

**Default:** Round *up* allocations to 2 decimals for all non-remainder buckets; remainder absorbs the difference automatically.

Example:
- Deposit: $100.00
- Bucket A: 33.333% → $33.34 (rounded up)
- Bucket B: 33.333% → $33.34
- Bucket C: 33.333% → $33.34
- Total allocated: $100.02  
Remainder becomes: **-$0.02**, which is not allowed → system must prevent total allocations from exceeding deposit amount.

**Practical MVP rule to avoid negative remainder:**
- Compute raw amounts
- Round up bucket amounts
- If total_allocated > deposit_amount: subtract the excess from the *last bucket in priority order* (or from user-selected “discretionary” bucket) to keep total_allocated == deposit_amount.

**User-friendly default:** pick one bucket as “adjustment sink” (often discretionary) OR the last bucket by priority.

---

## 8) Confirmation Model (Safety + Trust)

Because deposit classification and user intent can vary (gift vs paycheck vs refund), the MVP uses **human-in-the-loop confirmation**:

- When a deposit posts, create a split plan in **PROPOSED** state.
- User reviews and confirms.
- Only after confirmation does execution occur.

**Channels**
- **Primary**: In-app confirmation
- **Secondary**: SMS (alerts + quick approve)

---

## 9) Delivery Methods (How Buckets “Send” Money)

Buckets specify a delivery method:

1. **Internal Transfer (Automated)**
   - Move money from source bank account to a destination bank account (e.g., savings)
   - Requires bank integration to support transfers

2. **External Link (Manual Completion)**
   - For flows requiring 2FA or external checkout (e.g., church giving platform)
   - App generates a link with amount prefilled when supported

   **Example (Pushpay):**
   - Base: `https://pushpay.com/g/victorynorcross`
   - Prefill: `?a={{amount}}`
   - Generated: `https://pushpay.com/g/victorynorcross?a=173.46`

3. **Manual Only**
   - App records a recommended amount and a task for the user, but does not execute

---

## 10) Deposit Detection

### MVP Rule
- Only act on **posted** (settled) deposits.
- Do not process pending transactions.

### Idempotency
- Each deposit is processed once using a unique transaction identifier from the bank data.
- Split plan creation must be idempotent:
  - same deposit_id → same split_plan_id (no duplicates)

---

## 11) States & Lifecycle (MVP)

### Split Plan States
- **PROPOSED** → created after deposit detection
- **CONFIRMED** → user approves (may include edits)
- **EXECUTING** → actions running
- **COMPLETED** → all actions either executed (internal) or generated (external/manual)
- **FAILED** → unrecoverable error, user notified

### Action States (per bucket)
- **PENDING**
- **READY** (after confirmation)
- **SENT** (transfer initiated OR link generated)
- **COMPLETED** (transfer confirmed OR user marked manual complete)
- **FAILED** (with error + retry policy)

---

## 12) MVP Screens / UX

### A) Bucket Builder
- Create/edit bucket:
  - name
  - allocation type (percentage / fixed)
  - allocation value
  - delivery method (internal transfer / external link / manual)
  - destination (if internal transfer)
  - external link template (if external link)
  - priority/order

### B) Deposit Feed
- Shows each deposit
- Split plan preview
- “Confirm” button
- “Edit amounts” option (per deposit)

### C) Confirmation
- Show computed amounts per bucket
- Allow override for this deposit (optional)
- Confirm execution

### D) History / Ledger
- Deposits
- Split plans
- Actions per bucket
- Failures and retry attempts

---

## 13) MVP Requirements (Functional)

1. User can connect bank accounts (read transactions; transfers optional depending on integration).
2. System detects posted deposits and creates split plans.
3. User can create and manage buckets.
4. User can confirm split plans in-app; SMS can notify and optionally approve.
5. Execution supports:
   - internal transfers (where possible)
   - external link generation with amount prefill template
6. Full audit log + idempotency.

---

## 14) MVP Requirements (Non-Functional)

- **Security:** encryption at rest for secrets; least-privilege; do not store 2FA codes.
- **Reliability:** job retries with backoff; idempotency keys.
- **Observability:** structured logs + metrics for deposit detection, split plan creation, action execution.
- **Compliance posture (MVP):** human confirmation before execution reduces risk.

---

## 15) Open Questions (Post-MVP)

- Support rule filters (e.g., only deposits above $X, only specific sources).
- Automatic reconciliation of manual/external payments via bank outgoing transaction matching.
- Monthly caps and thresholds in UI (backend-ready if desired).
- “Paused” mode per bucket or per account.

---

# Appendix A — FastAPI Reference Architecture (MVP)

## A1) Services
- **API Service (FastAPI)**
  - Auth (MVP can be email + magic link or basic JWT)
  - Bucket CRUD
  - Split plan review/confirm
  - History views

- **Worker**
  - Handles deposit ingestion events
  - Computes split plans
  - Executes actions (transfers, SMS, link generation)

## A2) Suggested Infra
- Postgres (primary DB)
- Redis (optional, for job queue)
- Background jobs:
  - simple: APScheduler + DB locking (early MVP)
  - robust: Celery/RQ/Arq (recommended)

- SMS: Twilio

## A3) Core Tables (Suggested)

### users
- id, email, created_at

### bank_accounts
- id, user_id, provider, provider_account_id, name, is_active

### deposits
- id, user_id, bank_account_id
- provider_txn_id (unique)
- amount, currency
- posted_at
- description/raw_merchant
- created_at

**Unique constraint:** (provider, provider_txn_id)

### buckets
- id, user_id
- name
- allocation_type (percentage|fixed)
- allocation_value (decimal)
- delivery_method (internal_transfer|external_link|manual_only)
- delivery_metadata (jsonb)  # e.g., destination account id, url_template
- priority (int)
- is_active
- created_at, updated_at

### split_plans
- id, user_id, deposit_id
- status (proposed|confirmed|executing|completed|failed)
- created_at, confirmed_at

### split_actions
- id, split_plan_id, bucket_id
- amount
- status (pending|ready|sent|completed|failed)
- execution_type (transfer|external_link|manual_only)
- external_link (nullable)
- error_code, error_message
- created_at, updated_at

## A4) Deposit → Split Plan Flow

1. **Ingest deposit (posted only)**
2. **Idempotency check**: deposits unique on provider_txn_id
3. Create deposit row if new
4. Compute split plan from current active buckets
5. Create split_plan (PROPOSED) + split_actions (PENDING)
6. Notify user (SMS and/or push)
7. User confirms (CONFIRMED), optionally edits per-action amounts
8. Worker executes:
   - internal transfers → mark SENT/COMPLETED
   - external link → generate link → mark SENT; user later marks COMPLETED

## A5) Link Templates (External Link Buckets)

A bucket may store:
- url_template: `https://pushpay.com/g/victorynorcross?a={{amount}}`

When creating split_actions:
- external_link = template with amount formatted to 2 decimals

## A6) Idempotency Strategy
- deposits: unique(provider, provider_txn_id)
- split_plans: unique(deposit_id)
- split_actions: unique(split_plan_id, bucket_id)

## A7) Testing Checklist (MVP)
- duplicate webhook events do not duplicate deposits or actions
- rounding does not allow total_allocated > deposit_amount
- confirmation required before execution
- external link generation correct formatting
- failure retries do not duplicate transfers

---

# Appendix B — MVP Scope Cut (What to build first)

**Week 1:**
- bucket CRUD + local split plan simulator
- deposit feed UI (mock data)
- split plan creation engine (no bank integration yet)

**Week 2:**
- bank read integration (deposits)
- split plan proposed + in-app confirm
- SMS notifications

**Week 3:**
- internal transfer (if supported) OR manual-only placeholder
- external link bucket (Pushpay prefilled)
- history / ledger

---

**Status:** PRD complete for MVP build.
