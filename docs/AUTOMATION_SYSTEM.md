# LECIPM lead automation

## Engine

- **Module:** `apps/web/lib/automation/engine.ts`
- **Events:** `evaluation_submitted`, `lead_created`, `lead_updated`, `CTA_clicked`, `call_clicked`, `whatsapp_clicked`
- **Rules:** Fire-and-forget from API routes; errors are logged only (does not block user flows).
- **Scoring:** `refreshLeadAutomationScoring` uses a stable base from `aiExplanation` (`merged.merged`, `crmScoring.score`, or `form.score`) plus engagement / intent / deal-value bonuses so repeated refreshes do not compound.

## Email sequence (evaluation)

1. **Instant:** `sendPropertyEstimateEmailToUser` — subject: *Your property estimate is ready*; sets `evaluationEmailStatus: instant_sent` when Resend succeeds.
2. **24h / 72h:** `scheduleEvaluationEmailJobs` schedules drip jobs; automated sends update `evaluationEmailStatus` and `lastAutomationEmailAt`.

## CRM UI

- **Lead detail:** Automation card — recommended action, DM suggestions, open tasks (complete via `completeAutomationTaskId` on `PATCH /api/leads`).
- **Leads list:** “Urgent leads”, daily pulse, broker notifications, insights (from `GET /api/leads/summary` → `automation`).

## Database

- Apply migrations (includes `lead_automation_tasks` and lead columns), then `npx prisma generate`.

```bash
cd apps/web && npx prisma migrate deploy && npx prisma generate
```

## Validation checklist

- Submit `/evaluate` → lead row has tasks + drip scheduled + automation event fired.
- `PATCH` pipeline / DM replied / meeting → pipeline hooks and tasks update.
- Track API with `meta.leadId` → engagement / automation events.

## Launch first growth campaign (admin)

1. Sign in as **ADMIN** → **`/admin/growth`**
2. Click **Launch first campaign** (or `POST /api/admin/growth/campaigns/launch-first`)
3. Copy the generated URLs (they set first-touch attribution for `Lead.source` / `campaign` / `medium`)

`PATCH /api/admin/growth/campaigns/:id` with `{ "status": "ACTIVE" | "PAUSED" | "ENDED" }` to control lifecycle.
