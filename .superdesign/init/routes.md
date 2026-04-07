# FlowSplit Route Structure (Expo Router)

## Auth Stack: `app/(auth)/`
- `/login` → `(auth)/login.tsx`
- `/register` → `(auth)/register.tsx`

## Tab Bar: `app/(tabs)/`
- `/` (Home/Dashboard) → `(tabs)/index.tsx`
- `/history` → `(tabs)/history.tsx`
- `/buckets` → `(tabs)/buckets.tsx`
- `/settings` → `(tabs)/settings.tsx`

## Deposit Flow: `app/deposit/`
- `/deposit/setup` → `deposit/setup.tsx` — Pick bank account + amount
- `/deposit/[id]/allocate` → `deposit/[id]/allocate.tsx` — Donut chart allocation
- `/deposit/[id]/confirm` → `deposit/[id]/confirm.tsx` — Review before submit
- `/deposit/[id]/processing` → `deposit/[id]/processing.tsx` — Animation while executing
- `/deposit/[id]/complete` → `deposit/[id]/complete.tsx` — Success summary

## Buckets: `app/buckets/`
- `/buckets/configure` → `buckets/configure.tsx` — List all buckets, manage destinations
- `/buckets/new` → `buckets/new.tsx` — Create new bucket
- `/buckets/[id]` → `buckets/[id].tsx` — Edit existing bucket

## Other
- `/bank-accounts` → `bank-accounts/index.tsx` — Plaid-linked accounts
- `/split-plan/[id]` → `split-plan/[id].tsx` — View a split plan detail
