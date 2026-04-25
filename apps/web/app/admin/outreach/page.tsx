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
  Filter,
  MoreVertical,
  LogOut,
  ChevronRight,
  Share2,
  Copy,
  Zap,
  FileText
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Table, THead as TableHeader, TBody as TableBody, Th as TableHead, Tr as TableRow, Td as TableCell } from '../../../components/ui/Table';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { CallScriptPanel } from '../../../components/outreach/CallScriptPanel';
import { LoomScript } from '../../../components/outreach/LoomScript';
import { ClosingScript } from '../../../components/outreach/ClosingScript';

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

interface BrokerLead {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  source: string | null;
  status: string;
  lastContactAt: string | null;
  nextFollowUpAt: string | null;
  notes: string | null;
  ownerUserId: string | null;
  createdAt: string;
}

export default function OutreachPage() {
  const [leads, setLeads] = useState<BrokerLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLogCallModalOpen, setIsLogCallModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<BrokerLead | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form states
  const [newLead, setNewLead] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    source: 'google',
    notes: ''
  });
  
  const [callLog, setCallLog] = useState({
    outcome: 'no_answer',
    notes: '',
    nextFollowUpDate: ''
  });

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/outreach/leads');
      const data = await res.json();
      setLeads(data);
    } catch (err) {
      console.error('Failed to fetch leads', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/outreach/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLead),
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        setNewLead({ name: '', phone: '', email: '', city: '', source: 'google', notes: '' });
        fetchLeads();
      }
    } catch (err) {
      console.error('Failed to add lead', err);
    }
  };

  const handleLogCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    
    try {
      const res = await fetch(`/api/admin/outreach/leads/${selectedLead.id}/log-call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(callLog),
      });
      if (res.ok) {
        setIsLogCallModalOpen(false);
        setCallLog({ outcome: 'no_answer', notes: '', nextFollowUpDate: '' });
        fetchLeads();
      }
    } catch (err) {
      console.error('Failed to log call', err);
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

  const filteredLeads = leads.filter(l => 
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const today = new Date().toISOString().split('T')[0];
  const followUpsToday = leads.filter(l => l.nextFollowUpAt && l.nextFollowUpAt.split('T')[0] === today);
  const overdueFollowUps = leads.filter(l => l.nextFollowUpAt && l.nextFollowUpAt.split('T')[0] < today && l.status !== 'onboarded' && l.status !== 'rejected');

  const stats = {
    total: leads.length,
    contacted: leads.filter(l => l.status !== 'new').length,
    demos: leads.filter(l => l.status === 'demo_booked').length,
    onboarded: leads.filter(l => l.status === 'onboarded').length,
    activated: leads.filter(l => l.status === 'onboarded').length, // For now, using onboarded as proxy
  };

  const activationKpis = {
    activated: stats.activated,
    completedFirstDraft: Math.round((stats.onboarded * 0.65)), // Mocked for now
    paidUsers: Math.round((stats.onboarded * 0.25)), // Mocked for now
  };

  const conversionRate = stats.contacted > 0 ? Math.round((stats.onboarded / stats.contacted) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Navigation */}
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" className="text-xs font-bold text-[#D4AF37] bg-[#D4AF37]/10" onClick={() => window.location.href = '/admin/outreach'}>CRM</Button>
          <Button variant="ghost" className="text-xs font-bold text-gray-400" onClick={() => window.location.href = '/admin/execution'}>Execution</Button>
          <Button variant="ghost" className="text-xs font-bold text-gray-400" onClick={() => window.location.href = '/admin/closing'}>Closing</Button>
          <Button variant="ghost" className="text-xs font-bold text-gray-400" onClick={() => window.location.href = '/admin/bookings'}>Démos</Button>
          <Button variant="ghost" className="text-xs font-bold text-purple-400" onClick={() => window.location.href = '/operator'}>Operator Hub</Button>
        </div>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Outreach Engine <span className="text-[#D4AF37]">Québec</span></h1>
            <p className="text-gray-400">Gestion de l'onboarding des courtiers immobiliers.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-[#D4AF37] hover:bg-[#B8962E] text-black font-bold rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un Prospect
            </Button>
          </div>
        </div>

        {/* KPI Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6 bg-black/40 border-white/5 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 font-medium">Prospects</p>
                  <h3 className="text-2xl font-black mt-1">{stats.total}</h3>
                </div>
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-500" />
                </div>
              </div>
          </Card>
          <Card className="p-6 bg-black/40 border-white/5 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 font-medium">Contactés</p>
                  <h3 className="text-2xl font-black mt-1">{stats.contacted}</h3>
                </div>
                <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                  <Phone className="w-6 h-6 text-purple-500" />
                </div>
              </div>
          </Card>
          <Card className="p-6 bg-black/40 border-white/5 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 font-medium">Démos Prévues</p>
                  <h3 className="text-2xl font-black mt-1">{stats.demos}</h3>
                </div>
                <div className="w-12 h-12 bg-[#D4AF37]/10 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-[#D4AF37]" />
                </div>
              </div>
          </Card>
          <Card className="p-6 bg-black/40 border-white/5 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 font-medium">Taux de Conv.</p>
                  <h3 className="text-2xl font-black mt-1">{conversionRate}%</h3>
                </div>
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-500" />
                </div>
              </div>
          </Card>
        </div>

        {/* Activation KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 bg-[#D4AF37]/5 border-[#D4AF37]/20">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#D4AF37]/20 rounded-full flex items-center justify-center">
                <Zap className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Activés</p>
                <h4 className="text-xl font-black">{activationKpis.activated}</h4>
              </div>
            </div>
          </Card>
          <Card className="p-6 bg-blue-500/5 border-blue-500/20">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">1er Draft</p>
                <h4 className="text-xl font-black">{activationKpis.completedFirstDraft > 0 ? Math.round((activationKpis.completedFirstDraft / stats.onboarded) * 100) : 0}%</h4>
              </div>
            </div>
          </Card>
          <Card className="p-6 bg-green-500/5 border-green-500/20">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Payants</p>
                <h4 className="text-xl font-black">{activationKpis.paidUsers > 0 ? Math.round((activationKpis.paidUsers / stats.onboarded) * 100) : 0}%</h4>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main CRM Table */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-0 bg-black/40 border-white/5 backdrop-blur-xl">
              <div className="p-6 flex flex-row items-center justify-between">
                <h3 className="text-lg font-bold">Pipeline des Courtiers</h3>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input 
                      placeholder="Rechercher..." 
                      className="pl-9 bg-white/5 border-white/10 w-64 h-9 text-sm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" size="sm" className="bg-white/5 border-white/10 h-9">
                    <Filter className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead className="text-gray-400">Courtier</TableHead>
                      <TableHead className="text-gray-400">Ville / Source</TableHead>
                      <TableHead className="text-gray-400">Statut</TableHead>
                      <TableHead className="text-gray-400">Dernier Contact</TableHead>
                      <TableHead className="text-right text-gray-400">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8">Chargement...</TableCell></TableRow>
                    ) : filteredLeads.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">Aucun prospect trouvé.</TableCell></TableRow>
                    ) : filteredLeads.map((lead) => (
                      <TableRow key={lead.id} className="border-white/5 hover:bg-white/5 transition">
                        <TableCell>
                          <div className="font-bold">{lead.name}</div>
                          <div className="text-xs text-gray-500">{lead.email || lead.phone || 'Pas de contact'}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-gray-500" />
                            <span className="text-sm">{lead.city || 'N/A'}</span>
                          </div>
                          <Badge className="mt-1 bg-white/5 text-[10px] text-gray-400 uppercase tracking-wider">{lead.source || 'Direct'}</Badge>
                        </TableCell>
                        <TableCell>
                          <select 
                            value={lead.status}
                            onChange={(e) => updateStatus(lead.id, e.target.value)}
                            className="bg-black/60 border border-white/10 rounded px-2 py-1 text-xs"
                          >
                            <option value="new">Nouveau</option>
                            <option value="contacted">Contacté</option>
                            <option value="demo_booked">Démo Prévue</option>
                            <option value="onboarded">Onboardé</option>
                            <option value="rejected">Refusé</option>
                          </select>
                        </TableCell>
                        <TableCell className="text-sm text-gray-400">
                          {lead.lastContactAt ? new Date(lead.lastContactAt).toLocaleDateString() : 'Jamais'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                const link = `${window.location.origin}/demo/broker?ref=${lead.id}`;
                                navigator.clipboard.writeText(link);
                                alert('Lien démo copié !');
                              }}
                              className="text-blue-400 hover:bg-blue-400/10"
                              title="Copier le lien démo"
                            >
                              <Share2 className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setSelectedLead(lead);
                                setIsLogCallModalOpen(true);
                              }}
                              className="text-[#D4AF37] hover:bg-[#D4AF37]/10"
                            >
                              <Phone className="w-4 h-4 mr-2" />
                              Log Call
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>

          {/* Side Panels */}
          <div className="space-y-6">
            {/* Follow-up Reminders */}
            <Card className="p-6 bg-black/40 border-white/5 backdrop-blur-xl">
              <div className="mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-400" />
                  Rappels Suivi
                </h3>
              </div>
              <div className="space-y-4">
                {overdueFollowUps.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-red-500 uppercase tracking-wider">En retard ({overdueFollowUps.length})</p>
                    {overdueFollowUps.map(l => (
                      <div key={l.id} className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-between group hover:bg-red-500/20 transition cursor-pointer" onClick={() => { setSelectedLead(l); setIsLogCallModalOpen(true); }}>
                        <div>
                          <p className="text-sm font-bold">{l.name}</p>
                          <p className="text-[10px] text-red-400">{new Date(l.nextFollowUpAt!).toLocaleDateString()}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-red-400 group-hover:translate-x-1 transition" />
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="space-y-2">
                  <p className="text-xs font-bold text-blue-400 uppercase tracking-wider">Aujourd'hui ({followUpsToday.length})</p>
                  {followUpsToday.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">Aucun suivi prévu pour aujourd'hui.</p>
                  ) : (
                    followUpsToday.map(l => (
                      <div key={l.id} className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-between group hover:bg-blue-500/20 transition cursor-pointer" onClick={() => { setSelectedLead(l); setIsLogCallModalOpen(true); }}>
                        <div>
                          <p className="text-sm font-bold">{l.name}</p>
                          <p className="text-[10px] text-blue-400">Ville: {l.city || 'N/A'}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-blue-400 group-hover:translate-x-1 transition" />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Card>

            {/* Script Panel */}
            <CallScriptPanel />
            <LoomScript />
            <ClosingScript />
          </div>
        </div>
      </div>

      {/* Add Lead Modal */}
      <Modal 
        open={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        title="Ajouter un nouveau prospect"
      >
        <form onSubmit={handleAddLead} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Nom Complet</label>
            <Input 
              required
              value={newLead.name}
              onChange={e => setNewLead({...newLead, name: e.target.value})}
              placeholder="Ex: Jean Tremblay"
              className="bg-white/5 border-white/10"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Téléphone</label>
              <Input 
                value={newLead.phone}
                onChange={e => setNewLead({...newLead, phone: e.target.value})}
                placeholder="514-000-0000"
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Ville</label>
              <Input 
                value={newLead.city}
                onChange={e => setNewLead({...newLead, city: e.target.value})}
                placeholder="Montréal"
                className="bg-white/5 border-white/10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Email</label>
            <Input 
              type="email"
              value={newLead.email}
              onChange={e => setNewLead({...newLead, email: e.target.value})}
              placeholder="jean@agence.ca"
              className="bg-white/5 border-white/10"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Source</label>
            <Select 
              value={newLead.source}
              onChange={e => setNewLead({...newLead, source: e.target.value})}
              className="bg-white/5 border-white/10"
            >
              <option value="facebook">Facebook</option>
              <option value="instagram">Instagram</option>
              <option value="google">Google</option>
              <option value="linkedin">LinkedIn</option>
              <option value="referral">Referral</option>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Notes Initiales</label>
            <textarea 
              value={newLead.notes}
              onChange={e => setNewLead({...newLead, notes: e.target.value})}
              className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#D4AF37] outline-none"
              placeholder="Détails sur le courtier..."
            />
          </div>
          <Button type="submit" className="w-full bg-[#D4AF37] text-black font-bold h-12 rounded-xl mt-4">
            Créer le prospect
          </Button>
        </form>
      </Modal>

      {/* Log Call Modal */}
      <Modal 
        open={isLogCallModalOpen} 
        onClose={() => setIsLogCallModalOpen(false)}
        title={`Log Call: ${selectedLead?.name}`}
      >
        <form onSubmit={handleLogCall} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Résultat de l'appel</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setCallLog({...callLog, outcome: 'no_answer'})}
                className={cn(
                  "py-2 text-xs font-bold border rounded-lg transition",
                  callLog.outcome === 'no_answer' ? "bg-red-500/20 border-red-500 text-red-500" : "bg-white/5 border-white/10 text-gray-400"
                )}
              >
                <XCircle className="w-4 h-4 mx-auto mb-1" />
                Pas de réponse
              </button>
              <button
                type="button"
                onClick={() => setCallLog({...callLog, outcome: 'not_interested'})}
                className={cn(
                  "py-2 text-xs font-bold border rounded-lg transition",
                  callLog.outcome === 'not_interested' ? "bg-gray-500/20 border-gray-500 text-gray-400" : "bg-white/5 border-white/10 text-gray-400"
                )}
              >
                <LogOut className="w-4 h-4 mx-auto mb-1" />
                Pas intéressé
              </button>
              <button
                type="button"
                onClick={() => setCallLog({...callLog, outcome: 'interested'})}
                className={cn(
                  "py-2 text-xs font-bold border rounded-lg transition",
                  callLog.outcome === 'interested' ? "bg-green-500/20 border-green-500 text-green-500" : "bg-white/5 border-white/10 text-gray-400"
                )}
              >
                <CheckCircle className="w-4 h-4 mx-auto mb-1" />
                Intéressé / Démo
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Notes d'appel</label>
            <textarea 
              value={callLog.notes}
              onChange={e => setCallLog({...callLog, notes: e.target.value})}
              className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#D4AF37] outline-none"
              placeholder="Qu'est-ce qui a été dit ?"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400">Date du prochain suivi (Optionnel)</label>
            <Input 
              type="date"
              value={callLog.nextFollowUpDate}
              onChange={e => setCallLog({...callLog, nextFollowUpDate: e.target.value})}
              className="bg-white/5 border-white/10"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <Button type="submit" className="w-full bg-[#D4AF37] text-black font-bold h-12 rounded-xl mt-4">
            Enregistrer l'appel
          </Button>
        </form>
      </Modal>
    </div>
  );
}
