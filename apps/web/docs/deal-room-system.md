# ImmoContact deal room (collaboration) — V1

## What it is

A **structured collaboration space** linked to a platform entity (listing, lead, broker workspace context, booking, or property id). Brokers, admins, and internal operators use it for **notes, lightweight tasks, meeting URLs, document placeholders/links, status, participants, and an audit-style activity timeline**.

Routes: **`/dashboard/immo-deal-rooms`** (list), **`/dashboard/immo-deal-rooms/[id]`** (detail). Admin shortcut: **`/admin/immo-deal-rooms`** redirects to the dashboard list.

Persistence is **JSON on disk** (`apps/web/data/deal-rooms.json` by default). Override path with **`DEAL_ROOMS_JSON_PATH`** (see `.env.example`).

This feature is branded **ImmoContact deal rooms** to distinguish it from existing **CRM “deal rooms”** (`/dashboard/deal-rooms`), which are backed by Prisma and include pipeline stages, visits, payments, etc.

## What it does NOT do

- Not a **legal closing** or signing system  
- Not **Teams replacement** — only stores meeting URLs (Zoom / Teams use the same stub/link factory as the collaboration layer; manual URLs supported)  
- Not **payments, escrow, or commissions**  
- Does **not** send email/SMS or auto-notify externals  
- Does **not** execute financial or legal actions  

## Guardrails (implementation)

- This is a **collaboration** layer, not a **transaction-closing** engine.  
- **Do not** add escrow/payment logic, auto-sent “risky” messages, or legal-signature / e-sign workflows here.  
- **Do not** overbuild permissions until a product decision defines safe external access; V1 can stay **internal / broker / operator–first** and still be useful.  
- **Do** keep the focus on **notes, tasks, meetings, document rows, and the activity timeline**; every meaningful change should stay **visible in the feed** and **reversible** where the data model allows (e.g. status and task updates, not silent overwrites).

## V1 limits (explicit)

- **Internal / broker / operator–first**: End‑buyers and external clients are **not** first-class participants in V1 UI. You *can* add placeholder participants (e.g. buyer name + email) for visibility planning, but there is **no secure external portal** yet — treat rows as operational metadata only.
- **File uploads**: Document rows support **placeholder**, **external_link**, and **upload** kinds; binary upload wiring is **not** included unless you attach a URL from an existing safe upload flow elsewhere.
- **Meetings**: Storing and opening a URL is enough; no calendar sync or conferencing API beyond existing collaboration stubs.
- **Single-node JSON**: Suitable for early adoption; scale-out would require a shared database or object store.

## Participant roles (deal room semantics)

Stored on each participant: `role` (`admin | operator | broker | buyer | seller | host | guest | reviewer`) and **`accessLevel`** (`read | comment | edit | manage`). Platform **ADMIN** and **internal operator roles** (`CONTENT_OPERATOR`, `LISTING_OPERATOR`, `OUTREACH_OPERATOR`, `SUPPORT_AGENT`) can access and usually manage any room for support. **Creators** and participants with **`manage`** can add/remove participants and change status.

## Meeting integration

Uses **`createZoomMeeting` / `createTeamsMeeting`** from the collaboration module with `entityType: deal_room` and `entityId` = deal room id. Manual entries store an arbitrary HTTPS URL. No outbound invites are sent automatically.

## Document scope

Expect checklist-style rows: “ID copy”, “offer draft”, “supporting note”, etc. Not a document assembly or e‑signature engine.

## Room status meanings

| Status | Intent |
|--------|--------|
| `open` | Just created / triage |
| `active` | Work in progress |
| `pending_review` | Waiting on reviewer or ops |
| `paused` | Intentionally on hold |
| `closed` | Collaboration finished |
| `archived` | Retained for audit only |

Status changes append to the activity feed.

## Monitoring

`deal-room-monitoring.service.ts` logs counters with prefix **`[deal-room]`** and never throws.

## Related docs

- **Document workflow (checklists, packet, review):** [`docs/deal-room-document-workflow.md`](./deal-room-document-workflow.md)
- Collaboration layer (meeting stubs): `docs/collaboration-layer.md` (if present in repo)
