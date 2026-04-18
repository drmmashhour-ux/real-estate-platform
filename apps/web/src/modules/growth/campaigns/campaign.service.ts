import { prisma } from "@/lib/db";
import { engineFlags } from "@/config/feature-flags";
import { buildStaleBrokerLeadAudienceSample } from "../growth-audience.service";
import { GROWTH_V2 } from "../growth-v2.constants";
import { hasRecentCampaignCandidate } from "./campaign-dedupe";
import { isAudienceWithinCampaignCooldown } from "./campaign-frequency-policy";
import { logCampaignSuppression } from "./campaign-suppression-log.service";
import { findHighViewLowInquiryFsboSample } from "./campaign-audience.service";

/** Sampled dedupe rows in `campaign_suppression_logs` (full dedupe still increments `suppressed`). */
const DEDUPE_LOG_SAMPLE_BUDGET = 8;

/**
 * Generates campaign *candidates* with dedupe windows + optional cooldown from suppression logs — no bulk send.
 */
export async function scanGrowthCampaignCandidatesV2(): Promise<{ inserted: number; suppressed: number }> {
  if (!engineFlags.growthV2 || !engineFlags.campaignAutopilotV2) return { inserted: 0, suppressed: 0 };

  let inserted = 0;
  let suppressed = 0;
  const dedupeLogBudget = { remaining: DEDUPE_LOG_SAMPLE_BUDGET };

  const brokerHours = GROWTH_V2.CAMPAIGN_COOLDOWN_HOURS_BY_KIND.broker_followup;
  const brokerSince = new Date(Date.now() - brokerHours * 3600000);
  const hostHours = GROWTH_V2.CAMPAIGN_COOLDOWN_HOURS_BY_KIND.host_optimization_reminder;
  const hostSince = new Date(Date.now() - hostHours * 3600000);

  const leads = await buildStaleBrokerLeadAudienceSample(80);
  for (const l of leads) {
    if (inserted >= GROWTH_V2.MAX_CAMPAIGN_CANDIDATES_PER_RUN) break;

    const sessionKey = `lead:${l.leadId}`;

    if (
      await hasRecentCampaignCandidate({
        campaignKind: "broker_followup",
        targetType: "lead",
        targetId: l.leadId,
        since: brokerSince,
      })
    ) {
      suppressed++;
      if (dedupeLogBudget.remaining > 0) {
        dedupeLogBudget.remaining--;
        await logCampaignSuppression({
          userId: l.userId,
          sessionKey: l.userId ? undefined : sessionKey,
          campaignKind: "broker_followup",
          reason: "dedupe_recent_candidate",
          metadata: { leadId: l.leadId, windowHours: brokerHours, sampled: true },
        });
      }
      continue;
    }

    const cool = await isAudienceWithinCampaignCooldown({
      userId: l.userId,
      sessionKey: l.userId ? undefined : sessionKey,
      campaignKind: "broker_followup",
    });
    if (!cool.ok) {
      suppressed++;
      await logCampaignSuppression({
        userId: l.userId,
        sessionKey: l.userId ? undefined : sessionKey,
        campaignKind: "broker_followup",
        reason: cool.reason ?? "cooldown",
        metadata: { leadId: l.leadId },
      });
      continue;
    }

    await prisma.growthAutopilotCampaignCandidate.create({
      data: {
        campaignKind: "broker_followup",
        audienceKey: sessionKey,
        userId: l.userId,
        targetType: "lead",
        targetId: l.leadId,
        status: "candidate",
        metadataJson: {
          source: "growth_v2",
          leadScore: l.score,
          reasonSummary: `Broker follow-up candidate: score ${l.score}/100, no recent follow-up (10d+) or none logged — prioritization is rule-based, not a closing forecast.`,
        },
      },
    });
    inserted++;
  }

  const hv = await findHighViewLowInquiryFsboSample(30);
  for (const x of hv) {
    if (inserted >= GROWTH_V2.MAX_CAMPAIGN_CANDIDATES_PER_RUN) break;

    if (
      await hasRecentCampaignCandidate({
        campaignKind: "host_optimization_reminder",
        targetType: "fsbo_listing",
        targetId: x.listingId,
        since: hostSince,
      })
    ) {
      suppressed++;
      if (dedupeLogBudget.remaining > 0) {
        dedupeLogBudget.remaining--;
        const listingSession = `listing:${x.listingId}`;
        await logCampaignSuppression({
          sessionKey: listingSession,
          campaignKind: "host_optimization_reminder",
          reason: "dedupe_recent_candidate",
          metadata: { listingId: x.listingId, windowHours: hostHours, sampled: true },
        });
      }
      continue;
    }

    const listingSession = `listing:${x.listingId}`;
    const cool = await isAudienceWithinCampaignCooldown({
      sessionKey: listingSession,
      campaignKind: "host_optimization_reminder",
    });
    if (!cool.ok) {
      suppressed++;
      await logCampaignSuppression({
        sessionKey: listingSession,
        campaignKind: "host_optimization_reminder",
        reason: cool.reason ?? "cooldown",
        metadata: { listingId: x.listingId },
      });
      continue;
    }

    await prisma.growthAutopilotCampaignCandidate.create({
      data: {
        campaignKind: "host_optimization_reminder",
        audienceKey: listingSession,
        targetType: "fsbo_listing",
        targetId: x.listingId,
        status: "candidate",
        metadataJson: {
          source: "growth_v2",
          views: x.views,
          reasonSummary: `Host optimization: ${x.views} qualified listing views with at most ${GROWTH_V2.HOST_CAMPAIGN_MAX_LEADS} lead(s) — review photos, price, and CTA (editorial; outcomes not guaranteed).`,
        },
      },
    });
    inserted++;
  }

  return { inserted, suppressed };
}
