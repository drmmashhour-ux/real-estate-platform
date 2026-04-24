"use client";

import { Card } from "@/components/ui/card";
import { Building2, Landmark, TrendingUp, AlertTriangle } from "lucide-react";

interface Props {
  data: {
    totalEntities: number;
    activeEntities: number;
    totalRevenueRollup: number;
    totalCapitalRollup: number;
  };
}

export function EmpireOverviewCards({ data }: Props) {
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(val);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="p-4 flex items-center space-x-4 bg-zinc-900 border-zinc-800">
        <div className="p-2 bg-blue-500/10 rounded-lg">
          <Building2 className="w-6 h-6 text-blue-500" />
        </div>
        <div>
          <p className="text-xs text-zinc-400 uppercase font-semibold">Total Entities</p>
          <p className="text-2xl font-bold text-white">{data.totalEntities}</p>
          <p className="text-[10px] text-zinc-500">{data.activeEntities} active</p>
        </div>
      </Card>

      <Card className="p-4 flex items-center space-x-4 bg-zinc-900 border-zinc-800">
        <div className="p-2 bg-green-500/10 rounded-lg">
          <TrendingUp className="w-6 h-6 text-green-500" />
        </div>
        <div>
          <p className="text-xs text-zinc-400 uppercase font-semibold">Total Revenue</p>
          <p className="text-2xl font-bold text-white">{formatCurrency(data.totalRevenueRollup)}</p>
          <p className="text-[10px] text-green-500">Aggregated Group ROI</p>
        </div>
      </Card>

      <Card className="p-4 flex items-center space-x-4 bg-zinc-900 border-zinc-800">
        <div className="p-2 bg-purple-500/10 rounded-lg">
          <Landmark className="w-6 h-6 text-purple-500" />
        </div>
        <div>
          <p className="text-xs text-zinc-400 uppercase font-semibold">Total Capital</p>
          <p className="text-2xl font-bold text-white">{formatCurrency(data.totalCapitalRollup)}</p>
          <p className="text-[10px] text-zinc-500">Liquidity & Reserves</p>
        </div>
      </Card>

      <Card className="p-4 flex items-center space-x-4 bg-zinc-900 border-zinc-800">
        <div className="p-2 bg-orange-500/10 rounded-lg">
          <AlertTriangle className="w-6 h-6 text-orange-500" />
        </div>
        <div>
          <p className="text-xs text-zinc-400 uppercase font-semibold">Strategic Alerts</p>
          <p className="text-2xl font-bold text-white">4</p>
          <p className="text-[10px] text-orange-500">Requires Founder Review</p>
        </div>
      </Card>
    </div>
  );
}
