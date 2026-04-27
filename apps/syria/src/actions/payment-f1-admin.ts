"use server";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { runF1Confirm, runF1Reject } from "@/lib/payment-f1-service";
import { f1GetPaymentSecret, f1SignPaymentRequest } from "@/lib/payment-request-signature";
import { revalidateF1AfterConfirm, revalidateF1ListingOnly } from "@/lib/payment-f1-revalidate";

export async function adminF1ConfirmAction(requestId: string) {
  const admin = await requireAdmin();
  const id = requestId?.trim() ?? "";
  if (!id) {
    return { ok: false as const, error: "missing_id" };
  }
  const row = await prisma.syriaPaymentRequest.findUnique({ where: { id } });
  if (!row) {
    return { ok: false as const, error: "not_found" };
  }
  const secret = f1GetPaymentSecret();
  if (!secret) {
    return { ok: false as const, error: "no_secret" };
  }
  const sig = f1SignPaymentRequest(row.id, row.listingId, row.amount, secret);
  const out = await runF1Confirm(id, { sig, adminId: admin.id, clientIp: null });
  if (out.type === "ok" && out.listingId) {
    revalidateF1AfterConfirm(out.listingId);
    return { ok: true as const, listingId: out.listingId };
  }
  if (out.type === "already" && out.listingId) {
    revalidateF1AfterConfirm(out.listingId);
    return { ok: true as const, already: true as const, listingId: out.listingId };
  }
  if (out.type === "not_found") return { ok: false as const, error: "not_found" };
  if (out.type === "rejected" || out.type === "bad_state") return { ok: false as const, error: "invalid_state" };
  if (out.type === "listing_missing") return { ok: false as const, error: "listing_missing" };
  if (out.type === "bad_sig" || out.type === "no_secret") return { ok: false as const, error: "config" };
  return { ok: false as const, error: "unknown" };
}

export async function adminF1RejectAction(requestId: string, reason: string) {
  const admin = await requireAdmin();
  const id = requestId?.trim() ?? "";
  if (!id) {
    return { ok: false as const, error: "missing_id" };
  }
  const out = await runF1Reject(id, reason, { adminId: admin.id, clientIp: null });
  if (out.type === "not_found") return { ok: false as const, error: "not_found" };
  if (out.type === "already") return { ok: true as const, already: true as const, status: out.status };

  revalidateF1ListingOnly(out.listingId);
  return { ok: true as const };
}

export async function adminF1ConfirmFormAction(formData: FormData): Promise<void> {
  const requestId = String(formData.get("requestId") ?? "").trim();
  await adminF1ConfirmAction(requestId);
}

export async function adminF1RejectFormAction(formData: FormData): Promise<void> {
  const requestId = String(formData.get("requestId") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  await adminF1RejectAction(requestId, reason);
}
