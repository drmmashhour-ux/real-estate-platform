import React from "react";

type Goal = {
  id: string;
  name: string;
  domain: string;
  targetMetric: string;
  targetValue: number;
  currentValue: number;
  priority: number;
};

export function CeoLongTermGoalsPanel({ goals }: { goals: Goal[] }) {
  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
      <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-cyan-400"></span>
        Long-Term Strategic Goals
      </h3>
      <div className="mt-4 space-y-4">
        {goals.map((goal) => {
          const progress = Math.min(100, (goal.currentValue / goal.targetValue) * 100);
          return (
            <div key={goal.id} className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-300">{goal.name}</span>
                <span className="text-slate-500">{progress.toFixed(1)}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-800">
                <div 
                  className="h-full rounded-full bg-cyan-500/80" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 uppercase tracking-tight">
                <span>{goal.domain}</span>
                <span>Target: {goal.targetValue} {goal.targetMetric}</span>
              </div>
            </div>
          );
        })}
        {goals.length === 0 && (
          <p className="text-xs text-slate-500 italic">No active long-term goals.</p>
        )}
      </div>
    </section>
  );
}
