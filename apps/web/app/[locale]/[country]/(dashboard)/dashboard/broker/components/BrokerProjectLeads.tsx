"use client";

import { useCallback, useEffect, useState } from "react";
import { suggestBrokerNextAction } from "@/lib/ai/brain";

type Lead = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message?: string;
  projectId: string | null;
  status: string;
  score: number;
  temperature?: "hot" | "warm" | "cold";
};

type Project = { id: string; name: string };

export function BrokerProjectLeads({ accent = "#10b981" }: { accent?: string }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [projects, setProjects] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/lecipm/leads", { credentials: "same-origin" }).then((r) => r.json()),
      fetch("/api/projects", { credentials: "same-origin" }).then((r) => r.json()),
    ])
      .then(([leadsData, projectsData]) => {
        const list = Array.isArray(leadsData) ? leadsData : [];
        const projectLeads = list.filter((l: Lead) => l.projectId != null && l.projectId !== "");
        setLeads(projectLeads);
        const projList: Project[] = Array.isArray(projectsData) ? projectsData : [];
        const map: Record<string, string> = {};
        projList.forEach((p: Project) => {
          map[p.id] = p.name;
        });
        setProjects(map);
      })
      .catch(() => setLeads([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchData();
    });
  }, [fetchData]);

  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <p className="text-sm text-slate-400">Loading project leads...</p>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h3 className="mb-2 text-lg font-semibold" style={{ color: accent }}>
          Project Leads
        </h3>
        <p className="text-sm text-slate-400">No project leads yet. They will appear here when visitors submit the form on a project page.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6">
      <h3 className="mb-4 text-lg font-semibold" style={{ color: accent }}>
        Project Leads ({leads.length})
      </h3>
      <div className="space-y-3">
        {leads.map((lead) => {
          const nextAction = suggestBrokerNextAction({
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            message: lead.message,
          });
          const temp = lead.temperature ?? (lead.score >= 70 ? "hot" : lead.score >= 45 ? "warm" : "cold");
          const badge = temp === "hot" ? "🔥 Hot" : temp === "warm" ? "⚡ Warm" : "❄️ Cold";
          const projectName = lead.projectId ? projects[lead.projectId] ?? lead.projectId : "—";
          return (
            <div
              key={lead.id}
              className="rounded-xl border p-4 transition-all duration-200 hover:scale-[1.01]"
              style={{ borderColor: `${accent}40`, backgroundColor: "rgba(255,255,255,0.04)" }}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-white">{lead.name}</p>
                <span className="text-xs font-medium" style={{ color: accent }}>
                  {badge}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-400">Project: {projectName}</p>
              <p className="mt-1 text-xs text-slate-300 line-clamp-2">{lead.message || "—"}</p>
              <p className="mt-2 text-xs font-medium" style={{ color: accent }}>
                Score: {lead.score}
              </p>
              <p className="mt-2 rounded bg-white/5 px-2 py-1 text-[11px] text-slate-400">
                Next action: {nextAction.action || "Call within 24h"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {lead.phone && lead.phone !== "[Locked]" && (
                  <a
                    href={`tel:+${lead.phone.replace(/\D/g, "").replace(/^(\d{10})$/, "1$1")}`}
                    className="inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:opacity-90"
                    style={{ borderColor: `${accent}60`, color: accent }}
                  >
                    Call
                  </a>
                )}
                {lead.email && lead.email !== "[Locked]" && (
                  <a
                    href={`mailto:${encodeURIComponent(lead.email)}`}
                    className="inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:opacity-90"
                    style={{ borderColor: `${accent}60`, color: accent }}
                  >
                    Reply to client
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
