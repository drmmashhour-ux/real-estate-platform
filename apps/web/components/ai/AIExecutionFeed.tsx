import type { ManagerAiAgentRunRow } from "@/types/manager-ai-agent-client";

export function AIExecutionFeed({ runs }: { runs: Pick<ManagerAiAgentRunRow, "id" | "agentKey" | "status" | "createdAt" | "outputSummary">[] }) {
  if (runs.length === 0) {
    return <p className="text-sm text-white/40">No recent executions.</p>;
  }
  return (
    <ul className="space-y-2 text-sm text-white/75">
      {runs.map((r) => (
        <li key={r.id} className="rounded-lg border border-white/10 bg-[#141414] px-3 py-2">
          <span className="font-mono text-xs text-white/35">{r.createdAt.toISOString()}</span> · {r.agentKey} ·{" "}
          {r.status}
          {r.outputSummary ? <span className="mt-1 block text-white/45">{r.outputSummary.slice(0, 140)}</span> : null}
        </li>
      ))}
    </ul>
  );
}
