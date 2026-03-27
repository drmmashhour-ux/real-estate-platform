import { KPIDashboard } from "@/components/internal/KPIDashboard";

const GOLD = "#C9A646";

export const metadata = {
  title: "KPI dashboard | Admin",
  description: "Core business metrics — admin only.",
};

export default function AdminKpiPage() {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: GOLD }}>
        Metrics
      </p>
      <h1 className="mt-2 text-3xl font-bold text-white">KPI control panel</h1>
      <p className="mt-2 max-w-2xl text-sm text-[#B3B3B3]">
        Signups, activation, conversion, retention proxy, MRR, churn, and time-to-value. Admin-only API; definitions are
        on-card.
      </p>
      <div className="mt-8">
        <KPIDashboard />
      </div>
    </div>
  );
}
