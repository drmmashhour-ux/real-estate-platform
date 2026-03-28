import { PrimaryConversionCTA } from "./PrimaryConversionCTA";

export function InlineUpgradeBanner({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-premium-gold/40 bg-premium-gold/10 p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-white">{text}</p>
        <PrimaryConversionCTA href="/pricing" label="Upgrade" event="conversion_trigger" />
      </div>
    </div>
  );
}
