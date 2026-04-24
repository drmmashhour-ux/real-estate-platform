"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Rocket, Target, Zap, TrendingDown, PauseCircle, Trash2 } from "lucide-react";

interface Rec {
  entityId: string;
  entityName: string;
  action: string;
  priority: number;
  rationale: string;
  confidence: number;
  riskNotes: string;
}

interface Props {
  recommendations: Rec[];
}

const ACTION_ICONS: Record<string, any> = {
  INCREASE_CAPITAL: Rocket,
  REDUCE_SPEND: TrendingDown,
  HOLD_RESERVES: Target,
  INCUBATE: Zap,
  SHUT_DOWN: Trash2,
  PAUSE: PauseCircle,
};

export function StrategicAllocationPanel({ recommendations }: Props) {
  return (
    <Card className="bg-zinc-900 border-zinc-800 p-4">
      <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-2">
        <h3 className="font-bold text-white flex items-center">
          <Zap className="w-5 h-5 text-yellow-500 mr-2" />
          Strategic Strategic Recommendations
        </h3>
        <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
          Founder Advisory Only
        </Badge>
      </div>
      <div className="space-y-6">
        {recommendations.map((r, idx) => {
          const Icon = ACTION_ICONS[r.action] || Target;
          return (
            <div key={`${r.entityId}-${idx}`} className="relative pl-6 border-l border-zinc-800 group">
              <div className="absolute left-[-13px] top-0 p-1.5 bg-zinc-950 border border-zinc-800 rounded-full group-hover:border-yellow-500/50 transition-colors">
                <Icon className="w-4 h-4 text-zinc-400 group-hover:text-yellow-500 transition-colors" />
              </div>
              
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-bold text-white uppercase tracking-tight">{r.entityName}</h4>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Conf: {(r.confidence * 100).toFixed(0)}%</span>
                  <div className="w-12 bg-zinc-800 rounded-full h-1">
                    <div className="bg-yellow-500 h-full" style={{ width: `${r.confidence * 100}%` }} />
                  </div>
                </div>
              </div>
              
              <div className="bg-zinc-950/50 rounded-lg p-3 border border-zinc-800/30">
                <div className="flex items-center space-x-2 mb-2">
                  <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px] py-0">
                    {r.action.replace(/_/g, " ")}
                  </Badge>
                  <span className="text-[10px] text-zinc-600 font-bold">PRIORITY {r.priority}/10</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed mb-3">{r.rationale}</p>
                <div className="p-2 bg-red-500/5 rounded border border-red-500/10">
                  <p className="text-[10px] text-red-400/80 italic font-medium">Risk: {r.riskNotes}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
