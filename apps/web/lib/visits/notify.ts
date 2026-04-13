/**
 * Notification hooks for visit lifecycle (email/push/in-app).
 * Wire to your provider here — MVP is intentionally a no-op.
 */
export function notifyBrokerOnVisitRequest(_opts: {
  brokerUserId: string;
  visitRequestId: string;
  listingTitle: string;
}): void {
  void _opts;
}

export function notifyCustomerOnVisitUpdate(_opts: {
  customerUserId: string | null;
  guestEmail: string | null;
  message: string;
}): void {
  void _opts;
}
