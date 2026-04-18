"use client";

import { useState } from "react";
import { ScriptPanel } from "./ScriptPanel";
import { PitchBuilder } from "./PitchBuilder";
import { ObjectionHelper } from "./ObjectionHelper";
import { ROIQuickTool } from "./ROIQuickTool";
import { LeadConversionHelper } from "./LeadConversionHelper";

export function SalesWorkbench({ marketDefault }: { marketDefault?: string }) {
  const [tab, setTab] = useState<"script" | "pitch" | "objection" | "roi" | "leads">("script");

  const tabs: { id: typeof tab; label: string }[] = [
    { id: "script", label: "Scripts" },
    { id: "pitch", label: "Pitch outline" },
    { id: "objection", label: "Objections" },
    { id: "roi", label: "ROI" },
    { id: "leads", label: "Lead → deal" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              tab === t.id ? "bg-emerald-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "script" ? <ScriptPanel marketDefault={marketDefault} /> : null}
      {tab === "pitch" ? <PitchBuilder marketDefault={marketDefault} /> : null}
      {tab === "objection" ? <ObjectionHelper /> : null}
      {tab === "roi" ? <ROIQuickTool /> : null}
      {tab === "leads" ? <LeadConversionHelper /> : null}
    </div>
  );
}
