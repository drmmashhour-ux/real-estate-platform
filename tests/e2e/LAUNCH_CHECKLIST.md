# LECIPM Launch Readiness Checklist (E2E)

## 1. Core Flows (MUST PASS)
- [ ] **User Flow**: Search → Listing → Green Insight → Booking.
- [ ] **Green Flow**: Filter → Ranking → Decision Card (data consistency check).
- [ ] **Cross-App Flow**: Login on Web → Redirect to BNHub → Verify session persists.
- [ ] **Payment Flow**: Booking → Stripe Test Session → Confirmation → DB Record.
- [ ] **Broker Flow**: Create Listing in Broker Hub → Appears in BNHub Search.
- [ ] **Admin Flow**: Edit Listing in Admin Hub → Reflects in BNHub/Web immediately.

## 2. Edge Case Tests
- [ ] **Missing Green Data**: Ensure listing page doesn't crash if green logic fails.
- [ ] **Early Signature**: Ensure signature gate blocks incomplete drafts.
- [ ] **Invalid Inputs**: Test malformed pricing or guest counts in BNHub.
- [ ] **Network/DB Offline**: Verify graceful error messages on `/api/ready` failure.

## 3. Deployment Validation
- [ ] **Domain Redirection**: `lecipm.com/bnhub` → `bnhub.lecipm.com`.
- [ ] **SSL Checks**: All subdomains have valid HTTPS.
- [ ] **Env Sync**: All apps have identical `NEXT_PUBLIC_SUPABASE_*` keys.

## 4. Test Execution Format
Use the `validate_platform.ts` script to run automated checks before launch.

| Test ID | Flow | Status | Notes |
|---------|------|--------|-------|
| T-001 | User Journey | [ ] | |
| T-002 | Green Signals | [ ] | |
| T-003 | Multi-App Sync | [ ] | |
| T-004 | Stripe Webhook | [ ] | |
