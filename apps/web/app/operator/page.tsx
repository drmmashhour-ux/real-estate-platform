"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  Phone, 
  Play, 
  Target, 
  Shield, 
  CheckCircle2, 
  MessageSquare, 
  Clock, 
  Zap,
  ArrowRight,
  ChevronRight,
  BookOpen,
  Settings,
  HelpCircle,
  FileText
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { CallScriptPanel } from "../../components/outreach/CallScriptPanel";
import { LoomScript } from "../../components/outreach/LoomScript";
import { ClosingScript } from "../../components/outreach/ClosingScript";
import { cn } from "../../lib/utils";

export default function OperatorDashboard() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMode, setActiveSlot] = useState<"standard" | "demo" | "assist">("standard");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/execution/today");
      const data = await res.json();
      setLeads(data.leads.followUp.concat(data.leads.new));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const workflow = [
    { step: 1, label: "Contact broker", desc: "First call / intro" },
    { step: 2, label: "Book demo", desc: "Get them on Calendly" },
    { step: 3, label: "Send Loom", desc: "Personalized intro link" },
    { step: 4, label: "Run demo", desc: "10-min live session" },
    { step: 5, label: "Push for trial", desc: "Test on a real case" },
    { step: 6, label: "Help first draft", desc: "Step-by-step guidance" },
    { step: 7, label: "Convert to paid", desc: "Close for usage billing" },
  ];

  const rules = [
    "Keep calls under 1 minute",
    "Book demo fast (don't over-explain)",
    "Always push to real deal use",
    "Don't talk tech, talk peace of mind"
  ];

  if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Operator <span className="text-[#D4AF37]">Command Center</span></h1>
            <p className="text-gray-400 font-medium">Suivez le guide. Transformez chaque prospect en courtier actif.</p>
          </div>
          <div className="flex gap-2">
             <Button 
               variant={activeMode === "standard" ? "primary" : "ghost"}
               onClick={() => setActiveSlot("standard")}
               className={cn("text-xs font-bold px-6", activeMode === "standard" && "bg-[#D4AF37] text-black")}
             >Standard</Button>
             <Button 
               variant={activeMode === "demo" ? "primary" : "ghost"}
               onClick={() => setActiveSlot("demo")}
               className={cn("text-xs font-bold px-6", activeMode === "demo" && "bg-purple-600 text-white")}
             >Mode Démo</Button>
             <Button 
               variant={activeMode === "assist" ? "primary" : "ghost"}
               onClick={() => setActiveSlot("assist")}
               className={cn("text-xs font-bold px-6", activeMode === "assist" && "bg-blue-600 text-white")}
             >Mode Assist</Button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" className="text-xs font-bold text-gray-400" onClick={() => window.location.href = '/admin/outreach'}>CRM</Button>
          <Button variant="ghost" className="text-xs font-bold text-gray-400" onClick={() => window.location.href = '/admin/execution'}>Execution</Button>
          <Button variant="ghost" className="text-xs font-bold text-gray-400" onClick={() => window.location.href = '/admin/closing'}>Closing</Button>
          <Button variant="ghost" className="text-xs font-bold text-gray-400" onClick={() => window.location.href = '/admin/bookings'}>Démos</Button>
          <Button variant="ghost" className="text-xs font-bold text-purple-400 bg-purple-400/10" onClick={() => window.location.href = '/operator'}>Operator Hub</Button>
        </div>

        {/* Quick Progress Tracking */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           {[
             { label: "Calls Made", value: 12, icon: <Phone className="w-4 h-4" /> },
             { label: "Demos Booked", value: 3, icon: <Calendar className="w-4 h-4" /> },
             { label: "Demos Done", value: 1, icon: <Play className="w-4 h-4" /> },
             { label: "Activated", value: 0, icon: <Zap className="w-4 h-4 text-[#D4AF37]" /> },
           ].map((s, i) => (
             <Card key={i} className="bg-black/40 border-white/5 p-4 text-center">
                <div className="flex justify-center mb-1 text-gray-500">{s.icon}</div>
                <p className="text-[10px] text-gray-500 uppercase font-black">{s.label}</p>
                <h4 className="text-xl font-black mt-1">{s.value}</h4>
             </Card>
           ))}
        </div>

        {activeMode === "standard" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Workflow Column */}
            <div className="space-y-6">
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <Target className="w-4 h-4 text-[#D4AF37]" />
                Workflow Pas-à-Pas
              </h3>
              <div className="space-y-2">
                {workflow.map((w) => (
                  <div key={w.step} className="p-4 bg-black/40 border border-white/5 rounded-2xl flex items-center gap-4 hover:border-[#D4AF37]/30 transition group">
                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black group-hover:bg-[#D4AF37] group-hover:text-black transition">
                      {w.step}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{w.label}</p>
                      <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">{w.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Card className="bg-gradient-to-br from-red-500/10 to-black border border-red-500/20 p-6 rounded-[32px]">
                 <h4 className="text-xs font-black text-red-400 uppercase tracking-widest mb-4">Règles d'Or</h4>
                 <ul className="space-y-3">
                   {rules.map((r, i) => (
                     <li key={i} className="flex items-start gap-3 text-xs text-gray-300 italic">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5" />
                        {r}
                     </li>
                   ))}
                 </ul>
              </Card>
            </div>

            {/* Script Column */}
            <div className="lg:col-span-2 space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-6">
                    <PitchPanel />
                    <CallScriptPanel />
                    <ClosingScript />
                 </div>
                 <div className="space-y-6">
                    <LoomScript />
                    <Card className="bg-black/60 border-white/5 p-6">
                       <h3 className="text-sm font-bold text-[#D4AF37] mb-4 uppercase tracking-widest">Share Demo</h3>
                       <p className="text-xs text-gray-400 mb-4 italic">Copiez et envoyez le lien personnalisé au prospect après l'appel.</p>
                       <div className="flex gap-2">
                         <Input value="/demo/broker?ref=YOUR_ID" readOnly className="h-10 text-xs bg-white/5 border-white/10" />
                         <Button size="sm" className="bg-[#D4AF37] text-black font-black px-4">Copy</Button>
                       </div>
                    </Card>

                    {/* Active Leads Mini Panel */}
                    <Card className="bg-black/40 border-white/5 p-6">
                       <h3 className="text-sm font-bold text-blue-400 mb-4 uppercase tracking-widest flex items-center gap-2">
                         <Users className="w-4 h-4" />
                         Next to Call
                       </h3>
                       <div className="space-y-3">
                         {leads.slice(0, 3).map(l => (
                           <div key={l.id} className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between group">
                              <div>
                                <p className="text-sm font-bold">{l.name}</p>
                                <p className="text-[10px] text-gray-500">{l.city}</p>
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="text-blue-400 opacity-0 group-hover:opacity-100 transition" 
                                  onClick={() => {
                                    const link = `${window.location.origin}/demo/broker?ref=${l.id}`;
                                    navigator.clipboard.writeText(link);
                                    alert('Lien démo copié !');
                                  }}
                                >Share</Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="text-[#D4AF37] opacity-0 group-hover:opacity-100 transition" 
                                  onClick={() => window.location.href = '/admin/outreach'}
                                >Call</Button>
                              </div>
                           </div>
                         ))}
                       </div>
                    </Card>
                 </div>
               </div>
            </div>
          </div>
        )}

        {activeMode === "demo" && (
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 py-8">
             <Card className="p-8 bg-black/40 border-purple-500/30 backdrop-blur-xl space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-purple-400" />
                  </div>
                  <h2 className="text-xl font-black">Demo Flow</h2>
                </div>
                <div className="space-y-4">
                   {[
                     "1. Welcome & Screen check",
                     "2. Ask: 'How many drafts per week?'",
                     "3. Show Listing → Offer button",
                     "4. Show Guided Form (Speed)",
                     "5. Show Risks / AI Analysis (Safety)",
                     "6. Show Compliance Score",
                     "7. Finalize & PDF",
                     "8. Ask: 'Can this save you time?'",
                     "9. Close for Trial Deal"
                   ].map((f, i) => (
                     <div key={i} className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-xl">
                        <span className="text-xs font-black text-purple-400">Step {i+1}</span>
                        <span className="text-sm font-bold">{f}</span>
                     </div>
                   ))}
                </div>
             </Card>

             <div className="space-y-8">
                <Card className="p-8 bg-[#D4AF37]/5 border-[#D4AF37]/20 space-y-4">
                   <h3 className="text-sm font-black text-[#D4AF37] uppercase tracking-widest">Talking Points</h3>
                   <ul className="space-y-4">
                     <li className="text-sm text-gray-300 leading-relaxed italic">"On n'est pas un remplacement, on est une couche de sécurité supplémentaire."</li>
                     <li className="text-sm text-gray-300 leading-relaxed italic">"Réduisez vos risques de litiges grâce à l'IA qui détecte les ambiguïtés."</li>
                     <li className="text-sm text-gray-300 leading-relaxed italic">"Gagnez 30 minutes par dossier dès aujourd'hui."</li>
                   </ul>
                </Card>

                <div className="p-8 bg-zinc-900 border border-white/10 rounded-[32px] text-center space-y-6">
                   <h3 className="text-xl font-bold">Prêt à fermer ?</h3>
                   <p className="text-sm text-gray-400 italic">"On teste sur un de vos dossiers réels cette semaine ? Je vous accompagne pas-à-pas."</p>
                   <Button className="w-full bg-[#D4AF37] text-black font-black h-12 rounded-xl" onClick={() => setActiveSlot("assist")}>
                     Start Assist Mode
                   </Button>
                </div>
             </div>
          </div>
        )}

        {activeMode === "assist" && (
          <div className="max-w-3xl mx-auto space-y-8 py-8">
             <div className="text-center space-y-4">
                <Badge className="bg-blue-600 text-white font-black text-[10px] px-4 py-1">FIRST DEAL ASSIST</Badge>
                <h2 className="text-3xl font-black">Guidez le courtier pas-à-pas</h2>
             </div>

             <div className="grid grid-cols-1 gap-4">
                {[
                  { step: "A", title: "Create Draft", desc: "Allez sur /drafts/turbo et choisissez PTP.", link: "/drafts/turbo" },
                  { step: "B", title: "Let them type", desc: "Regardez-les remplir les champs. Intervenez seulement si bloqué." },
                  { step: "C", title: "Trigger AI", desc: "Cliquez sur 'AI Review' et lisez les résultats ensemble." },
                  { step: "D", title: "Fix Clauses", desc: "Ajustez les clauses basées sur les suggestions de l'IA." },
                  { step: "E", title: "Finalize", desc: "Allez jusqu'au bout, générez le document." },
                  { step: "F", title: "The Handover", desc: "Dites: 'C'est prêt. Vous voulez faire le prochain seul ?'" }
                ].map((s, i) => (
                  <div key={i} className="p-6 bg-black/40 border border-blue-500/20 rounded-3xl flex items-center justify-between group hover:border-blue-500/40 transition">
                    <div className="flex items-center gap-6">
                       <div className="w-12 h-12 bg-blue-600/20 border border-blue-500/30 rounded-2xl flex items-center justify-center font-black text-blue-400">
                         {s.step}
                       </div>
                       <div>
                         <h4 className="font-bold text-lg">{s.title}</h4>
                         <p className="text-sm text-gray-500 italic">{s.desc}</p>
                       </div>
                    </div>
                    {s.link && (
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-500 font-bold px-4" onClick={() => window.open(s.link, '_blank')}>Ouvrir</Button>
                    )}
                  </div>
                ))}
             </div>

             <div className="pt-8 border-t border-white/5 text-center">
                <Button className="bg-[#D4AF37] text-black font-black h-14 px-12 rounded-2xl shadow-xl shadow-[#D4AF37]/10" onClick={() => window.location.href = '/admin/outreach'}>
                  Marquer comme ACTIVÉ
                  <CheckCircle2 className="w-5 h-5 ml-2" />
                </Button>
             </div>
          </div>
        )}

      </div>
    </div>
  );
}
