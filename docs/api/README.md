# LECIPM public partner API (reference)

Server routes live under `apps/web/app/api/public/`. Authenticate with a partner API key:

- Header `Authorization: Bearer <api_key>`, **or**
- Header `x-api-key: <api_key>`

Keys and scopes are defined in `apps/web/lib/platform/partner-registry.ts` (env `PLATFORM_PUBLIC_PARTNERS_JSON`) or the development default (`PLATFORM_PUBLIC_API_DEV_KEY`).

## Scopes

| Scope | Routes |
| --- | --- |
| `leads:read` | `GET /api/public/leads` |
| `leads:write` | `POST /api/public/leads` |
| `deals:read` | `GET /api/public/deals` |
| `deals:write` | `PATCH /api/public/deals` |
| `insights:read` | `GET /api/public/insights` |
| `bookings:write` | `POST /api/public/bookings` |

## Endpoints

### List leads

```bash
curl -sS -H "Authorization: Bearer $API_KEY" \
  http://localhost:3001/api/public/leads
```

### Create lead (fires `lead_created` webhook)

```bash
curl -sS -X POST -H "Authorization: Bearer $API_KEY" -H "Content-Type: application/json" \
  -d '{"source":"partner_crm","status":"new"}' \
  http://localhost:3001/api/public/leads
```

### List deals

```bash
curl -sS -H "Authorization: Bearer $API_KEY" \
  http://localhost:3001/api/public/deals
```

### Update deal stage (fires `deal_updated` webhook)

```bash
curl -sS -X PATCH -H "Authorization: Bearer $API_KEY" -H "Content-Type: application/json" \
  -d '{"id":"deal_stub_1","stage":"negotiation"}' \
  http://localhost:3001/api/public/deals
```

### Insights

```bash
curl -sS -H "Authorization: Bearer $API_KEY" \
  http://localhost:3001/api/public/insights
```

### Create booking stub (fires `booking_created` webhook)

```bash
curl -sS -X POST -H "Authorization: Bearer $API_KEY" -H "Content-Type: application/json" \
  -d '{"listingId":"demo"}' \
  http://localhost:3001/api/public/bookings
```

## Webhooks

If a partner defines `webhookUrl`, the platform POSTs JSON payloads with headers `X-Platform-Event` and `X-Platform-Partner`. Events:

- `lead_created`
- `deal_updated`
- `booking_created`

## Internal services

Domain logic is decoupled in `packages/api/internal/` (`leads`, `deals`, `messaging`, `analytics`). Replace stubs with persistence as needed.

## Platform modules

Product modules are registered in `packages/core/modules.config.ts` (`AI Intelligence`, `Marketplace`, `Investor`).
