"use client";

import React, { useState, useEffect } from "react";
import { 
  BarChart3, 
  Target, 
  MessageSquare, 
  Calendar, 
  Sparkles, 
  Zap, 
  CheckCircle2, 
  Clock,
  ArrowRight,
  User,
  Shield,
  CreditCard,
  ChevronRight,
  TrendingUp,
  Layout
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { ProgressBar } from "../../../components/ui/ProgressBar";
import { cn } from "../../../lib/utils";

interface ClosingLead {
  id: string;
  name: string;
  city: string | null;
  status: string;
  lastContactAt: string | null;
  activation?: {
    createdDraft: boolean;
    usedAI: boolean;
    completedDraft: boolean;
    firstPayment: boolean;
  }
}

export default function ClosingPage() {
  const [leads, setLeads] = useState<ClosingLead[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeads();
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/admin/outreach/analytics");
      const data = await res.json();
      setAnalytics(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/outreach/leads");
      const data = await res.json();
      // Filter for leads that are at least contacted
      setLeads(data.filter((l: any) => l.status !== "new"));
    } catch (err) {
      console.error("Failed to fetch leads", err);
    } finally {
      setLoading(false);
    }
  };

  const stages = [
    { id: "contacted", label: "Contacté", color: "bg-blue-500/20 text-blue-400" },
    { id: "demo_booked", label: "Démo Prévue", color: "bg-purple-500/20 text-purple-400" },
    { id: "demo_done", label: "Démo Faite", color: "bg-orange-500/20 text-orange-400" },
    { id: "trial_started", label: "Essai Lancé", color: "bg-yellow-500/20 text-yellow-400" },
    { id: "first_deal", label: "Premier Deal", color: "bg-[#D4AF37]/20 text-[#D4AF37]" },
    { id: "onboarded", label: "Payé / Actif", color: "bg-green-500/20 text-green-400" },
  ];

  const updateStage = async (id: string, status: string) => {
    try {
      await fetch(`/api/admin/outreach/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      fetchLeads();
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const plan7Day = [
    { days: "1–2", title: "Acquisition Massive", tasks: ["Contacter 30 courtiers", "Réserver 10 démos"], icon: <Zap className="w-4 h-4" /> },
    { days: "3–4", title: "Démos & Engagement", tasks: ["Run les démos", "Pousser l'essai gratuit"], icon: <Layout className="w-4 h-4" /> },
    { days: "5–6", title: "Support au Deal", tasks: ["Aider à finir 1er draft", "Accompagnement live"], icon: <Shield className="w-4 h-4" /> },
    { days: "7", title: "Conversion Paid", tasks: ["Paiement à l'usage", "Rétention"], icon: <CreditCard className="w-4 h-4" /> },
  ];

  const scripts = [
    {
      title: "SCRIPT 1 — APRÈS DÉMO",
      content: (
        <div className="space-y-3">
          <p className="italic text-sm text-gray-300">"Tu viens de voir le système. Est-ce que tu penses que ça peut t’aider à gagner du temps ou sécuriser tes dossiers ?"</p>
          <p className="text-[10px] font-bold text-gray-500 uppercase">(ATTENDRE LA RÉPONSE)</p>
          <p className="font-bold text-[#D4AF37]">"Parfait, on fait simple: on teste sur un vrai dossier cette semaine."</p>
        </div>
      )
    },
    {
      title: "SCRIPT 2 — PUSH TO FIRST DEAL",
      content: (
        <div className="space-y-3">
          <p className="italic text-sm text-gray-300">"Le vrai test, c’est sur un vrai cas. Je peux te guider pour ton prochain dossier, ça te prend 5–10 minutes."</p>
        </div>
      )
    },
    {
      title: "SCRIPT 3 — CONVERT TO PAID",
      content: (
        <div className="space-y-3">
          <p className="italic text-sm text-gray-300">"Tu as vu que ça fonctionne. Tu peux continuer à l’utiliser dossier par dossier. C’est payant seulement quand tu l’utilises."</p>
        </div>
      )
    }
  ];

  if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center">Chargement...</div>;

  const stats = {
    total: leads.length,
    demos: leads.filter(l => ["demo_done", "trial_started", "first_deal", "onboarded"].includes(l.status)).length,
    trials: leads.filter(l => ["trial_started", "first_deal", "onboarded"].includes(l.status)).length,
    paid: leads.filter(l => l.status === "onboarded").length,
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Navigation */}
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" className="text-xs font-bold text-gray-400" onClick={() => window.location.href = '/admin/outreach'}>CRM</Button>
          <Button variant="ghost" className="text-xs font-bold text-gray-400" onClick={() => window.location.href = '/admin/execution'}>Execution</Button>
          <Button variant="ghost" className="text-xs font-bold text-[#D4AF37] bg-[#D4AF37]/10" onClick={() => window.location.href = '/admin/closing'}>Closing</Button>
          <Button variant="ghost" className="text-xs font-bold text-gray-400" onClick={() => window.location.href = '/admin/bookings'}>Démos</Button>
          <Button variant="ghost" className="text-xs font-bold text-purple-400" onClick={() => window.location.href = '/operator'}>Operator Hub</Button>
        </div>
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-8">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Closing Engine <span className="text-[#D4AF37]">7-Day</span></h1>
            <p className="text-gray-400">Objectif: 5 premiers courtiers payants cette semaine.</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="px-4 py-2 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl">
                <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest block mb-1">Succès Semaine</span>
                <span className="text-2xl font-black">{stats.paid} / 5</span>
             </div>
          </div>
        </div>

        {/* 7-Day Visual Roadmap */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           {plan7Day.map((p, i) => (
             <Card key={i} className="bg-black/40 border-white/5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#D4AF37]" />
                <CardHeader className="py-4">
                  <div className="flex items-center gap-2 text-[#D4AF37] mb-1">
                    {p.icon}
                    <span className="text-xs font-black uppercase tracking-tighter">Jour {p.days}</span>
                  </div>
                  <CardTitle className="text-sm font-bold">{p.title}</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <ul className="space-y-1">
                    {p.tasks.map((t, ti) => (
                      <li key={ti} className="text-[10px] text-gray-500 flex items-center gap-2">
                        <div className="w-1 h-1 bg-gray-700 rounded-full" />
                        {t}
                      </li>
                    ))}
                  </ul>
                </CardContent>
             </Card>
           ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Pipeline Column */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-black/40 border-white/5 backdrop-blur-xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  Pipeline de Conversion
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-white/5">
                  {leads.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 italic">Aucun courtier en pipeline.</div>
                  ) : leads.map(lead => (
                    <div key={lead.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/5 transition">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-bold text-lg">{lead.name}</h4>
                          <Badge className={cn("text-[10px] font-black uppercase", stages.find(s => s.id === lead.status)?.color)}>
                            {stages.find(s => s.id === lead.status)?.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><MapPinIcon className="w-3 h-3" /> {lead.city || 'N/A'}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Contact: {lead.lastContactAt ? new Date(lead.lastContactAt).toLocaleDateString() : '—'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <select 
                          value={lead.status}
                          onChange={(e) => updateStage(lead.id, e.target.value)}
                          className="bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-bold focus:ring-1 focus:ring-[#D4AF37] outline-none"
                        >
                          {stages.map(s => (
                            <option key={s.id} value={s.id}>{s.label}</option>
                          ))}
                        </select>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-white/10 hover:bg-white/5 h-9"
                          onClick={() => window.location.href = `/admin/outreach`}
                        >
                          Détails
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Performance KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {[
                 { label: "Total Courtiers", value: stats.total, icon: <User className="w-4 h-4" /> },
                 { label: "Démos Faites", value: stats.demos, icon: <Calendar className="w-4 h-4" /> },
                 { label: "Essais Lancés", value: stats.trials, icon: <Sparkles className="w-4 h-4 text-yellow-400" /> },
                 { label: "Ventes (Paid)", value: stats.paid, icon: <CreditCard className="w-4 h-4 text-green-500" /> },
               ].map((k, i) => (
                 <Card key={i} className="bg-black/40 border-white/5 p-4 text-center">
                    <div className="flex justify-center mb-2 text-gray-500">{k.icon}</div>
                    <p className="text-[10px] text-gray-500 uppercase font-black">{k.label}</p>
                    <h4 className="text-2xl font-black mt-1">{k.value}</h4>
                 </Card>
               ))}
            </div>

            {/* Drop-off Analytics */}
            {analytics && (
              <Card className="bg-black/40 border-white/5 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2 text-orange-400">
                    <BarChart3 className="w-5 h-5" />
                    Analyse des Pertes (Drop-offs)
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {analytics.dropOffs.map((d: any, i: number) => (
                    <div key={i} className="space-y-2">
                       <div className="flex justify-between text-[10px] font-black uppercase text-gray-500">
                          <span>{d.stage}</span>
                          <span className="text-red-400">{d.rate}% drop</span>
                       </div>
                       <ProgressBar progress={100 - d.rate} className="h-1 bg-white/5" barClassName="bg-orange-500" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column: Scripts */}
          <div className="space-y-6">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Scripts de Closing (7 Jours)
            </h3>
            
            <div className="space-y-4">
              {scripts.map((s, i) => (
                <Card key={i} className="bg-black/60 border-white/5 border-l-2 border-l-[#D4AF37] overflow-hidden">
                  <CardHeader className="py-3 bg-white/5 border-b border-white/10">
                    <CardTitle className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">{s.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="py-4">
                    {s.content}
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="p-6 bg-gradient-to-br from-[#D4AF37]/20 to-black border border-[#D4AF37]/20 rounded-[32px] space-y-4">
               <h4 className="font-bold text-sm flex items-center gap-2">
                 <Target className="w-4 h-4 text-[#D4AF37]" />
                 Règle d'or
               </h4>
               <p className="text-xs text-gray-400 leading-relaxed italic">
                 "Le courtier ne doit jamais se sentir vendu, il doit se sentir accompagné vers une réduction de son risque professionnel."
               </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function MapPinIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
