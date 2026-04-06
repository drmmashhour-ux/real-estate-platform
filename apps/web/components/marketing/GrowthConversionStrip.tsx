import Link from "next/link";
import { formatUnlockPriceShort } from "@/lib/growth/conversion-config";

type Variant = "buyer" | "supply" | "host";

type Props = {
  variant: Variant;
  className?: string;
};

/**
 * In-app conversion hints — links only; checkout uses existing unlock flows where applicable.
 */
export function GrowthConversionStrip({ variant, className = "" }: Props) {
  const unlock = formatUnlockPriceShort();

  if (variant === "buyer") {
    return (
      <div className={`rounded-xl border border-white/10 bg-[#121212]/80 p-4 text-sm text-[#B3B3B3] ${className}`}>
        <p className="font-semibold text-white">Unlock seller contact</p>
        <p className="mt-1">Instant access · No hidden fees · typical range {unlock}</p>
        <Link
          href="/search"
          className="mt-3 inline-flex min-h-[40px] items-center rounded-lg bg-premium-gold px-4 text-sm font-semibold text-[#0B0B0B] hover:brightness-110"
        >
          Browse listings
        </Link>
      </div>
    );
  }

  if (variant === "supply") {
    return (
      <div className={`rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 ${className}`}>
        <p className="font-semibold text-slate-900">List your property</p>
        <p className="mt-1">We can add it for you — permission-based, no scraping.</p>
        <Link
          href="/list-your-property"
          className="mt-3 inline-flex min-h-[40px] items-center rounded-lg bg-amber-600 px-4 text-sm font-semibold text-white hover:bg-amber-500"
        >
          Start intake
        </Link>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-white/10 bg-[#121212]/80 p-4 text-sm text-[#B3B3B3] ${className}`}>
      <p className="font-semibold text-white">Get direct bookings</p>
      <p className="mt-1">Lower fees than typical platforms — you control what you publish.</p>
      <Link
        href="/bnhub/stays"
        className="mt-3 inline-flex min-h-[40px] items-center rounded-lg border border-premium-gold/50 px-4 text-sm font-semibold text-premium-gold hover:bg-premium-gold/10"
      >
        Explore BNHub
      </Link>
    </div>
  );
}
