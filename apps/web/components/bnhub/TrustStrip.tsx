import { Check } from "lucide-react";

const ITEMS = ["Verified listings", "Smart recommendations", "Transparent pricing"] as const;

export function TrustStrip() {
  return (
    <div className="border-y border-white/[0.08] bg-black py-8 sm:py-10">
      <div className="mx-auto flex max-w-4xl flex-col items-center justify-center gap-6 px-4 sm:flex-row sm:flex-wrap sm:gap-x-12 sm:gap-y-4">
        {ITEMS.map((label) => (
          <div
            key={label}
            className="flex min-h-[48px] items-center gap-3 text-sm font-medium tracking-wide text-white/90 sm:text-base"
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#D4AF37]/45 bg-[#D4AF37]/10 text-[#D4AF37]"
              aria-hidden
            >
              <Check className="h-4 w-4" strokeWidth={2.5} />
            </span>
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
