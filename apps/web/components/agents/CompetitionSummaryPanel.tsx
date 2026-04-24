"use client";

import { Card } from "@/components/ui/card";
import { Swords, Trophy, TrendingUp, AlertCircle } from "lucide-react";

interface Props {
  agents: any[];
}

export function CompetitionSummaryPanel({ agents }: Props) {
  // Find top performer
  const topAgent = [...agents].sort((a, b) => b.performanceScore - a.performanceScore)[0];
  
  // Find most active domain
  const domains = agents.reduce((acc: any, a) => {
    acc[a.domain] = (acc[a.domain] || 0) + 1;
    return acc;
  }, {});
  const topDomain = Object.entries(domains).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || "n/a";

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="p-4 bg-zinc-900 border-zinc-800">
        <div className="flex items-center space-x-3 mb-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Top Performer</h4>
        </div>
        <p className="text-xl font-black text-white truncate">{topAgent?.name || "None"}</p>
        <p className="text-[10px] text-zinc-500 mt-1 uppercase">Domain: {topAgent?.domain || "n/a"}</p>
      </Card>

      <Card className="p-4 bg-zinc-900 border-zinc-800">
        <div className="flex items-center space-x-3 mb-2">
          <Swords className="w-5 h-5 text-blue-500" />
          <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Active Battles</h4>
        </div>
        <p className="text-xl font-black text-white">4 Domains</p>
        <p className="text-[10px] text-zinc-500 mt-1 uppercase">Leading: {topDomain}</p>
      </Card>

      <Card className="p-4 bg-zinc-900 border-zinc-800">
        <div className="flex items-center space-x-3 mb-2">
          <Shield className="w-5 h-5 text-green-500" />
          <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Safety Status</h4>
        </div>
        <p className="text-xl font-black text-green-500 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2" />
          GOVERNED
        </p>
        <p className="text-[10px] text-zinc-500 mt-1 uppercase">Caps Enforced</p>
      </Card>
    </div>
  );
}

function Shield({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
