import type { BnhubChannelPlatform } from "@prisma/client";
import { pushToAirbnb } from "./airbnb";
import { pushToBookingCom } from "./booking-com";
import { pushToVrbo } from "./vrbo";

export type ChannelPushContext = {
  listingId: string;
  externalListingRef: string;
  connectionId: string;
};

/** Stub push per platform — real credentials live on `BnhubChannelConnection`. */
export async function dispatchPushAvailability(
  platform: BnhubChannelPlatform,
  ctx: ChannelPushContext
): Promise<void> {
  switch (platform) {
    case "AIRBNB":
      await pushToAirbnb(ctx);
      return;
    case "BOOKING_COM":
      await pushToBookingCom(ctx);
      return;
    case "VRBO":
      await pushToVrbo(ctx);
      return;
    default:
      return;
  }
}
