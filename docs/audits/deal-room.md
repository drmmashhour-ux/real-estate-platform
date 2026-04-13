# Deal Room (LECIPM transaction workspace)

## Purpose

A **broker/admin workspace** that ties together CRM leads, listings, messaging threads, visits, tasks, document tracking, and lightweight payment status. It is **not** the same entity as the legal **sale `Deal`** model (buyer/seller/broker closing workflow at `/dashboard/deals`).

- **Deal rooms**: `/dashboard/deal-rooms` — operational pipeline and coordination.
- **Closing deals**: `/dashboard/deals` — existing sale deal record, milestones, Stripe flows.

## Schema (Prisma)

Enums: `DealRoomStage`, `DealPriorityLabel`, `DealTaskStatus`, `DealDocumentRefType`, `DealDocumentStatus`, `DealPaymentType`, `DealPaymentStatus`, `DealParticipantRole`.

Models (maps):

- `deal_rooms` — `listingId`, `brokerUserId`, optional `leadId`, `threadId`, `customerUserId`, guest fields, `stage`, `priorityLabel`, `summary`, `nextAction`, `nextFollowUpAt`, `isArchived`.
- `deal_room_participants` — optional `userId`, `role`, display/email.
- `deal_room_tasks` — title, description, `status`, `assignedUserId`, `dueAt`.
- `deal_room_events` — append-only timeline (`eventType`, `title`, `body`, `metadataJson`).
- `deal_room_documents` — `documentType`, `documentRefType` (`uploaded_file` | `legal_form_draft` | `external`), `documentRefId`, `status`.
- `deal_room_payments` — `paymentType`, `status`, optional `amountCents`, `currency`, `paymentRef`.

Uniqueness (MVP): at most one deal room per **non-null** `leadId` or `threadId` (Postgres unique allows multiple NULLs).

## API routes

Base path: **`/api/deal-rooms`** (does not replace `/api/deals` for the sale Deal).

| Method | Path | Role |
|--------|------|------|
| GET | `/api/deal-rooms` | List (broker: own; admin: all). Query: `stage`, `priority`, `listingId`, `followUpDue=1`, `brokerUserId` (admin), `stats=1` (admin aggregates). |
| POST | `/api/deal-rooms` | Create. Body `source`: `manual` (default), `lead`, `thread`, `visit`. |
| GET | `/api/deal-rooms/[id]` | Detail + insights + thread preview + visits bundle. |
| POST | `/api/deal-rooms/[id]/stage` | `{ stage }` |
| POST | `/api/deal-rooms/[id]/tasks` | New task |
| POST | `/api/deal-rooms/[id]/tasks/[taskId]` | Update task |
| POST | `/api/deal-rooms/[id]/documents` | Add document row |
| POST | `/api/deal-rooms/[id]/documents/[documentId]/status` | Update document status |
| POST | `/api/deal-rooms/[id]/payments` | Add payment row |
| POST | `/api/deal-rooms/[id]/next-action` | Update `nextAction`, `nextFollowUpAt`, `summary` |

Authorization: **`requireBrokerLikeApi`** — `BROKER`, `ADMIN`, `MORTGAGE_BROKER`. Brokers scoped to **their** `brokerUserId`; admins may read/update all.

## Creation flows

- **`lib/deals/create-deal-room.ts`** — core create + broker participant + initial timeline event.
- **`lib/deals/create-from-lead.ts`** — from CRM `Lead` (dedupes by `leadId`).
- **`lib/deals/create-from-thread.ts`** — `threadSource`: `crm` (`CrmConversation`) or `platform` (`Conversation`).
- **`lib/deals/create-from-visit.ts`** — from `LecipmVisitRequest`; updates existing lead room when present.

## Stage model

`DealRoomStage` drives Kanban columns (excluding terminal stages in the default board). Changing stage writes a **`stage_changed`** timeline event via `update-stage.ts`.

## Integrations

- **Messages**: `threadId` matches either `Conversation.id` or `CrmConversation.id`; preview loaded in `get-deal-room.ts` / `loadThreadPreview`.
- **Visits**: `loadVisitsForDealRoom` queries `LecipmVisitRequest` / `LecipmVisit` by `leadId` / `listingId`.
- **Legal drafting**: document rows can use `documentRefType = legal_form_draft` and `documentRefId` pointing at `legal_form_drafts.id` (wire UI upload/link later).
- **AI insights**: heuristic `compute-insights.ts` (stalled deal, overdue tasks, missing follow-up after visit, high-intent lead, offer stage without linked draft document).

## Timeline events

Key `eventType` values include: `deal_room_created`, `stage_changed`, `task_added`, `task_updated`, `document_added`, `document_status_updated`, `payment_updated`, `next_action_updated`, `visit_note`, etc. (see `lib/deals/constants.ts`).

## Future upgrades

- Real-time messaging embed, Doc Center file upload hooks, Stripe sync for payment rows, customer-facing read-only portal, automation from CRM webhooks, drag-and-drop Kanban with optimistic updates.
