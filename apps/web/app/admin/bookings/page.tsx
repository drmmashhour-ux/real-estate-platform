"use client";

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Filter,
  Search,
  MoreVertical,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Mail as MailIcon
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Table, THead as TableHeader, TBody as TableBody, Th as TableHead, Tr as TableRow, Td as TableCell } from '../../../components/ui/Table';
import { Badge } from '../../../components/ui/Badge';

interface DemoBooking {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  city: string | null;
  experience: string | null;
  status: string;
  scheduledAt: string;
  createdAt: string;
}

export default function BookingsAdminPage() {
  const [bookings, setBookings] = useState<DemoBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/outreach/bookings');
      const data = await res.json();
      setBookings(data);
    } catch (err) {
      console.error('Failed to fetch bookings', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch(`/api/admin/outreach/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      fetchBookings();
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const filteredBookings = bookings.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: bookings.length,
    upcoming: bookings.filter(b => b.status === 'scheduled').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    noShow: bookings.filter(b => b.status === 'no_show').length,
  };

  const today = new Date().toISOString().split('T')[0];
  const todayCalls = bookings.filter(b => b.scheduledAt.split('T')[0] === today);
  const overdue = bookings.filter(b => b.status === 'scheduled' && b.scheduledAt < new Date().toISOString());

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Booking <span className="text-[#D4AF37]">Manager</span></h1>
            <p className="text-gray-400">Gestion des démos et suivis automatisés.</p>
          </div>
          <Button onClick={fetchBookings} variant="outline" className="border-white/10 bg-white/5 h-11 px-6 rounded-xl">
            Actualiser
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6 bg-black/40 border-white/5 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Total Démos</p>
                <h3 className="text-2xl font-black mt-1">{stats.total}</h3>
              </div>
              <TrendingUp className="w-6 h-6 text-[#D4AF37]" />
            </div>
          </Card>
          <Card className="p-6 bg-black/40 border-white/5 backdrop-blur-xl text-blue-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-400/60 font-bold uppercase tracking-widest">À venir</p>
                <h3 className="text-2xl font-black mt-1">{stats.upcoming}</h3>
              </div>
              <Calendar className="w-6 h-6" />
            </div>
          </Card>
          <Card className="p-6 bg-black/40 border-white/5 backdrop-blur-xl text-green-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-400/60 font-bold uppercase tracking-widest">Terminées</p>
                <h3 className="text-2xl font-black mt-1">{stats.completed}</h3>
              </div>
              <CheckCircle className="w-6 h-6" />
            </div>
          </Card>
          <Card className="p-6 bg-black/40 border-white/5 backdrop-blur-xl text-red-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-red-400/60 font-bold uppercase tracking-widest">No Shows</p>
                <h3 className="text-2xl font-black mt-1">{stats.noShow}</h3>
              </div>
              <XCircle className="w-6 h-6" />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Bookings Table */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-0 bg-black/40 border-white/5 backdrop-blur-xl overflow-hidden">
              <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h3 className="text-lg font-bold">Liste des Réservations</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input 
                    placeholder="Rechercher par nom, email..." 
                    className="pl-9 bg-white/5 border-white/10 w-full md:w-64 h-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/5">
                    <TableHead className="text-gray-400">Courtier</TableHead>
                    <TableHead className="text-gray-400">Détails</TableHead>
                    <TableHead className="text-gray-400">Date Prévue</TableHead>
                    <TableHead className="text-gray-400">Statut</TableHead>
                    <TableHead className="text-right text-gray-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-12">Chargement...</TableCell></TableRow>
                  ) : filteredBookings.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-12 text-gray-500">Aucune réservation trouvée.</TableCell></TableRow>
                  ) : filteredBookings.map((b) => (
                    <TableRow key={b.id} className="border-white/5 hover:bg-white/5 transition">
                      <TableCell>
                        <div className="font-bold">{b.name}</div>
                        <div className="text-xs text-gray-500">{b.email}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-300">{b.city || 'N/A'}</div>
                        <div className="text-[10px] text-gray-500 uppercase">{b.experience ? `${b.experience} ans d'exp.` : 'N/A'}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{new Date(b.scheduledAt).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-500">{new Date(b.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </TableCell>
                      <TableCell>
                        <select 
                          value={b.status}
                          onChange={(e) => updateStatus(b.id, e.target.value)}
                          className={cn(
                            "bg-black/60 border border-white/10 rounded px-2 py-1 text-xs font-bold",
                            b.status === 'completed' && "text-green-400 border-green-500/30",
                            b.status === 'no_show' && "text-red-400 border-red-500/30",
                            b.status === 'scheduled' && "text-blue-400 border-blue-500/30"
                          )}
                        >
                          <option value="scheduled">Prévu</option>
                          <option value="completed">Terminé</option>
                          <option value="no_show">No Show</option>
                          <option value="cancelled">Annulé</option>
                        </select>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="text-[#D4AF37] hover:bg-[#D4AF37]/10">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>

          {/* Right Panels */}
          <div className="space-y-6">
            {/* Today's Agenda */}
            <Card className="p-6 bg-black/40 border-white/5 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-400" />
                  Agenda du Jour
                </h3>
                <Badge variant="outline" className="text-blue-400 border-blue-400/30">{todayCalls.length}</Badge>
              </div>
              <div className="space-y-4">
                {todayCalls.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">Aucun appel aujourd'hui.</p>
                ) : todayCalls.map(b => (
                  <div key={b.id} className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between group cursor-pointer hover:border-blue-500/30 transition">
                    <div className="flex gap-3">
                      <div className="text-blue-400 pt-1 font-black text-xs">{new Date(b.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      <div>
                        <p className="text-sm font-bold">{b.name}</p>
                        <p className="text-[10px] text-gray-500">{b.city || 'N/A'}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-blue-400 group-hover:translate-x-1 transition" />
                  </div>
                ))}
              </div>
            </Card>

            {/* Critical Follow-ups */}
            {overdue.length > 0 && (
              <Card className="p-6 bg-red-500/5 border-red-500/20 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black text-red-400 uppercase tracking-widest flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    No-Show / Retard
                  </h3>
                </div>
                <div className="space-y-3">
                  {overdue.map(b => (
                    <div key={b.id} className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold">{b.name}</span>
                        <span className="text-[10px] text-red-400 font-black">{new Date(b.scheduledAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="h-8 text-[10px] bg-red-500 hover:bg-red-600 text-white font-bold w-full rounded-lg">
                          Log No-Show
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 text-[10px] border-white/10 hover:bg-white/5 w-full rounded-lg">
                          <MailIcon className="w-3 h-3 mr-1" />
                          Replanifier
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Email Automation Preview */}
            <Card className="p-6 bg-white/5 border-white/5 backdrop-blur-xl">
              <h3 className="text-sm font-black text-[#D4AF37] uppercase tracking-widest mb-4">Séquence Automatisée</h3>
              <div className="space-y-4">
                {[
                  { label: "Confirmation", time: "Immédiat", icon: <CheckCircle className="w-4 h-4 text-green-500" /> },
                  { label: "Rappel 24h", time: "T-24h", icon: <Clock className="w-4 h-4 text-gray-500" /> },
                  { label: "Rappel 1h", time: "T-1h", icon: <Clock className="w-4 h-4 text-gray-500" /> },
                  { label: "Follow-up", time: "Post-Démo", icon: <MailIcon className="w-4 h-4 text-gray-500" /> }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-2 bg-white/5 rounded-lg border border-white/5">
                    <div className="flex items-center gap-2">
                      {item.icon}
                      <span className="font-bold">{item.label}</span>
                    </div>
                    <span className="text-gray-500">{item.time}</span>
                  </div>
                ))}
              </div>
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
