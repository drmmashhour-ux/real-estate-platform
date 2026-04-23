import type { Metadata } from "next";
import { GetLeadsPageClient } from "@/components/growth/get-leads-page-client";
import { PLATFORM_NAME } from "@/lib/brand/platform";
import { PlatformRole } from "@prisma/client";
import { engineFlags } from "@/config/feature-flags";
import { getConversionEngineFlagsEffective } from "@/config/rollout";
import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";
import { buildLeadScarcityLines } from "@/modules/growth/lead-scarcity.service";
import {
  conversionExperienceTierLabel,
  deriveConversionExperienceTier,
} from "@/modules/conversion/conversion-rollout-helpers";

/**
 * Public /get-leads landing. Markup and interaction live in `GetLeadsPageClient`
 * (`use client` — smooth scroll to `#lead-form`, form POST to `/api/growth/early-leads`).
 */
export const metadata: Metadata = {
  title: "Get matched with the right real estate opportunity",
  description: `Verified listings. Real opportunities. ${PLATFORM_NAME}.`,
};

function firstParam(v: string | string[] | undefined): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && v[0]) return v[0];
  return undefined;
}

export default async function GetLeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const wa = process.env.NEXT_PUBLIC_GROWTH_WHATSAPP_URL?.trim() || null;
  const sp = await searchParams;
  const utm = {
    utm_source: firstParam(sp?.utm_source)?.slice(0, 200),
    utm_campaign: firstParam(sp?.utm_campaign)?.slice(0, 200),
    utm_medium: firstParam(sp?.utm_medium)?.slice(0, 200),
  };
  const scarcity = engineFlags.growthScaleV1 ? await buildLeadScarcityLines() : null;

  const guestId = await getGuestId();
  let isPrivilegedUser = false;
  if (guestId) {
    const u = await prisma.user.findUnique({
      where: { id: guestId },
      select: { role: true, accountStatus: true },
    });
    isPrivilegedUser = Boolean(
      u?.accountStatus === "ACTIVE" &&
        u?.role != null &&
        (u.role === PlatformRole.ADMIN || u.role === PlatformRole.ACCOUNTANT),
    );
  }
  const effectiveConversion = getConversionEngineFlagsEffective({
    pathname: "/get-leads",
    isPrivilegedUser,
  });
  const conversionTier = deriveConversionExperienceTier(effectiveConversion);
  const conversionTierLabel = conversionExperienceTierLabel(conversionTier);
  const conversionDebugUi =
    process.env.NEXT_PUBLIC_CONVERSION_DEBUG_UI === "1" || firstParam(sp?.conversion_debug) === "1";
  const showConversionMonitoringPanel = process.env.NEXT_PUBLIC_CONVERSION_MONITORING_DEBUG === "1";

  const intentRaw = firstParam(sp?.intent)?.toLowerCase();
  const allowedIntent =
    intentRaw === "buy" || intentRaw === "rent" || intentRaw === "invest" || intentRaw === "host"
      ? intentRaw
      : undefined;
  const locationHint =
    firstParam(sp?.q)?.slice(0, 500) ?? firstParam(sp?.city)?.slice(0, 120) ?? undefined;

  return (
    <GetLeadsPageClient
      whatsappUrl={wa}
      utm={utm}
      scaleInboundV1={engineFlags.growthScaleV1}
      scarcity={scarcity}
      conversionUpgradeV1={effectiveConversion.conversionUpgradeV1}
      instantValueV1={effectiveConversion.instantValueV1}
      conversionTierKey={conversionTier}
      conversionTierLabel={conversionTierLabel}
      conversionDebugUi={conversionDebugUi}
      showConversionMonitoringPanel={showConversionMonitoringPanel}
      initialIntent={allowedIntent}
      locationHint={locationHint}
    />
  );
}
