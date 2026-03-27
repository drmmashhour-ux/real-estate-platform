# Trust, safety & compliance — BNHub + LECIPM

**Purpose:** Raise the bar for **verification**, **fraud resistance**, **disputes**, and **privacy** as volume grows. This is **guidance**, not legal advice — involve counsel for contracts, jurisdictional wording, and regulatory filings.

---

## Identity verification (users)

- **Hosts:** Strong identity before payouts; periodic re-check on risk signals.  
- **Guests:** Risk-based step-up (high-value bookings, abuse patterns).  
- **Audit:** who verified, when, method (document type redacted in logs).

---

## Listing verification

- **Address & listing alignment** — geocode vs stated address; mismatch → review queue.  
- **Ownership / authority** — where legally required, collect evidence before “verified” badge.  
- **Media** — duplicate/stock detection where technically feasible; manual spot checks in new markets.

---

## Fraud detection (rules + review)

- Velocity limits on new listings and bookings.  
- Payment risk signals (issuer declines, chargeback history).  
- Collusion patterns (circular bookings, synthetic reviews) — escalate to trust team.  
- **No fully autonomous ban** without human appeal path for paid users where policy requires it.

---

## Disputes

- Clear categories (access, cleanliness, safety, misrepresentation).  
- SLA for first response (see [operations.md](operations.md)).  
- Documented refund / partial refund / deny paths; ledger consistency with finance.

---

## Data privacy (Canadian expectations)

- **PIPEDA-style principles:** limit collection, specify purposes, secure storage, retention limits, access/correction process.  
- **Cross-border processing** — disclose sub-processors; DPAs where required.  
- **Cookies / analytics** — consent where applicable; minimize persistent IDs.  
- **Guest–host messaging** — policy on monitoring for safety vs expectation of privacy (document clearly).

---

## Security baseline

- TLS everywhere; secrets in vault/env — not in repo.  
- Role-based admin access; MFA for high-privilege accounts.  
- Regular dependency and container image updates.

---

## References in codebase

Trust-related BNHub models and flows (verification, disputes, risk flags) live in `apps/web/prisma/schema.prisma` and related modules — extend deliberately with migrations and tests.
