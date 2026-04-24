"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface EntityPerf {
  entityId: string;
  name: string;
  type: string;
  revenue: number;
  growth: number;
  status: string;
  strategicScore: number;
}

interface Props {
  scorecards: EntityPerf[];
}

export function EntityPerformanceTable({ scorecards }: Props) {
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(val);

  return (
    <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
      <div className="p-4 border-b border-zinc-800">
        <h3 className="font-bold text-white">Entity Performance Scorecards</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-zinc-950 text-zinc-400 border-b border-zinc-800">
              <th className="p-4 font-semibold">Entity Name</th>
              <th className="p-4 font-semibold">Type</th>
              <th className="p-4 font-semibold">Revenue</th>
              <th className="p-4 font-semibold">Growth</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold text-right">Strategic Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {scorecards.map((s) => (
              <tr key={s.entityId} className="hover:bg-zinc-800/50 transition-colors">
                <td className="p-4 font-medium text-white">{s.name}</td>
                <td className="p-4 text-zinc-400 text-xs uppercase tracking-wider">{s.type}</td>
                <td className="p-4 text-white">{formatCurrency(s.revenue)}</td>
                <td className="p-4">
                  <span className={s.growth >= 0 ? "text-green-500" : "text-red-500"}>
                    {(s.growth * 100).toFixed(1)}%
                  </span>
                </td>
                <td className="p-4">
                  <Badge className={
                    s.status === "STRONG" ? "bg-green-500/10 text-green-500 border-green-500/20" :
                    s.status === "STABLE" ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                    "bg-red-500/10 text-red-500 border-red-500/20"
                  }>
                    {s.status}
                  </Badge>
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <div className="w-16 bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-purple-500 h-full" 
                        style={{ width: `${s.strategicScore}%` }}
                      />
                    </div>
                    <span className="text-zinc-400 tabular-nums">{s.strategicScore}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
