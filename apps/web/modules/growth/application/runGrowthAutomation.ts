import { prisma } from "@/lib/db";
import { isGrowthAutomationEnabled } from "@/lib/feature-flags/revenue-growth";
import { sendGrowthPlainEmail } from "../infrastructure/emailService";
import { GrowthTriggerKey } from "../domain/growthRules";
import {
  findHighScoreWithoutSubscription,
  findIncompleteBnhubListings,
  findNewUsersForOnboarding,
  findUsersInactiveWithListings,
} from "../infrastructure/triggerService";

export type GrowthAutomationRunResult = {
  enabled: boolean;
  sent: number;
  skipped: number;
  failed: number;
};

function periodKeyWeekly(): string {
  const d = new Date();
  const oneJan = new Date(d.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - oneJan.getTime()) / 86400000 + oneJan.getUTCDay() + 1) / 7);
  return `${d.getUTCFullYear()}-W${week}`;
}

/**
 * Evaluates growth triggers with caps per run. Idempotent per user per trigger period (where applicable).
 */
export async function runGrowthAutomation(options?: { limitPerTrigger?: number }): Promise<GrowthAutomationRunResult> {
  const limit = options?.limitPerTrigger ?? 25;
  if (!isGrowthAutomationEnabled()) {
    return { enabled: false, sent: 0, skipped: 0, failed: 0 };
  }

  let sent = 0;
  let skipped = 0;
  let failed = 0;
  const week = periodKeyWeekly();

  const inactive = await findUsersInactiveWithListings(prisma, limit);
  for (const u of inactive) {
    const idem = `${GrowthTriggerKey.INACTIVE_3D_LISTING}:${u.id}:${week}`;
    const r = await sendGrowthPlainEmail({
      userId: u.id,
      to: u.email,
      triggerKey: GrowthTriggerKey.INACTIVE_3D_LISTING,
      idempotencyKey: idem,
      subject: "Your listing needs attention — LECIPM",
      body: `Hi,\n\nWe noticed you haven't been active recently. Log in to refresh your listing, respond to guests, and keep your calendar accurate.\n\n— LECIPM`,
    });
    if (r.ok && r.skipped) skipped += 1;
    else if (r.ok) sent += 1;
    else failed += 1;
  }

  const incomplete = await findIncompleteBnhubListings(prisma, limit);
  for (const row of incomplete) {
    if (!row.owner?.email) continue;
    const idem = `${GrowthTriggerKey.LISTING_INCOMPLETE}:${row.id}:${week}`;
    const r = await sendGrowthPlainEmail({
      userId: row.ownerId,
      to: row.owner.email,
      triggerKey: GrowthTriggerKey.LISTING_INCOMPLETE,
      idempotencyKey: idem,
      subject: "Complete your listing to improve trust — LECIPM",
      body: `Hi,\n\nYour BNHub listing "${row.title?.slice(0, 80) ?? "listing"}" is still in draft. Complete photos, description, and verification to improve trust and visibility.\n\n— LECIPM`,
    });
    if (r.ok && r.skipped) skipped += 1;
    else if (r.ok) sent += 1;
    else failed += 1;
  }

  const highNoSub = await findHighScoreWithoutSubscription(prisma, limit);
  for (const row of highNoSub) {
    const idem = `${GrowthTriggerKey.HIGH_SCORE_NO_UPGRADE}:${row.userId}:${week}`;
    const r = await sendGrowthPlainEmail({
      userId: row.userId,
      to: row.email,
      triggerKey: GrowthTriggerKey.HIGH_SCORE_NO_UPGRADE,
      idempotencyKey: idem,
      subject: "Unlock full LECIPM workspace features",
      body: `Hi,\n\nYou're getting strong engagement (score ${row.score}). Upgrade to Pro to unlock the full workspace, Copilot depth, and TrustGraph tooling.\n\n— LECIPM`,
    });
    if (r.ok && r.skipped) skipped += 1;
    else if (r.ok) sent += 1;
    else failed += 1;
  }

  const newUsers = await findNewUsersForOnboarding(prisma, limit);
  for (const u of newUsers) {
    const idem = `${GrowthTriggerKey.ONBOARDING_NEW_USER}:${u.id}`;
    const r = await sendGrowthPlainEmail({
      userId: u.id,
      to: u.email,
      triggerKey: GrowthTriggerKey.ONBOARDING_NEW_USER,
      idempotencyKey: idem,
      subject: "Welcome to LECIPM — get started",
      body: `Hi${u.name ? ` ${u.name}` : ""},\n\nWelcome to LECIPM. Complete your profile, add a listing or run the Deal Analyzer to see your first insights.\n\n— LECIPM`,
    });
    if (r.ok && r.skipped) skipped += 1;
    else if (r.ok) sent += 1;
    else failed += 1;
  }

  return { enabled: true, sent, skipped, failed };
}
