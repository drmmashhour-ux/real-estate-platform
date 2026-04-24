"use client";

import { Card } from "@/components/ui/card";
import { ListTodo, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Priority {
  entityId: string;
  entityName: string;
  priorityType: string;
  rank: number;
  rationale: string;
}

interface Props {
  priorities: Priority[];
}

export function OrchestrationPrioritiesPanel({ priorities }: Props) {
  return (
    <Card className="bg-zinc-900 border-zinc-800 p-4">
      <div className="flex items-center space-x-2 mb-4 border-b border-zinc-800 pb-2">
        <ListTodo className="w-5 h-5 text-blue-500" />
        <h3 className="font-bold text-white uppercase tracking-tighter">Empire Orchestration Priorities</h3>
      </div>
      <div className="space-y-3">
        {priorities.map((p, idx) => (
          <div key={`${p.entityId}-${idx}`} className="flex items-start space-x-3 p-3 bg-zinc-950 rounded border border-zinc-800/50">
            <div className="flex-shrink-0 w-6 h-6 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-500">
              #{p.rank}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-xs font-bold text-white truncate">{p.entityName}</h4>
                <Badge className="text-[9px] px-1 py-0 bg-blue-500/10 text-blue-400 border-blue-500/20">
                  {p.priorityType}
                </Badge>
              </div>
              <p className="text-[10px] text-zinc-500 italic leading-tight">{p.rationale}</p>
            </div>
          </div>
        ))}
        {priorities.length === 0 && (
          <div className="text-center py-6 text-zinc-500 text-xs italic">
            No active orchestration priorities.
          </div>
        )}
      </div>
    </Card>
  );
}
