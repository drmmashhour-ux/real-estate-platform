"use client";

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Target, 
  Phone, 
  MessageSquare, 
  Zap, 
  TrendingUp, 
  Video, 
  Calendar,
  Save,
  ChevronRight,
  ListTodo
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { ProgressBar } from '../../../components/ui/ProgressBar';

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
  notes: string;
}

export default function ExecutionEnginePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchDailyPlan();
  }, []);

  const fetchDailyPlan = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/outreach/execution');
      const data = await res.json();
      setTasks(data.tasks);
      setStats(data.stats);
    } catch (err) {
      console.error('Failed to fetch daily plan', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (id: string, completed: boolean) => {
    try {
      await fetch(`/api/admin/outreach/execution/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed, progress: completed ? tasks.find(t => t.id === id)?.quota : 0 }),
      });
      fetchDailyPlan();
    } catch (err) {
      console.error('Failed to toggle task', err);
    }
  };

  const updateStats = async () => {
    if (!stats) return;
    setSaving(true);
    try {
      await fetch('/api/admin/outreach/execution', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stats),
      });
    } catch (err) {
      console.error('Failed to update stats', err);
    } finally {
      setSaving(false);
    }
  };

  const schedule = [
    { time: '09:00 – 10:30', label: 'Outreach (calls + DMs)', icon: <Phone className="w-4 h-4" /> },
    { time: '10:30 – 11:00', label: 'Follow-ups', icon: <Clock className="w-4 h-4" /> },
    { time: '11:00 – 13:00', label: 'Demo calls', icon: <Calendar className="w-4 h-4" /> },
    { time: '14:00 – 15:00', label: 'Product improvement', icon: <Zap className="w-4 h-4" /> },
    { time: '15:00 – 16:00', label: 'More outreach / Loom', icon: <Video className="w-4 h-4" /> },
  ];

  if (loading || !stats) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#D4AF37]"></div>
    </div>
  );

  const completedTasks = tasks.filter(t => t.completed).length;
  const taskProgress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tight">Daily <span className="text-[#D4AF37]">Execution</span> Engine</h1>
            <p className="text-gray-400">Discipline quotidienne pour l'acquisition de courtiers.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Aujourd'hui</p>
              <p className="text-sm font-bold">{new Date().toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            </div>
            <Button 
              onClick={updateStats} 
              disabled={saving}
              className="bg-[#D4AF37] hover:bg-[#B8962E] text-black font-bold h-11 px-6 rounded-xl shadow-lg shadow-[#D4AF37]/10"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Enregistrement...' : 'Sauvegarder Progrès'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Schedule & Tasks */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Today's Plan (Hour by Hour) */}
            <Card className="p-8 bg-black/40 border-white/5 backdrop-blur-xl">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" />
                Structure de la Journée
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {schedule.map((item, idx) => (
                  <div key={idx} className="relative group">
                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3 group-hover:border-[#D4AF37]/30 transition h-full">
                      <div className="text-[10px] font-black text-[#D4AF37]">{item.time}</div>
                      <p className="text-xs font-bold leading-relaxed">{item.label}</p>
                      <div className="text-gray-600 group-hover:text-[#D4AF37] transition">{item.icon}</div>
                    </div>
                    {idx < schedule.length - 1 && (
                      <div className="hidden md:block absolute top-1/2 -right-2 -translate-y-1/2 z-10">
                        <ChevronRight className="w-4 h-4 text-gray-700" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Daily Tasks */}
            <Card className="p-8 bg-black/40 border-white/5 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <ListTodo className="w-5 h-5 text-green-400" />
                  Objectifs Prioritaires
                </h2>
                <span className="text-sm font-black text-[#D4AF37]">{taskProgress}%</span>
              </div>
              
              <div className="space-y-2 mb-8">
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 transition-all duration-700"
                    style={{ width: `${taskProgress}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tasks.map((task) => (
                  <div 
                    key={task.id} 
                    onClick={() => toggleTask(task.id, !task.completed)}
                    className={cn(
                      "p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between",
                      task.completed 
                        ? "bg-green-500/10 border-green-500/30 text-green-400" 
                        : "bg-white/5 border-white/10 hover:border-[#D4AF37]/40"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center border",
                        task.completed ? "bg-green-500 border-green-500 text-black" : "border-gray-600"
                      )}>
                        {task.completed && <CheckCircle2 className="w-3 h-3" />}
                      </div>
                      <span className="text-sm font-bold">{task.label}</span>
                    </div>
                    <Badge variant="outline" className={cn(
                      "text-[10px] uppercase font-black px-2 py-0.5",
                      task.completed ? "border-green-500 text-green-500" : "border-white/10 text-gray-500"
                    )}>
                      {task.completed ? 'Terminé' : `Quota: ${task.quota}`}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>

            {/* Quota Tracking Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Appels', value: stats.callsMade, key: 'callsMade', icon: <Phone className="w-4 h-4" /> },
                { label: 'DMs Envoyés', value: stats.dmsSent, key: 'dmsSent', icon: <MessageSquare className="w-4 h-4" /> },
                { label: 'Démos Bookées', value: stats.demosBooked, key: 'demosBooked', icon: <Calendar className="w-4 h-4" /> },
                { label: 'Looms Envoyés', value: stats.loomsSent, key: 'loomsSent', icon: <Video className="w-4 h-4" /> },
              ].map((q) => (
                <Card key={q.key} className="p-6 bg-black/40 border-white/5 flex flex-col items-center justify-center gap-3 text-center group hover:border-[#D4AF37]/30 transition">
                  <div className="text-gray-500 group-hover:text-[#D4AF37] transition">{q.icon}</div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{q.label}</p>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setStats({...stats, [q.key]: Math.max(0, stats[q.key as keyof Stats] as number - 1)})} className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5">-</button>
                    <span className="text-2xl font-black">{stats[q.key as keyof Stats] as number}</span>
                    <button onClick={() => setStats({...stats, [q.key]: (stats[q.key as keyof Stats] as number + 1)})} className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5">+</button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Right Column: Performance & Notes */}
          <div className="lg:col-span-4 space-y-8">
            {/* Performance Panel */}
            <Card className="p-8 bg-gradient-to-br from-[#D4AF37]/20 to-black border-[#D4AF37]/30">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#D4AF37]" />
                Performance
              </h2>
              <div className="space-y-6">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">Taux de Conv. Jour</p>
                    <h3 className="text-4xl font-black mt-1">
                      {stats.callsMade > 0 ? Math.round((stats.demosBooked / stats.callsMade) * 100) : 0}%
                    </h3>
                  </div>
                  <Badge className="bg-[#D4AF37] text-black font-black">+12% vs hier</Badge>
                </div>
                
                <div className="space-y-4 pt-4 border-t border-[#D4AF37]/20">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Démos effectuées</span>
                    <span className="font-bold">{stats.demosDone}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Conversions payantes</span>
                    <span className="font-bold text-green-400">{stats.conversions}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Notes Section */}
            <Card className="p-8 bg-black/40 border-white/5 backdrop-blur-xl h-full">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Save className="w-5 h-5 text-gray-400" />
                Journal de Bord
              </h2>
              <textarea 
                value={stats.notes || ''}
                onChange={(e) => setStats({...stats, notes: e.target.value})}
                className="w-full h-64 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:ring-1 focus:ring-[#D4AF37] outline-none leading-relaxed"
                placeholder="Notes sur les objections, ce qui a marché, idées d'amélioration..."
              />
              <p className="text-[10px] text-gray-500 mt-4 uppercase tracking-widest italic text-center">
                Les notes sont sauvegardées quotidiennement.
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
