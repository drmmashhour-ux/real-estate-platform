# Capacity assumptions (planning only)

**Purpose:** These values support **rough sizing, cost modeling, and design reviews**. They are **not** production measurements unless explicitly sourced from your own analytics.

**Rules**

- Treat every number below as a **planning assumption** or **illustrative range**.
- Replace with **measured** p50/p95 and tenant-level stats when available.
- Use ranges to express uncertainty; avoid false precision.

---

## Tenant and user shape

| Assumption | Illustrative range | Notes |
|------------|-------------------|--------|
| Active users per tenant (SMB brokerage / team) | Tens to low hundreds | Wide variance; enterprise tenants differ. |
| Concurrent active users per tenant at peak | Small fraction of total users | Drives connection and cache planning, not total signups. |
| Tenants in early SaaS | Order of tens to hundreds before multi-region becomes a conversation | Not a ceiling—an intuition band. |

---

## Documents

| Assumption | Illustrative range | Notes |
|------------|-------------------|--------|
| Documents per closed deal | Single digits to a few tens | Depends on mandatory checklist and property type. |
| Average document size (listings / PDFs) | Hundreds of KB to a few MB | Large plans change storage and egress costs. |
| Version churn per document | Low | If versioning is heavy, storage multiplies. |

---

## Messaging

| Assumption | Illustrative range | Notes |
|------------|-------------------|--------|
| Messages per active client thread per week | Low tens (bursty) | Campaigns and automations increase variance. |
| Threads per broker | Ranges widely by role | Use inbox pagination assumptions, not averages alone. |

---

## Scheduling

| Assumption | Illustrative range | Notes |
|------------|-------------------|--------|
| Appointments per broker per week | Single digits to tens | Seasonality matters. |
| Reschedule/cancel rate | Non-trivial | Drives notification and audit volume. |

---

## Notifications and workflows

| Assumption | Illustrative range | Notes |
|------------|-------------------|--------|
| Notifications emitted per significant workflow step | 0–several | Deduplication and digest settings change totals. |
| Action queue items created per broker per day | Low to moderate | Spikes during listing launches or deadlines. |

---

## Analytics and events

| Assumption | Illustrative range | Notes |
|------------|-------------------|--------|
| Client-side or server events per session | Highly variable | Define which events are **required** vs **best effort**. |
| Admin/analytics queries per day | Low count but **heavy** | Few expensive queries can dominate DB time. |

---

## Finance

| Assumption | Illustrative range | Notes |
|------------|-------------------|--------|
| Invoices per tenant per month | Depends on deal flow | Commission models change row counts. |
| Payment reconciliation jobs | Batch daily or more | Driven by processor webhooks and SLA. |

---

## How to use this document

1. Copy the table structure into a spreadsheet and plug in **your** pilot metrics when available.
2. Mark each replaced cell as **measured** with date and source.
3. Revisit before major infra commits (replicas, sharding, large cache clusters).
