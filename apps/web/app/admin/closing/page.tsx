"use client";

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Phone, 
  Calendar, 
  Plus, 
  Search, 
  TrendingUp, 
  CheckCircle, 
  XCircle,
  Clock,
  MapPin,
  ChevronRight,
  Target,
  ArrowRight,
  ShieldCheck,
  Zap,
  DollarSign,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Table, THead as TableHeader, TBody as TableBody, Th as TableHead, Tr as TableRow, Td as TableCell } from '../../../components/ui/Table';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';

interface BrokerLead {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  status: string;
  lastContactAt: string | null;
  nextAction: string | null;
  notes: string | null;
  createdAt: string;
}

export default function ClosingPipelinePage() {
  const [leads, setLeads] = useState<BrokerLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const stages = [
    { id: 'contacted', label: 'Contacté', color: 'blue' },
    { id: 'demo_booked', label: 'Démo Bookée', color: 'purple' },
    { id: 'demo_done', label: 'Démo Effectuée', color: 'indigo' },
    { id: 'trial_started', label: 'Essai Lancé', color: 'orange' },
    { id: 'first_deal', label: 'Premier Deal', color: 'emerald' },
    { id: 'paid', label: 'Payant', color: 'green' }
  ];

  const plan7Day = [
    { days: '1–2', focus: 'Prospection massive', items: ['Contacter 30 courtiers', 'Booker 10 démos'] },
    { days: '3–4', focus: 'Exécution Démos', items: ['Run démos (10 min)', 'Push vers Essai / Trial'] },
    { days: '5–6', focus: 'Accompagnement', items: ['Aider à finir 1er draft', 'Valider conformité'] },
    { days: '7', focus: 'Conversion', items: ['Passage au payant ($15)', 'Activation récurrente'] },
  ];

  const scripts = [
    {
      title: "APRÈS LA DÉMO",
      icon: <CheckCircle className="w-4 h-4" />,
      text: "\"Tu viens de voir le système. Est-ce que tu penses que ça peut t’aider à gagner du temps ou sécuriser tes dossiers ?\" (Pause) \"Parfait, on fait simple: on teste sur un vrai dossier cette semaine.\""
    },
    {
      title: "PUSH 1ER DEAL",
      icon: <Zap className="w-4 h-4" />,
      text: "\"Le vrai test, c’est sur un vrai cas. Je peux te guider pour ton prochain dossier, ça te prend 5–10 minutes.\""
    },
    {
      title: "CONVERT TO PAID",
      icon: <DollarSign className="w-4 h-4" />,
      text: "\"Tu as vu que ça fonctionne. Tu peux continuer à l’utiliser dossier par dossier. C’est payant seulement quand tu l’utilises ($15 par doc).\""
    }
  ];

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/outreach/leads');
      const data = await res.json();
      // Filter for those in closing pipeline (not new)
      setLeads(data.filter((l: any) => l.status !== 'new'));
    } catch (err) {
      console.error('Failed to fetch leads', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch(`/api/admin/outreach/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      fetchLeads();
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const updateNextAction = async (id: string, nextAction: string) => {
    try {
      await fetch(`/api/admin/outreach/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nextAction }),
      });
      fetchLeads();
    } catch (err) {
      console.error('Failed to update action', err);
    }
  };

  const stats = {
    total: leads.length,
    demosDone: leads.filter(l => ['demo_done', 'trial_started', 'first_deal', 'paid'].includes(l.status)).length,
    trials: leads.filter(l => ['trial_started', 'first_deal', 'paid'].includes(l.status)).length,
    paid: leads.filter(l => l.status === 'paid').length,
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tight">Closing <span className="text-[#D4AF37]">Accelerator</span></h1>
            <p className="text-gray-400 text-sm">Système de conversion 7 jours vers le premier paiement.</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-[#D4AF37]/20 text-[#D4AF37] px-4 py-1">
              Objectif: 5 Premiers Payants
            </Badge>
          </div>
        </div>

        {/* KPI Panel */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6 bg-black/40 border-white/5 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Pipeline Actif</p>
                <h3 className="text-2xl font-black mt-1">{stats.total}</h3>
              </div>
              <Users className="w-5 h-5 text-blue-500" />
            </div>
          </Card>
          <Card className="p-6 bg-black/40 border-white/5 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Démos Faites</p>
                <h3 className="text-2xl font-black mt-1">{stats.demosDone}</h3>
              </div>
              <CheckCircle className="w-5 h-5 text-purple-500" />
            </div>
          </Card>
          <Card className="p-6 bg-black/40 border-white/5 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Essais Lancés</p>
                <h3 className="text-2xl font-black mt-1">{stats.trials}</h3>
              </div>
              <TrendingUp className="w-5 h-5 text-orange-500" />
            </div>
          </Card>
          <Card className="p-6 bg-[#D4AF37]/5 border-[#D4AF37]/20 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-[#D4AF37] font-black uppercase tracking-widest">Payants (Cible: 5)</p>
                <h3 className="text-2xl font-black text-[#D4AF37] mt-1">{stats.paid} / 5</h3>
              </div>
              <DollarSign className="w-5 h-5 text-[#D4AF37]" />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Pipeline */}
          <div className="lg:col-span-8 space-y-6">
            <Card className="p-0 bg-black/40 border-white/5 backdrop-blur-xl overflow-hidden">
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-400" />
                  Closing Pipeline
                </h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input 
                    placeholder="Chercher courtier..." 
                    className="pl-9 bg-white/5 border-white/10 w-48 h-8 text-xs"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/5">
                    <TableHead className="text-[10px] text-gray-400 uppercase font-black">Courtier</TableHead>
                    <TableHead className="text-[10px] text-gray-400 uppercase font-black">Étape</TableHead>
                    <TableHead className="text-[10px] text-gray-400 uppercase font-black">Next Action</TableHead>
                    <TableHead className="text-right text-[10px] text-gray-400 uppercase font-black">Quick Step</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-12">Chargement...</TableCell></TableRow>
                  ) : leads.filter(l => l.name.toLowerCase().includes(searchTerm.toLowerCase())).map((lead) => (
                    <TableRow key={lead.id} className="border-white/5 hover:bg-white/5 transition group">
                      <TableCell>
                        <div className="font-bold">{lead.name}</div>
                        <div className="text-[10px] text-gray-500">{lead.city || 'N/A'}</div>
                      </TableCell>
                      <TableCell>
                        <select 
                          value={lead.status}
                          onChange={(e) => updateStatus(lead.id, e.target.value)}
                          className={cn(
                            "bg-black/60 border border-white/10 rounded px-2 py-1 text-xs font-bold w-32",
                            lead.status === 'paid' && "text-green-400 border-green-500/30",
                            lead.status === 'first_deal' && "text-emerald-400 border-emerald-500/30",
                            lead.status === 'trial_started' && "text-orange-400 border-orange-500/30"
                          )}
                        >
                          {stages.map(s => (
                            <option key={s.id} value={s.id}>{s.label}</option>
                          ))}
                        </select>
                      </TableCell>
                      <TableCell>
                        <Input 
                          defaultValue={lead.nextAction || ''}
                          onBlur={(e) => updateNextAction(lead.id, e.target.value)}
                          className="bg-transparent border-transparent hover:border-white/10 h-8 text-xs focus:bg-white/5"
                          placeholder="Action..."
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 text-[10px] text-[#D4AF37] hover:bg-[#D4AF37]/10"
                            onClick={() => {
                              const currentIdx = stages.findIndex(s => s.id === lead.status);
                              if (currentIdx < stages.length - 1) {
                                updateStatus(lead.id, stages[currentIdx + 1].id);
                              }
                            }}
                          >
                            Next Stage <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

            {/* Scripts Panel */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {scripts.map((script, idx) => (
                <Card key={idx} className="p-6 bg-black/40 border-white/5 hover:border-[#D4AF37]/30 transition group">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="text-[#D4AF37]">{script.icon}</div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">{script.title}</h3>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed italic group-hover:text-white transition">
                    {script.text}
                  </p>
                </Card>
              ))}
            </div>
          </div>

          {/* Right Column: 7-Day Plan & Tips */}
          <div className="lg:col-span-4 space-y-8">
            {/* 7-Day Roadmap */}
            <Card className="p-8 bg-gradient-to-br from-[#D4AF37]/10 to-transparent border-[#D4AF37]/20 backdrop-blur-xl">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-[#D4AF37]">
                <Calendar className="w-5 h-5" />
                Plan de 7 Jours
              </h2>
              <div className="space-y-6">
                {plan7Day.map((p, idx) => (
                  <div key={idx} className="relative pl-6 border-l border-white/10 last:border-0 pb-6 last:pb-0">
                    <div className="absolute -left-[5px] top-0 w-[9px] h-[9px] rounded-full bg-[#D4AF37]" />
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">Jour {p.days}</p>
                      </div>
                      <h4 className="text-sm font-bold">{p.focus}</h4>
                      <ul className="space-y-1">
                        {p.items.map((item, i) => (
                          <li key={i} className="text-xs text-gray-500 flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-gray-700" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Strategy Tips */}
            <Card className="p-6 bg-white/5 border-white/5">
              <h3 className="text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                Winning Strategy
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-2">
                  <p className="text-xs font-bold text-white italic">"On ne vend pas un abonnement."</p>
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    On vend le succès du 1er dossier. Une fois que le courtier a finalisé son premier document, il voit le gain de temps réel.
                  </p>
                </div>
                <div className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-2">
                  <p className="text-xs font-bold text-white italic">"Le Mode Assisté est clé."</p>
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    N'hésitez pas à faire un Zoom pour guider les 5 premières minutes du premier draft. Le courtier devient autonome après ça.
                  </p>
                </div>
              </div>
            </Card>

            {/* Payment Trigger Logic */}
            <Card className="p-6 bg-emerald-500/5 border-emerald-500/20">
              <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-2">Automatique</h3>
              <p className="text-[10px] text-gray-400 leading-relaxed">
                Dès que le statut passe à <span className="text-emerald-400 font-bold">first_deal</span>, le système envoie l'email de rétention et active le paywall de $15/doc pour les dossiers suivants.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
