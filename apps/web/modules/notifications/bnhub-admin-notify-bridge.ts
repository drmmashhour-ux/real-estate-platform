/**
 * Registers BNHub domain events → admin email/SMS via `notifyPlatformBusinessEvent`.
 * Loaded from `instrumentation.ts` on Node runtime startup.
 */
import { onBNHubNotification } from "@/lib/bnhub/notifications";
import { prisma } from "@/lib/db";

import { dispatchBusinessEventToChannels } from "./notification-router.service";
import type { PlatformBusinessEvent } from "./platform-events";

onBNHubNotification(async (event) => {
  if (event.type !== "booking_confirmation") return;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: event.bookingId },
      select: {
        totalCents: true,
        listing: { select: { title: true } },
      },
    });

    const cents = booking?.totalCents ?? 0;
    const title = booking?.listing?.title?.trim() ?? "Stay";

    const platformEvent: PlatformBusinessEvent = {
      type: "BOOKING_CONFIRMED",
      amountCents: cents,
      currency: "CAD",
      reference: event.bookingId,
    };

    const dollars = (cents / 100).toFixed(2);
    await dispatchBusinessEventToChannels(platformEvent, {
      subject: `New booking revenue · $${dollars} · ${title.slice(0, 80)}`,
      bodyText: `BNHub booking confirmed.\nListing: ${title}\nTotal: $${dollars} CAD\nBooking id: ${event.bookingId}`,
    });
  } catch (e) {
    console.error("[bnhub-admin-notify-bridge] booking_confirmation", e);
  }
});
