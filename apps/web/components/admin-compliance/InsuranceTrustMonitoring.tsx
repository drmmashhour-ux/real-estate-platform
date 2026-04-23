"use client";

import React from "react";
import { format } from "date-fns";
import { Shield, AlertTriangle, FileText, User } from "lucide-react";

type Props = {
  monitoring: {
    expiringSoon: any[];
    highRiskBrokers: any[];
    recentClaims: any[];
  };
};

export function InsuranceTrustMonitoring({ monitoring }: Props) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Expiring Soon */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-4 w-4 text-orange-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Expiring Insurance</h3>
        </div>
        <ul className="space-y-3">
          {monitoring.expiringSoon.length === 0 ? (
            <p className="text-xs text-zinc-500 italic">No policies expiring soon.</p>
          ) : (
            monitoring.expiringSoon.map((item) => (
              <li key={item.id} className="flex justify-between items-start gap-2">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-zinc-200">{item.broker.name}</span>
                  <span className="text-[10px] text-zinc-500">Expires: {format(new Date(item.endDate), "MMM d, yyyy")}</span>
                </div>
                <div className="px-1.5 py-0.5 rounded bg-orange-500/10 border border-orange-500/20 text-[10px] text-orange-400 font-bold uppercase">
                  Renew
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      {/* High Risk Brokers */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-4 w-4 text-red-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">High Risk Brokers</h3>
        </div>
        <ul className="space-y-3">
          {monitoring.highRiskBrokers.length === 0 ? (
            <p className="text-xs text-zinc-500 italic">No high-risk brokers flagged.</p>
          ) : (
            monitoring.highRiskBrokers.map((item) => (
              <li key={item.id} className="flex justify-between items-start gap-2">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-zinc-200">{item.broker.name}</span>
                  <span className="text-[10px] text-zinc-500">{item.message}</span>
                </div>
                <div className="px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-[10px] text-red-400 font-bold uppercase">
                  Critical
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      {/* Recent Claims */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-4 w-4 text-blue-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Recent Claims</h3>
        </div>
        <ul className="space-y-3">
          {monitoring.recentClaims.length === 0 ? (
            <p className="text-xs text-zinc-500 italic">No recent claims filed.</p>
          ) : (
            monitoring.recentClaims.map((item) => (
              <li key={item.id} className="flex justify-between items-start gap-2">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-zinc-200">{item.broker.name}</span>
                  <span className="text-[10px] text-zinc-500">{format(new Date(item.createdAt), "MMM d")} · {item.status}</span>
                </div>
                <div className="px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-400 font-bold uppercase">
                  View
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
