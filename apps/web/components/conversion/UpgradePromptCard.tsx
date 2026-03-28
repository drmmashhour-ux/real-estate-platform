import { conversionCopy } from "@/src/design/conversionCopy";
import { PrimaryConversionCTA } from "./PrimaryConversionCTA";

export function UpgradePromptCard({ role = "guest" }: { role?: "broker" | "investor" | "seller" | "guest" }) {
  const roleLine =
    role === "broker"
      ? "Prioritize better leads and automate follow-up."
      : role === "investor"
        ? "Unlock deeper scenario and confidence breakdowns."
        : role === "seller"
          ? "Get stronger pricing and listing confidence insights."
          : "Unlock full analysis and next best actions.";
  return (
    <aside className="rounded-xl border border-premium-gold/40 bg-premium-gold/10 p-4">
      <p className="text-sm font-semibold text-white">{conversionCopy.upgrade.lockedPrompt}</p>
      <p className="mt-1 text-sm text-slate-200">{roleLine}</p>
      <div className="mt-3">
        <PrimaryConversionCTA href="/pricing" label={conversionCopy.upgrade.ctaSecondary} event="conversion_trigger" />
      </div>
    </aside>
  );
}
