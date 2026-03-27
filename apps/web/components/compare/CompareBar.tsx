"use client";

import Link from "next/link";
import { useCompare } from "./CompareProvider";
import { MAX_COMPARE } from "@/lib/compare/constants";

export function CompareBar() {
  const { count, ids, hydrated } = useCompare();

  if (!hydrated || count === 0) return null;

  const qs = ids.length ? `?fsbo=${encodeURIComponent(ids.join(","))}` : "";

  return (
    <div
      className="pointer-events-auto fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-50 w-[min(100%,32rem)] -translate-x-1/2 p-4"
      role="region"
      aria-label="Property comparison"
    >
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#C9A646]/40 bg-[#0B0B0B]/95 px-4 py-3 shadow-2xl shadow-black/50 backdrop-blur-md">
        <span className="text-sm font-semibold text-[#C9A646]">
          Compare · {count}/{MAX_COMPARE}
        </span>
        <Link
          href={`/compare/fsbo${qs}`}
          className="relative z-30 inline-flex cursor-pointer rounded-lg bg-[#C9A646] px-4 py-2 text-sm font-bold text-[#0B0B0B]"
        >
          Open compare
        </Link>
        <Link
          href={`/compare/fsbo${qs}`}
          className="relative z-30 inline-flex cursor-pointer text-xs text-slate-400 underline"
        >
          View table
        </Link>
      </div>
    </div>
  );
}
