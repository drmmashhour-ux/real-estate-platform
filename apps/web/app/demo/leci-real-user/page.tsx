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
  Target,
  Gauge,
  History,
  Info,
  CreditCard,
  PenTool,
  Lock,
  FileText,
  MousePointer2,
  TrendingUp,
  Layout,
  ArrowRight
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { ProgressBar } from "../../../components/ui/ProgressBar";
import { REAL_USER_SCENARIO, RealUserStep, RealUserStepId } from "../../../../modules/leci/realUserScenario";

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

export default function LeciRealUserSimulation() {
  const [activeStepId, setActiveStepId] = useState<RealUserStepId>("STEP1_LISTING");
  const [messages, setMessages] = useState<{ role: "user" | "leci", content: string }[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showFinalScreen, setShowFinalScreen] = useState(false);
  const [systemLogs, setSystemLogs] = useState<{ timestamp: string, action: string, type: "INFO" | "CRITICAL" | "SUCCESS" }[]>([]);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const logScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (logScrollRef.current) {
      logScrollRef.current.scrollTop = logScrollRef.current.scrollHeight;
    }
  }, [systemLogs]);

  const currentStep = REAL_USER_SCENARIO[activeStepId];

  const handleNext = () => {
    const timestamp = new Date().toLocaleTimeString();
    
    // Add user action to chat if applicable
    if (activeStepId !== "STEP1_LISTING") {
      setMessages(prev => [...prev, { role: "user", content: currentStep.userAction }]);
    }

    // Add system log
    setSystemLogs(prev => [...prev, { 
      timestamp, 
      action: currentStep.systemUpdate, 
      type: currentStep.id === "STEP5_WARRANTY_EXCLUSION" || currentStep.id === "STEP8_EARLY_SIGNATURE" ? "CRITICAL" : 
            currentStep.id === "STEP11_SIGNATURE_GATE" || currentStep.id === "STEP12_FINAL_SUCCESS" ? "SUCCESS" : "INFO"
    }]);

    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { role: "leci", content: currentStep.leciResponse }]);
      setIsTyping(false);

      if (currentStep.nextStep) {
        setActiveStepId(currentStep.nextStep);
      } else {
        setShowFinalScreen(true);
      }
    }, 1200);
  };

  const reset = () => {
    setActiveStepId("STEP1_LISTING");
    setMessages([]);
    setSystemLogs([]);
    setShowFinalScreen(false);
    setIsTyping(false);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 font-sans selection:bg-[#D4AF37]/30">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
               <Badge variant="gold" className="text-[10px] uppercase tracking-[0.2em] px-3 py-1 bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20 font-black">USER EXPERIENCE TEST</Badge>
               <div className="w-1 h-1 rounded-full bg-white/20" />
               <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Real User + LECI Sync</span>
            </div>
            <h1 className="text-5xl font-black tracking-tighter leading-none">
              LECI <span className="text-[#D4AF37] italic">Real-User Simulation</span>
            </h1>
            <p className="text-gray-400 max-w-2xl text-lg font-medium leading-relaxed">
              Démonstration d'un acheteur non représenté naviguant LECIPM avec l'assistance critique de LECI.
            </p>
          </div>
          <Button variant="outline" className="h-12 border-white/10 font-bold text-xs tracking-widest uppercase hover:bg-white/5 px-6" onClick={reset}>
             <RefreshCw className="w-4 h-4 mr-2" />
             REINITIALISER
          </Button>
        </div>

        {!showFinalScreen ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* Left: Chat Panel */}
            <div className="lg:col-span-4 flex flex-col h-[700px] bg-zinc-900/40 border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl relative">
               <div className="p-6 border-b border-white/5 bg-black/40 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-[#D4AF37]/10 rounded-2xl flex items-center justify-center border border-[#D4AF37]/20">
                        <Bot className="w-6 h-6 text-[#D4AF37]" />
                     </div>
                     <span className="font-black text-xs uppercase tracking-widest">LECI Assistant</span>
                  </div>
                  <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-[8px] animate-pulse">ACTIVE</Badge>
               </div>

               <div className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth" ref={scrollRef}>
                  {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-30">
                       <MessageSquare className="w-12 h-12" />
                       <p className="text-sm font-medium">Lancez la simulation pour voir LECI en action.</p>
                       <Button onClick={handleNext} className="bg-[#D4AF37] text-black font-black px-8">START DEMO</Button>
                    </div>
                  )}
                  {messages.map((m, i) => (
                    <div key={i} className={cn(
                      "flex flex-col gap-2 animate-in slide-in-from-bottom duration-500",
                      m.role === "user" ? "items-end" : "items-start"
                    )}>
                       <div className={cn(
                         "p-5 text-sm leading-relaxed rounded-3xl font-medium",
                         m.role === "user" 
                          ? "bg-white/5 text-gray-400 rounded-tr-none border border-white/10 italic" 
                          : "bg-[#D4AF37]/5 text-white rounded-tl-none border border-[#D4AF37]/20"
                       )}>
                          {m.content}
                       </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex items-center gap-2 text-[#D4AF37] text-[10px] font-bold uppercase tracking-widest animate-pulse">
                       <Bot className="w-3 h-3" />
                       LECI répond...
                    </div>
                  )}
               </div>
            </div>

            {/* Middle: System Actions & UI Previews */}
            <div className="lg:col-span-5 flex flex-col gap-8 h-[700px]">
               <Card className="flex-1 bg-zinc-900/60 border-white/5 rounded-[3rem] overflow-hidden relative shadow-2xl flex flex-col">
                  <CardHeader className="p-8 border-b border-white/5">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                              <Layout className="w-5 h-5 text-gray-400" />
                           </div>
                           <CardTitle className="text-xl font-black">{currentStep.title}</CardTitle>
                        </div>
                        <Badge variant="outline" className="border-white/10 text-gray-500 uppercase tracking-widest text-[8px]">Simulation Mode</Badge>
                     </div>
                  </CardHeader>
                  <CardContent className="p-10 flex-1 flex flex-col justify-between">
                     <div className="space-y-8">
                        <div className="space-y-4">
                           <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Action Utilisateur</h4>
                           <div className="p-6 bg-white/5 border border-white/5 rounded-2xl text-lg font-bold text-gray-300">
                              {currentStep.userAction}
                           </div>
                        </div>
                        <div className="space-y-4">
                           <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Update Système</h4>
                           <div className={cn(
                             "p-6 rounded-2xl text-sm font-black border flex items-center gap-4 transition-all duration-500",
                             currentStep.id === "STEP5_WARRANTY_EXCLUSION" || currentStep.id === "STEP8_EARLY_SIGNATURE" 
                              ? "bg-red-500/10 border-red-500/30 text-red-500" 
                              : "bg-blue-500/10 border-blue-500/30 text-blue-400"
                           )}>
                              {currentStep.id === "STEP5_WARRANTY_EXCLUSION" || currentStep.id === "STEP8_EARLY_SIGNATURE" ? <AlertTriangle className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                              {currentStep.systemUpdate}
                           </div>
                        </div>
                     </div>

                     <div className="pt-8 border-t border-white/5">
                        <Button 
                          onClick={handleNext} 
                          disabled={isTyping}
                          className="w-full h-16 bg-[#D4AF37] text-black font-black text-lg rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                           SUIVANT
                           <ArrowRight className="w-6 h-6 ml-3" />
                        </Button>
                     </div>
                  </CardContent>
               </Card>

               <div className="grid grid-cols-2 gap-6">
                  <div className="p-6 bg-black/40 border border-white/5 rounded-[2rem] space-y-4">
                     <div className="flex justify-between items-center text-[10px] font-black text-gray-500 uppercase tracking-widest">
                        <span>Compliance Score</span>
                        <span className="text-white">{currentStep.complianceScore}%</span>
                     </div>
                     <ProgressBar value={currentStep.complianceScore} accent={currentStep.complianceScore > 80 ? "#22c55e" : "#D4AF37"} />
                  </div>
                  <div className="p-6 bg-black/40 border border-white/5 rounded-[2rem] flex flex-col justify-center items-center gap-2">
                     <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Signature Gate</p>
                     <Badge className={cn(
                       "h-8 px-4 rounded-xl font-black text-xs",
                       currentStep.id === "STEP11_SIGNATURE_GATE" || currentStep.id === "STEP12_FINAL_SUCCESS" ? "bg-green-500/20 text-green-500 border border-green-500/30" : "bg-red-500/20 text-red-500 border border-red-500/30"
                     )}>
                        {currentStep.id === "STEP11_SIGNATURE_GATE" || currentStep.id === "STEP12_FINAL_SUCCESS" ? "UNLOCKED" : "LOCKED"}
                     </Badge>
                  </div>
               </div>
            </div>

            {/* Right: Audit Timeline & Logic */}
            <div className="lg:col-span-3 space-y-8 flex flex-col">
               <section className="flex-1 flex flex-col bg-black/40 border border-white/5 rounded-[3rem] overflow-hidden">
                  <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
                     <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Audit Timeline</h3>
                     <History className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="flex-1 p-6 overflow-y-auto space-y-4 font-mono text-[9px] scrollbar-hide" ref={logScrollRef}>
                     {systemLogs.length === 0 && <p className="text-gray-700 italic">En attente des actions système...</p>}
                     {systemLogs.map((log, i) => (
                       <div key={i} className={cn(
                         "p-3 rounded-xl border flex gap-3",
                         log.type === "CRITICAL" ? "bg-red-500/5 border-red-500/20 text-red-200" : 
                         log.type === "SUCCESS" ? "bg-green-500/5 border-green-500/20 text-green-200" : 
                         "bg-white/5 border-white/5 text-gray-500"
                       )}>
                          <span className="text-gray-700 font-bold">[{log.timestamp}]</span>
                          <span className="leading-tight">{log.action}</span>
                       </div>
                     ))}
                  </div>
               </section>

               <section className="p-8 bg-blue-500/5 border border-blue-500/20 rounded-[2.5rem] space-y-4">
                  <div className="flex items-center gap-2 text-blue-400">
                     <ShieldAlert className="w-4 h-4" />
                     <h4 className="text-[10px] font-black uppercase tracking-widest">Logic Analysis</h4>
                  </div>
                  <p className="text-[10px] text-gray-500 leading-relaxed italic">
                     "LECI détecte le statut non-représenté et l'exclusion de garantie comme des risques majeurs, bloquant la signature jusqu'à l'acknowledgment formel."
                  </p>
               </section>
            </div>

          </div>
        ) : (
          <div className="max-w-4xl mx-auto py-12 animate-in zoom-in duration-1000">
             <Card className="p-16 bg-zinc-900 border-[#D4AF37]/40 border-2 rounded-[5rem] text-center space-y-12 shadow-[0_0_100px_rgba(212,175,55,0.15)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full -mr-32 -mt-32 blur-[80px]" />
                <div className="w-32 h-32 bg-green-500/10 rounded-full flex items-center justify-center mx-auto border-2 border-green-500/20 shadow-[0_0_30px_rgba(34,197,94,0.1)]">
                   <CheckCircle2 className="w-16 h-16 text-green-500" />
                </div>
                <div className="space-y-6">
                   <h2 className="text-6xl font-black tracking-tighter leading-none">Draft Completed <span className="text-[#D4AF37] italic">Safely.</span></h2>
                   <p className="text-gray-400 text-xl font-medium max-w-xl mx-auto">La simulation a démontré avec succès la capacité de LECI à protéger un utilisateur non-représenté.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   <div className="p-10 bg-black/40 rounded-[2.5rem] border border-white/5 space-y-2 group hover:border-[#D4AF37]/30 transition-all">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Compliance</p>
                      <p className="text-5xl font-black text-green-500">100%</p>
                   </div>
                   <div className="p-10 bg-black/40 rounded-[2.5rem] border border-white/5 space-y-2 group hover:border-[#D4AF37]/30 transition-all">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Forensic Hash</p>
                      <p className="text-4xl font-black text-[#D4AF37]">SHA-256</p>
                   </div>
                   <div className="p-10 bg-black/40 rounded-[2.5rem] border border-white/5 space-y-2 group hover:border-[#D4AF37]/30 transition-all">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Audit Log</p>
                      <p className="text-4xl font-black text-blue-500 italic">SECURE</p>
                   </div>
                </div>

                <div className="pt-12 flex gap-6 max-w-lg mx-auto">
                   <Button variant="outline" className="flex-1 h-16 rounded-3xl font-black text-xs tracking-widest uppercase border-white/10 hover:bg-white/5" onClick={reset}>
                      RECOMMENCER
                   </Button>
                   <Button className="flex-1 h-16 bg-[#D4AF37] text-black rounded-3xl font-black text-xs tracking-widest uppercase" onClick={() => window.location.href = "/leci/lab"}>
                      VOIR LE LAB
                   </Button>
                </div>
             </Card>
          </div>
        )}

      </div>
    </div>
  );
}
