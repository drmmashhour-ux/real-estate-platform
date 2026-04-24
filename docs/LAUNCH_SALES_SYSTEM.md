# Launch + sales system

## Routes

| Path | Purpose |
|------|---------|
| `/dashboard/admin/sales` | DM, call, closing, follow-up scripts (copy buttons) |
| `/dashboard/admin/daily` | Daily checklist + performance (leads/day, calls, deals) |
| `/dashboard/admin/content` | Content ideas + traffic strategy (FB, Marketplace, IG, TikTok) |
| `/dashboard/leads` | CRM table: **Contacted**, **last contact**, **notes**, **Copy DM**, **Call client**, **WhatsApp** |

## Lead fields (sales tracking)

Stored on `Lead`: `launchSalesContacted` (= **contacted**), `launchLastContactDate` (= **lastContactDate**), `launchNotes` (= **notes**). Patched via `PATCH /api/lecipm/leads`.

## Homepage

Hero CTAs: *Get pre-approved FREE*, *Talk to an expert*, *Find your property*. Chips: FREE mortgage help / consultation / evaluation. Testimonials: success stories & trust messages.

## Copy source of truth

`lib/launch/sales-scripts.ts` — CRM lead detail DMs use `lib/leads/dm-templates.ts` (same text).
