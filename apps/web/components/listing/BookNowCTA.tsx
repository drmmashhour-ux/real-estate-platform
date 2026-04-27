"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { assignVariant } from "@/lib/ab/assign";
import { trackAbExposure } from "@/lib/ab/track";
import { getTrackingSessionId } from "@/lib/tracking";
import { cn } from "@/lib/utils";

const BOOKING_CTA_EXPERIMENT = "booking_cta";

export function BookNowCTA({
  listingId,
  className,
  userId: userIdProp,
}: {
  listingId: string;
  className?: string;
  /** When set, assignment is stable per signed-in user; otherwise uses tab session id. */
  userId?: string;
}) {
  const subject = userIdProp ?? getTrackingSessionId() ?? "anon";
  const variant = useMemo(() => assignVariant(subject, BOOKING_CTA_EXPERIMENT), [subject]);
  const exposureSent = useRef(false);

  useEffect(() => {
    if (exposureSent.current) return;
    exposureSent.current = true;
    trackAbExposure(BOOKING_CTA_EXPERIMENT, variant);
  }, [variant, subject]);

  const label = variant === "A" ? "Book now" : "Reserve instantly";

  return (
    <Link
      href={`/book/${listingId}`}
      className={cn(
        "mt-6 block w-full rounded-xl bg-black py-4 text-center text-lg font-semibold text-white",
        className
      )}
    >
      {label}
    </Link>
  );
}
