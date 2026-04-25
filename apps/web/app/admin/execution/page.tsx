"use client";

import React, { useState, useEffect } from "react";
import { 
  Calendar, 
  Clock, 
  CheckSquare, 
  Square, 
  Phone, 
  MessageSquare, 
  Play, 
  CheckCircle2, 
  TrendingUp, 
  Zap, 
  AlertCircle,
  MoreVertical,
  ChevronRight,
  ArrowRight,
  Edit3
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { ProgressBar } from "../../../components/ui/ProgressBar";
import { Badge } from "../../../components/ui/Badge";
import { cn } from "../../../lib/utils";

interface Task {
  id: string;
  label: string;
  category: string;
  completed: boolean;
  quota: number;
  progress: number;
}

interface Stats {
  callsMade: number;
  dmsSent: number;
  demosBooked: number;
  demosDone: number;
  loomsSent: number;
  conversions: number;
  notes: string | null;
}

interface Lead {
  id: string;
  name: string;
  city: string | null;
  status: string;
  nextFollowUpAt: string | null;
}

export default function ExecutionPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [leads, setLeads] = useState<{ followUp: Lead[], new: Lead[] }>({ followUp: [], new: [] });
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchTodayData();
  }, []);

  const fetchTodayData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/execution/today");
      const data = await res.json();
      setTasks(data.tasks);
      setStats(data.stats);
      setLeads(data.leads);
      setNotes(data.stats.notes || "");
    } catch (err) {
      console.error("Failed to fetch execution data", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (id: string, completed: boolean) => {
    try {
      const res = await fetch(`/api/admin/execution/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
      });
      if (res.ok) {
        setTasks(tasks.map(t => t.id === id ? { ...t, completed } : t));
      }
    } catch (err) {
      console.error("Failed to update task", err);
    }
  };

  const updateStat = async (field: string, increment: number = 1) => {
    try {
      const res = await fetch("/api/admin/execution/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field, increment }),
      });
      if (res.ok) {
        const updatedStats = await res.json();
        setStats(updatedStats);
      }
    } catch (err) {
      console.error("Failed to update stat", err);
    }
  };

  const saveNotes = async () => {
    try {
      await fetch("/api/admin/execution/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      alert("Notes enregistrées !");
    } catch (err) {
      console.error("Failed to save notes", err);
    }
  };

  const schedule = [
    { time: "09:00 – 10:30", task: "Outreach (calls + DMs)", active: false },
    { time: "10:30 – 11:00", task: "Suivis (Follow-ups)", active: false },
    { time: "11:00 – 13:00", task: "Demo Calls", active: false },
    { time: "14:00 – 15:00", task: "Amélioration Produit / Feedback", active: false },
    { time: "15:00 – 16:00", task: "Outreach / Loom Sending", active: false },
  ];

  // Determine current active slot based on time
  const now = new Date();
  const currentHour = now.getHours();
  const currentMin = now.getMinutes();
  const currentTime = currentHour + currentMin / 60;

  const getActiveSlot = () => {
    if (currentTime >= 9 && currentTime < 10.5) return 0;
    if (currentTime >= 10.5 && currentTime < 11) return 1;
    if (currentTime >= 11 && currentTime < 13) return 2;
    if (currentTime >= 14 && currentTime < 15) return 3;
    if (currentTime >= 15 && currentTime < 16) return 4;
    return -1;
  };

  const activeSlot = getActiveSlot();

  if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center">Chargement...</div>;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Navigation */}
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" className="text-xs font-bold text-gray-400" onClick={() => window.location.href = '/admin/outreach'}>CRM</Button>
          <Button variant="ghost" className="text-xs font-bold text-[#D4AF37] bg-[#D4AF37]/10" onClick={() => window.location.href = '/admin/execution'}>Execution</Button>
          <Button variant="ghost" className="text-xs font-bold text-gray-400" onClick={() => window.location.href = '/admin/closing'}>Closing</Button>
          <Button variant="ghost" className="text-xs font-bold text-gray-400" onClick={() => window.location.href = '/admin/bookings'}>Démos</Button>
          <Button variant="ghost" className="text-xs font-bold text-purple-400" onClick={() => window.location.href = '/operator'}>Operator Hub</Button>
        </div>
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-8">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Execution Engine <span className="text-[#D4AF37]">Daily</span></h1>
            <p className="text-gray-400">Transformez votre discipline en résultats. Chaque jour compte.</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="text-right">
               <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Date du jour</p>
               <p className="text-lg font-bold">{new Date().toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Schedule & Tasks */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Today's Plan */}
            <Card className="bg-black/40 border-white/5 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#D4AF37]" />
                  Structure de la Journée
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {schedule.map((item, i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "flex items-center justify-between p-4 rounded-xl border transition",
                        activeSlot === i 
                          ? "bg-[#D4AF37]/10 border-[#D4AF37]/30 ring-1 ring-[#D4AF37]/20" 
                          : "bg-white/5 border-white/5 opacity-60"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <span className={cn("text-xs font-mono font-bold", activeSlot === i ? "text-[#D4AF37]" : "text-gray-500")}>
                          {item.time}
                        </span>
                        <span className={cn("font-bold", activeSlot === i ? "text-white" : "text-gray-400")}>
                          {item.task}
                        </span>
                      </div>
                      {activeSlot === i && (
                        <Badge className="bg-[#D4AF37] text-black text-[10px] font-black animate-pulse">EN COURS</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Daily Tasks */}
            <Card className="bg-black/40 border-white/5 backdrop-blur-xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-blue-400" />
                  Objectifs Prioritaires
                </CardTitle>
                <div className="text-right">
                   <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mr-2">Progression</span>
                   <span className="text-lg font-black text-blue-400">{progressPercent}%</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <ProgressBar progress={progressPercent} className="h-2 bg-white/5" barClassName="bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {tasks.map((task) => (
                    <div 
                      key={task.id}
                      onClick={() => toggleTask(task.id, !task.completed)}
                      className={cn(
                        "flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition group",
                        task.completed 
                          ? "bg-green-500/5 border-green-500/20" 
                          : "bg-white/5 border-white/5 hover:border-white/10"
                      )}
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-600 group-hover:text-gray-400" />
                      )}
                      <div className="flex-grow">
                        <p className={cn("text-sm font-bold", task.completed ? "text-gray-500 line-through" : "text-white")}>
                          {task.label}
                        </p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">{task.category}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quota Counter Section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {[
                 { label: "Appels", field: "callsMade", icon: <Phone className="w-4 h-4" color="#D4AF37" /> },
                 { label: "DMs Sent", field: "dmsSent", icon: <MessageSquare className="w-4 h-4" color="#3B82F6" /> },
                 { label: "Démos", field: "demosBooked", icon: <Calendar className="w-4 h-4" color="#A855F7" /> },
                 { label: "Looms", field: "loomsSent", icon: <Play className="w-4 h-4" color="#EF4444" /> },
               ].map((q) => (
                 <Card key={q.field} className="bg-black/40 border-white/5 text-center p-4">
                    <div className="flex justify-center mb-2">{q.icon}</div>
                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-tighter">{q.label}</p>
                    <h4 className="text-2xl font-black my-1">{(stats as any)?.[q.field] || 0}</h4>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-6 w-full text-[10px] font-bold text-gray-400 hover:text-white"
                      onClick={() => updateStat(q.field)}
                    >
                      + 1
                    </Button>
                 </Card>
               ))}
            </div>
          </div>

          {/* Right Column: Leads & Notes */}
          <div className="space-y-8">
            
            {/* Lead Integration */}
            <Card className="bg-black/40 border-white/5 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Zap className="w-5 h-5 text-orange-400" />
                  À appeler maintenant
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[400px] overflow-y-auto">
                  {leads.followUp.length === 0 && leads.new.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 italic text-sm">
                      Aucun lead urgent. Faites de l'outreach !
                    </div>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {leads.followUp.map(l => (
                        <div key={l.id} className="p-4 hover:bg-white/5 transition flex items-center justify-between group">
                          <div>
                            <p className="text-sm font-bold">{l.name}</p>
                            <p className="text-[10px] text-orange-400 font-bold uppercase tracking-widest">Suivi prévu</p>
                          </div>
                          <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 text-[#D4AF37]" onClick={() => window.location.href = `/admin/outreach`}>
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      {leads.new.map(l => (
                        <div key={l.id} className="p-4 hover:bg-white/5 transition flex items-center justify-between group">
                          <div>
                            <p className="text-sm font-bold">{l.name}</p>
                            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Nouveau prospect</p>
                          </div>
                          <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 text-[#D4AF37]" onClick={() => window.location.href = `/admin/outreach`}>
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Daily Notes */}
            <Card className="bg-black/40 border-white/5 backdrop-blur-xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-gray-400" />
                  Journal de Bord
                </CardTitle>
                <Button size="sm" className="bg-white/5 h-8 text-[10px] font-bold" onClick={saveNotes}>SAVE</Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ce qui a marché, objections entendues, idées..."
                  className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:ring-1 focus:ring-[#D4AF37] outline-none placeholder:text-gray-600"
                />
                
                <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                  <div className="flex items-center gap-2 text-blue-400 mb-2">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-widest">Performance</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-2xl font-black">{(stats?.conversions || 0) > 0 ? Math.round(((stats?.conversions || 0) / (stats?.callsMade || 1)) * 100) : 0}%</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase">Conversion du jour</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-300">Semaine: {stats?.conversions || 0}</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase">Total signatures</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Tips */}
            <div className="p-6 bg-gradient-to-br from-black to-zinc-900 border border-white/5 rounded-[32px] space-y-4 shadow-2xl">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 bg-[#D4AF37]/20 rounded-full flex items-center justify-center">
                   <AlertCircle className="w-4 h-4 text-[#D4AF37]" />
                 </div>
                 <h4 className="font-bold text-sm">Conseil de Vente</h4>
               </div>
               <p className="text-xs text-gray-400 italic leading-relaxed">
                 "Ne vendez pas l'outil, vendez la tranquillité d'esprit sur les clauses complexes. Un courtier gagne quand il réduit son risque."
               </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
