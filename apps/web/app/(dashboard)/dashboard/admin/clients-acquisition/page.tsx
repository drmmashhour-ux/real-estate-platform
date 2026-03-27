import { ClientsAcquisitionClient } from "./clients-acquisition-client";

const GOLD = "#C9A646";

export const metadata = {
  title: "First 10 clients | Acquisition",
  description: "High-touch outreach, scripts, and conversion tracking for your first clients.",
};

export default function ClientsAcquisitionPage() {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: GOLD }}>
        Manual acquisition
      </p>
      <h1 className="mt-2 text-3xl font-bold text-white">First 10 clients</h1>
      <p className="mt-2 max-w-2xl text-sm text-[#B3B3B3]">
        Daily targets, outreach CRM, proven DM/call scripts, follow-up rhythm, and conversion stats — black &amp; gold
        launch workspace. Does not change public site or automated CRM pipelines.
      </p>
      <ClientsAcquisitionClient />
    </div>
  );
}
