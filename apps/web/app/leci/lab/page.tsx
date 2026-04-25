"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Bot, 
  User, 
  Send, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  MessageSquare,
  ShieldAlert,
  Play,
  RefreshCw,
  Search,
  Scale,
  Brain,
  Zap,
  ChevronRight,
  TrendingUp,
  Target,
  Gauge,
  History,
  Info
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { ProgressBar } from "../../../components/ui/ProgressBar";
import { KNOWLEDGE_PACK } from "../../../../../modules/leci/knowledgePack";
import { validateLeciResponse, ValidationResult } from "../../../../../modules/leci/responseValidator";
import { SCENARIOS, getNextUserMessage, ScenarioType, SimulationMessage, getRandomPressure } from "../../../../../modules/leci/simulationEngine";

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

interface Message {
  role: "user" | "leci";
  content: string;
  validation?: ValidationResult;
}

export default function LeciLab() {
  const [activeScenario, setActiveScenario] = useState<ScenarioType | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [replayMode, setReplayMode] = useState(false);
  const [pressureActive, setPressureActive] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const startSimulation = (type: ScenarioType) => {
    setActiveScenario(type);
    setMessages([]);
    setCurrentStep(0);
    setShowSummary(false);
    setReplayMode(false);
    
    const firstMsg = getNextUserMessage(type, 0);
    if (firstMsg) {
      setMessages([{ role: "user", content: firstMsg.content }]);
      handleLeciResponse(firstMsg.content);
      setCurrentStep(1);
    }
  };

  const handleLeciResponse = (userContent: string) => {
    setIsTyping(true);
    setTimeout(() => {
      // Logic to find best answer from knowledge pack
      const entry = KNOWLEDGE_PACK.find(e => 
        userContent.toLowerCase().includes(e.question.toLowerCase().split('?')[0].trim()) ||
        e.question.toLowerCase().includes(userContent.toLowerCase().split('?')[0].trim())
      );

      let response = entry 
        ? entry.answerFr 
        : "Je peux vous aider à analyser la structure et la clarté de cette demande, mais pour une validation finale ou légale, il est impératif de consulter un professionnel autorisé.";

      const validation = validateLeciResponse(response, userContent);
      setMessages(prev => [...prev, { role: "leci", content: response, validation }]);
      setIsTyping(false);

      // Trigger next user message or summary
      setTimeout(() => {
        if (activeScenario) {
          const nextMsg = getNextUserMessage(activeScenario, currentStep);
          if (nextMsg) {
            setMessages(prev => [...prev, { role: "user", content: nextMsg.content }]);
            setCurrentStep(prev => prev + 1);
            handleLeciResponse(nextMsg.content);
          } else {
            setShowSummary(true);
          }
        }
      }, 2500);
    }, 1500);
  };

  const triggerPressure = () => {
    setPressureActive(true);
    const pressure = getRandomPressure();
    setMessages(prev => [...prev, { role: "user", content: pressure }]);
    handleLeciResponse(pressure);
    setTimeout(() => setPressureActive(false), 2000);
  };

  const averageScores = () => {
    const leciMsgs = messages.filter(m => m.role === "leci" && m.validation);
    if (leciMsgs.length === 0) return { clarity: 0, safety: 0, usefulness: 0 };
    
    const sum = leciMsgs.reduce((acc, m) => ({
      clarity: acc.clarity + (m.validation?.scores.clarity || 0),
      safety: acc.safety + (m.validation?.scores.safety || 0),
      usefulness: acc.usefulness + (m.validation?.scores.usefulness || 0)
    }), { clarity: 0, safety: 0, usefulness: 0 });

    return {
      clarity: (sum.clarity / leciMsgs.length) * 10,
      safety: (sum.safety / leciMsgs.length) * 10,
      usefulness: (sum.usefulness / leciMsgs.length) * 10
    };
  };

  const scores = averageScores();
  const overallPerformance = (scores.clarity + scores.safety + scores.usefulness) / 3;

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 font-sans selection:bg-[#D4AF37]/30">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
               <Badge variant="gold" className="text-[10px] uppercase tracking-[0.2em] px-3 py-1 bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20">Advanced R&D</Badge>
               <div className="w-1 h-1 rounded-full bg-white/20" />
               <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Lab v2.4</span>
            </div>
            <h1 className="text-5xl font-black tracking-tighter leading-none">
              LECI <span className="text-[#D4AF37] italic">Full Simulation Lab</span>
            </h1>
            <p className="text-gray-400 max-w-2xl text-lg font-medium leading-relaxed">
              Stress-testez l'IA sur des scénarios complexes : courtiers agressifs, acheteurs émotionnels et investisseurs analytiques.
            </p>
          </div>
          <div className="flex gap-3">
             <Button variant="outline" className="h-12 px-6 border-white/10 hover:bg-white/5 font-black text-xs tracking-widest" onClick={() => window.location.reload()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                RESET LAB
             </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column: Selector & Stats */}
          <div className="lg:col-span-3 space-y-8">
             <section className="space-y-4">
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                   <Target className="w-3 h-3" />
                   Scénarios d'entraînement
                </h3>
                <div className="grid grid-cols-1 gap-3">
                   {Object.keys(SCENARIOS).map((key) => (
                     <button
                       key={key}
                       onClick={() => startSimulation(key as ScenarioType)}
                       disabled={isTyping}
                       className={cn(
                         "w-full text-left p-5 rounded-3xl transition-all duration-500 border relative overflow-hidden group",
                         activeScenario === key 
                           ? "bg-[#D4AF37]/10 border-[#D4AF37]/40 text-white shadow-[0_0_30px_rgba(212,175,55,0.1)]" 
                           : "bg-white/5 border-white/5 text-gray-500 hover:border-white/10 hover:text-gray-300 hover:bg-white/[0.07]"
                       )}
                     >
                        <div className="relative z-10">
                           <p className="font-black text-xs uppercase tracking-tight mb-1 capitalize">{key.replace('_', ' ')}</p>
                           <p className="text-[10px] text-gray-600 font-medium group-hover:text-gray-400 transition-colors">Test de pression et conformité</p>
                        </div>
                        {activeScenario === key && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2">
                             <Zap className="w-4 h-4 text-[#D4AF37] animate-pulse" />
                          </div>
                        )}
                     </button>
                   ))}
                </div>
             </section>

             {messages.length > 0 && (
               <section className="space-y-6 animate-in fade-in slide-in-from-left duration-700">
                  <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] flex items-center gap-2">
                     <Gauge className="w-3 h-3" />
                     Performance Lab
                  </h3>
                  <div className="space-y-6 p-6 bg-white/5 border border-white/5 rounded-[2rem]">
                     <div className="space-y-4">
                        <ProgressBar label="Clarity" value={scores.clarity} max={100} accent="gold" />
                        <ProgressBar label="Safety" value={scores.safety} max={100} accent="#ef4444" />
                        <ProgressBar label="Usefulness" value={scores.usefulness} max={100} accent="#3b82f6" />
                     </div>
                     <div className="pt-6 border-t border-white/5 flex flex-col items-center">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Overall Lab Score</p>
                        <p className="text-4xl font-black text-white">{Math.round(overallPerformance)}%</p>
                     </div>
                  </div>
               </section>
             )}
          </div>

          {/* Middle Column: Chat Simulation */}
          <div className="lg:col-span-5 flex flex-col h-[750px] bg-zinc-900/50 border border-white/5 rounded-[3rem] overflow-hidden backdrop-blur-3xl shadow-2xl relative">
             <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-md sticky top-0 z-20">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-[#D4AF37]/10 rounded-2xl flex items-center justify-center border border-[#D4AF37]/20">
                      <Brain className="w-6 h-6 text-[#D4AF37]" />
                   </div>
                   <div className="flex flex-col">
                      <span className="font-black text-xs uppercase tracking-widest text-white">LECI Simulation</span>
                      <span className="text-[9px] text-green-500 font-bold uppercase tracking-widest animate-pulse flex items-center gap-1">
                         <div className="w-1 h-1 rounded-full bg-green-500" />
                         Engine Active
                      </span>
                   </div>
                </div>
                <div className="flex gap-2">
                   <Button variant="ghost" size="sm" onClick={triggerPressure} disabled={!activeScenario || isTyping} className="h-8 rounded-lg text-red-400 hover:bg-red-500/10 text-[9px] font-black tracking-widest">
                      FORCE PRESSURE
                   </Button>
                </div>
             </div>

             <div className="flex-1 overflow-y-auto p-8 space-y-10 scroll-smooth" ref={scrollRef}>
                {messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                     <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center animate-bounce">
                        <Play className="w-8 h-8 text-gray-600 ml-1" />
                     </div>
                     <div className="space-y-2">
                        <p className="text-xl font-bold text-gray-500">Prêt pour le test ?</p>
                        <p className="text-sm text-gray-600 max-w-xs mx-auto">Choisissez un profil à gauche pour lancer la simulation IA contre IA.</p>
                     </div>
                  </div>
                )}
                {messages.map((m, i) => (
                  <div key={i} className={cn(
                    "flex flex-col space-y-2 animate-in slide-in-from-bottom duration-500",
                    m.role === "user" ? "items-end" : "items-start"
                  )}>
                     <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">
                           {m.role === "user" ? "Simulation User" : "LECI Response"}
                        </span>
                     </div>
                     <div className={cn(
                       "p-6 text-sm leading-relaxed max-w-[90%] font-medium",
                       m.role === "user" 
                        ? "bg-zinc-800 text-white rounded-3xl rounded-tr-none border border-white/5" 
                        : "bg-[#D4AF37]/5 text-[#D4AF37] rounded-3xl rounded-tl-none border border-[#D4AF37]/20"
                     )}>
                        {m.content}
                     </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex items-center gap-3 text-gray-500 text-[10px] font-bold uppercase tracking-widest animate-pulse ml-2">
                     <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-gray-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-1.5 h-1.5 bg-gray-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-1.5 h-1.5 bg-gray-600 rounded-full animate-bounce" />
                     </div>
                     LECI Engine analyzing...
                  </div>
                )}
             </div>
          </div>

          {/* Right Column: Dynamic Feedback */}
          <div className="lg:col-span-4 space-y-8 h-full flex flex-col">
             <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] ml-2">Real-time Analysis</h3>
             
             {showSummary ? (
               <Card className="p-8 bg-black/60 border-[#D4AF37]/30 border-2 rounded-[2.5rem] shadow-[0_0_50px_rgba(212,175,55,0.1)] animate-in zoom-in duration-500 flex flex-col gap-8 h-full">
                  <div className="text-center space-y-2">
                     <Badge variant="gold" className="text-[10px] mb-4">Simulation Complete</Badge>
                     <h2 className="text-3xl font-black">Session Report</h2>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-5 bg-white/5 rounded-3xl border border-white/5 text-center space-y-1">
                        <p className="text-[10px] font-black text-gray-500 uppercase">Clarity</p>
                        <p className="text-2xl font-black">{Math.round(scores.clarity)}%</p>
                     </div>
                     <div className="p-5 bg-white/5 rounded-3xl border border-white/5 text-center space-y-1">
                        <p className="text-[10px] font-black text-gray-500 uppercase">Safety</p>
                        <p className="text-2xl font-black text-red-500">{Math.round(scores.safety)}%</p>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Risk Assessment</h4>
                     <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-3xl">
                        <p className="text-xs text-red-200 font-bold leading-relaxed">
                           LECI a maintenu un haut niveau de sécurité, mais pourrait être plus proactif dans l'escalade des questions sur la "légalité" pure.
                        </p>
                     </div>
                  </div>

                  <div className="mt-auto space-y-3">
                     <Button variant="goldPrimary" className="w-full h-14 rounded-2xl font-black text-sm" onClick={() => window.location.reload()}>
                        START NEW LAB
                     </Button>
                  </div>
               </Card>
             ) : messages.length > 0 && messages[messages.length - 1].role === "leci" ? (
               <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500">
                  <Card className={cn(
                    "p-8 rounded-[2.5rem] border-2 shadow-2xl transition-all duration-500",
                    messages[messages.length - 1].validation?.status === "SAFE" ? "bg-green-500/5 border-green-500/20" : 
                    messages[messages.length - 1].validation?.status === "IMPROVE" ? "bg-yellow-500/5 border-yellow-500/20" : 
                    "bg-red-500/5 border-red-500/40"
                  )}>
                     <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                           {messages[messages.length - 1].validation?.status === "SAFE" ? <CheckCircle2 className="w-6 h-6 text-green-500" /> : 
                            messages[messages.length - 1].validation?.status === "IMPROVE" ? <AlertTriangle className="w-6 h-6 text-yellow-500" /> : 
                            <ShieldAlert className="w-6 h-6 text-red-500" />}
                           <span className={cn(
                             "font-black tracking-tighter text-2xl uppercase",
                             messages[messages.length - 1].validation?.status === "SAFE" ? "text-green-500" : 
                             messages[messages.length - 1].validation?.status === "IMPROVE" ? "text-yellow-500" : 
                             "text-red-500"
                           )}>{messages[messages.length - 1].validation?.status}</span>
                        </div>
                     </div>
                     
                     <div className="space-y-6">
                        <div className="space-y-2">
                           <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Feedback Analyst</h4>
                           <p className="text-sm text-gray-200 font-medium italic leading-relaxed">
                              "{messages[messages.length - 1].validation?.feedback}"
                           </p>
                        </div>

                        <div className="space-y-3 pt-6 border-t border-white/5">
                           <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Safety Checks</h4>
                           <div className="grid grid-cols-1 gap-2">
                              {Object.entries(messages[messages.length - 1].validation?.checks || {}).map(([key, value]) => (
                                <div key={key} className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5">
                                   <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                   {value ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <XCircle className="w-3 h-3 text-red-500" />}
                                </div>
                              ))}
                           </div>
                        </div>

                        {messages[messages.length - 1].validation?.betterAnswerSuggestion && (
                          <div className="p-5 bg-blue-500/5 border border-blue-500/20 rounded-2xl space-y-2">
                             <div className="flex items-center gap-2 text-blue-400">
                                <Info className="w-3 h-3" />
                                <span className="text-[9px] font-black uppercase tracking-widest">Optimized Answer</span>
                             </div>
                             <p className="text-[10px] text-gray-300 italic leading-relaxed">
                                {messages[messages.length - 1].validation?.betterAnswerSuggestion}
                             </p>
                          </div>
                        )}
                     </div>
                  </Card>
               </div>
             ) : (
               <div className="h-full flex flex-col items-center justify-center p-12 bg-zinc-900/30 border border-dashed border-white/10 rounded-[2.5rem] opacity-30 text-center space-y-4">
                  <ShieldAlert className="w-12 h-12" />
                  <p className="text-sm font-medium">En attente de la prochaine réponse pour analyse...</p>
               </div>
             )}
          </div>

        </div>

      </div>
    </div>
  );
}
