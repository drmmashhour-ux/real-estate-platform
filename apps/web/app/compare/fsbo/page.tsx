import type { Metadata } from "next";
import { ComparePageClient } from "../ComparePageClient";

export const metadata: Metadata = {
  title: "Compare properties (FSBO)",
  description: "Side-by-side FSBO comparison with ROI and mortgage estimates — informational only.",
};

/** Legacy FSBO listing compare — moved from /compare for investment deal comparison. */
export default function CompareFsboPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <ComparePageClient />
    </div>
  );
}
