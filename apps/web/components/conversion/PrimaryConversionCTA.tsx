"use client";

import { track } from "@/lib/tracking";

export function PrimaryConversionCTA({
  href,
  label,
  event = "conversion_track",
  meta,
  className,
}: {
  href: string;
  label: string;
  event?: string;
  meta?: Record<string, unknown>;
  className?: string;
}) {
  return (
    <a
      href={href}
      onClick={() => track(event, { meta: { label, ...meta } })}
      className={
        className ??
        "inline-flex rounded-xl bg-[#C9A646] px-5 py-2.5 text-sm font-semibold text-black hover:bg-[#e8c547]"
      }
    >
      {label}
    </a>
  );
}
