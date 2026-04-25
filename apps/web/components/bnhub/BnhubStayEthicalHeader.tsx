import Link from "next/link";
import { VerificationStatus } from "@prisma/client";
import { EarlyAccessBanner } from "@/components/bnhub/EarlyAccessBanner";
import { ListingActivitySignals } from "@/components/bnhub/ListingActivitySignals";
import { ListingBadges, deriveBnhubListingBadges } from "@/components/bnhub/ListingBadges";
import { BnhubEarlyAccessDiscountNotice } from "@/components/bnhub/BnhubEarlyAccessDiscountNotice";
import { getBnhubListingEthicalSignals } from "@/lib/bnhub/bnhub-ethical-seeding";

function isEarlyAccessRegionCity(city: string | null | undefined): boolean {
  if (!city) return false;
  const c = city.toLowerCase();
  return c.includes("montréal") || c.includes("montreal") || c.includes("laval");
}

export async function BnhubStayEthicalHeader({
  listingId,
  city,
  createdAt,
  verificationStatus,
  earlyAccessPercentOff,
  foundingHost,
  activePromoPercent,
  activePromoLabel,
}: {
  listingId: string;
  city: string;
  createdAt: Date;
  verificationStatus: VerificationStatus;
  earlyAccessPercentOff: number | null;
  foundingHost: boolean;
  activePromoPercent?: number | null;
  activePromoLabel?: string | null;
}) {
  const signals = await getBnhubListingEthicalSignals(listingId);
  const verified = verificationStatus === VerificationStatus.VERIFIED;
  const regionEarly = isEarlyAccessRegionCity(city);
  const badges = deriveBnhubListingBadges({
    verified,
    createdAt,
    earlyAccessPercentOff,
    foundingHost,
    earlyAccessRegion: regionEarly,
  });
  const effectivePct = activePromoPercent ?? earlyAccessPercentOff ?? null;

  return (
    <div className="space-y-4 border-b border-white/10 bg-[#050505] px-4 py-6 sm:px-6">
      <EarlyAccessBanner className="max-w-4xl" />
      <div className="mx-auto flex max-w-4xl flex-col gap-3">
        <ListingBadges badges={badges} />
        <ListingActivitySignals viewsToday={signals.viewsToday} savesThisWeek={signals.savesThisWeek} />
        <BnhubEarlyAccessDiscountNotice percentOff={effectivePct} promoLabel={activePromoLabel} />
        <p className="text-sm text-white/70">
          Need help booking?{" "}
          <Link href="/bnhub/concierge" className="font-medium text-[#D4AF37] underline-offset-4 hover:underline">
            Talk to BNHub concierge
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
