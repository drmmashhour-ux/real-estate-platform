import { SalesScriptsClient } from "./sales-scripts-client";

const GOLD = "var(--color-premium-gold)";

export const metadata = {
  title: "Launch + sales | Scripts",
  description: "In-app DM, call, closing, and follow-up scripts to generate leads and close deals.",
};

export default function DashboardAdminSalesPage() {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: GOLD }}>
        Launch + sales system
      </p>
      <h1 className="mt-2 text-3xl font-bold text-white">Sales scripts (in-app)</h1>
      <p className="mt-2 max-w-2xl text-sm text-[#B3B3B3]">
        Generate leads, convert manually, close mortgage &amp; real estate deals — ready-to-copy{" "}
        <strong className="text-premium-gold">DM, call, closing, and follow-up</strong> blocks. Use with{" "}
        <strong className="text-white">CRM → Leads</strong> (Copy DM · Call client · WhatsApp).
      </p>
      <SalesScriptsClient />
    </div>
  );
}
