"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { LeadPreviewCard } from "@/components/leads/LeadPreviewCard";

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
  leadMonetizationV1?: boolean;
  isLocked?: boolean;
  intentLabel?: string;
  city?: string;
  estimatedValue?: number | null;
  rangeMin?: number | null;
  rangeMax?: number | null;
  leadPricing?: { leadPrice: number; leadPriceCents: number };
  leadQualityV1?: { band: string; suggestedPrice: number };
  dynamicPricingV1?: { suggestedPrice: number; demandLevel: string };
};

export function BrokerContactInquiries({ accent = "#10b981" }: { accent?: string }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "locked" | "unlocked">("all");

  const fetchData = useCallback(() => {
    setLoading(true);
    fetch("/api/lecipm/leads", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        const contactLeads = list.filter(
          (l: Lead) =>
            l.status === "contact_inquiry" || (l.projectId == null && l.listingId == null),
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

  const isLeadLocked = (lead: Lead) =>
    typeof lead.isLocked === "boolean" ? lead.isLocked : lead.email === "[Locked]";

  const filtered = leads.filter((l) => {
    const locked = isLeadLocked(l);
    if (filter === "locked") return locked;
    if (filter === "unlocked") return !locked;
    return true;
  });

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

  const hasMonetization = leads.some((l) => l.leadMonetizationV1);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold" style={{ color: accent }}>
          Contact page inquiries ({filtered.length}
          {filter !== "all" ? ` / ${leads.length}` : ""})
        </h3>
        {hasMonetization ? (
          <div className="flex flex-wrap gap-2 text-xs">
            {(["all", "locked", "unlocked"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-full border px-2.5 py-1 font-medium transition ${
                  filter === f ? "border-white/40 bg-white/10 text-white" : "border-white/10 text-slate-400"
                }`}
              >
                {f === "all" ? "All" : f === "locked" ? "Locked" : "Unlocked"}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div className="space-y-3">
        {filtered.map((lead) => {
          const temp = lead.temperature ?? (lead.score >= 70 ? "hot" : lead.score >= 45 ? "warm" : "cold");
          const badge = temp === "hot" ? "🔥 Hot" : temp === "warm" ? "⚡ Warm" : "❄️ Cold";
          const locked = isLeadLocked(lead);
          const showPreview = Boolean(lead.leadMonetizationV1) && locked;
          const city = lead.city?.trim() || "—";
          const priceRange =
            lead.estimatedValue != null && lead.estimatedValue > 0
              ? `~$${Number(lead.estimatedValue).toLocaleString()}`
              : lead.rangeMin != null && lead.rangeMax != null
                ? `$${Number(lead.rangeMin).toLocaleString()} – $${Number(lead.rangeMax).toLocaleString()}`
                : null;

          if (showPreview) {
            const qBand = lead.leadQualityV1?.band;
            const qualityBadgeLabel =
              qBand === "premium"
                ? "Premium opportunity"
                : qBand === "high"
                  ? "High quality lead"
                  : undefined;
            const dp = lead.dynamicPricingV1;
            const demandBadgeLabel = dp?.demandLevel === "high" ? "High demand lead" : undefined;
            const advisorySuggested =
              typeof dp?.suggestedPrice === "number" && dp.suggestedPrice > 0
                ? dp.suggestedPrice
                : lead.leadQualityV1?.suggestedPrice;
            return (
              <LeadPreviewCard
                key={lead.id}
                leadId={lead.id}
                displayName={lead.name}
                city={city}
                intentLabel={lead.intentLabel ?? "other"}
                priceRangeLabel={priceRange}
                messagePreview={lead.message}
                score={lead.score}
                unlockPriceCad={lead.leadPricing?.leadPrice ?? 29}
                temperatureBadge={badge}
                qualityBadgeLabel={qualityBadgeLabel}
                demandBadgeLabel={demandBadgeLabel}
                advisorySuggestedPriceCad={advisorySuggested}
                accent={accent}
                useMonetizationUnlockApi
              />
            );
          }

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
              {!locked ? (
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="inline-block rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                    Unlocked
                  </span>
                  {lead.leadMonetizationV1 ? (
                    <span className="text-[10px] text-slate-500">Already purchased · full contact</span>
                  ) : null}
                </div>
              ) : null}
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
