import { prisma } from "@/lib/db";
import { sendEmail, getReplyToEmail } from "@/lib/email/resend";
import { getSiteBaseUrl } from "@/modules/seo/lib/siteBaseUrl";

/**
 * Lightweight post-booking thank-you (automation). Skips if Resend not configured.
 */
export async function sendBnhubBookingThanksEmail(leadId: string): Promise<boolean> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      email: true,
      name: true,
      optedOutOfFollowUp: true,
      shortTermListingId: true,
      listingCode: true,
    },
  });
  if (!lead?.email || lead.optedOutOfFollowUp) return false;

  const listing = lead.shortTermListingId
    ? await prisma.shortTermListing.findUnique({
        where: { id: lead.shortTermListingId },
        select: { title: true, city: true, listingCode: true },
      })
    : null;

  const first = lead.name?.trim().split(/\s+/)[0] || "there";
  const stay = listing?.title ?? "your stay";
  const city = listing?.city ? ` in ${listing.city}` : "";
  const base = getSiteBaseUrl();
  const code = listing?.listingCode ?? lead.listingCode;

  const plainBody = [
    `Hi ${first},`,
    ``,
    `Thanks for confirming ${stay}${city} on LECIPM. Your host has been notified.`,
    code ? `Reference: ${code}` : "",
    ``,
    `Manage trips: ${base}/bnhub/trips`,
    ``,
    `— LECIPM`,
  ]
    .filter(Boolean)
    .join("\n");

  const html = `<p>Hi ${first},</p>
<p>Thanks for confirming <strong>${stay}</strong>${city} on LECIPM. Your host has been notified.</p>
${code ? `<p>Reference: <strong>${code}</strong></p>` : ""}
<p><a href="${base}/bnhub/trips">View your trips</a></p>
<p>— LECIPM</p>`;

  const ok = await sendEmail({
    to: lead.email,
    subject: `Booking confirmed — ${stay}`,
    html,
    replyTo: getReplyToEmail(),
  });
  if (!ok) return false;

  await prisma.leadCommMessage
    .create({
      data: {
        leadId,
        direction: "outbound",
        channel: "email",
        templateKey: "bnhub_booking_thanks",
        body: plainBody,
        status: "sent",
      },
    })
    .catch(() => {});

  await prisma.lead
    .update({
      where: { id: leadId },
      data: { lastAutomationEmailAt: new Date() },
    })
    .catch(() => {});

  return true;
}
