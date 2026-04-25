"use client";

import Link from "next/link";
import { 
  Users, 
  Target, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  ArrowUpRight,
  Info,
  DollarSign,
  Tag,
  Zap,
  Star,
  RefreshCcw,
  MapPin,
  Sparkles
} from "lucide-react";
import { QUEBEC_PRICING, PricingDisplay } from "@/modules/monetization/quebec-pricing.config";

type LeadMarketplaceRow = {
  id: string;
  name: string;
  score: number;
  conversionProbability: number;
  estimatedValue: number;
  createdAt: string;
  purchaseRegion: string | null;
};
import {
  BROKER_CRM_KANBAN_COLUMNS,
  brokerCrmStatusToKanbanColumn,
  KANBAN_COLUMN_LABEL,
  type BrokerCrmKanbanColumn,
} from "@/modules/crm/crm.types";

type AutopilotBar = {
  suggestedActions: number;
  followUpsDueToday: number;
};

type LeadRow = {
  id: string;
  displayName: string;
  status: string;
  source: string;
  priorityLabel: string;
  priorityScore: number;
  listing: { id: string; title: string; listingCode: string } | null;
  lastActivityAt: string;
  nextFollowUpAt: string | null;
  /** Rule-based label (internal scoring; no auto-messaging). */
  aiScoreLabel?: string;
  /** 0–1 normalized priority score. */
  aiScore01?: number;
  /** hot / warm / cold from priority bands. */
  aiThermal?: "hot" | "warm" | "cold";
  suggestedNext?: string | null;
};

type Kpis = {
  newLeads: number;
  highPriority: number;
  followUpsDueToday: number;
  closedThisWeek: number;
};

type CrmInsightsPayload = {
  pipeline: {
    openLeads: number;
    stuckFollowUps: number;
    newLeads: number;
    highPriority: number;
  };
  operational?: {
    stalledLeads: number;
    overdueFollowUps?: number;
    uncontactedLeads: number;
    highScoreIgnoredLeads: number;
    dealBottlenecks: number;
  };
  suggestedBacklog: number;
  notes: string[];
  generatedAt: string;
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: "new", label: "New" },
  { id: "high", label: "High priority" },
  { id: "followup_due", label: "Follow-up due" },
  { id: "closed", label: "Closed" },
  { id: "lost", label: "Lost" },
] as const;

function badgePriority(label: string) {
  if (label === "high") return "bg-rose-500/20 text-rose-100";
  if (label === "medium") return "bg-amber-500/20 text-amber-100";
  return "bg-slate-500/20 text-slate-200";
}

function badgeThermal(t: string | undefined) {
  if (t === "hot") return "bg-rose-600/30 text-rose-50";
  if (t === "warm") return "bg-amber-500/25 text-amber-50";
  return "bg-slate-600/35 text-slate-200";
}

function leadEligibleForConvert(l: LeadRow): boolean {
  if (["closed", "lost"].includes(l.status)) return false;
  if (!l.listing?.id) return false;
  if (["qualified", "visit_scheduled", "negotiating"].includes(l.status)) return true;
  if (l.priorityLabel === "high") return true;
  return l.status === "contacted" && (l.priorityLabel === "medium" || l.priorityLabel === "high");
}

function badgeStatus(status: string) {
  if (status === "new") return "bg-sky-500/20 text-sky-100";
  if (status === "contacted") return "bg-violet-500/15 text-violet-100";
  if (status === "qualified") return "bg-emerald-500/20 text-emerald-100";
  if (status === "visit_scheduled" || status === "negotiating") return "bg-amber-500/20 text-amber-100";
  if (status === "closed" || status === "lost") return "bg-slate-600/40 text-slate-200";
  return "bg-emerald-500/15 text-emerald-100";
}

export function BrokerCrmHomeClient() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [view, setView] = useState<"table" | "pipeline">("table");
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autopilotBar, setAutopilotBar] = useState<AutopilotBar | null>(null);
  const [crmInsights, setCrmInsights] = useState<CrmInsightsPayload | null>(null);
  const [convertingLeadId, setConvertingLeadId] = useState<string | null>(null);
  const [marketplaceLeads, setMarketplaceLeads] = useState<LeadMarketplaceRow[]>([]);
  const [marketplacePricing, setMarketplacePricing] = useState<Record<string, PricingDisplay>>({});
  const [marketplaceLoading, setMarketplaceLoading] = useState(false);
  const [purchasingLeadId, setPurchasedLeadId] = useState<string | null>(null);
  const [convertHintByLead, setConvertHintByLead] = useState<Record<string, string>>({});
  const [convSummary, setConvSummary] = useState<{
    topOpportunities: LeadRow[];
    dealsAtRiskCount: number;
    highPotentialOpenCount: number;
    firstLeadEligible: boolean;
    unlockCount: number;
    coachTips: string[];
  } | null>(null);
  const homeViewTracked = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/broker-crm/leads?filter=${encodeURIComponent(filter)}`, {
        credentials: "same-origin",
      });
      const j = (await res.json()) as { leads?: LeadRow[]; kpis?: Kpis; error?: string };
      if (!res.ok) throw new Error(j.error ?? "Failed to load");
      setLeads(Array.isArray(j.leads) ? j.leads : []);
      setKpis(j.kpis ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
    void fetchMarketplaceLeads();
  }, [load]);

  const fetchMarketplaceLeads = async () => {
    setMarketplaceLoading(true);
    try {
      const res = await fetch("/api/leads");
      const data = await res.json();
      setMarketplaceLeads(data);
      
      // Batch fetch pricing for all marketplace leads
      if (data.length > 0) {
        const pricingMap: Record<string, PricingDisplay> = {};
        await Promise.all(data.map(async (l: any) => {
          try {
            const pRes = await fetch(`/api/leads/pricing?leadId=${l.id}`);
            const pData = await pRes.json();
            pricingMap[l.id] = pData;
          } catch (e) {
            console.error("Failed to fetch pricing for", l.id);
          }
        }));
        setMarketplacePricing(pricingMap);
      }
    } catch (e) {
      console.error("Failed to fetch marketplace leads", e);
    } finally {
      setMarketplaceLoading(false);
    }
  };

  const handlePurchaseLead = async (leadId: string) => {
    setPurchasedLeadId(leadId);
    try {
      const res = await fetch("/api/leads/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId,
          successUrl: window.location.href + "?purchase=success",
          cancelUrl: window.location.href + "?purchase=cancel"
        })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      console.error("Purchase failed", e);
    } finally {
      setPurchasedLeadId(null);
    }
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/crm/insights", { credentials: "same-origin" });
        const j = (await res.json()) as { ok?: boolean; insights?: CrmInsightsPayload };
        if (!res.ok || cancelled || !j.insights) return;
        setCrmInsights(j.insights);
      } catch {
        if (!cancelled) setCrmInsights(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/broker/conversion/summary", { credentials: "same-origin" });
        const j = (await res.json()) as Record<string, unknown>;
        if (!res.ok || cancelled) return;
        setConvSummary({
          topOpportunities: Array.isArray(j.topOpportunities) ? (j.topOpportunities as LeadRow[]) : [],
          dealsAtRiskCount: Number(j.dealsAtRiskCount ?? 0),
          highPotentialOpenCount: Number(j.highPotentialOpenCount ?? 0),
          firstLeadEligible: Boolean(j.firstLeadEligible),
          unlockCount: Number(j.unlockCount ?? 0),
          coachTips: Array.isArray(j.coachTips) ? (j.coachTips as string[]) : [],
        });
      } catch {
        if (!cancelled) setConvSummary(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (homeViewTracked.current) return;
    homeViewTracked.current = true;
    void fetch("/api/broker/conversion/track", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType: "broker_conversion_crm_view" }),
    }).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/broker-autopilot/summary", { credentials: "same-origin" });
        const j = (await res.json()) as Partial<AutopilotBar> & { error?: string };
        if (!res.ok || cancelled) return;
        setAutopilotBar({
          suggestedActions: j.suggestedActions ?? 0,
          followUpsDueToday: j.followUpsDueToday ?? 0,
        });
      } catch {
        /* optional */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const pipelineGroups: Record<string, LeadRow[]> = {
    new: leads.filter((l) => l.status === "new"),
    active: leads.filter((l) => !["closed", "lost"].includes(l.status)),
    won: leads.filter((l) => l.status === "closed"),
    lost: leads.filter((l) => l.status === "lost"),
  };

  const nextBest = useMemo(() => {
    if (!leads.length) return "Review your pipeline and pick one follow-up for today.";
    const hot = leads.find((l) => l.priorityLabel === "high" && !["closed", "lost"].includes(l.status));
    if (hot) return `Next: follow up with ${hot.displayName} (high priority).`;
    const due = leads.find(
      (l) => l.nextFollowUpAt && new Date(l.nextFollowUpAt) < new Date() && !["closed", "lost"].includes(l.status)
    );
    if (due) return `This deal needs follow-up: ${due.displayName}.`;
    return `Work the newest lead: ${leads[0]!.displayName}.`;
  }, [leads]);

  const convertLeadToDeal = useCallback(async (leadId: string) => {
    setConvertingLeadId(leadId);
    setConvertHintByLead((prev) => {
      const next = { ...prev };
      delete next[leadId];
      return next;
    });
    try {
      const res = await fetch("/api/crm/convert-to-deal", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId }),
      });
      const j = (await res.json()) as { ok?: boolean; dealId?: string; reason?: string; error?: string };
      if (j.ok && j.dealId) {
        setConvertHintByLead((prev) => ({ ...prev, [leadId]: `Deal created — open in Deals (${j.dealId.slice(0, 8)}…).` }));
        await load();
      } else {
        setConvertHintByLead((prev) => ({
          ...prev,
          [leadId]: j.reason ?? j.error ?? "Conversion not available for this lead (see requirements).",
        }));
      }
    } catch {
      setConvertHintByLead((prev) => ({ ...prev, [leadId]: "Network error — try again." }));
    } finally {
      setConvertingLeadId(null);
    }
  }, [load]);

  const autopilotSuggestedLead = useMemo(() => {
    const withHint = leads.find((l) => l.suggestedNext && !["closed", "lost"].includes(l.status));
    if (withHint) return withHint;
    const hot = leads.find((l) => (l.aiThermal === "hot" || l.priorityLabel === "high") && !["closed", "lost"].includes(l.status));
    return hot ?? null;
  }, [leads]);

  return (
    <div className="p-4 lg:p-8 space-y-10 max-w-7xl mx-auto">
      {/* PHASE 5: TOP SECTION — "Top actions today" */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl lg:text-4xl font-black text-white tracking-tighter uppercase">
              Top Actions <span className="text-[#D4AF37]">Today</span>
            </h2>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">
              Focus your energy on these {convSummary?.topOpportunities.length || 0} priority moves.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Market Status</p>
              <p className="text-xs font-bold text-green-500 uppercase">Active · High Demand</p>
            </div>
            <div className="h-10 w-px bg-white/10" />
            <div className="text-right">
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Session</p>
              <p className="text-xs font-bold text-white uppercase">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Lead Marketplace: Québec Optimized (Phase 3 & 4 Re-refined) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {marketplaceLeads.slice(0, 3).map((lead) => {
            const pricing = marketplacePricing[lead.id];
            if (!pricing) return null;

            return (
              <div 
                key={lead.id} 
                className={`group relative bg-zinc-900/40 border rounded-[2.5rem] p-8 transition-all duration-500 hover:scale-[1.02] ${
                  lead.score >= 85 
                    ? "border-[#D4AF37]/50 shadow-[0_20px_50px_rgba(212,175,55,0.15)] bg-zinc-900/60" 
                    : "border-white/5 hover:border-[#D4AF37]/30"
                }`}
              >
                {/* Background Decor */}
                <div className={`absolute top-0 right-0 w-40 h-40 rounded-full -mr-20 -mt-20 blur-[80px] transition-colors duration-700 ${
                  lead.score >= 85 ? "bg-[#D4AF37]/20" : "bg-[#D4AF37]/5 group-hover:bg-[#D4AF37]/15"
                }`} />

                <div className="relative space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-white truncate max-w-[180px]">
                          {lead.name}
                        </h3>
                        {lead.score >= 85 && (
                          <div className="flex items-center gap-1.5 text-[9px] font-black text-black uppercase bg-[#D4AF37] px-3 py-1 rounded-full shadow-lg shadow-[#D4AF37]/20 animate-pulse">
                            <Star className="w-2.5 h-2.5 fill-current" />
                            Focus Here
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                        <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                        {lead.purchaseRegion || "Greater Montréal"}
                      </div>
                    </div>
                    {pricing.badge && (
                      <Badge variant="gold" className="text-[9px] font-black tracking-widest py-1 px-3 shadow-lg shadow-[#D4AF37]/10">
                        {pricing.badge}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-6 py-4 border-y border-white/5">
                    <div className="flex-1 space-y-2">
                      <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Match Strength</p>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-white/5 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-[#D4AF37] to-white h-full transition-all duration-1000" 
                            style={{ width: `${lead.score}%` }} 
                          />
                        </div>
                        <span className="text-xs font-black text-white">{lead.score}%</span>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Value</p>
                      <p className="text-sm font-black text-white uppercase tracking-tighter">
                        High Potential
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        {pricing.anchorPrice && (
                          <span className="text-sm text-zinc-600 line-through font-black">
                            ${pricing.anchorPrice}
                          </span>
                        )}
                        <span className="text-2xl font-black text-white tracking-tighter">
                          ${pricing.price}
                        </span>
                      </div>
                      <button className="group/why flex items-center gap-2 text-[9px] font-black text-[#D4AF37] hover:text-white uppercase tracking-widest transition-colors">
                        <Info className="w-3.5 h-3.5" />
                        Why this price?
                        <div className="absolute bottom-full left-0 mb-4 hidden group-hover/why:block bg-zinc-900 border border-[#D4AF37]/20 rounded-2xl p-4 shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-50 min-w-[240px] normal-case text-xs text-zinc-300 font-medium">
                          <div className="space-y-3">
                            {pricing.reasoning.map((r, i) => (
                              <div key={i} className="flex items-start gap-3">
                                <div className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full mt-1.5 shrink-0" />
                                <span>{r}</span>
                              </div>
                            ))}
                            <div className="pt-3 border-t border-white/5 text-[#D4AF37] font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                              <TrendingUp className="w-3 h-3" />
                              High region demand
                            </div>
                          </div>
                        </div>
                      </button>
                    </div>

                    <Button 
                      variant="goldPrimary"
                      disabled={purchasingLeadId === lead.id}
                      onClick={() => handlePurchaseLead(lead.id)}
                      className="font-black text-[10px] tracking-[0.2em] px-8 py-6 rounded-2xl shadow-xl shadow-[#D4AF37]/20 transition-all hover:scale-105"
                    >
                      {purchasingLeadId === lead.id ? "UNLOCKING..." : "UNLOCK LEAD"}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* PHASE 5: MIDDLE & RIGHT PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-6">
        {/* MIDDLE: Pipeline Management (Phase 5) */}
        <div className="lg:col-span-8 space-y-8">
          <div className="flex items-center justify-between border-b border-white/5 pb-6">
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">
              Active <span className="text-[#D4AF37]">Pipeline</span>
            </h3>
            <div className="hidden sm:flex gap-2">
              {FILTERS.slice(0, 4).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`text-[9px] font-black uppercase tracking-widest px-5 py-2.5 rounded-full transition-all ${
                    filter === f.id ? "bg-[#D4AF37] text-black" : "bg-zinc-900 text-zinc-500 hover:text-white border border-white/5"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="p-20 text-center animate-pulse">
                <p className="text-zinc-600 font-black uppercase tracking-[0.3em] text-xs">Syncing CRM...</p>
              </div>
            ) : leads.length === 0 ? (
              <div className="p-20 text-center border border-dashed border-white/10 rounded-[2.5rem] bg-zinc-900/20">
                <p className="text-zinc-600 text-sm font-black uppercase tracking-[0.2em]">Queue is empty.</p>
              </div>
            ) : (
              leads.map((row) => (
                <div 
                  key={row.id}
                  className="group bg-zinc-900/30 border border-white/5 rounded-[2.5rem] p-8 hover:border-[#D4AF37]/30 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-8"
                >
                  <div className="flex items-center gap-6">
                    <div className={`w-14 h-14 rounded-3xl flex items-center justify-center border transition-all duration-500 ${
                      row.aiThermal === "hot" ? "bg-rose-500/10 border-rose-500/20 text-rose-500 shadow-lg shadow-rose-500/10" : "bg-white/5 border-white/10 text-zinc-500"
                    }`}>
                      {row.aiThermal === "hot" ? <Zap className="w-6 h-6 fill-current" /> : <Users className="w-6 h-6" />}
                    </div>
                    <div className="space-y-1">
                      <Link href={`/dashboard/crm/${row.id}`} className="text-xl font-black text-white hover:text-[#D4AF37] transition-colors uppercase tracking-tight">
                        {row.displayName}
                      </Link>
                      <div className="flex items-center gap-4">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${badgeStatus(row.status)}`}>
                          {row.status}
                        </span>
                        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest truncate max-w-[200px]">
                          {row.listing?.title || "Direct Lead"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-10">
                    <div className="hidden sm:block text-right">
                      <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Score</p>
                      <p className={`text-lg font-black uppercase ${
                        row.aiScore01 && row.aiScore01 >= 0.8 ? "text-[#D4AF37]" : "text-white"
                      }`}>
                        {row.aiScore01 != null ? `${(row.aiScore01 * 100).toFixed(0)}%` : "—"}
                      </p>
                    </div>
                    <Link href={`/dashboard/crm/${row.id}`}>
                      <Button variant="ghost" className="border border-white/10 hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/10 text-white font-black text-[11px] tracking-widest px-8 py-6 rounded-2xl transition-all">
                        OPEN
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT PANEL: AI Insights & Upgrades (Phase 5 & 10) */}
        <div className="lg:col-span-4 space-y-10">
          <section className="bg-zinc-900 border border-[#D4AF37]/30 rounded-[3rem] p-10 space-y-8 relative overflow-hidden shadow-2xl shadow-[#D4AF37]/5">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#D4AF37]/5 rounded-full -mr-24 -mt-24 blur-[80px]" />
            
            <div className="flex items-center gap-4 relative">
              <div className="w-10 h-10 bg-[#D4AF37]/10 rounded-2xl flex items-center justify-center border border-[#D4AF37]/20">
                <Sparkles className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <h3 className="text-lg font-black text-white uppercase tracking-tighter">LECIPM Intelligence</h3>
            </div>

            {autopilotSuggestedLead ? (
              <div className="space-y-8 relative">
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Critical Recommendation</p>
                  <div className="p-6 bg-white/5 border border-white/5 rounded-3xl space-y-4">
                    <p className="text-sm font-bold text-white uppercase leading-tight">
                      Close the gap with <span className="text-[#D4AF37]">{autopilotSuggestedLead.displayName}</span>
                    </p>
                    {autopilotSuggestedLead.suggestedNext && (
                      <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest leading-relaxed">
                        "{autopilotSuggestedLead.suggestedNext}"
                      </p>
                    )}
                    <Link href={`/dashboard/crm/${autopilotSuggestedLead.id}`} className="block">
                      <Button variant="goldPrimary" className="w-full py-5 text-[10px] font-black tracking-widest">
                        EXECUTE NOW
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-black/40 rounded-[2rem] border border-white/5">
                    <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Overdue</p>
                    <p className="text-2xl font-black text-rose-500 mt-1">{convSummary?.dealsAtRiskCount || 0}</p>
                  </div>
                  <div className="p-5 bg-black/40 rounded-[2rem] border border-white/5">
                    <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Active Ops</p>
                    <p className="text-2xl font-black text-[#D4AF37] mt-1">{convSummary?.highPotentialOpenCount || 0}</p>
                  </div>
                </div>

                {convSummary?.coachTips && convSummary.coachTips.length > 0 && (
                  <div className="space-y-4 pt-2">
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Coach Notes</p>
                    {convSummary.coachTips.slice(0, 2).map((tip, i) => (
                      <div key={i} className="flex gap-4 text-[11px] text-zinc-400 font-bold uppercase tracking-tight">
                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-20 text-center space-y-4 opacity-40">
                <Clock className="w-12 h-12 text-zinc-700 mx-auto" />
                <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">Neural Syncing...</p>
              </div>
            )}
          </section>

          {/* Premium Conversion (Phase 6) */}
          {convSummary && convSummary.unlockCount >= 1 && (
            <div className="bg-gradient-to-br from-indigo-500/20 via-zinc-900 to-zinc-900 border border-indigo-500/30 rounded-[3rem] p-10 space-y-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full -mr-20 -mt-20 blur-[80px] group-hover:bg-indigo-500/20 transition-all duration-700" />
              <div className="flex items-center gap-3 relative">
                <Star className="w-5 h-5 text-indigo-400" />
                <h4 className="text-xs font-black text-white uppercase tracking-widest">Pro Expansion</h4>
              </div>
              <p className="text-sm font-black text-zinc-400 uppercase tracking-tighter leading-tight relative">
                Unlock <span className="text-white">Full AI Insights</span> and elite lead marketplace.
              </p>
              <Button variant="ghost" className="w-full py-6 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-black text-[10px] tracking-widest hover:bg-indigo-500/20 relative">
                ACTIVATE PRO
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
