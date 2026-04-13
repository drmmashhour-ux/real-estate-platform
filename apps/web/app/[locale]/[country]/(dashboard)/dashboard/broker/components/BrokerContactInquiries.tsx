"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Lead = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message?: string;
  projectId: string | null;
  listingId?: string | null;
  status: string;
  score: number;
  temperature?: "hot" | "warm" | "cold";
  createdAt?: string;
};

export function BrokerContactInquiries({ accent = "#10b981" }: { accent?: string }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(() => {
    setLoading(true);
    fetch("/api/leads", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        const contactLeads = list.filter(
          (l: Lead) =>
            l.status === "contact_inquiry" ||
            (l.projectId == null && l.listingId == null)
        );
        setLeads(contactLeads);
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
        <p className="text-sm text-slate-400">Loading contact inquiries...</p>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h3 className="mb-2 text-lg font-semibold" style={{ color: accent }}>
          Contact page inquiries
        </h3>
        <p className="text-sm text-slate-400">
          No inquiries yet. They will appear here when visitors submit the form on the Contact page.
        </p>
        <Link
          href="/contact"
          className="mt-3 inline-block text-sm font-medium"
          style={{ color: accent }}
        >
          View contact page →
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6">
      <h3 className="mb-4 text-lg font-semibold" style={{ color: accent }}>
        Contact page inquiries ({leads.length})
      </h3>
      <div className="space-y-3">
        {leads.map((lead) => {
          const temp = lead.temperature ?? (lead.score >= 70 ? "hot" : lead.score >= 45 ? "warm" : "cold");
          const badge = temp === "hot" ? "🔥 Hot" : temp === "warm" ? "⚡ Warm" : "❄️ Cold";
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
              <p className="mt-1 text-sm text-slate-400">
                {lead.email} {lead.phone ? ` · ${lead.phone}` : ""}
              </p>
              <p className="mt-2 text-xs text-slate-300 line-clamp-3">{lead.message || "—"}</p>
              <p className="mt-2 text-xs font-medium" style={{ color: accent }}>
                Score: {lead.score}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {lead.phone && lead.phone !== "[Locked]" && (
                  <a
                    href={`tel:${lead.phone.replace(/\D/g, "").replace(/^(\d{10})$/, "1$1").replace(/^/, "+")}`}
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
      <Link
        href="/contact"
        className="mt-4 inline-block text-sm font-medium"
        style={{ color: accent }}
      >
        View contact page →
      </Link>
    </div>
  );
}
