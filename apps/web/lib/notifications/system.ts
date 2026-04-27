/**
 * In-app / delivery stub (Order 54). Replace with real provider (e.g. WebSocket, email, APNs).
 */
export function sendNotification(userId: string, message: string) {
  console.log(`[NOTIFICATION] to ${userId}: ${message}`);
}

/**
 * Re-engagement (Order 58) — **stubs** until SendGrid / Twilio / Postmark.
 * Resolves recipient in a real provider; for now: structured console only (no PII in prod logs policy — adjust when wiring).
 */
export function sendEmail(userId: string, subject: string, body: string) {
  console.log(
    `[EMAIL stub] userId=${userId} subject=${subject.replace(/\n/g, " ")} body_chars=${body.length} (not delivered)`
  );
}

export function sendSMS(userId: string, message: string) {
  console.log(`[SMS stub] userId=${userId} message_chars=${message.length} (not delivered)`);
}
