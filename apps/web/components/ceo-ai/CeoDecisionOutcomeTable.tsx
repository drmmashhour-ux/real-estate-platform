import React from "react";

type Outcome = {
  id: string;
  resultLabel: string;
  impactScore: number;
  outcomeWindowDays: number;
  createdAt: string;
};

type Memory = {
  id: string;
  decisionType: string;
  domain: string;
  reasoning: string | null;
  outcomes: Outcome[];
  createdAt: string;
};

export function CeoDecisionOutcomeTable({ memories }: { memories: Memory[] }) {
  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
      <div className="bg-white/5 px-5 py-3">
        <h3 className="text-sm font-semibold text-slate-200">Strategic Performance Audit</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-400">
          <thead className="bg-white/[0.02] text-slate-500 uppercase tracking-tighter">
            <tr>
              <th className="px-5 py-3 font-medium">Decision</th>
              <th className="px-5 py-3 font-medium">Domain</th>
              <th className="px-5 py-3 font-medium">Result</th>
              <th className="px-5 py-3 font-medium">Impact</th>
              <th className="px-5 py-3 font-medium">Age</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {memories.map((m) => {
              const outcome = m.outcomes[0];
              return (
                <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3">
                    <div className="font-medium text-slate-200">{m.decisionType}</div>
                    <div className="truncate max-w-[200px] text-slate-500">{m.reasoning || 'No rationale stored'}</div>
                  </td>
                  <td className="px-5 py-3">{m.domain}</td>
                  <td className="px-5 py-3">
                    {outcome ? (
                      <span className={`px-2 py-0.5 rounded-full ${
                        outcome.resultLabel === 'POSITIVE' ? 'bg-emerald-500/10 text-emerald-400' :
                        outcome.resultLabel === 'NEGATIVE' ? 'bg-rose-500/10 text-rose-400' :
                        'bg-slate-500/10 text-slate-400'
                      }`}>
                        {outcome.resultLabel}
                      </span>
                    ) : (
                      <span className="text-slate-600 italic">PENDING</span>
                    )}
                  </td>
                  <td className="px-5 py-3 font-mono">
                    {outcome ? (
                      <span className={outcome.impactScore > 0 ? 'text-emerald-500' : 'text-rose-500'}>
                        {outcome.impactScore > 0 ? '+' : ''}{outcome.impactScore.toFixed(1)}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-5 py-3 text-slate-500">
                    {Math.floor((Date.now() - new Date(m.createdAt).getTime()) / (1000 * 60 * 60 * 24))}d
                  </td>
                </tr>
              );
            })}
            {memories.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-slate-500 italic">
                  No strategic decisions in memory.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
