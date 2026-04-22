# LECIPM transaction file system — week-by-week execution plan

**Audience:** builders shipping in Cursor who want fast, stable delivery without architectural breakage.

**Ground rules**

- Each week ends with a **validation gate** — do not start the next week until the gate passes.
- Prefer thin vertical slices over parallel half-finished layers.
- Every API returns structured JSON; every mutation appends audit events where applicable.
- **Immutable:** `transactionNumber` once assigned.

**Reference:** Full product/schema spec lives with the multi-part “Centris-style transaction file system” requirement (models, APIs, UI tabs). This doc is **only** the pacing and checkpoints.

---

## Week 1 — Transaction foundation (critical path)

### Day 1 — Schema + creation API

| Task | Detail |
|------|--------|
| Models | `Transaction`, `TransactionParty` (minimal fields needed for creation + listing refs) |
| Migration | Safe, additive migration in `apps/web/prisma/migrations/` |
| API | `POST /api/transactions` — authenticated broker (or scoped role); persist row |

**Output**

- Rows appear in DB; FKs to `User` (broker), optional `Listing` / `Property`.

---

### Day 2 — Transaction number generator

| Task | Detail |
|------|--------|
| Module | `apps/web/modules/transactions/transaction-number.service.ts` |
| Format | `LEC-SD-YYYY-######` (e.g. `LEC-SD-2026-000001`) |
| Safety | Atomic sequence per year — **no** random IDs; `@unique` on `transactionNumber`; race-safe via dedicated counter row + transaction or advisory lock |

**Output**

- Every created transaction receives one number **once**, never rewritten.

---

### Day 3 — Read APIs + filters

| Task | Detail |
|------|--------|
| API | `GET /api/transactions` — query params: `status`, `brokerId` (scoped: broker sees own; admin optional) |
| API | `GET /api/transactions/[transactionId]` — full header payload including `transactionNumber` |

**Output**

- List and detail work for authorized users.

---

### Day 4 — Workspace shell UI

| Task | Detail |
|------|--------|
| Route | `/[locale]/[country]/dashboard/transactions/[transactionId]` (match existing dashboard layout pattern) |
| Visible | Transaction number (prominent), title, type, workflow type, status |

**Output**

- Broker can open a transaction and see identity clearly.

---

### Day 5 — Parties

| Task | Detail |
|------|--------|
| API | `POST/GET …/parties` — CRUD minimal (seller/buyer/broker roles) |
| UI | Tab or section on workspace: list + add party |

**Output**

- Parties stored on `TransactionParty` with `transactionId`; no orphan parties.

---

### Day 6 — Timeline (audit v1)

| Task | Detail |
|------|--------|
| Model | `TransactionEvent` (if not added day 1, add now) |
| Service | Append events: `CREATED`, `UPDATED`, `PARTY_ADDED` (names aligned to enum/string contract) |
| API | `GET …/timeline` |

**Output**

- Chronological trail for create/update/party actions.

---

### Day 7 — Validation gate (mandatory)

Run through manually (and add smoke script when stable):

1. Create transaction → number assigned.
2. List + filter by status/broker.
3. Open workspace → number visible.
4. Add parties → persist + timeline entries.
5. No duplicate numbers under concurrent creates (quick script or two tabs).

**Stop:** Do **not** start Week 2 document work until this passes.

---

## Week 2 — Document system (SD number core)

### Day 8 — `TransactionDocument` + CRUD APIs

| Task | Detail |
|------|--------|
| Model | `TransactionDocument` per product spec |
| API | `POST/GET …/documents` |

---

### Day 9 — Document list UI

| Task | Detail |
|------|--------|
| UI | List documents inside transaction workspace |

---

### Day 10 — Critical: transaction number on every artifact

| Task | Detail |
|------|--------|
| Metadata | Every generated/uploaded doc row stores `transactionNumber` (denormalized OK for search/PDF) |
| Visible line | Standard: `Transaction No.: {{transactionNumber}}` in templates / PDF header |
| Guard | Block “final” generation path if `transactionId` / number missing when in transaction workflow |

---

### Day 11 — Document generator + form context

| Task | Detail |
|------|--------|
| Module | `transaction-form-context.service.ts` — injects `transactionId`, `transactionNumber`, parties, listing/property, workflow |

---

### Day 12 — Versioning

| Task | Detail |
|------|--------|
| Behavior | `versionNumber` increments; signed copies link to source `documentId` where applicable |

---

### Day 13 — Document statuses

| Task | Detail |
|------|--------|
| States | DRAFT → GENERATED → SENT_FOR_SIGNATURE → SIGNED / FINAL / VOID (as per spec) |
| Events | Each transition writes `TransactionEvent` |

---

### Day 14 — Week 2 validation

- Generate at least one contract/PDF from template → **transaction number appears** in output and in DB metadata.
- Confirm document rows are **only** under the correct `transactionId`.

---

## Week 3 — Communication + tasks + checklist

| Days | Scope |
|------|--------|
| **15–16** | `TransactionCommunication` model + `POST/GET …/communications`; optional attachment refs JSON |
| **17–18** | `TransactionTask` + API + UI (open/done/assign) |
| **19** | `TransactionChecklistItem` + default seed by `workflowType` |
| **20** | Wire checklist to status transitions (e.g. closing prep) |
| **21** | **Validation:** one transaction with docs + comms + tasks + checklist visible end-to-end |

---

## Week 4 — Signature + workflow

| Days | Scope |
|------|--------|
| **22–23** | `TransactionSignaturePacket` + link to `documentId` |
| **24** | Send-for-signature flow (provider stub OK: INTERNAL first) |
| **25** | Status tracking on packet |
| **26** | Return signed PDF → new `TransactionDocument` row (SIGNED_COPY) + link |
| **27** | Timeline events for sent/viewed/signed/completed |
| **28** | **Validation:** doc → sign → returned file stored under same transaction |

---

## Week 5 — Archive + professional finish

| Days | Scope |
|------|--------|
| **29** | `transaction-archive.service.ts` — close/archive; freeze semantics (no deletes) |
| **30** | Read-only archive mode in UI |
| **31** | Status model: ACTIVE / CONDITIONAL / CLOSED / ARCHIVED (map to your enum strings) |
| **32** | Search by `transactionNumber` (list API + UI filter) |
| **33** | Polish: headers, empty states, loading |
| **34–35** | **Final QA:** full simulation create → docs → sign → complete → archive; export stub OK |

---

## Result after 5 weeks (target)

| Capability | Week achieved |
|------------|----------------|
| One SD-style number per deal | 1–2 |
| Parties + audit trail | 1 |
| Documents + number on everything | 2 |
| Comms + tasks + checklist | 3 |
| Signature loop | 4 |
| Archive + search + polish | 5 |

---

## Weekly gate checklist (copy/paste)

```text
Week 1 [ ]  Week 2 [ ]  Week 3 [ ]  Week 4 [ ]  Week 5 [ ]

Last validation date: ___________
Blockers: ___________
```

---

## Notes for Cursor sessions

- Implement **Week 1 Days 1–2** before any document PDF work.
- Keep **transaction number generation** in one module; never duplicate sequence logic in route handlers.
- When adding UI, reuse existing dashboard shell under `app/[locale]/[country]/(dashboard)/dashboard/`.
