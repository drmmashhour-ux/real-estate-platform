export type ParsedCloverHostedWebhook = {
  checkoutSessionId: string | null;
  approved: boolean;
  failed: boolean;
  paymentId: string | null;
};

/**
 * Best-effort parse — Clover payload shapes vary; extend as you capture real samples.
 */
export function parseCloverHostedCheckoutWebhook(body: unknown): ParsedCloverHostedWebhook {
  if (!body || typeof body !== "object") {
    return { checkoutSessionId: null, approved: false, failed: false, paymentId: null };
  }
  const o = body as Record<string, unknown>;

  const status = String(o.status ?? o.paymentStatus ?? "").toUpperCase();
  const type = String(o.type ?? "").toUpperCase();

  const checkoutSessionId =
    typeof o.checkoutSessionId === "string"
      ? o.checkoutSessionId
      : typeof o.checkoutId === "string"
        ? o.checkoutId
        : typeof o.data === "string" && o.data.length > 8
          ? o.data
          : null;

  const paymentId =
    typeof o.id === "string"
      ? o.id
      : typeof o.paymentId === "string"
        ? o.paymentId
        : typeof o.payment_id === "string"
          ? o.payment_id
          : null;

  const approved =
    status === "APPROVED" ||
    status === "PAID" ||
    status === "SUCCESS" ||
    type === "PAYMENT_SUCCESS" ||
    o.approved === true;

  const failed =
    status === "DECLINED" ||
    status === "FAILED" ||
    status === "CANCELLED" ||
    type === "PAYMENT_FAILED" ||
    o.declined === true;

  return {
    checkoutSessionId,
    approved: approved && !failed,
    failed,
    paymentId,
  };
}
