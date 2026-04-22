/**
 * Nurture sequences (Day 1 welcome → Day 2 value → Day 3 demo → Day 5 case study).
 * Steps map to offsets (full days since enroll): 0, 1, 2, 4.
 */
import { prisma } from "@/lib/db";
import { logError, logInfo } from "@/lib/logger";
import { sendEmail } from "@/lib/email/resend";
import { getSiteBaseUrl } from "@/modules/seo/lib/siteBaseUrl";

const TAG = "[growth.emailAutomation]";

/** Minimum calendar days since enroll required before sending step `stepIndex` (1-based). */
const STEP_DAY_OFFSET: Record<number, number> = {
  1: 0,
  2: 1,
  3: 2,
  4: 4,
};

export async function enrollEmailNurture(email: string): Promise<void> {
  const norm = email.trim().toLowerCase().slice(0, 320);
  await prisma.lecipmGrowthEmailNurture.upsert({
    where: { email: norm },
    create: { email: norm, nextStep: 1 },
    update: {},
  });
}

/** Send step 1 immediately when capture enrolls (offset 0). */
export async function triggerWelcomeAfterCapture(email: string): Promise<void> {
  const norm = email.trim().toLowerCase().slice(0, 320);
  const row = await prisma.lecipmGrowthEmailNurture.findUnique({ where: { email: norm } });
  if (!row) return;
  await sendNextNurtureEmail(row.id);
}

function daysSince(d: Date): number {
  return Math.floor((Date.now() - d.getTime()) / 86_400_000);
}

function htmlBody(step: number, demoUrl: string): { subject: string; html: string } {
  const brand = "LECIPM";
  switch (step) {
    case 1:
      return {
        subject: `Welcome to ${brand} — your growth workspace`,
        html: `<p>Hi,</p><p>Thanks for joining the ${brand} growth list. You’ll get practical plays for broker productivity, closing automation, and compliant deal files.</p><p>— Team ${brand}</p>`,
      };
    case 2:
      return {
        subject: "The value in one sentence",
        html: `<p>Hi,</p><p><strong>${brand}</strong> ties listings, conversations, and transaction files so you stop losing context between tools.</p><p>Reply with your biggest bottleneck — we read every note.</p>`,
      };
    case 3:
      return {
        subject: "See the product walkthrough",
        html: `<p>Hi,</p><p>When you’re ready, start here: <a href="${demoUrl}">${demoUrl}</a></p><p>Bring a live deal scenario — we’ll map it to milestones.</p>`,
      };
    case 4:
      return {
        subject: "Case study pattern (template)",
        html: `<p>Hi,</p><p>Teams that win reduce coordination drag: fewer handoffs, clearer documents, measurable cycle time.</p><p>We’ll share anonymized benchmarks as you onboard.</p>`,
      };
    default:
      return {
        subject: `${brand} update`,
        html: `<p>Hi,</p><p>Update from ${brand}.</p>`,
      };
  }
}

/** Send the next eligible email for a nurture row (if due). */
export async function sendNextNurtureEmail(rowId: string): Promise<{ sent: boolean; reason?: string }> {
  const row = await prisma.lecipmGrowthEmailNurture.findUnique({ where: { id: rowId } });
  if (!row) return { sent: false, reason: "not_found" };
  if (row.nextStep > 4) return { sent: false, reason: "complete" };

  const required = STEP_DAY_OFFSET[row.nextStep];
  if (required === undefined) return { sent: false, reason: "bad_step" };
  if (daysSince(row.enrolledAt) < required) return { sent: false, reason: "not_due" };

  const base = getSiteBaseUrl().replace(/\/$/, "");
  const demoUrl = `${base}/en/ca/onboarding/broker`;

  const { subject, html } = htmlBody(row.nextStep, demoUrl);
  const ok = await sendEmail({ to: row.email, subject, html });

  if (!ok) {
    logInfo(TAG, { email: row.email, step: row.nextStep, sent: false });
    return { sent: false, reason: "send_failed" };
  }

  await prisma.lecipmGrowthEmailNurture.update({
    where: { id: row.id },
    data: {
      lastSentAt: new Date(),
      nextStep: row.nextStep + 1,
    },
  });

  logInfo(TAG, { email: row.email, step: row.nextStep, sent: true });
  return { sent: true };
}

/** Process all enrollments — call from cron / admin. */
export async function processNurtureOutbox(limit = 200): Promise<{ processed: number; sends: number }> {
  const rows = await prisma.lecipmGrowthEmailNurture.findMany({
    where: { nextStep: { lte: 4 } },
    take: limit,
    orderBy: { enrolledAt: "asc" },
  });

  let sends = 0;
  for (const r of rows) {
    try {
      const required = STEP_DAY_OFFSET[r.nextStep];
      if (required === undefined) continue;
      if (daysSince(r.enrolledAt) < required) continue;
      const out = await sendNextNurtureEmail(r.id);
      if (out.sent) sends++;
    } catch (e) {
      logError(TAG, { error: e, id: r.id });
    }
  }

  logInfo(TAG, { processed: rows.length, sends });
  return { processed: rows.length, sends };
}
