# Growth Autopilot v2

Scalable traffic, re-engagement, referrals, and experimentation — **review-first**, **flag-gated**, **auditable**. Extends v1 modules under `apps/web/src/modules/growth/` without removing legacy flows.

## 1. Files created (summary)

| Area | Path |
|------|------|
| Core v2 | `growth-v2.types.ts`, `growth-v2.constants.ts`, `growth-v2.service.ts`, `growth-eligibility.service.ts`, `growth-audience.service.ts`, `growth-priority.service.ts`, `growth-orchestrator.ts` |
| SEO | `seo/seo-page-quality.service.ts`, `seo-page-template.service.ts`, `seo-page-generator.service.ts`, `seo-page-candidate-expander.ts`, `seo-page-publisher.service.ts` (+ v1 `seo-candidate.service.ts` extended) |
| Referrals | `referrals/referral.types.ts`, `referral.service.ts`, `referral-attribution.service.ts`, `referral-reward.service.ts`, `referral-eligibility.service.ts` |
| Social | `social/social-content.types.ts`, `social-content.service.ts`, `social-caption.service.ts`, `social-asset-selector.service.ts`, `social-candidate.service.ts` |
| Campaigns | `campaigns/campaign.types.ts`, `campaign.service.ts`, `campaign-audience.service.ts`, `campaign-delivery-policy.ts`, `campaign-frequency-policy.ts` |
| Experiments | `../experiments/experiment.types.ts`, `experiment.service.ts`, `assignment.service.ts`, `metric-evaluator.service.ts`, `experiment-guardrails.ts` |
| Admin | `app/[locale]/[country]/admin/growth-autopilot-v2/page.tsx` |
| APIs | `app/api/internal/growth-v2/**`, `app/api/internal/experiments/aggregate/route.ts` |

## 2. Prisma schema

**Extended** `SeoPageOpportunity` (transaction type, budget, bedroom, `pageFamily`, `seoScoresJson`, `duplicateRiskScore`, `lastEvaluatedAt`, relations).

**New**: `SeoPageDraft`, `SeoPagePublishLog`, `SocialContentCandidate`, `GrowthAutopilotCampaignCandidate`, `ReferralGrowthAttribution`, `CampaignSuppressionLog`, `ExperimentResultSnapshot`.

## 3. Migration

`20260403200000_growth_autopilot_v2`

## 4. Internal endpoints

| Route | Role |
|-------|------|
| `POST /api/internal/growth-v2/orchestrator` | Full v2 scan summary |
| `POST /api/internal/growth-v2/seo/scan` | SEO candidate expansion |
| `POST /api/internal/growth-v2/seo/generate-drafts` | Draft generation batch |
| `POST /api/internal/growth-v2/referrals/scan` | Referral abuse queue count |
| `POST /api/internal/growth-v2/social/scan` | Social candidates |
| `POST /api/internal/growth-v2/campaigns/scan` | Campaign candidates |
| `POST /api/internal/experiments/aggregate` | `{ experimentId }` → snapshot |

Auth: `Authorization: Bearer CRON_SECRET`.

## 5. Feature flags (`engineFlags`)

`growthV2`, `seoPageGeneratorV2`, `seoDraftGenerationV2`, `referralEngineV2`, `socialContentAutopilotV2`, `campaignAutopilotV2`, `experimentsV1`, `experimentRankingVariantsV1`, `experimentCampaignCopyV1`, `seoAutoPublishTrusted` (default off).

## 6. SEO scoring

Component scores (0–100) from **inventory-derived** stats: inventory strength, diversity, freshness, content support (images), business value blend, internal linking potential. Combined into `overallSeoOpportunityScore` in `seo-page-quality.service.ts`. No market “trend” claims.

## 7. Referral attribution

`recordReferralAttributionV2` writes `ReferralGrowthAttribution` with **suspicion scoring** (self-referral, rapid repeat). Rewards use **placeholder** `ReferralReward` rows until billing integration (**TODO v3**).

## 8. Social candidates

FSBO listings with sufficient real images; asset picker uses listing URLs only; captions are template-based with compliance notes. **No auto-post.**

## 9. Campaign candidates / suppression

`scanGrowthCampaignCandidatesV2` inserts `GrowthAutopilotCampaignCandidate`. `campaign-frequency-policy` uses `CampaignSuppressionLog` for cooldowns. Delivery gated by `campaign-delivery-policy` (opt-out hooks **TODO** when prefs wired).

## 10. Experiment assignment

`getOrCreateExperimentAssignment` — deterministic SHA-256 pick from variant keys; sticky `ExperimentAssignment` per `experimentId` + `sessionId`. Metrics aggregated by `eventName` counts.

## 11. Manual QA

- [ ] `pnpm exec prisma validate` && `prisma migrate deploy` (staging)
- [ ] Enable flags in `.env` and hit orchestrator — non-zero only with real data
- [ ] Confirm SEO drafts never set `publishStatus=published` without `FEATURE_SEO_AUTO_PUBLISH_TRUSTED`
- [ ] Social rows stay `ready_for_review`
- [ ] Experiment aggregate creates `ExperimentResultSnapshot`

## 12. Limitations / next

- Multilingual SEO (**TODO v3**), ML campaign targeting, auto-schedule social after approval, referral payout integration, experiment auto-winner, analytics-grounded market copy.

## TODO v3

- Multilingual SEO page generation  
- ML-based campaign targeting  
- Auto-scheduling social posts after approval  
- Referral reward payout integration  
- Experiment auto-winner selection  
- Market-insight copy grounded in verified analytics  
