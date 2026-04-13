# AI-assisted legal drafting assistant (LECIPM)

## Purpose

Structured **OACIQ-style** form drafting with platform prefill, deterministic compliance checks, and assistive AI. Brokers remain in control; nothing is legally finalized without broker review and explicit export confirmation.

## Schema

- **Templates** (`LegalFormTemplate`): `key`, `name`, `language`, `schemaJson` (sections + fields with `sourceMappings`, `aiPrefillEligible`, validation hints).
- **Drafts** (`LegalFormDraft`): `fieldValuesJson`, `alertsJson` (cached snapshot), `status`: `draft` | `review_required` | `ready` | `exported`.
- **Suggestions** (`LegalFormSuggestion`): prefill / clause / warning / annex_recommendation / summary with `sourceType`, `sourceRef`, `confidence`, `explanation`.
- **Alerts** (`LegalFormAlert`): rule engine + consistency outputs with `severity` (`info` | `warning` | `high` | `blocking`).
- **Audit** (`LegalFormAuditEvent`): created, ai_prefill, field_edited, alert_generated, reviewed, exported, etc.

Default sample template key: `oaciq_promise_to_purchase_v1` (seeded on first GET `/api/legal-drafting/templates`).

## Workflow

1. Create draft (`POST /api/legal-drafting/drafts`) with `templateKey` and optional `listingId`, `clientUserId`.
2. Import platform context (automatic in prefill).
3. **Deterministic rules first** (`POST .../run-rules`) → persists `LegalFormAlert` rows.
4. **AI prefill** (`POST .../prefill`) → factual fields from platform + optional model suggestions (stored as suggestions; does not overwrite broker values unless `overwriteConfirmed` and field not confirmed).
5. Optional **clause suggestions** (`POST .../suggest-clauses`), **summary** (`POST .../summarize`).
6. Broker edits (`POST .../fields`), re-run rules as needed.
7. **Review** (`POST .../review` with `action: "mark_ready"`) — blocked if blocking alerts remain.
8. **Export** (`POST .../export`) — only when `status === ready`, no blocking alerts, and `confirmReviewed: true`. Returns print-ready HTML JSON (PDF/DOCX can be wired later).

## Rule engine

Runs before/with AI assistance. Modules:

- `form-type-rules.ts` — transaction type vs form template, annex hints.
- `language-rules.ts` — EN/FR consistency.
- `annex-rules.ts` — recommended annexes by transaction type.
- `consistency-rules.ts` — listing price vs drafted price, dates, deposit logic.
- `custom-clause-rules.ts` — risk signals on custom text.

Blocking alerts prevent `ready` and `export`.

## AI tasks

| File | Role |
|------|------|
| `prefill-form.ts` | Map platform context to fields; optional OpenAI JSON for eligible empty fields. |
| `suggest-clauses.ts` | Clause ideas from context + drafting guide snippets (suggestions only). |
| `explain-alert.ts` | Plain-language explanation of an alert (assistive). |
| `summarize-draft.ts` | Obligations, deadlines, conditions, risks to review (not legal advice). |

## Safety rules

- Do not invent facts; empty fields stay empty when data is missing.
- Suggestions include `sourceType` / `sourceRef` when available (`platform_data`, `rule_engine`, `draft_book`, `uploaded_doc`, `law_reference`, `ai_assist`).
- No claim of legal validity; broker must review before export.
- Export requires checkbox confirmation: “I have reviewed this draft before export.”

## Source hierarchy

1. Platform data (listing, broker, optional client, deal facts).
2. Rule engine (deterministic alerts).
3. Uploaded drafting guides / law docs (when connectors return content).
4. AI (only where eligible and with low temperature; outputs stored as suggestions).

## API routes (Next.js App Router)

Existing `/api/forms` is reserved for **form submissions** (legacy). Legal drafting uses:

- `GET /api/legal-drafting/templates`
- `GET` / `POST /api/legal-drafting/drafts`
- `GET /api/legal-drafting/drafts/[id]`
- `POST /api/legal-drafting/drafts/[id]/prefill`
- `POST /api/legal-drafting/drafts/[id]/run-rules`
- `POST /api/legal-drafting/drafts/[id]/suggest-clauses`
- `POST /api/legal-drafting/drafts/[id]/summarize`
- `POST /api/legal-drafting/drafts/[id]/fields`
- `POST /api/legal-drafting/drafts/[id]/review`
- `POST /api/legal-drafting/drafts/[id]/export`

Authorization: broker roles (`BROKER`, `MORTGAGE_BROKER`) or `ADMIN`. Drafts are scoped to `brokerUserId` unless `ADMIN`.

## UI

- `/dashboard/forms` — list, status counts, new draft.
- `/dashboard/forms/[draftId]` — section nav, field editor with AI suggestion accept/reject, alerts, assistant panel (prefill, clauses, summary), export with review gate.

## Export conditions

- No `blocking` severity alerts.
- Draft status `ready`.
- Client confirms final review on export.
