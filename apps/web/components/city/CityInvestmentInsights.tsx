import type { ReactNode } from "react";
import Link from "next/link";
import type { CityInsightsPayload } from "@/lib/city-insights";

function fmtMoney(cents: number | null, opts?: { perNight?: boolean }) {
  if (cents == null) return "—";
  const n = cents / 100;
  const base = n >= 1000 ? n.toLocaleString(undefined, { maximumFractionDigits: 0 }) : n.toFixed(0);
  return opts?.perNight ? `$${base}/night` : `$${base}`;
}

export function CityInvestmentInsights({
  data,
  bnhubHref,
  fsboHref,
  brokerHref = "/broker",
}: {
  data: CityInsightsPayload;
  bnhubHref: string;
  fsboHref: string;
  brokerHref?: string;
}) {
  return (
    <section
      className="mt-16 rounded-2xl border border-[#C9A646]/25 bg-gradient-to-br from-[#0B0B0B] via-[#121212] to-[#0B0B0B] px-5 py-8 sm:px-8"
      aria-labelledby="investment-insights-heading"
    >
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C9A646]">Market snapshot</p>
          <h2 id="investment-insights-heading" className="mt-2 text-2xl font-bold text-white">
            Investment insights
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-[#B3B3B3]">
            Aggregated from active BNHub stays and FSBO listings in this city. Figures are indicative — consult a{" "}
            <Link href={brokerHref} className="font-medium text-[#C9A646] hover:text-[#E8C547]">
              licensed broker
            </Link>{" "}
            before making decisions.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <Link
            href={bnhubHref}
            className="rounded-full border border-[#C9A646]/40 px-3 py-1.5 font-medium text-[#C9A646] hover:bg-[#C9A646]/10"
          >
            BNHub listings
          </Link>
          <Link
            href={fsboHref}
            className="rounded-full border border-white/15 px-3 py-1.5 font-medium text-white/90 hover:bg-white/5"
          >
            FSBO inventory
          </Link>
        </div>
      </div>

      {data.yieldNote ? (
        <p className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-100/90">
          {data.yieldNote}
        </p>
      ) : null}

      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <InsightCard
          label="Avg property price"
          value={fmtMoney(data.avgPropertyPriceCents)}
          sub="FSBO (ask)"
          icon={<IconHome />}
        />
        <InsightCard
          label="Avg nightly rate"
          value={fmtMoney(data.avgNightlyPriceCents, { perNight: true })}
          sub="BNHub published"
          icon={<IconMoon />}
        />
        <InsightCard
          label="Active listings"
          value={`${data.activeBnhubCount + data.activeFsboCount}`}
          sub={`${data.activeBnhubCount} stays · ${data.activeFsboCount} FSBO`}
          icon={<IconLayers />}
        />
        <InsightCard
          label="Est. rental yield"
          value={data.estimatedYieldPercent != null ? `${data.estimatedYieldPercent}%` : "—"}
          sub="Simple model"
          icon={<IconTrending />}
        />
        <InsightCard
          label="Investment score"
          value={data.investmentScore != null ? String(data.investmentScore) : "—"}
          sub="0–100 heuristic"
          icon={<IconTarget />}
          highlight
        />
      </ul>

      {data.avgBedrooms != null ? (
        <p className="mt-6 text-center text-xs text-[#737373]">
          Blended avg bedrooms (where known): <span className="text-[#B3B3B3]">{data.avgBedrooms}</span>
        </p>
      ) : null}
    </section>
  );
}

function InsightCard({
  label,
  value,
  sub,
  icon,
  highlight,
}: {
  label: string;
  value: string;
  sub: string;
  icon: ReactNode;
  highlight?: boolean;
}) {
  return (
    <li
      className={`rounded-xl border px-4 py-4 transition duration-200 hover:-translate-y-0.5 hover:border-[#C9A646]/45 hover:shadow-[0_12px_40px_rgba(201, 166, 70,0.08)] ${
        highlight
          ? "border-[#C9A646]/50 bg-[#C9A646]/[0.07]"
          : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[#C9A646] [&>svg]:h-5 [&>svg]:w-5">{icon}</span>
      </div>
      <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-[#737373]">{label}</p>
      <p className="mt-1 text-xl font-bold text-white">{value}</p>
      <p className="mt-0.5 text-xs text-[#737373]">{sub}</p>
    </li>
  );
}

function IconHome() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}
function IconMoon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  );
}
function IconLayers() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7l8 4 8-4M4 13l8 4 8-4" />
    </svg>
  );
}
function IconTrending() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}
function IconTarget() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" />
      <path strokeLinecap="round" d="M12 3v2M12 19v2M3 12h2M19 12h2" />
    </svg>
  );
}
