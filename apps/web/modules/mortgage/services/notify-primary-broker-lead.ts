import { sendEmail } from "@/lib/email/send";

/** Optional email to the primary broker when a new mortgage lead is created. */
export async function notifyPrimaryBrokerNewMortgageLead(params: {
  brokerEmail: string;
  leadId: string;
  propertyPrice: number;
  intentLevel: string;
}): Promise<void> {
  const { brokerEmail, leadId, propertyPrice, intentLevel } = params;
  await sendEmail({
    to: brokerEmail,
    subject: "New mortgage lead received — LECIPM",
    html: `
      <p>You have a new mortgage lead.</p>
      <ul>
        <li><strong>Request ID:</strong> ${leadId}</li>
        <li><strong>Property price (CAD):</strong> ${propertyPrice.toLocaleString("en-CA")}</li>
        <li><strong>Intent:</strong> ${intentLevel}</li>
      </ul>
      <p>Open your <a href="${process.env.NEXT_PUBLIC_APP_URL ?? ""}/broker/dashboard">broker dashboard</a> to review and contact the client.</p>
    `,
  });
}
