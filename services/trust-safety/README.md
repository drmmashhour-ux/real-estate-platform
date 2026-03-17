# Trust & Safety Service

Incident reporting, account/listing flags, moderation queue, and suspension system.

## Features

- **Incident reporting** — Users report others or listings with type (FRAUD, HARASSMENT, INAPPROPRIATE_CONTENT, SCAM, SAFETY_CONCERN, OTHER), description, optional priority. At least one of `reportedUserId` or `reportedListingId` required.
- **Account flags** — Quick flag on an account (`targetType: ACCOUNT`, `targetId: userId`) with a reason.
- **Listing flags** — Quick flag on a listing (`targetType: LISTING`, `targetId: listingId`) with a reason.
- **Moderation queue** — Pending incidents and flags: `GET /moderation/queue/incidents` and `GET /moderation/queue/flags`. List endpoints with `status=PENDING` also serve as the queue.
- **Suspension system** — Suspend an account or listing with reason, optional `expiresAt` (null = indefinite), optional `suspendedById`. Status: ACTIVE, LIFTED, EXPIRED.

## APIs

| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/incidents` | Report incident (body: `reporterId`, `reportedUserId` and/or `reportedListingId`, `type`, `description`, optional `priority`) |
| GET | `/v1/incidents` | List incidents (query: `reporterId`, `reportedUserId`, `reportedListingId`, `status`, `type`, `limit`, `offset`) |
| POST | `/v1/flags` | Create flag (body: `flaggerId`, `targetType` ACCOUNT\|LISTING, `targetId`, `reason`) |
| GET | `/v1/flags` | List flags (query: `flaggerId`, `targetType`, `targetId`, `status`, `limit`, `offset`) |
| POST | `/v1/suspensions` | Create suspension (body: `targetType`, `targetId`, `reason`, optional `suspendedById`, `expiresAt`) |
| GET | `/v1/suspensions` | List suspensions (query: `targetType`, `targetId`, `status`) |
| GET | `/v1/moderation/queue/incidents` | Pending incidents for moderation |
| GET | `/v1/moderation/queue/flags` | Pending flags for moderation |

## Configuration

- `PORT` — default `3009`
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

- [API Architecture Blueprint](../../docs/LECIPM-API-ARCHITECTURE-BLUEPRINT.md), [Database Blueprint](../../docs/LECIPM-DATABASE-SCHEMA-BLUEPRINT.md) §10.
- Build order: Phase 8 — [Build Order](../../docs/LECIPM-BUILD-ORDER.md).
