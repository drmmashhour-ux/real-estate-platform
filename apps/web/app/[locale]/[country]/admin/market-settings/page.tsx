import { MarketSettingsClient } from "./market-settings-client";

export const metadata = {
  title: "Market launch settings",
};

export default function AdminMarketSettingsPage() {
  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-50">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight">Market launch settings</h1>
        <p className="mt-2 text-sm text-slate-400">
          Configure Syria-style manual booking, payments, and contact-first messaging for a single deployable platform.
        </p>
        <div className="mt-8">
          <MarketSettingsClient />
        </div>
      </div>
    </div>
  );
}
