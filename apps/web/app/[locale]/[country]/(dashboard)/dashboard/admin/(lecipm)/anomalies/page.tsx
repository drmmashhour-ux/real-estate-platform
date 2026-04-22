import Link from "next/link";

import { detectAdminAnomalies } from "@/modules/admin-intelligence";

export const dynamic = "force-dynamic";

export default async function AdminAnomaliesDrillPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const adminBase = `/${locale}/${country}/dashboard/admin`;
  const anomalies = await detectAdminAnomalies();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 text-white" style={{ background: "#030303" }}>
      <p className="text-[11px] uppercase tracking-[0.28em] text-[#D4AF37]/80">Guardrails</p>
      <h1 className="mt-3 font-serif text-3xl font-light">Anomaly desk</h1>
      <p className="mt-3 max-w-2xl text-sm text-zinc-500">
        Rule-based scans on revenue, bookings, payments, and abuse density. Severity guides triage — not a substitute for fraud models.
      </p>

      <div className="mt-10 overflow-hidden rounded-2xl border border-[#D4AF37]/15">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 bg-black/60 text-[11px] uppercase tracking-widest text-zinc-500">
            <tr>
              <th className="px-4 py-3">Severity</th>
              <th className="px-4 py-3">Signal</th>
              <th className="px-4 py-3">Explanation</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {anomalies.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-zinc-500">
                  No anomalies detected for current rules.
                </td>
              </tr>
            ) : (
              anomalies.map((a) => (
                <tr key={a.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-4 font-semibold text-[#D4AF37]">{a.severity}</td>
                  <td className="px-4 py-4 text-white">{a.title}</td>
                  <td className="px-4 py-4 text-zinc-400">{a.explanation}</td>
                  <td className="px-4 py-4 text-zinc-500">{a.recommendedAction}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Link href={adminBase} className="mt-10 inline-block text-sm text-[#D4AF37] hover:underline">
        ← Command center
      </Link>
    </div>
  );
}
