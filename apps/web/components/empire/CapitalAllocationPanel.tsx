"use client";

import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface Capital {
  entityId: string;
  entityName: string;
  totalCapital: number;
  reserves: number;
  operatingAllocation: number;
  investmentAllocation: number;
}

interface Props {
  capital: Capital[];
}

const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];

export function CapitalAllocationPanel({ capital }: Props) {
  const chartData = capital.map(c => ({
    name: c.entityName,
    value: c.totalCapital
  }));

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(val);

  return (
    <Card className="bg-zinc-900 border-zinc-800 p-4">
      <h3 className="font-bold text-white mb-4 border-b border-zinc-800 pb-2">Capital Allocation</h3>
      <div className="flex flex-col lg:flex-row items-center">
        <div className="w-full lg:w-1/2 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: "#09090b", border: "1px solid #27272a", color: "#fff" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="w-full lg:w-1/2 space-y-4">
          {capital.map((c, index) => (
            <div key={c.entityId} className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-white font-bold">{c.entityName}</span>
                </div>
                <span className="text-zinc-400 font-mono">{formatCurrency(c.totalCapital)}</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-1">
                <div className="bg-zinc-600 h-full" style={{ width: "100%" }} />
              </div>
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono pt-1">
                <span>Ops: {formatCurrency(c.operatingAllocation)}</span>
                <span>Res: {formatCurrency(c.reserves)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
