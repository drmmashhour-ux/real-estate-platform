import { sendTransactionalEmail } from "@/lib/email/provider";

export async function sendBookingNotificationEmails(input: {
  leadName: string;
  leadEmail: string;
  listingTitle: string | null;
  brokerEmail: string | null;
  brokerName: string | null;
  start: Date;
}): Promise<void> {
  const when = input.start.toLocaleString("en-CA", { timeZone: "America/Toronto" });
  const title = input.listingTitle ?? "Property visit";

  if (input.leadEmail && !input.leadEmail.includes("@phone-only.invalid")) {
    const html = `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
<p><strong>Visit request confirmed</strong></p>
<p>${title}</p>
<p>Time: ${when}</p>
<p style="font-size:12px;color:#555">Scheduling is managed by the LECIPM platform; your listing broker finalizes showings and compliance.</p>
</body></html>`;
    void sendTransactionalEmail({
      to: input.leadEmail,
      subject: `Visit confirmed — ${title}`,
      html,
      template: "lecipm_visit_confirmed_buyer",
    });
  }

  if (input.brokerEmail) {
    const html = `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
<p><strong>New visit scheduled</strong></p>
<p>Lead: ${input.leadName}</p>
<p>Listing: ${title}</p>
<p>Time: ${when}</p>
</body></html>`;
    void sendTransactionalEmail({
      to: input.brokerEmail,
      subject: `Visit scheduled — ${title}`,
      html,
      template: "lecipm_visit_confirmed_broker",
    });
  }
}

export async function sendAdminHighValueAlert(input: {
  leadName: string;
  listingTitle: string | null;
  when: string;
  adminEmail: string;
}): Promise<void> {
  const html = `<p>High-value lead visit: ${input.leadName} — ${input.listingTitle ?? "listing"} at ${input.when}</p>`;
  void sendTransactionalEmail({
    to: input.adminEmail,
    subject: "LECIPM: visit booking alert",
    html,
    template: "lecipm_visit_admin_alert",
  });
}
