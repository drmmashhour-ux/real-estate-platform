/**
 * Optional: send email when user reaches 80% or 100% storage.
 * Wire to your email provider (SendGrid, Resend, etc.).
 */

export async function sendStorageAlertEmail(
  userId: string,
  percent: number,
  usedBytes: number,
  limitBytes: number
): Promise<void> {
  if (percent >= 100) {
    // TODO: send "Storage full — upload blocked" email
    console.info("[Storage alert] User", userId, "reached 100% storage. Used:", usedBytes, "Limit:", limitBytes);
  } else if (percent >= 80) {
    // TODO: send "You've used 80% of your storage" email
    console.info("[Storage alert] User", userId, "reached 80% storage. Used:", usedBytes, "Limit:", limitBytes);
  }
}
