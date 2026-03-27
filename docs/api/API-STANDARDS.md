# LECIPM — API Standards (Quick Reference)

Consistent rules for all REST APIs. Full specification: [LECIPM-API-ARCHITECTURE-BLUEPRINT.md](../LECIPM-API-ARCHITECTURE-BLUEPRINT.md).

---

## REST

- **Base path:** `/v1/<domain>` (e.g. `/v1/auth`, `/v1/bookings`).
- **Resources:** Plural nouns; IDs in path: `/v1/bookings/{bookingId}`.
- **Methods:** `GET` (read), `POST` (create / action), `PATCH` (partial update), `DELETE` (delete/soft-delete).
- **IDs:** UUIDs.

---

## JSON

- **Request:** `Content-Type: application/json`.
- **Response:** `Content-Type: application/json`; UTF-8.
- **Naming:** camelCase (`createdAt`, `checkIn`, `pageSize`).

---

## Success responses

**Single resource**

```json
{ "id": "...", "title": "...", "createdAt": "..." }
```

**List with pagination**

```json
{
  "data": [ { "id": "...", ... } ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalCount": 100,
    "hasMore": true
  }
}
```

Some services use `limit`/`offset` instead of `page`/`pageSize`; `total` or `totalCount` for total count.

---

## Error responses

**Standard shape**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "details": ["optional", "array", "of", "details"]
  }
}
```

**HTTP status**

- `400` — Validation error, bad request.
- `401` — Unauthorized (missing or invalid token).
- `403` — Forbidden (insufficient role or permission).
- `404` — Not found.
- `409` — Conflict (e.g. duplicate).
- `500` — Internal server error.

**Common codes:** `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `INTERNAL_ERROR`, plus domain-specific (e.g. `BOOKING_ERROR`, `PAYMENT_ERROR`).

---

## Validation

- Use **Zod** (or equivalent) for body, query, and path params.
- Return **400** with `error.details` listing field errors when validation fails.
- Document required vs optional fields and allowed values in each service README or OpenAPI.

---

## Pagination

- **Query params:** `page`, `pageSize` (or `limit`, `offset`).
- **Defaults:** e.g. page 1, pageSize 20; cap pageSize (e.g. 100).
- **Response:** Include `totalCount` (or `total`) and `hasMore` (or derive from `page * pageSize < total`).

---

## Filtering

- **Query params:** e.g. `status`, `listingId`, `city`, `minPrice`, `maxPrice`.
- Same camelCase as JSON; document in API docs.

---

## Authentication and authorization

- **Header:** `Authorization: Bearer <accessToken>`.
- **Cookie:** Some flows (e.g. web BNHub guest) use session cookie.
- **Role-based:** Enforce after auth; return 403 when role is not allowed for the action.
- **Service-to-service:** Use API key or JWT as agreed (e.g. `X-API-Key`, `Authorization: Bearer`).

---

## Versioning

- **URL prefix:** `/v1/`; keep backward compatibility within v1; introduce v2 when breaking changes are required.
- **Deprecation:** Communicate and provide migration path before removing or changing behavior.
