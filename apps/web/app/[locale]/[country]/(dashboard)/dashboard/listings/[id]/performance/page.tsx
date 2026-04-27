import Link from "next/link";
import { notFound } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { loadListingPerformance, priceChangeFromLog, type AiPerformanceLog } from "@/lib/ai/performance";

export const dynamic = "force-dynamic";

function fmtUsd(n: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
    n
  );
}

function logSummary(log: AiPerformanceLog) {
  const p = priceChangeFromLog(log);
  if (p) {
    if (p.unit === "cents") {
      return {
        before: fmtUsd(p.before / 100),
        after: fmtUsd(p.after / 100),
        kind: "nightly" as const,
      };
    }
    return { before: fmtUsd(p.before), after: fmtUsd(p.after), kind: "list" as const };
  }
  const t = log.action.length > 120 ? `${log.action.slice(0, 120)}…` : log.action;
  return { line: t };
}

export default async function ListingPerformancePage({
  params,
}: {
  params: Promise<{ id: string; locale: string; country: string }>;
}) {
  const { id, locale, country } = await params;
  const userId = await getGuestId();
  if (!userId) notFound();

  const data = await loadListingPerformance(id, userId);
  if (!data.ok) notFound();

  const base = `/${locale}/${country}`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href={`${base}/dashboard/listings/${id}/quality`} className="text-sm text-slate-500 hover:text-slate-800">
        ← Quality &amp; AI
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">AI performance</h1>
      <p className="mt-1 text-sm text-slate-600">
        {data.listing.title} <span className="text-slate-400">· {data.listing.listingCode}</span>
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Bookings (confirmed+)</p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-slate-900">{data.metrics.bookings}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Stay revenue (recorded)</p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-slate-900">
            {fmtUsd(data.metrics.revenueDollars)}
          </p>
        </div>
      </div>

      {data.estimate && data.estimate.firstPriceEventAt && (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5">
          <p className="text-sm font-semibold text-emerald-900">Estimated impact (simple windows)</p>
          {data.estimate.bookingUpliftPct != null && data.estimate.bookingUpliftPct > 0 && (
            <p className="mt-2 text-lg font-bold text-emerald-700">
              +{data.estimate.bookingUpliftPct}% bookings after the first AI price change
            </p>
          )}
          {data.estimate.bookingUpliftPct != null && data.estimate.bookingUpliftPct < 0 && (
            <p className="mt-2 text-sm text-slate-800">
              Booking count vs. prior 30 days: {data.estimate.bookingUpliftPct}% (seasonality and demand
              also matter).
            </p>
          )}
          {data.estimate.bookingUpliftPct === 0 && (
            <p className="mt-2 text-sm text-slate-700">Same booking count in the before and after windows.</p>
          )}
          {data.estimate.bookingUpliftPct == null && (
            <p className="mt-2 text-sm text-slate-700">Not enough bookings in one or both windows to compare yet.</p>
          )}
          {data.estimate.revenueUpliftPct != null && data.estimate.revenueUpliftPct > 0 && (
            <p className="mt-1 text-sm font-semibold text-emerald-800">
              Revenue in the after window: +{data.estimate.revenueUpliftPct}% vs. the before window
            </p>
          )}
          <p className="mt-3 text-xs text-slate-600">{data.estimate.disclaimer}</p>
        </div>
      )}

      <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
        <h2 className="text-sm font-semibold text-slate-800">From your AI logs</h2>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-slate-500">Logged price changes</dt>
            <dd className="text-lg font-semibold text-slate-900">{data.impact.priceChanges}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Conversion hints (tracked)</dt>
            <dd className="text-lg font-semibold text-slate-900">{data.impact.conversionHints}</dd>
          </div>
        </dl>
      </div>

      <h2 className="mt-10 text-lg font-semibold text-slate-900">AI actions (recent)</h2>
      <ul className="mt-3 space-y-3">
        {data.logs.length === 0 ? (
          <li className="text-sm text-slate-500">No execution logs for this listing yet.</li>
        ) : (
          data.logs.map((log) => {
            const s = logSummary(log);
            return (
              <li key={log.id} className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
                {"line" in s && s.line != null && (
                  <div className="font-mono text-xs text-slate-700 break-all">{s.line}</div>
                )}
                {"before" in s && (
                  <div className="mt-1 text-slate-800">
                    <span className="text-slate-500">Before:</span> {s.before}{" "}
                    <span className="text-slate-400">→</span> <span className="text-slate-500">After:</span> {s.after}
                    {s.kind === "nightly" && <span className="ml-2 text-xs text-slate-500">(nightly)</span>}
                  </div>
                )}
                <div className="mt-2 text-xs text-slate-500">
                  {new Date(log.createdAt).toLocaleString()}
                </div>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
