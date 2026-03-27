"use client";

import { useCompare } from "./CompareProvider";
import { MAX_COMPARE } from "@/lib/compare/constants";

export function FsboCompareButton({
  listingId,
  className = "",
}: {
  listingId: string;
  className?: string;
}) {
  const { has, add, remove, hydrated } = useCompare();
  const on = has(listingId);

  const base =
    className ||
    `rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
      on
        ? "border-[#C9A646] bg-[#C9A646]/15 text-[#C9A646]"
        : "border-white/20 bg-black/40 text-white hover:border-[#C9A646]/50"
    }`;

  return (
    <button
      type="button"
      disabled={!hydrated}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (on) {
          remove(listingId);
        } else {
          const ok = add(listingId);
          if (!ok) {
            window.alert(`You can compare up to ${MAX_COMPARE} properties. Remove one to add another.`);
          }
        }
      }}
      className={
        className
          ? `${className} ${on ? "ring-2 ring-[#C9A646]/60 ring-offset-2 ring-offset-white" : ""}`
          : base
      }
    >
      {on ? "✓ In compare" : "Compare"}
    </button>
  );
}
