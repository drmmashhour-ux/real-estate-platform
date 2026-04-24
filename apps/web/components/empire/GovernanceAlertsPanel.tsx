"use client";

import { Card } from "@/components/ui/card";
import { AlertCircle, ShieldCheck, ShieldAlert } from "lucide-react";

interface Alert {
  id: string;
  entityId: string;
  entityName: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  type: string;
  message: string;
  createdAt: string | Date;
}

interface Props {
  alerts: Alert[];
}

export function GovernanceAlertsPanel({ alerts }: Props) {
  return (
    <Card className="bg-zinc-900 border-zinc-800 p-4 h-full">
      <div className="flex justify-between items-center mb-4 border-b border-zinc-800 pb-2">
        <div className="flex items-center space-x-2 text-orange-500">
          <ShieldAlert className="w-5 h-5" />
          <h3 className="font-bold text-white">Governance & Risk Alerts</h3>
        </div>
        <span className="text-xs text-zinc-500 uppercase font-bold tracking-tighter">
          {alerts.length} Active
        </span>
      </div>
      <div className="space-y-4">
        {alerts.map((a) => (
          <div key={a.id} className="p-3 bg-zinc-950 border-l-2 border-orange-500 rounded-r-lg">
            <div className="flex justify-between items-start mb-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase">{a.type}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                a.severity === "CRITICAL" ? "bg-red-500/20 text-red-500" : "bg-orange-500/20 text-orange-500"
              }`}>
                {a.severity}
              </span>
            </div>
            <p className="text-sm text-white font-medium leading-snug">{a.message}</p>
            <div className="mt-2 flex items-center space-x-1 text-[10px] text-zinc-500">
              <AlertCircle className="w-3 h-3" />
              <span>Entity: {a.entityName}</span>
            </div>
          </div>
        ))}
        {alerts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
            <ShieldCheck className="w-12 h-12 text-green-500/20 mb-2" />
            <p className="text-sm italic">All entities compliant. No major risks detected.</p>
          </div>
        )}
      </div>
    </Card>
  );
}
