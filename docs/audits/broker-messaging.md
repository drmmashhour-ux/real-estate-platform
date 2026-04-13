# LECIPM broker messaging — audit & reference

This document describes how **listing-linked broker conversations** work in the repo: schema (physical tables), API routes, permissions, and extension points (notifications, email, AI).

## Conceptual model (product)

| Concept | Implementation |
|--------|----------------|
| Thread | `lecipm_broker_listing_threads` (Prisma: `LecipmBrokerListingThread`) |
| Message | `lecipm_broker_listing_messages` (Prisma: `LecipmBrokerListingMessage`) |
| Thread status | `LecipmBrokerThreadStatus`: `open`, `replied`, `closed` |
| Source | `LecipmBrokerThreadSource`: `listing_contact`, `broker_profile`, `general_inquiry` |
| Sender role | `LecipmBrokerMessageSenderRole`: `customer`, `broker`, `admin`, `guest` |

The product spec may refer to generic names (`MessageThread`, `ThreadStatus`). **We do not duplicate** those as separate Postgres tables: one canonical pipeline backs broker listing messaging and the broker CRM lead (`lecipm_broker_crm_leads`) created with each new thread.

## Physical schema (migrations)

- `prisma/migrations/20260422150000_lecipm_broker_listing_messaging/migration.sql` — threads, messages, participants.
- `prisma/migrations/20260422160000_lecipm_broker_crm_ai/migration.sql` — CRM lead rows keyed by `thread_id`.

IDs are **text/cuid-style** in the database (not UUID columns), consistent with the rest of the app.

## Service layer (`apps/web/lib/messages/`)

| Module | Role |
|--------|------|
| `create-thread.ts` | Validates listing/broker resolution, guest or logged-in customer, creates thread + first message + CRM lead. |
| `send-message.ts` | Authorized send; updates `lastMessageAt`, status (`replied` / `open`); reopens from `closed` when the buyer/guest writes. |
| `get-thread.ts` | Thread detail + messages; broker-only response-time stats. |
| `list-threads.ts` | Broker (or customer) inbox list with unread counts and filters. |
| `mark-read.ts` | Marks the **other side’s** messages read for the viewer. |
| `close-thread.ts` | Broker/admin closes thread. |
| `permissions.ts` | `ThreadViewer`: broker / customer / admin / guest token. |
| `validators.ts` | Body length, email, honeypot helpers used by API. |
| `notify.ts` | In-app `Notification` rows + **TODO** email hooks (`queueEmailBrokerNewInquiry`, `queueEmailCustomerBrokerReply`). |
| `broker-response-stats.ts` | Median/avg broker reply latency from message pairs (UI). |
| `resolve-broker-for-listing.ts` | Broker user for a CRM listing (`BrokerListingAccess` or listing owner). |

## API routes

Base path: **`/api/messages/threads`**

| Method | Path | Notes |
|--------|------|--------|
| `POST` | `/api/messages/threads` | Create thread (guest or customer); rate-limited; honeypot. |
| `GET` | `/api/messages/threads` | List threads for authenticated broker or customer. |
| `GET` | `/api/messages/threads/[id]` | Thread detail (`guestToken` query for guests). |
| `POST` | `/api/messages/threads/[id]/messages` | Send message. |
| `POST` | `/api/messages/threads/[id]/read` | Mark read. |
| `POST` | `/api/messages/threads/[id]/close` | Close (broker/admin). |

## Listing contact → thread

CRM marketplace listings: **`POST /api/buyer/contact-listing`** (`handleCrmContact`) creates the legacy `Lead` row **and**, when a messaging thread can be resolved (broker on listing), calls **`createLecipmBrokerThread`** with `listing_contact`. Response may include **`messagingThreadId`** for the UI to deep-link to **`/account/messages?threadId=...`**.

FSBO contacts do not automatically open a LECIPM broker thread (seller-led flow); broker listing UX is CRM-focused.

## UI surfaces

| Surface | Path | Notes |
|---------|------|--------|
| Broker centralized inbox | `/dashboard/messages` | Tabs: listing inquiries (`LecipmBrokerListingInbox`) + CRM `Conversation` inbox. Query: `?lecipmThread=` opens a thread. |
| Customer inbox | `/account/messages` | `LecipmCustomerMessagesClient`; query: `?threadId=`. |
| Listing detail | `/listings/[id]` | Contact modal + **broker contact card** (CRM) calling the same contact flow. |

## Permissions

- **Broker** sees threads where `brokerUserId` is their user id.
- **Customer** sees threads where `customerUserId` matches (logged-in buyer).
- **Guest** uses opaque **`guestToken`** (hash stored on thread) for read/reply without an account where supported.
- **Admin** can view per `permissions.ts` / API context.

## Notifications

- **In-app:** `lib/messages/notify.ts` (new inquiry → broker; broker reply → customer with **`/account/messages?threadId=`**).
- **BNHUB** booking/inquiry notifications are separate (`lib/bnhub/notifications.ts`).

## Anti-spam / safety

- Thread creation: IP/user rate limits in `app/api/messages/threads/route.ts`.
- Contact listing: `gateDistributedRateLimit` on `buyer:contact-listing`.
- Honeypot field `website` on thread POST.
- Message body validation in `validators.ts` (min/max length).

## Future upgrades

- Transactional email templates wired to `queueEmailBrokerNewInquiry` / `queueEmailCustomerBrokerReply`.
- Optional deduplication: one open thread per `(listingId, customerUserId)` before creating another.
- AI-suggested replies on thread detail (behind feature flag).

## QA checklist

- [ ] CRM listing contact from logged-in buyer creates lead + `messagingThreadId` when broker resolvable.
- [ ] Broker sees thread under **Listing inbox**; customer under **Account → Inbox**.
- [ ] Reply both ways; unread counts move after read.
- [ ] Close thread; customer message reopens (`send-message.ts`).
- [ ] Mobile: thread list hides when a thread is open; **Back to threads** visible.
