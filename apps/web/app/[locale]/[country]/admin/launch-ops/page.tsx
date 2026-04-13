import Link from "next/link";
import { prisma } from "@/lib/db";
import { getResolvedMarket } from "@/lib/markets";
import { resolveLaunchFlags } from "@/lib/launch/resolve-launch-flags";

export const dynamic = "force-dynamic";

export default async function AdminLaunchOpsPage() {
  const [market, launch] = await Promise.all([getResolvedMarket(), resolveLaunchFlags()]);
  const [
    pendingBookings,
    pendingManualPayment,
    pendingAiApprovals,
    generatedDrafts,
    listingPublished,
  ] = await Promise.all([
    prisma.booking.count({ where: { status: "AWAITING_HOST_APPROVAL" } }).catch(() => 0),
    prisma.booking
      .count({
        where: { manualPaymentSettlement: "PENDING", status: { not: "CANCELLED" } },
      })
      .catch(() => 0),
    prisma.managerAiApprovalRequest.count({ where: { status: "pending" } }).catch(() => 0),
    prisma.lecipmGeneratedContent.count({ where: { status: { in: ["draft", "pending_review"] } } }).catch(() => 0),
    prisma.shortTermListing.count({ where: { listingStatus: "PUBLISHED" } }).catch(() => 0),
  ]);

  return (
    <div className="min-h-screen bg-[#050505] px-4 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <h1 className="font-serif text-2xl text-[#D4AF37]">Soft-launch operations</h1>
        <p className="mt-2 text-sm text-white/50">
          Snapshot for rollout control. Pair with{" "}
          <Link href="/admin/launch" className="text-[#D4AF37] underline-offset-2 hover:underline">
            Launch events
          </Link>{" "}
          and{" "}
          <Link href="/admin/content/generated" className="text-[#D4AF37] underline-offset-2 hover:underline">
            Generated content
          </Link>
          .
        </p>

        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-[#0b0b0b] p-4">
            <p className="text-xs uppercase tracking-wider text-white/40">Resolved market</p>
            <p className="mt-2 text-lg font-semibold text-white">{market.code}</p>
            <p className="mt-1 text-xs text-white/50">
              Online payments: {String(market.onlinePaymentsEnabled)} · Manual payment tracking:{" "}
              {String(market.manualPaymentTrackingEnabled)} · Contact-first: {String(market.contactFirstEmphasis)}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#0b0b0b] p-4">
            <p className="text-xs uppercase tracking-wider text-white/40">Launch flags (env)</p>
            <ul className="mt-2 space-y-1 font-mono text-xs text-white/70">
              <li>ENABLE_AI_CONTENT_ENGINE → {String(launch.enableAiContentEngine)}</li>
              <li>ENABLE_AI_CONTENT_PUBLISH → {String(launch.enableAiContentPublish)}</li>
              <li>ENABLE_SYRIA_MARKET → {String(launch.enableSyriaMarket)}</li>
              <li>ENABLE_ARABIC → {String(launch.enableArabic)}</li>
              <li>ENABLE_FRENCH → {String(launch.enableFrench)}</li>
            </ul>
            <p className="mt-2 text-[10px] text-white/35">
              DB overrides: feature_flag.key = launch:enableArabic, launch:enableAiContentPublish, …
            </p>
          </div>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Metric label="Host-pending bookings" value={pendingBookings} />
          <Metric label="Manual payment pending" value={pendingManualPayment} />
          <Metric label="AI approvals pending" value={pendingAiApprovals} />
          <Metric label="Generated content (draft/review)" value={generatedDrafts} />
          <Metric label="Published BNHUB listings" value={listingPublished} />
        </section>

        <p className="mt-10 text-xs text-white/35">
          If counts fail (e.g. missing migration for generated content), run{" "}
          <code className="text-white/60">pnpm exec prisma migrate dev</code> in apps/web.
        </p>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0b0b0b] p-4">
      <p className="text-xs uppercase tracking-wider text-white/40">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}
