import { requireMobileBrokerUser } from "@/lib/mobile/require-mobile-broker";
import { defaultSearchRange, getAvailableSlots } from "@/modules/booking-system/broker-availability.service";
import { groupSlotsForUi } from "@/modules/booking-system/booking-calendar.service";

export const dynamic = "force-dynamic";

/**
 * GET — broker’s own availability (next 14d) for mobile; query `durationMinutes` optional.
 * Path: `/api/mobile/lecipm/availability` (LECIPM listing visits, not BNHub stays).
 */
export async function GET(request: Request) {
  const auth = await requireMobileBrokerUser(request);
  if (!auth.ok) return auth.response;
  const { searchParams } = new URL(request.url);
  const duration = searchParams.get("durationMinutes");
  const d = duration ? parseInt(duration, 10) : undefined;
  const { from, to } = defaultSearchRange();
  const raw = await getAvailableSlots(
    auth.user.id,
    { from, to },
    Number.isFinite(d) ? d : undefined,
  );
  return Response.json({
    kind: "mobile_lecipm_availability_v1",
    brokerId: auth.user.id,
    slots: groupSlotsForUi(raw),
  });
}
