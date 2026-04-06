import { getSupabaseAuthIdFromRequest } from "@/lib/bnhub/getSupabaseAuthIdFromRequest";
import { updateHostBnhubBookingInstructions } from "@/lib/bookings/host-supabase-bookings";
import { getMobileAuthUser, resolveMobileAppRoleFromRequest } from "@/lib/mobile/mobileAuth";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/mobile/v1/bnhub/host/bookings/[bookingId]/instructions
 * Body: `{ "instructions": "..." }` — host-only; visible to guest only after payment.
 */
export async function PATCH(request: Request, context: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await context.params;
  const user = await getMobileAuthUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const appRole = await resolveMobileAppRoleFromRequest(request, user);
  if (appRole !== "host" && appRole !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const supaId = await getSupabaseAuthIdFromRequest(request);
  if (!supaId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { instructions?: string };
  try {
    body = (await request.json()) as { instructions?: string };
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const instructions = typeof body.instructions === "string" ? body.instructions : "";

  const result = await updateHostBnhubBookingInstructions({
    bookingId: bookingId ?? "",
    hostSupabaseUserId: supaId,
    isAdmin: appRole === "admin",
    instructions,
  });

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json({ ok: true });
}
