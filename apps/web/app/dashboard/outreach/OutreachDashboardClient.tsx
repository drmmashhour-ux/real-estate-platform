"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  Instagram, 
  Linkedin, 
  User, 
  Phone, 
  Mail, 
  Copy, 
  ArrowRight,
  RefreshCcw,
  Calendar,
  AlertCircle,
  TrendingUp,
  ChevronDown,
  MapPin,
  Building2,
  Trophy,
  Lightbulb
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Toast } from "@/components/ui/Toast";
import {
  OUTREACH_SCRIPTS,
  getOutreachScript,
  mergePersonalizedMessage,
  suggestNextFollowUp,
  type FirstContactVariant,
  type OutreachScriptType,
} from "@/modules/growth/outreach-scripts";
import { TARGET_REGIONS } from "@/modules/growth/geo-target.config";
import { SOURCING_GUIDE } from "@/modules/growth/source-guide";
import { IDEAL_BROKER_TARGET } from "@/modules/growth/broker-targeting.types";

// --- Types ---

type OutreachStatus = "NEW" | "CONTACTED" | "RESPONDED" | "INTERESTED" | "ONBOARDED" | "LOST";

interface OutreachLead {
  id: string;
  createdAt: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  source: string;
  status: OutreachStatus;
  notesJson: { callBookedAt?: string } | null;
  lastContactedAt: string | null;
  referralSource: string | null;
  city: string | null;
  agency: string | null;
  instagramHandle: string | null;
  linkedinUrl: string | null;
  specialization: string | null;
  /** CRM notes (plain text). */
  notes: string | null;
  score: number;
}

// --- Components ---

export function OutreachDashboardClient() {
  const [leads, setLeads] = useState<OutreachLead[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<OutreachLead | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [activeScriptType, setActiveScriptType] = useState<OutreachScriptType>("FIRST_CONTACT");
  const [firstContactVariant, setFirstContactVariant] = useState<FirstContactVariant>("A");
  const [followUpHint, setFollowUpHint] = useState<string | null>(null);
  const [manualTweak, setManualTweak] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [dailyTargets, setDailyTargets] = useState<OutreachLead[]>([]);
  const [profileLead, setProfileLead] = useState<OutreachLead | null>(null);
  const [profileNotesDraft, setProfileNotesDraft] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // New Lead Form State
  const [newLead, setNewLead] = useState({
    name: "",
    email: "",
    phone: "",
    source: "DIRECT",
    referralSource: "",
    city: "Montreal",
    agency: "",
    instagramHandle: "",
    linkedinUrl: "",
    specialization: "",
    notes: ""
  });

  useEffect(() => {
    fetchLeads();
    fetchMetrics();
  }, [filterStatus]);

  const fetchDailyTargets = async () => {
    try {
      const res = await fetch("/api/outreach/daily-targets");
      const j = (await res.json()) as { targets?: OutreachLead[] };
      if (res.ok && Array.isArray(j.targets)) setDailyTargets(j.targets);
    } catch {
      /* optional */
    }
  };

  useEffect(() => {
    void fetchDailyTargets();
  }, [leads]);

  const fetchMetrics = async () => {
    try {
      const res = await fetch("/api/outreach/metrics");
      const data = await res.json();
      setMetrics(data);
    } catch (error) {
      console.error("Failed to fetch metrics:", error);
    }
  };

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const url = filterStatus 
        ? `/api/outreach/list?status=${filterStatus}` 
        : "/api/outreach/list";
      const res = await fetch(url);
      const data = await res.json();
      setLeads(data);
    } catch (error) {
      console.error("Failed to fetch leads:", error);
      showToast("Failed to load leads", "error");
    } finally {
      setLoading(false);
    }
  };

  const openTemplateModal = (lead: OutreachLead) => {
    setSelectedLead(lead);
    setManualTweak("");
    setFirstContactVariant("A");
    const suggestion = suggestNextFollowUp(lead.status, lead.lastContactedAt);
    if (suggestion) {
      setActiveScriptType(suggestion.script);
      setFollowUpHint(suggestion.hint);
    } else {
      setFollowUpHint(null);
    }
    setIsTemplateModalOpen(true);
  };

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/outreach/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLead)
      });
      if (res.ok) {
        showToast("Lead added successfully");
        setIsAddModalOpen(false);
        setNewLead({
          name: "",
          email: "",
          phone: "",
          source: "DIRECT",
          referralSource: "",
          city: "Montreal",
          agency: "",
          instagramHandle: "",
          linkedinUrl: "",
          specialization: "",
          notes: "",
        });
        fetchLeads();
        void fetchDailyTargets();
      } else {
        showToast("Failed to add lead", "error");
      }
    } catch (error) {
      showToast("Error adding lead", "error");
    }
  };

  const updateLeadStatus = async (leadId: string, status: OutreachStatus) => {
    try {
      const res = await fetch(`/api/outreach/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status,
          lastContactedAt: status === "CONTACTED" ? new Date().toISOString() : undefined
        })
      });
      if (res.ok) {
        showToast(`Status updated to ${status}`);
        fetchLeads();
        void fetchDailyTargets();
      } else {
        showToast("Failed to update status", "error");
      }
    } catch (error) {
      showToast("Error updating status", "error");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("Message copied to clipboard");
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      (lead.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
       lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
       lead.phone?.includes(searchQuery));
    return matchesSearch;
  });

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "INSTAGRAM": return <Instagram className="w-4 h-4 text-pink-500" />;
      case "LINKEDIN": return <Linkedin className="w-4 h-4 text-blue-600" />;
      case "REFERRAL": return <UserPlus className="w-4 h-4 text-green-500" />;
      default: return <User className="w-4 h-4 text-gray-400" />;
    }
  };

  const sortedLeads = useMemo(
    () => [...filteredLeads].sort((a, b) => b.score - a.score),
    [filteredLeads]
  );

  const messagePreview = useMemo(() => {
    if (!selectedLead) return "";
    const base = getOutreachScript(activeScriptType, { variant: firstContactVariant });
    const merged = mergePersonalizedMessage(base, {
      name: selectedLead.name,
      city: selectedLead.city,
      specialty: selectedLead.specialization,
    });
    return manualTweak.trim() ? `${merged}\n\n${manualTweak.trim()}` : merged;
  }, [selectedLead, activeScriptType, firstContactVariant, manualTweak]);

  const openProfile = (lead: OutreachLead) => {
    setProfileLead(lead);
    setProfileNotesDraft(lead.notes ?? "");
  };

  const saveProfileNotes = async () => {
    if (!profileLead) return;
    setSavingProfile(true);
    try {
      const res = await fetch(`/api/outreach/${profileLead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: profileNotesDraft }),
      });
      if (res.ok) {
        showToast("Profile notes saved");
        setProfileLead(null);
        fetchLeads();
        void fetchDailyTargets();
      } else {
        showToast("Failed to save", "error");
      }
    } catch {
      showToast("Failed to save", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const markCallBooked = async (leadId: string) => {
    try {
      const res = await fetch(`/api/outreach/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callBooked: true }),
      });
      if (res.ok) {
        showToast("Call booked logged");
        fetchLeads();
        void fetchDailyTargets();
      } else {
        showToast("Could not log call", "error");
      }
    } catch {
      showToast("Could not log call", "error");
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Outreach Hub</h1>
          <p className="text-zinc-500 text-sm font-medium">Acquire your first 20 brokers.</p>
        </div>
        <Button 
          variant="goldPrimary" 
          onClick={() => setIsAddModalOpen(true)}
          className="font-black text-[10px] tracking-widest px-8"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          ADD LEAD
        </Button>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-900/50 border-white/5">
          <CardContent className="p-6">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Response rate</p>
            <p className="text-2xl font-black text-[#D4AF37]">
              {metrics ? `${metrics.responseRate.toFixed(1)}%` : "0%"}
            </p>
            <p className="text-[8px] text-zinc-600 mt-1">
              Sent: {metrics?.sentCount ?? 0} · Replies: {metrics?.respondedCount ?? 0}
            </p>
            {metrics?.bestPerformingChannel && (
              <p className="text-[8px] font-bold text-zinc-600 mt-1 uppercase tracking-widest">
                Best: {metrics.bestPerformingChannel}
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-white/5">
          <CardContent className="p-6">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Conversion Rate</p>
            <p className="text-2xl font-black text-blue-400">
              {metrics ? `${metrics.conversionRate.toFixed(1)}%` : "0%"}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-white/5">
          <CardContent className="p-6">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Onboarded</p>
            <p className="text-2xl font-black text-green-500">
              {metrics?.onboardedCount || 0} / 20
            </p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-white/5">
          <CardContent className="p-6">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Goal Progress</p>
            <div className="mt-2 w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-green-500 h-full transition-all duration-500" 
                style={{ width: `${metrics?.onboardProgress || 0}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ideal broker profile (IBP) — manual positioning, not auto-matched */}
      <Card className="bg-zinc-900/40 border-[#D4AF37]/20">
        <CardContent className="p-6 flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#D4AF37]/10">
            <TrendingUp className="h-6 w-6 text-[#D4AF37]" />
          </div>
          <div className="space-y-2 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">Ideal broker profile (first 10)</p>
            <p className="text-sm font-bold text-white">
              {IDEAL_BROKER_TARGET.experienceLevel} · {IDEAL_BROKER_TARGET.activityLevel} activity · {IDEAL_BROKER_TARGET.techAdoption} tech openness
            </p>
            <p className="text-xs text-zinc-500 leading-relaxed max-w-3xl">
              Prioritize brokers who are active on social, feel lead overload, and want clearer prioritization — not volume chasers. Source manually (Instagram, LinkedIn, referrals); score updates when you save profile data.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Filters & Search */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input 
            placeholder="Search brokers, agencies, cities..." 
            className="pl-10 bg-zinc-900/50 border-white/5 text-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {["NEW", "CONTACTED", "RESPONDED", "INTERESTED", "ONBOARDED", "LOST"].map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? "goldPrimary" : "ghost"}
              size="sm"
              onClick={() => setFilterStatus(filterStatus === status ? null : status)}
              className="text-[10px] font-black tracking-widest h-9"
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Leads Table */}
        <Card className="lg:col-span-2 bg-zinc-900/50 border-white/5 overflow-hidden">
          <div className="px-4 pt-3 pb-1 flex justify-between items-center border-b border-white/5">
            <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">
              Sorted by target score · top 10 highlighted
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-white/5 bg-white/5">
                <tr>
                  <th className="p-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Broker / Agency</th>
                  <th className="p-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Location</th>
                  <th className="p-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Status</th>
                  <th className="p-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Score</th>
                  <th className="p-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-white text-sm">{lead.name || "Unknown"}</span>
                        <div className="flex items-center gap-2 mt-1">
                          {lead.agency && (
                            <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                              <Building2 className="w-3 h-3" /> {lead.agency}
                            </span>
                          )}
                          {lead.specialization && (
                            <Badge variant="outline" className="text-[8px] py-0">{lead.specialization}</Badge>
                          )}
                        </div>
                        <div className="flex gap-2 mt-1">
                          {lead.instagramHandle && <Instagram className="w-3 h-3 text-pink-500" />}
                          {lead.linkedinUrl && <Linkedin className="w-3 h-3 text-blue-400" />}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-zinc-500" />
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{lead.city || "N/A"}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap items-center gap-1">
                        {(() => {
                          switch (lead.status) {
                            case "NEW": return <Badge variant="default">NEW</Badge>;
                            case "CONTACTED": return <Badge variant="gold">CONTACTED</Badge>;
                            case "RESPONDED": return <Badge variant="active">RESPONDED</Badge>;
                            case "INTERESTED": return <Badge variant="bestMatch">INTERESTED</Badge>;
                            case "ONBOARDED": return <Badge variant="success">ONBOARDED</Badge>;
                            case "LOST": return <Badge variant="danger">LOST</Badge>;
                            default: return <Badge variant="outline">{lead.status}</Badge>;
                          }
                        })()}
                        {lead.notesJson?.callBookedAt ? (
                          <Badge variant="outline" className="text-[7px] border-sky-500/30 text-sky-300">
                            call booked
                          </Badge>
                        ) : null}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Trophy className={`w-3 h-3 ${lead.score >= 70 ? "text-[#D4AF37]" : "text-zinc-600"}`} />
                        <span className={`text-[11px] font-black ${lead.score >= 70 ? "text-white" : "text-zinc-400"}`}>
                          {lead.score}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => openTemplateModal(lead)}
                          className="text-[10px] font-black tracking-widest hover:text-[#D4AF37]"
                        >
                          <MessageSquare className="w-3 h-3 mr-1" />
                          DM
                        </Button>
                        <div className="relative group/actions">
                          <Button variant="ghost" size="sm" className="p-2">
                            <MoreHorizontal className="w-4 h-4 text-zinc-500" />
                          </Button>
                          <div className="absolute right-0 bottom-full mb-2 hidden group-hover/actions:block bg-zinc-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50 min-w-[160px]">
                            {["CONTACTED", "RESPONDED", "INTERESTED", "ONBOARDED", "LOST"].map((s) => (
                              <button
                                key={s}
                                onClick={() => updateLeadStatus(lead.id, s as OutreachStatus)}
                                className="w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:bg-white/5 hover:text-white"
                              >
                                MARK AS {s}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
                {sortedLeads.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-zinc-500 font-medium italic text-sm">
                      No brokers found. Time to source some more.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Sidebar: Top Targets & Sourcing Guide */}
        <div className="space-y-8">
          {/* Top Targets Queue (Phase 6) */}
          <Card className="bg-zinc-900/50 border-white/5">
            <CardHeader className="p-6 pb-2">
              <CardTitle className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#D4AF37]" />
                Top Daily Targets
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              {leads
                .filter(l => l.status === "NEW")
                .sort((a, b) => b.score - a.score)
                .slice(0, 5)
                .map((target) => (
                  <div key={target.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 group hover:border-[#D4AF37]/30 transition-all cursor-pointer" onClick={() => openTemplateModal(target)}>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white">{target.name}</span>
                      <span className="text-[9px] text-zinc-500 uppercase tracking-widest">{target.city} · {target.agency || "Indep."}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-black text-[#D4AF37]">{target.score}</span>
                      <ArrowRight className="w-3 h-3 text-zinc-700 group-hover:text-[#D4AF37] transition-colors" />
                    </div>
                  </div>
                ))}
              {leads.filter(l => l.status === "NEW").length === 0 && (
                <div className="p-6 text-center text-[10px] text-zinc-600 font-bold uppercase tracking-widest bg-white/5 rounded-xl border border-dashed border-white/5">
                  Queue empty.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sourcing Guide (Phase 4) */}
          <Card className="bg-zinc-900/50 border-white/5">
            <CardHeader className="p-6 pb-2">
              <CardTitle className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-blue-400" />
                Quick Source Guide
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              {SOURCING_GUIDE.map((tip, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center gap-2">
                    {tip.platform === "INSTAGRAM" && <Instagram className="w-3 h-3 text-pink-500" />}
                    {tip.platform === "LINKEDIN" && <Linkedin className="w-3 h-3 text-blue-400" />}
                    {tip.platform === "GOOGLE_MAPS" && <MapPin className="w-3 h-3 text-red-500" />}
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">{tip.platform}</span>
                  </div>
                  <div className="pl-5 space-y-1">
                    {tip.queries.slice(0, 2).map((q, qi) => (
                      <p key={qi} className="text-[9px] text-zinc-500 font-medium italic">"{q}"</p>
                    ))}
                    <p className="text-[9px] text-blue-400/70 font-bold uppercase tracking-tighter pt-1">Pro Tip: {tip.proTip}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Onboarding Referral Section (Phase 7) */}
      <Card className="bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
        <CardContent className="p-8 flex items-center justify-between">
          <div className="space-y-2">
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Invite another broker</h3>
            <p className="text-zinc-400 text-sm">Onboarded a broker? Ask them to refer another and they'll get priority leads.</p>
          </div>
          <Button variant="ghost" className="text-green-500 border border-green-500/20 hover:bg-green-500/10 font-black text-[10px] tracking-widest px-8">
            <RefreshCcw className="w-4 h-4 mr-2" />
            GENERATE REFERRAL LINK
          </Button>
        </CardContent>
      </Card>

      {/* Modals */}
      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        title="SOURCING: ADD BROKER"
      >
        <form onSubmit={handleAddLead} className="space-y-6 p-6 overflow-y-auto max-h-[80vh]">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Full Name</label>
                <Input 
                  placeholder="Broker Name" 
                  required
                  value={newLead.name}
                  onChange={(e) => setNewLead({...newLead, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">City</label>
                <select 
                  className="w-full h-11 bg-zinc-900 border border-white/10 rounded-xl px-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  value={newLead.city}
                  onChange={(e) => setNewLead({...newLead, city: e.target.value})}
                >
                  {TARGET_REGIONS.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Agency / Firm</label>
              <Input 
                placeholder="RE/MAX, Royal LePage, Independent, etc." 
                value={newLead.agency}
                onChange={(e) => setNewLead({...newLead, agency: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Email</label>
                <Input 
                  type="email" 
                  placeholder="broker@example.com" 
                  value={newLead.email}
                  onChange={(e) => setNewLead({...newLead, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Phone</label>
                <Input 
                  placeholder="514-XXX-XXXX" 
                  value={newLead.phone}
                  onChange={(e) => setNewLead({...newLead, phone: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Instagram Handle</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">@</span>
                  <Input 
                    placeholder="handle" 
                    className="pl-8"
                    value={newLead.instagramHandle}
                    onChange={(e) => setNewLead({...newLead, instagramHandle: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">LinkedIn URL</label>
                <Input 
                  placeholder="linkedin.com/in/..." 
                  value={newLead.linkedinUrl}
                  onChange={(e) => setNewLead({...newLead, linkedinUrl: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Specialization</label>
              <Input 
                placeholder="Residential, Luxury, Plex, etc." 
                value={newLead.specialization}
                onChange={(e) => setNewLead({...newLead, specialization: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Sourcing Source</label>
              <div className="grid grid-cols-4 gap-2">
                {["INSTAGRAM", "LINKEDIN", "GOOGLE_MAPS", "REFERRAL"].map((s) => (
                  <Button
                    key={s}
                    type="button"
                    variant={newLead.source === s ? "goldPrimary" : "ghost"}
                    onClick={() => setNewLead({...newLead, source: s})}
                    className="text-[8px] font-black tracking-widest h-10 px-0"
                  >
                    {s.replace("_", " ")}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Notes</label>
              <textarea 
                className="w-full bg-zinc-900 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#D4AF37] min-h-[80px]"
                placeholder="Initial thoughts, common connections, etc."
                value={newLead.notes}
                onChange={(e) => setNewLead({...newLead, notes: e.target.value})}
              />
            </div>
          </div>
          <Button type="submit" variant="goldPrimary" className="w-full font-black text-[10px] tracking-widest py-6">
            SAVE TARGET BROKER
          </Button>
        </form>
      </Modal>

      <Modal
        isOpen={!!profileLead}
        onClose={() => setProfileLead(null)}
        title="BROKER PROFILE (QUICK VIEW)"
      >
        {profileLead ? (
          <div className="p-6 space-y-5">
            <div className="flex items-start gap-3">
              {getSourceIcon(profileLead.source)}
              <div>
                <p className="text-sm font-bold text-white">{profileLead.name || "Unknown"}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
                  {profileLead.source} · score {profileLead.score}
                </p>
              </div>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between gap-4 border-b border-white/5 pb-2">
                <span className="text-zinc-500">Instagram</span>
                <span className="text-white font-mono text-right break-all">
                  {profileLead.instagramHandle ? `@${profileLead.instagramHandle.replace(/^@/, "")}` : "—"}
                </span>
              </div>
              <div className="flex justify-between gap-4 border-b border-white/5 pb-2">
                <span className="text-zinc-500">LinkedIn</span>
                {profileLead.linkedinUrl ? (
                  <a
                    href={
                      profileLead.linkedinUrl.startsWith("http")
                        ? profileLead.linkedinUrl
                        : `https://${profileLead.linkedinUrl}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-400 hover:underline break-all text-right"
                  >
                    {profileLead.linkedinUrl}
                  </a>
                ) : (
                  <span className="text-zinc-600">—</span>
                )}
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Notes</span>
                <textarea
                  className="w-full min-h-[100px] rounded-xl border border-white/10 bg-zinc-900 p-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  value={profileNotesDraft}
                  onChange={(e) => setProfileNotesDraft(e.target.value)}
                  placeholder="Pain points, reply speed, why they are a fit…"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="goldPrimary"
                className="flex-1 font-black text-[10px] tracking-widest"
                disabled={savingProfile}
                onClick={() => void saveProfileNotes()}
              >
                Save notes
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setProfileLead(null);
                  openTemplateModal(profileLead);
                }}
                className="text-[10px] font-black tracking-widest"
              >
                Open DM
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        title="OUTREACH SCRIPTS"
      >
        <div className="p-6 space-y-6">
          <div className="p-4 bg-zinc-900 border border-white/5 rounded-2xl flex items-center gap-4">
            <div className="w-10 h-10 bg-[#D4AF37]/10 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">{selectedLead?.name || "Broker"}</p>
              <p className="text-[10px] text-zinc-500">{selectedLead?.source} • {selectedLead?.email || selectedLead?.phone || "No contact info"}</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest" htmlFor="outreach-script-select">
                Script
              </label>
              <div className="relative">
                <select
                  id="outreach-script-select"
                  className="w-full appearance-none rounded-xl border border-white/10 bg-zinc-900 py-2.5 pl-3 pr-10 text-xs font-bold uppercase tracking-widest text-white focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  value={activeScriptType}
                  onChange={(e) => setActiveScriptType(e.target.value as OutreachScriptType)}
                >
                  {OUTREACH_SCRIPTS.map((script) => (
                    <option key={script.type} value={script.type}>
                      {script.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              </div>
            </div>

            {activeScriptType === "FIRST_CONTACT" ? (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">First line variant</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={firstContactVariant === "A" ? "goldPrimary" : "ghost"}
                    size="sm"
                    onClick={() => setFirstContactVariant("A")}
                    className="text-[9px] font-black tracking-widest h-9"
                  >
                    A — qualified leads
                  </Button>
                  <Button
                    type="button"
                    variant={firstContactVariant === "B" ? "goldPrimary" : "ghost"}
                    size="sm"
                    onClick={() => setFirstContactVariant("B")}
                    className="text-[9px] font-black tracking-widest h-9"
                  >
                    B — how you manage leads
                  </Button>
                </div>
              </div>
            ) : null}

            {followUpHint ? (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-[10px] font-medium text-amber-100/90">
                {followUpHint}
              </div>
            ) : null}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest" htmlFor="outreach-manual">
                Optional manual line
              </label>
              <textarea
                id="outreach-manual"
                className="w-full min-h-[72px] rounded-xl border border-white/10 bg-zinc-900 p-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                placeholder="e.g. mutual connection, a listing you both commented on, neighborhood…"
                value={manualTweak}
                onChange={(e) => setManualTweak(e.target.value)}
              />
            </div>

            <div className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-3.5 w-3.5 text-zinc-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Personalized from</span>
                </div>
                <span className="text-[9px] text-zinc-600">
                  {[selectedLead?.name, selectedLead?.city, selectedLead?.specialization].filter(Boolean).length
                    ? "name / city / specialty on file"
                    : "add city & specialty to the lead for richer openers"}
                </span>
              </div>
            </div>

            <div className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-4 animate-in fade-in duration-300">
              <div className="flex justify-between items-center">
                <Badge variant="gold" className="text-[8px] tracking-[0.2em]">PREVIEW</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(messagePreview)}
                  className="h-8 px-4 text-[10px] font-black tracking-widest hover:text-[#D4AF37]"
                >
                  <Copy className="w-3 h-3 mr-2" />
                  COPY MESSAGE
                </Button>
              </div>
              <p className="whitespace-pre-wrap text-sm text-zinc-300 leading-relaxed border-l-2 border-[#D4AF37]/30 pl-4 py-1">
                {messagePreview}
              </p>
            </div>
          </div>

          <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5" />
            <div className="space-y-1">
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Human DM guardrails</p>
              <p className="text-[10px] text-zinc-500 leading-relaxed font-medium">
                Keep it under 3–4 short lines, no mass blasts, no inflated claims. Edit the preview before you send.
                {selectedLead?.status === "NEW" ? " First touch: curiosity over pitch." : " Follow-ups: gentle nudges only."}
              </p>
            </div>
          </div>
        </div>
      </Modal>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-8 right-8 z-[100] animate-in slide-in-from-right duration-300">
          <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border ${
            toast.type === "success" ? "bg-zinc-900 border-green-500/20" : "bg-zinc-900 border-red-500/20"
          }`}>
            {toast.type === "success" ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
            <span className="text-sm font-bold text-white">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
