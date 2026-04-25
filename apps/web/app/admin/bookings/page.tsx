"use client";

import React, { useState, useEffect } from "react";
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  User, 
  Mail, 
  Phone, 
  MapPin,
  MoreVertical,
  ChevronRight,
  Filter,
  Search
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Table, THead as TableHeader, TBody as TableBody, Th as TableHead, Tr as TableRow, Td as TableCell } from "../../../components/ui/Table";
import { Badge } from "../../../components/ui/Badge";

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

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<DemoBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/bookings");
      const data = await res.json();
      setBookings(data);
    } catch (err) {
      console.error("Failed to fetch bookings", err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch(`/api/admin/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      fetchBookings();
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const filteredBookings = bookings.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    upcoming: bookings.filter(b => b.status === "scheduled").length,
    completed: bookings.filter(b => b.status === "completed").length,
    noShow: bookings.filter(b => b.status === "no_show").length,
  };

  const today = new Date().toISOString().split('T')[0];
  const todayBookings = bookings.filter(b => b.scheduledAt.split('T')[0] === today);

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-8">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Gestion des <span className="text-[#D4AF37]">Démos</span></h1>
            <p className="text-gray-400">Suivi des rendez-vous et de l'activation des courtiers.</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" className="text-xs font-bold text-gray-400" onClick={() => window.location.href = '/admin/outreach'}>CRM</Button>
          <Button variant="ghost" className="text-xs font-bold text-gray-400" onClick={() => window.location.href = '/admin/execution'}>Execution</Button>
          <Button variant="ghost" className="text-xs font-bold text-gray-400" onClick={() => window.location.href = '/admin/closing'}>Closing</Button>
          <Button variant="ghost" className="text-xs font-bold text-[#D4AF37] bg-[#D4AF37]/10" onClick={() => window.location.href = '/admin/bookings'}>Démos</Button>
          <Button variant="ghost" className="text-xs font-bold text-purple-400" onClick={() => window.location.href = '/operator'}>Operator Hub</Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 bg-black/40 border-white/5 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 font-medium">À venir</p>
                <h3 className="text-2xl font-black mt-1 text-blue-400">{stats.upcoming}</h3>
              </div>
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </Card>
          <Card className="p-6 bg-black/40 border-white/5 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 font-medium">Complétées</p>
                <h3 className="text-2xl font-black mt-1 text-green-500">{stats.completed}</h3>
              </div>
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </Card>
          <Card className="p-6 bg-black/40 border-white/5 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 font-medium">No Shows</p>
                <h3 className="text-2xl font-black mt-1 text-red-500">{stats.noShow}</h3>
              </div>
              <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Bookings Table */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-0 bg-black/40 border-white/5 backdrop-blur-xl">
              <div className="p-6 flex flex-row items-center justify-between">
                <h3 className="text-lg font-bold">Calendrier des Démos</h3>
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
                </div>
              </div>
              <div>
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead className="text-gray-400">Courtier</TableHead>
                      <TableHead className="text-gray-400">Rendez-vous</TableHead>
                      <TableHead className="text-gray-400">Statut</TableHead>
                      <TableHead className="text-right text-gray-400">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-8">Chargement...</TableCell></TableRow>
                    ) : filteredBookings.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-8 text-gray-500">Aucun rendez-vous trouvé.</TableCell></TableRow>
                    ) : filteredBookings.map((booking) => (
                      <TableRow key={booking.id} className="border-white/5 hover:bg-white/5 transition">
                        <TableCell>
                          <div className="font-bold">{booking.name}</div>
                          <div className="text-xs text-gray-500">{booking.city} • {booking.experience} ans d'exp.</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 font-medium">
                            <Calendar className="w-3 h-3 text-[#D4AF37]" />
                            {new Date(booking.scheduledAt).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            {new Date(booking.scheduledAt).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <select 
                            value={booking.status}
                            onChange={(e) => updateStatus(booking.id, e.target.value)}
                            className="bg-black/60 border border-white/10 rounded px-2 py-1 text-xs"
                          >
                            <option value="scheduled">Prévu</option>
                            <option value="completed">Terminé</option>
                            <option value="no_show">No Show</option>
                            <option value="cancelled">Annulé</option>
                          </select>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => window.location.href = `mailto:${booking.email}`}
                            className="text-gray-400 hover:bg-white/5"
                          >
                            <Mail className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>

          {/* Side Panel: Today's Focus */}
          <div className="space-y-6">
            <Card className="p-6 bg-[#D4AF37]/5 border-[#D4AF37]/20 backdrop-blur-xl">
              <div className="mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#D4AF37]" />
                  Aujourd'hui
                </h3>
              </div>
              <div className="space-y-4">
                {todayBookings.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">Aucune démo prévue pour aujourd'hui.</p>
                ) : (
                  todayBookings.map(b => (
                    <div key={b.id} className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold">{new Date(b.scheduledAt).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}</span>
                        <Badge className="bg-[#D4AF37] text-black text-[10px] font-bold">URGENT</Badge>
                      </div>
                      <div>
                        <p className="font-bold">{b.name}</p>
                        <p className="text-xs text-gray-500">{b.city}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1 bg-white/5 border-white/10 h-8 text-xs hover:bg-green-500/20 hover:border-green-500/50" onClick={() => updateStatus(b.id, "completed")}>
                          Terminé
                        </Button>
                        <Button size="sm" className="flex-1 bg-white/5 border-white/10 h-8 text-xs hover:bg-red-500/20 hover:border-red-500/50" onClick={() => updateStatus(b.id, "no_show")}>
                          No Show
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card className="p-6 bg-blue-500/5 border-blue-500/20 backdrop-blur-xl text-sm space-y-4">
              <h3 className="font-bold text-blue-400 uppercase tracking-widest text-xs">Rappels Automatiques</h3>
              <p className="text-gray-400">
                Le système envoie automatiquement des rappels à 24h et 1h du rendez-vous.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="w-1 h-1 bg-blue-400 rounded-full" />
                  Confirmation immédiate avec lien Loom
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="w-1 h-1 bg-blue-400 rounded-full" />
                  Rappel 24h — Simple + Direct
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="w-1 h-1 bg-blue-400 rounded-full" />
                  Rappel 1h — "On se voit bientôt"
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
