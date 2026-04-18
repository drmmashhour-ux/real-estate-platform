import { ConversionMonitoringDashboard } from "@/components/admin/ConversionMonitoringDashboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AdminConversionMonitoringPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 text-white">
      <header className="border-b border-white/10 pb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Conversion monitoring</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">
          Live counters from this server process — lead funnel starts/submits and conversion CTAs. Pair with{" "}
          <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-[11px]">[conversion]</code> structured logs and
          the rollout checklist in{" "}
          <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-[11px]">
            docs/conversion/conversion-rollout-checklist.md
          </code>
          .
        </p>
      </header>
      <div className="mt-8">
        <ConversionMonitoringDashboard />
      </div>
    </div>
  );
}
