import { CanadaFlagIcon } from "@/components/brand/CanadaFlagIcon";
import { QuebecFlagIcon } from "@/components/brand/QuebecFlagIcon";

/** Same 2:1 frame + object-contain treatment as the homepage “Proudly a Quebec platform” row. */
const FLAG_BOX =
  "relative flex h-10 w-20 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-white/10 bg-black/40 shadow-lg shadow-black/40 sm:h-12 sm:w-24";

export function QuebecCanadaFlagsPair({
  className = "",
  gapClass = "gap-3",
}: {
  className?: string;
  /** Gap between the two flags (not between flags and adjacent text). */
  gapClass?: string;
}) {
  return (
    <span
      className={`inline-flex flex-wrap items-center justify-center ${gapClass} ${className}`}
      aria-hidden
    >
      <span className={FLAG_BOX}>
        <QuebecFlagIcon className="max-h-full max-w-full object-contain" />
      </span>
      <span className={FLAG_BOX}>
        <CanadaFlagIcon className="max-h-full max-w-full object-contain" />
      </span>
    </span>
  );
}
