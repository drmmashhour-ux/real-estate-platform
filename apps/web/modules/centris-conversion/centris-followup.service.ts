import { prisma } from "@/lib/db";
import { getPublicAppUrl } from "@/lib/config/public-app-url";
import { sendTransactionalEmail } from "@/lib/email/provider";

import { resolveCentrisBrokerRouting } from "./centris-broker-routing.service";
import { enrichCentrisLeadSnapshot } from "./centris-enrich.service";
import { logConversion } from "./centris-funnel.log";
import { buildCentrisUrgencySignals } from "./centris-urgency.service";

/** Law 25: only call when lead capture recorded explicit marketing consent. */
export async function sendCentrisAnalysisFollowUpEmail(params: {
  toEmail: string;
  leadId: string;
  listingTitle?: string;
}): Promise<boolean> {
  try {
    const enrich = await enrichCentrisLeadSnapshot(params.leadId);
    const origin = getPublicAppUrl();
    const signupUrl = `${origin}/auth/signup?returnUrl=${encodeURIComponent("/dashboard/buyer")}`;

    const peerLinks = enrich.similarListingIds
      .slice(0, 5)
      .map((lid) => {
        const url = `${origin}/listings/${lid}`;
        return `<li><a href="${escapeHtml(url)}">${escapeHtml(url)}</a></li>`;
      })
      .join("");

    const peersBlock =
      peerLinks.length > 0
        ? `<p><strong>Similar listings to explore</strong> (examples only):</p><ul>${peerLinks}</ul>`
        : "";

    const html = `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
<p>Thanks for your interest${params.listingTitle ? ` in <strong>${escapeHtml(params.listingTitle)}</strong>` : ""}.</p>
<p><strong>Here is your initial property analysis snapshot</strong> (advisory only, not an appraisal):</p>
<ul>
<li>${escapeHtml(enrich.priceAnalysis)}</li>
<li>Deal signal: ${escapeHtml(enrich.dealRating)}</li>
</ul>
${peersBlock}
<p><a href="${escapeHtml(origin)}">Open your LECIPM workspace</a> — create an account to unlock saved searches, visits, and documents.</p>
<p><a href="${escapeHtml(signupUrl)}">Create your LECIPM account</a></p>
<p style="font-size:12px;color:#555">Sent because you opted in to analysis updates from Centris-attributed traffic.</p>
</body></html>`;

    await sendTransactionalEmail({
      to: params.toEmail,
      subject: "Your LECIPM property analysis",
      html,
      template: "centris_followup_analysis",
    });

    logConversion("followup_email_sent", { leadId: params.leadId });
    return true;
  } catch (e) {
    logConversion("followup_email_failed", {
      leadId: params.leadId,
      err: e instanceof Error ? e.message : "unknown",
    });
    return false;
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Day 2 — similar listings emphasis (marketing consent required). */
export async function sendCentrisSimilarListingsEmail(params: {
  toEmail: string;
  leadId: string;
  listingTitle?: string;
}): Promise<boolean> {
  try {
    const enrich = await enrichCentrisLeadSnapshot(params.leadId);
    const origin = getPublicAppUrl();
    const peerLinks = enrich.similarListingIds
      .slice(0, 7)
      .map((lid) => {
        const url = `${origin}/listings/${lid}`;
        return `<li><a href="${escapeHtml(url)}">${escapeHtml(url)}</a></li>`;
      })
      .join("");
    const html = `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
<p>Still comparing${params.listingTitle ? ` near <strong>${escapeHtml(params.listingTitle)}</strong>` : ""}?</p>
${peerLinks ? `<p><strong>Similar active listings</strong> you may want to shortlist:</p><ul>${peerLinks}</ul>` : "<p>We’ll keep surfacing fresh inventory that matches your search.</p>"}
<p><a href="${escapeHtml(origin)}">Return to LECIPM</a> to save homes and book visits.</p>
<p style="font-size:12px;color:#555">Centris conversion sequence · similar listings touchpoint.</p>
</body></html>`;
    await sendTransactionalEmail({
      to: params.toEmail,
      subject: "Similar listings you might like",
      html,
      template: "centris_followup_similar",
    });
    logConversion("followup_d2_sent", { leadId: params.leadId });
    return true;
  } catch (e) {
    logConversion("followup_d2_failed", {
      leadId: params.leadId,
      err: e instanceof Error ? e.message : "unknown",
    });
    return false;
  }
}

/** Day 3 — urgency injection (marketing consent required). */
export async function sendCentrisUrgencyFollowUpEmail(params: {
  toEmail: string;
  leadId: string;
  listingId: string;
  listingTitle?: string;
}): Promise<boolean> {
  try {
    const urgency = await buildCentrisUrgencySignals(params.listingId);
    const origin = getPublicAppUrl();
    const html = `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
<p><strong>Market pulse</strong>${params.listingTitle ? ` for ${escapeHtml(params.listingTitle)}` : ""}</p>
<p>${escapeHtml(urgency.emailParagraph)}</p>
<ul>${urgency.stripLines.slice(0, 4).map((l) => `<li>${escapeHtml(l)}</li>`).join("")}</ul>
<p><a href="${escapeHtml(origin)}">Continue on LECIPM</a></p>
<p style="font-size:12px;color:#555">Centris conversion sequence · urgency touchpoint.</p>
</body></html>`;
    await sendTransactionalEmail({
      to: params.toEmail,
      subject: "Movement on listings you viewed",
      html,
      template: "centris_followup_urgency",
    });
    logConversion("followup_d3_sent", { leadId: params.leadId });
    return true;
  } catch (e) {
    logConversion("followup_d3_failed", {
      leadId: params.leadId,
      err: e instanceof Error ? e.message : "unknown",
    });
    return false;
  }
}

/** Day 5 — broker invitation (routes to listing broker — no duplicate CRM assignment). */
export async function sendCentrisBrokerInvitationEmail(params: {
  toEmail: string;
  leadId: string;
  listingTitle?: string;
}): Promise<boolean> {
  try {
    const routing = await resolveCentrisBrokerRouting(params.leadId);
    const broker =
      routing.bestBrokerId != null
        ? await prisma.user.findUnique({
            where: { id: routing.bestBrokerId },
            select: { name: true, email: true },
          })
        : null;
    const origin = getPublicAppUrl();
    const html = `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
<p>You showed serious interest${params.listingTitle ? ` in <strong>${escapeHtml(params.listingTitle)}</strong>` : ""}.</p>
<p>${broker?.name ? `${escapeHtml(broker.name)}, your listing broker on LECIPM, can coordinate showings and paperwork.` : "Your broker partner can finalize next steps directly on-platform."}</p>
<p style="font-size:13px;color:#444">${escapeHtml(routing.routingReason)}</p>
<p><a href="${escapeHtml(origin)}">Open your LECIPM workspace</a></p>
<p style="font-size:12px;color:#555">Centris conversion sequence · broker invitation.</p>
</body></html>`;
    await sendTransactionalEmail({
      to: params.toEmail,
      subject: "Connect with your broker on this listing",
      html,
      template: "centris_followup_broker_invite",
    });
    logConversion("followup_d5_sent", { leadId: params.leadId });
    return true;
  } catch (e) {
    logConversion("followup_d5_failed", {
      leadId: params.leadId,
      err: e instanceof Error ? e.message : "unknown",
    });
    return false;
  }
}

export async function scheduleCentrisLeadDominationSequence(params: {
  leadId: string;
  consentMarketing: boolean;
}): Promise<void> {
  if (!params.consentMarketing) return;

  const offsets: { jobKey: string; hours: number }[] = [
    { jobKey: "centris_domination_d2_similar", hours: 48 },
    { jobKey: "centris_domination_d3_urgency", hours: 72 },
    { jobKey: "centris_domination_d5_broker_invite", hours: 120 },
  ];

  const base = Date.now();
  for (const { jobKey, hours } of offsets) {
    const exists = await prisma.leadFollowUpJob.findFirst({
      where: { leadId: params.leadId, jobKey },
    });
    if (exists) continue;

    await prisma.leadFollowUpJob.create({
      data: {
        leadId: params.leadId,
        jobKey,
        scheduledFor: new Date(base + hours * 3600000),
        status: "pending",
      },
    });
  }

  logConversion("domination_sequence_scheduled", { leadId: params.leadId });
}

async function listingTitleForLead(leadId: string): Promise<{ title: string | undefined; listingId: string | null }> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { fsboListingId: true, listingId: true },
  });
  if (!lead) return { title: undefined, listingId: null };

  const lid = lead.fsboListingId ?? lead.listingId;
  if (!lid) return { title: undefined, listingId: null };

  if (lead.fsboListingId) {
    const fsbo = await prisma.fsboListing.findUnique({
      where: { id: lead.fsboListingId },
      select: { title: true },
    });
    return { title: fsbo?.title ?? undefined, listingId: lid };
  }

  const crm = await prisma.listing.findUnique({
    where: { id: lead.listingId as string },
    select: { title: true },
  });
  return { title: crm?.title ?? undefined, listingId: lid };
}

/** Processes pending Centris domination jobs — suitable for cron / internal dispatch. */
export async function processDueCentrisDominationJobs(limit = 25): Promise<number> {
  const jobs = await prisma.leadFollowUpJob.findMany({
    where: {
      status: "pending",
      scheduledFor: { lte: new Date() },
      jobKey: { startsWith: "centris_domination_" },
    },
    orderBy: { scheduledFor: "asc" },
    take: limit,
    include: {
      lead: {
        select: {
          email: true,
          optedOutOfFollowUp: true,
        },
      },
    },
  });

  let processed = 0;

  for (const job of jobs) {
    const email = job.lead.email?.trim();
    if (!email || email.includes("@phone-only.invalid") || email.includes("@lecipm.local")) {
      await prisma.leadFollowUpJob.update({
        where: { id: job.id },
        data: { status: "skipped", processedAt: new Date(), lastError: "no_email" },
      });
      continue;
    }

    if (job.lead.optedOutOfFollowUp) {
      await prisma.leadFollowUpJob.update({
        where: { id: job.id },
        data: { status: "skipped", processedAt: new Date(), lastError: "opt_out" },
      });
      continue;
    }

    const meta = await listingTitleForLead(job.leadId);
    const listingId = meta.listingId ?? "";

    try {
      if (job.jobKey === "centris_domination_d2_similar") {
        await sendCentrisSimilarListingsEmail({
          toEmail: email,
          leadId: job.leadId,
          listingTitle: meta.title,
        });
      } else if (job.jobKey === "centris_domination_d3_urgency") {
        if (!listingId) throw new Error("missing_listing");
        await sendCentrisUrgencyFollowUpEmail({
          toEmail: email,
          leadId: job.leadId,
          listingId,
          listingTitle: meta.title,
        });
      } else if (job.jobKey === "centris_domination_d5_broker_invite") {
        await sendCentrisBrokerInvitationEmail({
          toEmail: email,
          leadId: job.leadId,
          listingTitle: meta.title,
        });
      }

      await prisma.leadFollowUpJob.update({
        where: { id: job.id },
        data: { status: "completed", processedAt: new Date(), lastError: null },
      });
      processed++;
    } catch (e) {
      await prisma.leadFollowUpJob.update({
        where: { id: job.id },
        data: {
          status: "failed",
          processedAt: new Date(),
          lastError: e instanceof Error ? e.message : "unknown",
        },
      });
    }
  }

  return processed;
}
