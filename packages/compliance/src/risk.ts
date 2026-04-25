export function generateRiskEvent(input: { type: string; severity: string; description: string }) {
  return {
    riskType: input.type,
    severity: input.severity,
    description: input.description,
    detectedBy: "rule_engine" as const,
  };
}
