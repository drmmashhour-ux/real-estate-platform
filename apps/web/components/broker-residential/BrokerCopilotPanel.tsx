import { residentialCopilotDisclaimer } from "@/modules/broker-residential-copilot/broker-residential-copilot.explainer";

export function BrokerCopilotPanel() {
  return (
    <div className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-5">
      <h2 className="font-serif text-lg text-amber-100">Residential copilot</h2>
      <p className="mt-2 text-sm leading-relaxed text-amber-100/75">{residentialCopilotDisclaimer()}</p>
      <p className="mt-3 text-xs text-amber-200/60">
        Run document checks and copilot analysis per deal from the deal workspace. Nothing is auto-filed or auto-signed.
      </p>
    </div>
  );
}
