"use client";

type ValuationRow = {
  id: string;
  property_identity_id: string;
  property_uid: string;
  official_address: string;
  valuation_type: string;
  estimated_value: number | null;
  value_min: number | null;
  value_max: number | null;
  monthly_rent_estimate: number | null;
  nightly_rate_estimate: number | null;
  annual_revenue_estimate: number | null;
  investment_score: number | null;
  confidence_score: number;
  confidence_label: string;
  valuation_summary: string | null;
  updated_at: Date;
};

export function AdminValuationClient({ initialValuations }: { initialValuations: ValuationRow[] }) {
  return (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-700 text-slate-400">
            <th className="pb-2 pr-4">Type</th>
            <th className="pb-2 pr-4">Property</th>
            <th className="pb-2 pr-4">Value / Rent / Revenue</th>
            <th className="pb-2 pr-4">Confidence</th>
            <th className="pb-2 pr-4">Updated</th>
          </tr>
        </thead>
        <tbody>
          {initialValuations.map((v) => (
            <tr key={v.id} className="border-b border-slate-800">
              <td className="py-2 pr-4 text-slate-300">{v.valuation_type.replace(/_/g, " ")}</td>
              <td className="max-w-[200px] truncate py-2 pr-4 text-slate-300" title={v.official_address}>
                {v.property_uid}
              </td>
              <td className="py-2 pr-4 text-slate-300">
                {v.estimated_value != null && `$${(v.estimated_value / 100).toLocaleString()}`}
                {v.monthly_rent_estimate != null && `$${(v.monthly_rent_estimate / 100).toLocaleString()}/mo`}
                {v.nightly_rate_estimate != null && `$${(v.nightly_rate_estimate / 100).toLocaleString()}/night`}
                {v.annual_revenue_estimate != null && `$${(v.annual_revenue_estimate / 100).toLocaleString()}/yr`}
                {v.investment_score != null && `Score ${v.investment_score}`}
                {!v.estimated_value && !v.monthly_rent_estimate && !v.nightly_rate_estimate && !v.annual_revenue_estimate && v.investment_score == null && "—"}
              </td>
              <td className="py-2 pr-4">
                <span
                  className={
                    v.confidence_label === "high"
                      ? "text-emerald-400"
                      : v.confidence_label === "medium"
                        ? "text-amber-400"
                        : "text-slate-400"
                  }
                >
                  {v.confidence_label} ({v.confidence_score})
                </span>
              </td>
              <td className="py-2 pr-4 text-slate-500">{new Date(v.updated_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {initialValuations.length === 0 && (
        <p className="py-8 text-center text-slate-500">No valuations yet.</p>
      )}
    </div>
  );
}
