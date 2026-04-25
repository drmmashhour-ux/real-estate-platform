import { prisma } from "@repo/db";
import { normalizeBnhubConfirmationCode } from "@/lib/bnhub/normalize-confirmation-code";
import { logInfo } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * Resolve a guest-facing confirmation code to the booking id for deep-linking after login.
 * Does not expose booking details without an authenticated session on the booking page.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const code = typeof (body as { code?: unknown }).code === "string" ? (body as { code: string }).code : "";
  const normalized = normalizeBnhubConfirmationCode(code);
  if (normalized.length < 4) {
    return Response.json({ ok: false, error: "Enter a valid confirmation code." }, { status: 400 });
  }

  const booking = await prisma.booking.findFirst({
    where: { confirmationCode: normalized },
    select: { id: true },
  });

  if (!booking) {
    logInfo("bnhub_lookup_code_miss", { codeLen: normalized.length });
    return Response.json({ ok: false, error: "No reservation found for this code." }, { status: 404 });
  }

  return Response.json({
    ok: true,
    bookingId: booking.id,
    nextPath: `/bnhub/booking/${booking.id}`,
  });
}
