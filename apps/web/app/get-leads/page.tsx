import type { Metadata } from "next";
import { GetLeadsPageClient } from "@/components/growth/get-leads-page-client";
import { PLATFORM_NAME } from "@/lib/brand/platform";
import { conversionEngineFlags, engineFlags } from "@/config/feature-flags";
import { buildLeadScarcityLines } from "@/modules/growth/lead-scarcity.service";

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

  return (
    <GetLeadsPageClient
      whatsappUrl={wa}
      utm={utm}
      scaleInboundV1={engineFlags.growthScaleV1}
      scarcity={scarcity}
      conversionUpgradeV1={conversionEngineFlags.conversionUpgradeV1}
      instantValueV1={conversionEngineFlags.instantValueV1}
    />
  );
}
