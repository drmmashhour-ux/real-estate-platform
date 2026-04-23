import type { Metadata } from "next";
import { PLATFORM_DEFAULT_DESCRIPTION } from "@/lib/brand/platform";
import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";
import { buildMonetizationSnapshot } from "@/lib/investment/monetization";
import { GeneratedByLecipm } from "@/components/brand/GeneratedByLecipm";
import { MvpNav } from "@/components/investment/MvpNav";
import {
  ConversionSteps,
  ConversionUrgencyBanner,
  TrustBadgesRow,
} from "@/components/marketing/ConversionFunnelBlocks";
import { AnalyzeDealClient } from "./analyze-deal-client";

export const metadata: Metadata = {
  title: "Analyze deal",
  description: "Estimate cash flow and ROI with LECIPM, then save deals to your portfolio.",
  openGraph: {
    title: "Analyze deals",
    description: PLATFORM_DEFAULT_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Analyze deals",
    description: PLATFORM_DEFAULT_DESCRIPTION,
  },
};

export default async function AnalyzePage() {
  const id = await getGuestId();
  const userRow = id ? await prisma.user.findUnique({ where: { id }, select: { id: true } }) : null;
  const isLoggedIn = Boolean(userRow);
  const shareReferrerUserId = userRow?.id ?? null;

  let monetization = null;
  if (userRow) {
    const [u, dealCount] = await Promise.all([
      prisma.user.findUnique({ where: { id: userRow.id }, select: { plan: true } }),
      prisma.investmentDeal.count({ where: { userId: userRow.id } }),
    ]);
    monetization = buildMonetizationSnapshot(u?.plan ?? "free", dealCount);
  }

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-slate-50">
      <MvpNav variant={isLoggedIn ? "live" : "demo"} />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-12">
        <ConversionUrgencyBanner className="mb-4" />
        <p className="mb-6 rounded-xl border border-amber-500/35 bg-amber-950/30 px-4 py-3 text-center text-sm text-amber-100">
          <strong className="text-amber-200">Early access</strong>
          <span className="text-amber-100/90"> · Be among the first users</span>
        </p>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Investment MVP</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Analyze your real estate deal in seconds
        </h1>
        <TrustBadgesRow className="mt-5" />
        <p className="mt-4 max-w-xl text-slate-400">
          <span className="block text-emerald-200/90">No login required · Takes less than 30 seconds</span>
          <span className="mt-2 block text-sm leading-relaxed">
            Enter price, rent, and expenses — we compare long-term vs short-term and show ROI and cash flow.{" "}
            {isLoggedIn
              ? "Saving syncs to your portfolio."
              : "Save locally, or sign in to sync across devices."}
          </span>
        </p>
        <div className="mt-8">
          <ConversionSteps />
        </div>
        <div className="mt-10">
          <AnalyzeDealClient
            isLoggedIn={isLoggedIn}
            shareReferrerUserId={shareReferrerUserId}
            monetization={monetization}
          />
        </div>
        <GeneratedByLecipm className="mt-14 border-t border-white/10 pt-8" />
      </div>
    </div>
  );
}
