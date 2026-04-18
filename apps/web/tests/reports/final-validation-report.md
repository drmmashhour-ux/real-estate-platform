# LECIPM Full Platform Validation Report

- **Generated:** 2026-04-15T14:37:55.585Z
- **Base URL:** http://127.0.0.1:3001
- **Mode:** smoke
- **Decision:** **GO_WITH_WARNINGS**

## Evidence
HTTP probes use Node fetch (no browser console capture). Playwright E2E is separate. Failed network calls include error message.

## Launch events
- ran: true
- ready: true
```json
{
  "USER_SIGNUP": 14,
  "USER_LOGIN": 102,
  "VIEW_LISTING": 431,
  "CONTACT_BROKER": 20,
  "CREATE_BOOKING": 1,
  "PAYMENT_SUCCESS": 34,
  "CHECKOUT_BLOCKED": 2
}
```

## Pages (15)
- `pass` /en/ca 200 
- `pass` /en/ca/listings 200 
- `pass` /en/ca/bnhub 200 
- `pass` /en/ca/search 200 
- `pass` /en/ca/dashboard/host 200 
- `pass` /en/ca/bnhub/host/dashboard 200 
- `pass` /en/ca/dashboard/broker 200 
- `pass` /en/ca/dashboard/broker/clients 200 
- `pass` /en/ca/admin 200 
- `pass` /en/ca/admin/fraud 200 
- `pass` /en/ca/admin/growth 200 
- `pass` /en/ca/admin/users 200 
- `pass` /en/ca/admin/security 200 
- `pass` /en/ca/pricing 200 
- `pass` /en/ca/admin/seo-blog 200 

## APIs (3)
- `pass` ready 200 
- `pass` health 200 
- `pass` auth_login_rejects_empty 400 

## Security (3)
- `pass` dashboard_api_without_cookie 
- `pass` stripe_checkout_rejects_bad_payload_or_auth 
- `pass` ready_endpoint_under_burst 

## Scenarios (5)
### Guest: home → listings → BNHub → search (pass)
- OK home
- OK listings
- OK bnhub
- OK search
### Host: dashboard hub surfaces (auth walls expected) (pass)
- OK host_dashboard
- OK bnhub_host
### Broker: CRM / deals entry (auth walls expected) (pass)
- OK broker_home
- OK broker_leads
### Admin: fraud → growth → users (auth walls expected) (pass)
- OK admin_root
- OK admin_fraud
- OK admin_growth
- OK admin_users
- OK admin_security
### Marketing: pricing → blog pipeline (pass)
- OK pricing
- OK seo_blog_admin

## Stripe / booking E2E
- ran: true, ok: true
- detail: exit_0

## Data integrity
- ran: true, ok: false
- SUPABASE_UNAVAILABLE:Supabase service env (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY) is not configured.

## Blockers

## Warnings
- data_integrity:supabase_not_configured_skipped
