import Link from "next/link";
import { AvailableFinancialSupport } from "@/components/green/AvailableFinancialSupport";
import { prisma } from "@/lib/db";
import { POSITIONING_GREEN_EXECUTION } from "@/modules/contractors/contractor.model";
import { QuebecEsgBreakdownPanel } from "@/components/green/QuebecEsgBreakdownPanel";
import type { GreenListingMetadata } from "@/modules/green/green.types";
import {
  GREEN_VERIFICATION_PRODUCT,
  LECIPM_GREEN_AI_DISCLAIMER,
  POSITIONING_GREEN_AI,
} from "@/modules/green-ai/green.types";
import { QUEBEC_ESG_CRITERIA_DISCLAIMER } from "@/modules/green-ai/quebec-esg.engine";
import { RenoclimatPotentialChecker } from "@/components/green/RenoclimatPotentialChecker";

export async function BrokerGreenIntelligenceSection({
  locale,
  country,
  userId,
}: {
  locale: string;
  country: string;
  userId: string | null;
}) {
  const listings =
    userId != null
      ? await prisma.fsboListing.findMany({
          where: { ownerId: userId },
          take: 6,
          orderBy: { updatedAt: "desc" },
          select: {
            id: true,
            title: true,
            city: true,
            lecipmGreenInternalScore: true,
            lecipmGreenConfidence: true,
            lecipmGreenAiLabel: true,
            lecipmGreenVerificationLevel: true,
            lecipmGreenCertifiedAt: true,
            lecipmGreenProgramTier: true,
            lecipmGreenMetadataJson: true,
          },
        })
      : [];

  const base = `/${locale}/${country}`;

  return (
    <section className="rounded-xl border border-emerald-500/25 bg-emerald-950/25 px-4 py-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400/90">Green Intelligence</p>
          <h2 className="mt-2 font-serif text-xl font-semibold text-white">LECIPM AI Green Score</h2>
          <p className="mt-2 max-w-2xl text-sm text-emerald-100/85">{POSITIONING_GREEN_AI}</p>
          <p className="mt-3 rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-[11px] leading-relaxed text-slate-400">
            {LECIPM_GREEN_AI_DISCLAIMER}
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-500">{QUEBEC_ESG_CRITERIA_DISCLAIMER}</p>
        </div>
        <Link
          href={`${base}/contact`}
          className="shrink-0 rounded-lg bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-50 ring-1 ring-emerald-400/40 hover:bg-emerald-500/30"
        >
          Green Verification Report — sales
        </Link>
      </div>

      <div className="mt-6">
        <RenoclimatPotentialChecker defaultLocation="Quebec, Canada" />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-3 text-sm text-slate-300">
          <p className="font-medium text-white">{GREEN_VERIFICATION_PRODUCT.BASIC.label}</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-slate-400">
            {GREEN_VERIFICATION_PRODUCT.BASIC.includes.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/40 px-3 py-3 text-sm text-emerald-100">
          <p className="font-medium text-white">Premium — paid report + badge + boost</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-emerald-100/85">
            {GREEN_VERIFICATION_PRODUCT.PREMIUM.includes.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-emerald-200/70">
            Indicative ~${GREEN_VERIFICATION_PRODUCT.PREMIUM.indicativeCadMonthly}/mo CAD — confirm at checkout when billing
            is connected.
          </p>
        </div>
      </div>

      {listings.length > 0 ? (
        <div className="mt-5 border-t border-white/10 pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Your listings (owned)</p>
          <ul className="mt-2 space-y-2">
            {listings.map((l) => {
              const metaRaw = l.lecipmGreenMetadataJson;
              const meta =
                metaRaw !== null && typeof metaRaw === "object" && !Array.isArray(metaRaw)
                  ? (metaRaw as GreenListingMetadata)
                  : undefined;
              const qcSnap = meta?.quebecEsgSnapshot;
              const grantsSnap = meta?.grantsSnapshot;

              return (
                <li
                  key={l.id}
                  className="rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-sm"
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <span className="font-medium text-white">{l.title}</span>
                    <span className="text-xs text-slate-400">
                      {l.city} · AI score {l.lecipmGreenInternalScore ?? "—"} · confidence {l.lecipmGreenConfidence ?? "—"} ·{" "}
                      {l.lecipmGreenVerificationLevel ?? "—"} · band {l.lecipmGreenAiLabel ?? "—"}
                      {l.lecipmGreenCertifiedAt ? " · LECIPM Green Verified" : ""}
                    </span>
                  </div>
                  {qcSnap ? <QuebecEsgBreakdownPanel snapshot={qcSnap} /> : null}
                  {grantsSnap ? <AvailableFinancialSupport snapshot={grantsSnap} /> : null}
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <p className="mt-4 border-t border-white/10 pt-4 text-xs text-slate-500">
          Attach listings under your account to track AI score, confidence, and verification level.{" "}
          <Link href={`${base}/dashboard/seller/listings`} className="text-emerald-300 underline underline-offset-2">
            Seller listings
          </Link>
          .
        </p>
      )}
    </section>
  );
}
