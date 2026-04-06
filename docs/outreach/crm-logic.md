# CRM logic — investor pipeline (LECIPM Manager)

## States

| State | Meaning |
|-------|---------|
| `not contacted` | In database; no outbound logged |
| `contacted` | First touch sent (email, DM, or intro request) |
| `replied` | Any substantive reply (even “not now”) |
| `meeting` | Meeting agreed or on calendar (use `meeting scheduled` in prose if clearer for your team) |
| `closed` | Passed, invested, or relationship parked with outcome noted |
| `no response` | Sequence exhausted without reply |

*Align CSV / API values with your tooling; `/investors-crm` uses the labels above.*

## Rules

1. **Auto follow-up:** If **no reply** after **3 days** from last outbound, schedule **follow-up #1** (see [follow-up-sequences.md](follow-up-sequences.md)) and set **next follow-up** in CRM.  
2. **Attempt cap:** After **3 outbound attempts** with no reply, move to **`no response`**; optional long-dated nurture.  
3. **Track all interactions:** Every send, reply, and meeting — date + channel + one-line note — for clean handoffs and intros.  
4. **Replies:** On any reply, move to **`replied`**; update **last_contact_date** immediately.  
5. **Meeting booked:** Move to **`meeting`**; clear or set **next_follow_up** to pre-call prep if useful.

## Automation (manual or tool-assisted)

- **Reminder:** Daily view filtered by `next_follow_up <= today` and status not in `closed`, `no response`.  
- **No auto-send:** Do not automate email sends without compliance review; use sequences as **copy + timing**, human sends.

## LECIPM Manager copy guardrails

- Pipeline notes must not contain **invented KPIs**.  
- Use **illustrative** only for internal financial models, never pasted as facts to investors.
