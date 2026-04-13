/**
 * Professional email templates – polite, prestige, luxury real estate tone.
 * All content structured and suitable for LECIPM.
 */

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type LeadNotificationData = {
  name: string;
  email: string;
  phone: string;
  message: string;
  /** Immutable public BNHUB listing id (LEC-#####) when inquiry is listing-scoped */
  listingCode?: string | null;
  /** Deep link to the listing (optional) */
  listingUrl?: string | null;
};

/**
 * Lead notification email (to team/broker).
 * Subject: New Client Inquiry – LECIPM
 */
export function leadNotificationEmail(data: LeadNotificationData): { subject: string; html: string } {
  const name = escapeHtml(data.name);
  const email = escapeHtml(data.email);
  const phone = escapeHtml(data.phone);
  const message = escapeHtml(data.message);
  const code = data.listingCode?.trim();
  const url = data.listingUrl?.trim();
  const listingBlock =
    code || url
      ? `<p><strong>Listing:</strong></p><ul>${
          code ? `<li>Listing ID: <code style="font-size:13px;">${escapeHtml(code)}</code></li>` : ""
        }${
          url
            ? `<li><a href="${escapeHtml(url)}" style="color:#0f766e;">Open listing</a></li>`
            : ""
        }</ul>`
      : "";
  const subject = "New Client Inquiry – LECIPM";
  const html = `
<p>Dear Team,</p>
<p>You have received a new client inquiry through the platform.</p>
<p><strong>Client Details:</strong></p>
<ul>
  <li>Name: ${name}</li>
  <li>Email: ${email}</li>
  <li>Phone: ${phone}</li>
</ul>
${listingBlock}
<p><strong>Message:</strong></p>
<p>"${message}"</p>
<p>Please follow up with the client at your earliest convenience.</p>
<p>Best regards,<br>LECIPM Platform</p>
  `.trim();
  return { subject, html };
}

export type ReservationNotificationData = {
  project: string;
  unit: string;
  name: string;
  email: string;
  phone: string;
};

/**
 * Reservation notification email (to team).
 * Subject: New Unit Reservation Request
 */
export function reservationNotificationEmail(
  data: ReservationNotificationData
): { subject: string; html: string } {
  const project = escapeHtml(data.project);
  const unit = escapeHtml(data.unit);
  const name = escapeHtml(data.name);
  const email = escapeHtml(data.email);
  const phone = escapeHtml(data.phone);
  const subject = "New Unit Reservation Request";
  const html = `
<p>Dear Team,</p>
<p>A new reservation request has been submitted.</p>
<p><strong>Project:</strong> ${project}<br>
<strong>Unit:</strong> ${unit}</p>
<p><strong>Client Details:</strong></p>
<ul>
  <li>Name: ${name}</li>
  <li>Email: ${email}</li>
  <li>Phone: ${phone}</li>
</ul>
<p>Please review and proceed accordingly.</p>
<p>Best regards,<br>LECIPM Platform</p>
  `.trim();
  return { subject, html };
}

export type ClientConfirmationData = {
  name: string;
};

/**
 * Client confirmation email (to client).
 * Subject: Thank You for Your Inquiry – LECIPM
 */
export function clientConfirmationEmail(data: ClientConfirmationData): {
  subject: string;
  html: string;
} {
  const name = escapeHtml(data.name);
  const subject = "Thank You for Your Inquiry – LECIPM";
  const html = `
<p>Dear ${name},</p>
<p>Thank you for your interest in our properties.</p>
<p>We have successfully received your request, and a member of our team will contact you shortly to assist you further.</p>
<p>We look forward to helping you find the perfect opportunity.</p>
<p>Warm regards,<br>LECIPM</p>
  `.trim();
  return { subject, html };
}

/**
 * ImmoContact — immediate acknowledgement (public “Contact broker” flow).
 */
export function immoContactAckEmail(data: { name: string; listingTitle?: string | null }): {
  subject: string;
  html: string;
} {
  const name = escapeHtml(data.name);
  const title = data.listingTitle ? escapeHtml(data.listingTitle) : null;
  const subject = "We received your message — a broker will follow up";
  const html = `
<p>Dear ${name},</p>
<p><strong>Thanks! A broker will contact you shortly 👍 Usually within a few minutes.</strong></p>
${title ? `<p>Regarding: <em>${title}</em></p>` : ""}
<p>If your request is urgent, reply to this email or call the number on the listing page.</p>
<p>Warm regards,<br>LECIPM</p>
  `.trim();
  return { subject, html };
}

export type FormSubmissionNotificationData = {
  formType: string;
  submissionId: string;
  clientName?: string | null;
  clientEmail?: string | null;
};

/**
 * Form submission notification (to admin).
 * Subject: New Form Submission – [formType] – [submissionId]
 */
export function formSubmissionNotificationEmail(data: FormSubmissionNotificationData): {
  subject: string;
  html: string;
} {
  const formType = escapeHtml(data.formType);
  const id = escapeHtml(data.submissionId);
  const name = data.clientName ? escapeHtml(data.clientName) : "—";
  const email = data.clientEmail ? escapeHtml(data.clientEmail) : "—";
  const subject = `New Form Submission – ${formType} – ${id.slice(0, 8)}`;
  const html = `
<p>Dear Admin,</p>
<p>A new form submission has been received.</p>
<p><strong>Form type:</strong> ${formType}<br>
<strong>Submission ID:</strong> ${id}</p>
<p><strong>Client:</strong> ${name}<br>
<strong>Email:</strong> ${email}</p>
<p>Please review and process the submission in the admin dashboard.</p>
<p>Best regards,<br>Platform Notifications</p>
  `.trim();
  return { subject, html };
}

export type FormStatusUpdateData = {
  formType: string;
  submissionId: string;
  status: string;
  clientName?: string | null;
};

/**
 * Form status update email (to client).
 * Polite notice that their submission status has been updated.
 */
export function formStatusUpdateEmail(data: FormStatusUpdateData): { subject: string; html: string } {
  const formType = escapeHtml(data.formType);
  const status = escapeHtml(data.status);
  const name = data.clientName ? escapeHtml(data.clientName) : "Valued Client";
  const subject = `Update on your ${formType} form submission`;
  const html = `
<p>Dear ${name},</p>
<p>This is to inform you that the status of your submitted form (${formType}) has been updated.</p>
<p><strong>New status:</strong> ${status}</p>
<p>If you have any questions, please do not hesitate to contact us.</p>
<p>Best regards,<br>LECIPM</p>
  `.trim();
  return { subject, html };
}
