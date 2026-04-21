import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Executive agents · LECIPM",
};

const AGENTS = [
  { name: "ACQUISITION", scope: "Investment pipeline sourcing / diligence gaps (delegates to pipeline data)." },
  { name: "ESG", scope: "Portfolio health ESG dimension + action center signals (delegates to portfolio-health.engine)." },
  { name: "LEGAL_COMPLIANCE", scope: "Open compliance cases on deal/listing scope." },
  { name: "FINANCING", scope: "Pipeline financing conditions & covenants." },
  { name: "COMMITTEE", scope: "Memo / IC pack readiness on pipeline deal." },
  { name: "CLOSING", scope: "Transactional closing readiness (delegates to closing-orchestrator)." },
  { name: "ASSET_OPERATIONS", scope: "Post-close onboarding flags." },
  { name: "PORTFOLIO", scope: "Cross-portfolio intelligence (delegates to portfolio-intelligence.service)." },
  { name: "INVESTOR_REPORTING", scope: "Memo / IC artifacts linkage." },
  { name: "GROWTH", scope: "Listing visibility / positioning hints (conservative)." },
];

export default function ExecutiveAgentsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Domain agents</h1>
      <p className="text-sm text-muted-foreground">
        Each agent normalizes outputs for the orchestrator; business rules stay in underlying modules — no duplicated engines.
      </p>
      <ul className="space-y-4">
        {AGENTS.map((a) => (
          <li key={a.name} className="rounded-xl border p-4">
            <div className="font-mono text-sm font-semibold">{a.name}</div>
            <p className="mt-2 text-sm text-muted-foreground">{a.scope}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
