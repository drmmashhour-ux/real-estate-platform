# Messaging Service

Conversations between users, messages, attachments, unread tracking, and a real-time event hook.

## Features

- **Conversations** — Create or find a conversation by participant set; list conversations for the current user.
- **Messages** — Send text messages with optional attachments (URL, type, filename). Paginated history with `before` cursor.
- **Unread tracking** — Each participant has `lastReadAt`; unread count = messages from others after that time. Mark as read via `POST /conversations/:id/read`.
- **Real-time** — In-process event bus emits `message` when a new message is sent. A WebSocket server or push service can subscribe and broadcast to clients.

## Authentication

All routes require the current user. Send **`X-User-Id`** (UUID) on every request. Replace with JWT or API gateway in production.

## APIs

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/conversations` | List conversations for current user (query: `limit`, `offset`) |
| POST | `/v1/conversations` | Create conversation (body: `participantUserIds[]`); returns existing if same set |
| GET | `/v1/conversations/:conversationId` | Get one conversation (with `unreadCount`) |
| POST | `/v1/conversations/:conversationId/read` | Mark conversation as read |
| GET | `/v1/conversations/:conversationId/messages` | List messages (query: `limit`, `before` ISO datetime) |
| POST | `/v1/conversations/:conversationId/messages` | Send message (body: `body`, optional `attachments[]` with `url`, `type`, `filename`) |

## Message attachments

Attachments are stored as URLs (e.g. after upload to S3). Each item: `{ "url": "https://...", "type": "image/png", "filename": "photo.png" }`. Max 10 per message.

## Real-time integration

```ts
import { messageEvents } from "./realtime/events.js";

messageEvents.on("message", (payload: NewMessagePayload) => {
  // payload: conversationId, messageId, senderId, body, createdAt, attachmentCount
  // e.g. broadcast to WebSocket room for conversationId
});
```

## Configuration

- `PORT` — default `3007`
- `DATABASE_URL` — PostgreSQL connection string (required)

## Scripts

```bash
npm run build
npm run dev
npm run start
npm run db:generate
npm run db:push
npm run db:migrate
```

## Reference

- [API Architecture Blueprint](../../docs/LECIPM-API-ARCHITECTURE-BLUEPRINT.md), [Database Blueprint](../../docs/LECIPM-DATABASE-SCHEMA-BLUEPRINT.md) §7.
- Build order: Phase 7 — [Build Order](../../docs/LECIPM-BUILD-ORDER.md).
