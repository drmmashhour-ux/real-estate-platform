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
import { STEP_DEFINITIONS, INITIAL_STATE, SimulationStep, FlowState } from "../../../../modules/leci/E2EFlowLogic";
import { validateLeciResponse } from "../../../../modules/leci/responseValidator";

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

export default function E2EUserLeciSimulation() {
  const [state, setState] = useState<FlowState>(INITIAL_STATE);
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeStepId, setActiveStepId] = useState<SimulationStep>("LISTING");
  const [showSummary, setShowSummary] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const logScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [state.leciMessages]);

  useEffect(() => {
    if (logScrollRef.current) {
      logScrollRef.current.scrollTop = logScrollRef.current.scrollHeight;
    }
  }, [state.systemLogs]);

  const nextStep = () => {
    const currentStepDef = STEP_DEFINITIONS[activeStepId];
    if (currentStepDef.nextStep) {
      const nextStepId = currentStepDef.nextStep;
      setActiveStepId(nextStepId);
      
      // Update state
      const timestamp = new Date().toLocaleTimeString();
      const nextStepDef = STEP_DEFINITIONS[nextStepId];

      setState(prev => {
        let newScore = prev.complianceScore;
        if (nextStepId === "COMPLIANCE_SCORE") newScore = 85;
        if (nextStepId === "SUCCESS") newScore = 98;

        const newLogs = [...prev.systemLogs, { 
          timestamp, 
          action: `Step Transition: ${nextStepDef.title}`, 
          type: "INFO" as const 
        }, {
          timestamp,
          action: nextStepDef.systemAction,
          type: nextStepId === "RISK_SITUATION" ? "CRITICAL" as const : "INFO" as const
        }];

        const newLeciMsgs = [...prev.leciMessages, {
          role: "leci" as const,
          content: nextStepDef.leciGuidance,
          status: validateLeciResponse(nextStepDef.leciGuidance, "").status
        }];

        return {
          ...prev,
          currentStep: nextStepId,
          complianceScore: newScore,
          systemLogs: newLogs,
          leciMessages: newLeciMsgs,
          paymentCompleted: nextStepId === "PAYMENT" || prev.paymentCompleted
        };
      });
    } else {
      setShowSummary(true);
    }
  };

  const startSimulation = () => {
    setIsSimulating(true);
    setShowSummary(false);
    setState({
      ...INITIAL_STATE,
      leciMessages: [{
        role: "leci",
        content: STEP_DEFINITIONS.LISTING.leciGuidance,
        status: "SAFE"
      }]
    });
    setActiveStepId("LISTING");
  };

  const reset = () => {
    setIsSimulating(false);
    setShowSummary(false);
    setState(INITIAL_STATE);
  };

  const getStepIcon = (stepId: SimulationStep) => {
    switch (stepId) {
      case "LISTING": return <Search className="w-4 h-4" />;
      case "DRAFTING": return <Layout className="w-4 h-4" />;
      case "RISK_SITUATION": return <AlertTriangle className="w-4 h-4" />;
      case "USER_QUESTION": return <MessageSquare className="w-4 h-4" />;
      case "AI_REVIEW": return <Brain className="w-4 h-4" />;
      case "COMPLIANCE_SCORE": return <TrendingUp className="w-4 h-4" />;
      case "PROTECTION_MODE": return <ShieldAlert className="w-4 h-4" />;
      case "PAYMENT": return <CreditCard className="w-4 h-4" />;
      case "SIGNATURE_GATE": return <Lock className="w-4 h-4" />;
      case "SUCCESS": return <CheckCircle2 className="w-4 h-4" />;
      case "AUDIT_TRAIL": return <History className="w-4 h-4" />;
      default: return <ChevronRight className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 font-sans selection:bg-[#D4AF37]/30">
      <div className="max-w-[1600px] mx-auto space-y-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
               <Badge variant="gold" className="text-[10px] uppercase tracking-[0.2em] px-3 py-1 bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20 font-black">E2E SIMULATION</Badge>
               <div className="w-1 h-1 rounded-full bg-white/20" />
               <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">User + LECI + Compliance</span>
            </div>
            <h1 className="text-6xl font-black tracking-tighter leading-none">
              LECIPM <span className="text-[#D4AF37] italic">Full Journey Lab</span>
            </h1>
            <p className="text-gray-400 max-w-3xl text-xl font-medium leading-relaxed">
              Vivez l'expérience complète : de la découverte d'une propriété à la signature légale, assisté en temps réel par LECI et surveillé par nos protocoles de sécurité.
            </p>
          </div>
          <div className="flex gap-4">
             {!isSimulating ? (
               <Button onClick={startSimulation} className="bg-[#D4AF37] text-black h-16 px-10 rounded-[1.5rem] font-black text-lg shadow-[0_0_30px_rgba(212,175,55,0.2)] hover:scale-105 transition-transform">
                  LANCER LA SIMULATION
                  <Play className="w-6 h-6 ml-3 fill-current" />
               </Button>
             ) : (
               <Button variant="outline" className="h-16 px-8 border-white/10 rounded-[1.5rem] font-black text-xs tracking-widest uppercase hover:bg-white/5" onClick={reset}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  REINITIALISER
               </Button>
             )}
          </div>
        </div>

        {isSimulating && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* Left: Progression & System Status */}
            <div className="lg:col-span-3 space-y-8 h-[800px] flex flex-col">
               <section className="space-y-6">
                  <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] flex items-center gap-2">
                     <Target className="w-3 h-3" />
                     Progression Étapes
                  </h3>
                  <div className="space-y-3">
                     {Object.values(STEP_DEFINITIONS).map((step) => {
                       const isPast = Object.keys(STEP_DEFINITIONS).indexOf(step.id) < Object.keys(STEP_DEFINITIONS).indexOf(activeStepId);
                       const isActive = activeStepId === step.id;
                       return (
                         <div 
                           key={step.id} 
                           className={cn(
                             "flex items-center gap-4 p-4 rounded-2xl border transition-all duration-500",
                             isActive ? "bg-[#D4AF37]/10 border-[#D4AF37]/40 text-white" : 
                             isPast ? "bg-white/5 border-white/10 text-gray-400" : "bg-transparent border-transparent text-gray-600"
                           )}
                         >
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border",
                              isActive ? "bg-[#D4AF37] border-white/20 text-black font-black" : 
                              isPast ? "bg-green-500/10 border-green-500/20 text-green-500" : "bg-white/5 border-white/5"
                            )}>
                               {isPast ? <CheckCircle2 className="w-4 h-4" /> : getStepIcon(step.id)}
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-tighter truncate">{step.title}</span>
                         </div>
                       );
                     })}
                  </div>
               </section>

               <section className="mt-auto space-y-6 p-8 bg-zinc-900/80 border border-white/5 rounded-[2.5rem]">
                  <div className="space-y-6">
                     <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Compliance Score</span>
                        <span className={cn(
                          "text-2xl font-black",
                          state.complianceScore > 80 ? "text-green-500" : 
                          state.complianceScore > 60 ? "text-yellow-500" : "text-red-500"
                        )}>{state.complianceScore}%</span>
                     </div>
                     <ProgressBar value={state.complianceScore} accent={state.complianceScore > 80 ? "#22c55e" : "#D4AF37"} />
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
                     <div className="text-center">
                        <p className="text-[9px] font-black text-gray-500 uppercase">Payment</p>
                        <Badge className={state.paymentCompleted ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}>
                           {state.paymentCompleted ? "PAID" : "PENDING"}
                        </Badge>
                     </div>
                     <div className="text-center">
                        <p className="text-[9px] font-black text-gray-500 uppercase">Signature</p>
                        <Badge className={state.currentStep === "SUCCESS" ? "bg-green-500/10 text-green-500" : "bg-gray-500/10 text-gray-500"}>
                           {state.currentStep === "SUCCESS" ? "SIGNED" : "LOCKED"}
                        </Badge>
                     </div>
                  </div>
               </section>
            </div>

            {/* Middle: Live Simulation View */}
            <div className="lg:col-span-5 flex flex-col h-[800px] bg-zinc-900/50 border border-white/5 rounded-[3.5rem] overflow-hidden relative shadow-2xl">
               <div className="p-8 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-xl sticky top-0 z-30">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                        {getStepIcon(activeStepId)}
                     </div>
                     <div>
                        <h2 className="text-xl font-black tracking-tight">{STEP_DEFINITIONS[activeStepId].title}</h2>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{STEP_DEFINITIONS[activeStepId].description}</p>
                     </div>
                  </div>
               </div>

               <div className="flex-1 p-10 space-y-12 overflow-y-auto scrollbar-hide" ref={scrollRef}>
                  <div className="space-y-8">
                     <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-widest flex items-center gap-2">
                        <Bot className="w-4 h-4" />
                        LECI ASSISTANT INTEGRATION
                     </h3>
                     {state.leciMessages.map((m, i) => (
                       <div key={i} className="flex flex-col gap-3 animate-in slide-in-from-bottom duration-500">
                          <div className={cn(
                            "p-8 text-lg font-medium leading-relaxed rounded-[2.5rem] rounded-tl-none border shadow-lg",
                            m.status === "SAFE" ? "bg-[#D4AF37]/5 border-[#D4AF37]/20 text-white" : 
                            m.status === "UNSAFE" ? "bg-red-500/5 border-red-500/20 text-red-100" : 
                            "bg-white/5 border-white/10 text-gray-200"
                          )}>
                             "{m.content}"
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                             <Badge className={cn(
                               "text-[8px] font-black px-2 py-0.5",
                               m.status === "SAFE" ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                             )}>
                                {m.status === "SAFE" ? "VERIFIED SAFE" : "SECURITY FLAG"}
                             </Badge>
                          </div>
                       </div>
                     ))}
                  </div>

                  {activeStepId === "SIGNATURE_GATE" && (
                    <div className="p-8 bg-black/60 border border-white/5 rounded-3xl space-y-6 animate-in zoom-in duration-500">
                       <h4 className="text-sm font-black text-center text-[#D4AF37] uppercase tracking-widest">Signature Validation Gate</h4>
                       <div className="grid grid-cols-1 gap-3">
                          <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                             <span className="text-xs font-bold text-gray-400">Compliance Score {">"} 80%</span>
                             <CheckCircle2 className="w-5 h-5 text-green-500" />
                          </div>
                          <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                             <span className="text-xs font-bold text-gray-400">Notices Acknowledged</span>
                             <CheckCircle2 className="w-5 h-5 text-green-500" />
                          </div>
                          <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                             <span className="text-xs font-bold text-gray-400">Payment Completed</span>
                             <CheckCircle2 className="w-5 h-5 text-green-500" />
                          </div>
                       </div>
                    </div>
                  )}
               </div>

               <div className="p-8 border-t border-white/5 bg-black/40 backdrop-blur-xl">
                  <Button 
                    onClick={nextStep} 
                    className="w-full h-16 bg-[#D4AF37] text-black font-black text-lg rounded-2xl shadow-[0_0_40px_rgba(212,175,55,0.15)] group relative overflow-hidden"
                  >
                     <span className="relative z-10 flex items-center justify-center">
                        CONTINUER LA SIMULATION
                        <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-2 transition-transform" />
                     </span>
                     <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500" />
                  </Button>
               </div>
            </div>

            {/* Right: System Audit & Forensic Logs */}
            <div className="lg:col-span-4 space-y-8 h-[800px] flex flex-col">
               <section className="flex-1 flex flex-col bg-black/40 border border-white/5 rounded-[3.5rem] overflow-hidden">
                  <div className="p-8 border-b border-white/5 bg-white/5">
                     <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] flex items-center gap-2">
                        <Lock className="w-3 h-3" />
                        Forensic Audit Trail
                     </h3>
                  </div>
                  <div className="flex-1 p-8 overflow-y-auto space-y-4 font-mono text-[10px] scrollbar-hide" ref={logScrollRef}>
                     {state.systemLogs.map((log, i) => (
                       <div key={i} className={cn(
                         "p-3 rounded-xl border flex gap-3 items-start",
                         log.type === "CRITICAL" ? "bg-red-500/10 border-red-500/20 text-red-200" : 
                         log.type === "WARNING" ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-200" : 
                         log.type === "SUCCESS" ? "bg-green-500/10 border-green-500/20 text-green-200" : 
                         "bg-white/5 border-white/5 text-gray-400"
                       )}>
                          <span className="text-gray-600 font-black">[{log.timestamp}]</span>
                          <span className="font-medium">{log.action}</span>
                       </div>
                     ))}
                  </div>
               </section>

               <Card className="p-8 bg-[#D4AF37]/5 border-[#D4AF37]/20 rounded-[2.5rem] space-y-4">
                  <h4 className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest flex items-center gap-2">
                     <ShieldAlert className="w-4 h-4" />
                     Protocol Check
                  </h4>
                  <p className="text-[11px] text-gray-400 italic leading-relaxed">
                     "LECIPM applique un protocole non-bypassable : aucune signature n'est générée sans validation forensic du score de conformité et preuve de paiement."
                  </p>
               </Card>
            </div>

          </div>
        )}

        {showSummary && (
          <div className="max-w-4xl mx-auto animate-in zoom-in duration-700">
             <Card className="p-12 bg-zinc-900 border-[#D4AF37]/30 border-2 rounded-[4rem] text-center space-y-10 shadow-[0_0_100px_rgba(212,175,55,0.1)]">
                <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto border-2 border-green-500/30">
                   <CheckCircle2 className="w-12 h-12 text-green-500" />
                </div>
                <div className="space-y-4">
                   <h2 className="text-5xl font-black tracking-tighter">Simulation Terminée</h2>
                   <p className="text-gray-400 text-lg">Le parcours utilisateur a été validé de bout en bout avec succès.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="p-8 bg-black/40 rounded-[2rem] border border-white/5 space-y-2">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Compliance</p>
                      <p className="text-4xl font-black text-green-500">98%</p>
                   </div>
                   <div className="p-8 bg-black/40 rounded-[2rem] border border-white/5 space-y-2">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Integrity</p>
                      <p className="text-4xl font-black text-[#D4AF37]">HASHED</p>
                   </div>
                   <div className="p-8 bg-black/40 rounded-[2rem] border border-white/5 space-y-2">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Audit</p>
                      <p className="text-4xl font-black text-blue-500">LOCKED</p>
                   </div>
                </div>

                <div className="pt-10 flex gap-4">
                   <Button variant="outline" className="flex-1 h-16 rounded-2xl font-black text-sm tracking-widest border-white/10 hover:bg-white/5" onClick={reset}>
                      RETOUR
                   </Button>
                   <Button className="flex-1 h-16 bg-[#D4AF37] text-black rounded-2xl font-black text-sm tracking-widest" onClick={startSimulation}>
                      RELANCER
                   </Button>
                </div>
             </Card>
          </div>
        )}

      </div>
    </div>
  );
}
