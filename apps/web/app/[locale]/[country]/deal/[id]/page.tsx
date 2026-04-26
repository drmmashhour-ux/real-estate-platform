import type { Metadata } from "next";
import { PLATFORM_NAME } from "@/lib/brand/platform";
import { notFound } from "next/navigation";
import { z } from "zod";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { buildSharedDealPayload } from "@/lib/investment/shared-deal-public";
import { SHARE_DEAL_LINE } from "@/lib/investment/share-deal-copy";
import { MvpNav } from "@/components/investment/MvpNav";
import { SharedDealClient } from "./shared-deal-client";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://lecipm.com";

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ ref?: string; ru?: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return { title: "Deal | LECIPM" };
  }
  const deal = await prisma.investmentDeal.findUnique({
    where: { id },
    select: { id: true, city: true, propertyPrice: true },
  });
  if (!deal) {
    return { title: "Deal not found" };
  }
  const desc = `${SHARE_DEAL_LINE} · ${deal.city} — illustrative analysis, not financial advice.`;
  return {
    metadataBase: new URL(SITE_URL),
    title: `${deal.city} deal analysis`,
    description: desc,
    openGraph: {
      title: `Analyzed real estate deal — ${deal.city} | LECIPM`,
      description: desc,
      url: `/deal/${deal.id}`,
      siteName: PLATFORM_NAME,
      type: "website",
      locale: "en_CA",
    },
    twitter: {
      card: "summary_large_image",
      title: `Real estate deal — ${deal.city}`,
      description: desc,
    },
    robots: { index: true, follow: true },
  };
}

export default async function SharedDealPage({ params, searchParams }: Props) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    notFound();
  }

  const sp = (await searchParams) ?? {};
  const refRaw = sp.ref;
  const referrerDealId =
    typeof refRaw === "string" && z.string().uuid().safeParse(refRaw).success ? refRaw : undefined;
  const ruRaw = sp.ru;
  const referrerUserId =
    typeof ruRaw === "string" && z.string().uuid().safeParse(ruRaw).success ? ruRaw : undefined;

  const deal = await prisma.investmentDeal.findUnique({
    where: { id },
  });

  if (!deal) {
    notFound();
  }

  const payload = buildSharedDealPayload(deal);

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-slate-50">
      <MvpNav variant="live" />
      <SharedDealClient payload={payload} referrerDealId={referrerDealId} referrerUserId={referrerUserId} />
    </div>
  );
}
