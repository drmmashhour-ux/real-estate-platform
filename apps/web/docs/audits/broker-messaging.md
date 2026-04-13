# LECIPM broker listing messaging

## Overview

Listing-linked threads between buyers (logged-in or guest) and CRM listing brokers. Distinct from CRM `Conversation` / `Message` and BNHub inquiry tables.

## Schema

- **Enums:** `LecipmBrokerThreadStatus`, `LecipmBrokerThreadSource`, `LecipmBrokerMessageSenderRole`
- **Models:** `LecipmBrokerListingThread`, `LecipmBrokerListingMessage`, `LecipmBrokerListingParticipant` (participants populated for broker + logged-in customer; guests use `guestTokenHash` only)
- **Tables:** `lecipm_broker_listing_*` (PostgreSQL)

## API routes

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/messages/threads` | Create thread + first message (guest or logged-in) |
| GET | `/api/messages/threads` | List threads (broker/admin or customer) |
| GET | `/api/messages/threads/unread-count` | `{ brokerUnread, customerUnread }` for nav |
| GET | `/api/messages/threads/[id]` | Thread + messages (`?guestToken=` for guests) |
| POST | `/api/messages/threads/[id]/messages` | Send reply (`?guestToken=` for guests) |
| POST | `/api/messages/threads/[id]/read` | Mark other party’s messages read |
| POST | `/api/messages/threads/[id]/close` | Broker/admin close thread |

## Flows

1. **Guest / buyer from listing (CRM):** `BuyerListingDetail` → `POST /api/messages/threads` with `source: listing_contact`, `listingId`, body, name, email, honeypot `website`.
2. **Logged-in buyer:** Same endpoint; session sets `customerUserId` server-side.
3. **Broker inbox:** `/dashboard/messages` → tab **Listing inquiries** → `LecipmBrokerListingInbox`.
4. **Buyer inbox:** `/account/messages` → `LecipmCustomerMessagesClient`.
5. **Guest follow-up:** Store `guestToken` from create response (e.g. `sessionStorage`); pass `guestToken` query on GET/POST for that thread (optional future dedicated guest page).

## Permissions

- **Broker:** `thread.brokerUserId === session user`
- **Customer:** `thread.customerUserId === session user`
- **Guest:** HMAC-style `guestToken` → `guestTokenHash` match
- **Admin:** Full read (list all threads; close)

Broker resolution for listings: `resolveBrokerForListing` — `BrokerListingAccess` first, else `listing.ownerId`.

## Unread logic

- Incoming messages for the other party stay `isRead: false` until the viewer opens the thread and triggers `POST .../read`.
- Broker unread: messages with `senderRole` in `customer`, `guest` and `isRead: false`.
- Customer unread: `senderRole` in `broker`, `admin` and `isRead: false`.

## Notifications

See `lib/messages/notify.ts` — placeholder hooks for email; connect `sendTransactionalEmail` or a queue later.

## Anti-spam

- Body length: `MESSAGE_BODY_MIN` / `MESSAGE_BODY_MAX` in `lib/messages/validators.ts`
- Email validation for guests
- Honeypot field `website` on create (bots fill → silent 200)
- Rate limit: 5/min per IP for unauthenticated creates; 20/min per user when authenticated (`lib/rate-limit.ts`)

## Future upgrades

- Magic-link emails for guest threads
- AI suggested replies (broker inbox)
- Push notifications
- Optional CRM `Lead` sync on thread create for reporting parity with legacy `contact-listing`
