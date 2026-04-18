import type { NegotiationAutopilotResult } from "@/modules/negotiation-autopilot/negotiation-autopilot.types";
import { NegotiationScenarioCard } from "./NegotiationScenarioCard";
import { NegotiationRiskCard } from "./NegotiationRiskCard";
import { ConcessionBundleCard } from "./ConcessionBundleCard";
import { ApprovalRequiredBar } from "./ApprovalRequiredBar";

export function NegotiationAutopilotPanel({ result }: { result: NegotiationAutopilotResult }) {
  const flags = result.riskFlags as { code: string; message: string; severity: string }[];
  return (
    <div className="space-y-6">
      <ApprovalRequiredBar />
      <p className="text-xs text-ds-text-secondary">{result.disclaimer}</p>
      <NegotiationRiskCard flags={flags} />
      <ConcessionBundleCard outputs={result.engineOutputs} />
      <div className="space-y-4">
        {result.scenarios.map((s) => (
          <NegotiationScenarioCard key={s.scenarioId} scenario={s} />
        ))}
      </div>
    </div>
  );
}
