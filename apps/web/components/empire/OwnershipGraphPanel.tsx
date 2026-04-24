"use client";

import { Card } from "@/components/ui/card";
import { GitBranch, User, ChevronRight } from "lucide-react";

interface Ownership {
  id: string;
  parentEntity: { id: string; name: string };
  childEntity: { id: string; name: string };
  ownershipPercent: number;
}

interface Props {
  ownerships: Ownership[];
}

export function OwnershipGraphPanel({ ownerships }: Props) {
  return (
    <Card className="bg-zinc-900 border-zinc-800 p-4">
      <div className="flex items-center space-x-2 mb-4 border-b border-zinc-800 pb-2">
        <GitBranch className="w-5 h-5 text-zinc-400" />
        <h3 className="font-bold text-white">Ownership & Control Map</h3>
      </div>
      <div className="space-y-3">
        {ownerships.map((o) => (
          <div key={o.id} className="flex items-center space-x-3 p-3 bg-zinc-950 rounded-lg border border-zinc-800/50">
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-tighter mb-1">Parent</span>
              <div className="p-2 bg-blue-500/10 rounded border border-blue-500/20 text-blue-400 font-bold text-xs truncate max-w-[120px]">
                {o.parentEntity.name}
              </div>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="h-px bg-zinc-800 w-full relative">
                <ChevronRight className="w-4 h-4 text-zinc-600 absolute right-0 -top-2" />
              </div>
              <span className="text-[10px] font-bold text-zinc-400 mt-1">
                {o.ownershipPercent}%
              </span>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-tighter mb-1">Child</span>
              <div className="p-2 bg-purple-500/10 rounded border border-purple-500/20 text-purple-400 font-bold text-xs truncate max-w-[120px]">
                {o.childEntity.name}
              </div>
            </div>
          </div>
        ))}
        {ownerships.length === 0 && (
          <div className="text-center py-8 text-zinc-500 text-sm italic">
            No direct ownership links recorded.
          </div>
        )}
      </div>
    </Card>
  );
}
