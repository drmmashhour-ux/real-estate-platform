import { triggerAlert } from "@/modules/alerts/alert.service";

export async function reportBookingAnomaly(input: {
  message: string;
  bookingId?: string | null;
  meta?: Record<string, unknown>;
}): Promise<void> {
  await triggerAlert({
    type: "booking_failure",
    severity: "critical",
    message: input.message,
    meta: { ...input.meta, bookingId: input.bookingId ?? undefined },
  });
}
