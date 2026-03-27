# First 10 users — tracking

Measure outreach so you know **what to repeat**. Use a **sheet** or the in-app CRM at **`/admin/early-users`** (after DB migration).

**Scripts:** **`first-10-users.md`**

---

## Metrics to track

| Metric | Definition |
|--------|------------|
| **People contacted** | Unique individuals you sent an opening message to (host or guest). |
| **Replies** | They responded with anything (including “no thanks”). |
| **Conversions (signed up)** | Created an account (track email or user id in notes). |
| **Active users** | Logged in or completed a meaningful action in last **7 days**. |
| **Hosts onboarded** | Host with **≥1 live listing** (or your bar for “onboarded”). |

**Rates (calculate weekly):**

- `reply_rate = replies / contacted`
- `signup_rate = signups / replied` (if replies > 0)

---

## Simple CRM (spreadsheet)

| Column | Example |
|--------|---------|
| Name | Alex |
| Type | host / guest |
| Contact | email or @handle |
| Status | contacted → replied → signed_up → onboarded |
| Notes | Objection, source, date of last touch |
| Created | Date first contacted |

**Status flow**

1. **contacted** — message sent  
2. **replied** — they answered  
3. **signed_up** — account exists  
4. **onboarded** — host listing live **or** guest completed first booking attempt  

---

## Database (optional — `early_users_tracking`)

When Prisma migration is applied, admins can use **`/admin/early-users`** (web app, admin role). For **first 100** scale, see **`first-100-users.md`** — extra fields: `source`, `conversion_stage`, `conversion_date`, `follow_up_at`, plus **`/early-access`** landing captures.

```bash
pnpm --filter @lecipm/web exec prisma migrate dev --name early_users_tracking
```

| Field | Purpose |
|-------|---------|
| `id` | Primary key |
| `name` | Display name |
| `type` | `HOST` \| `GUEST` |
| `contact` | Email, phone, or @handle (varchar) |
| `status` | `CONTACTED` \| `REPLIED` \| `SIGNED_UP` \| `ONBOARDED` |
| `notes` | Free text |
| `user_id` | Optional link to `User` after signup |
| `created_at` / `updated_at` | Audit |

---

## Weekly review (15 min)

- Total **contacted / replies / signups / onboarded** vs targets in **`first-10-users.md`**.  
- **Best channel** (IG vs FB vs email).  
- **One** script tweak for next week.

---

## Honesty

If you didn’t contact 20 people, write **actual** numbers — the system only works if the data is real.
