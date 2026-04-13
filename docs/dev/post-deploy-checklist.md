# Post-deploy smoke checklist

Run this after **every production deployment** and after **important preview** validations. Adjust URLs: use **preview URL** for QA, **production URL** for go-live verification.

## Quick probes

- [ ] **`GET /api/health`** returns `200` and `{ "status": "ok", ... }`.
- [ ] **`GET /api/ready`** returns `200` and `ready: true` (if it returns `503`, investigate DB/env before declaring success).

## Core UX

- [ ] **Homepage** loads without error boundary (replace with your locale path if needed, e.g. `/en/ca`).
- [ ] **Listing search** returns results (or empty state without 500).
- [ ] **Listing detail** (BNHub stay or property listing) loads.
- [ ] **Login** and **signup** flows open and submit without 500 (use test accounts on preview).
- [ ] **Booking flow** opens from a listing (dates + guest path); reaches checkout or expected gate without crash.

## Payments-critical

- [ ] **Stripe checkout** or payment route responds (e.g. create session or BNHub checkout page loads). On **preview**, use **test** keys and test cards only.
- [ ] **Critical APIs** return healthy responses (spot-check routes your release touched, e.g. `/api/ready`, one authenticated API if auth changed).

## If anything fails

1. Capture **deployment ID** and time from Vercel.  
2. Open **runtime logs** for that deployment ([vercel-logs.md](./vercel-logs.md)).  
3. If production is impacted, consider **rollback** ([vercel-rollback.md](./vercel-rollback.md)).

## Related

- [vercel-deploy-flow.md](./vercel-deploy-flow.md)  
- [incident-response.md](./incident-response.md)  
