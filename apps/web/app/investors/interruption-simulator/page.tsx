"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Mic, 
  Play, 
  AlertTriangle, 
  CheckCircle2, 
  Zap, 
  RefreshCw, 
  MessageSquare,
  ArrowRight,
  Shield,
  TrendingUp,
  Brain,
  Timer,
  Sparkles
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { ProgressBar } from "../../../components/ui/ProgressBar";
import { getRandomInterruption, evaluateResponse, Interruption } from "../../../modules/investor/interruptionEngine";

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

type Mode = "beginner" | "advanced" | "rapid-fire";

export default function InterruptionSimulator() {
  const [currentInterruption, setCurrentInterruption] = useState<Interruption | null>(null);
  const [response, setResponse] = useState("");
  const [evaluation, setEvaluation] = useState<any>(null);
  const [mode, setMode] = useState<Mode>("beginner");
  const [isSimulating, setIsSimulating] = useState(false);
  const [timeRemaining, setTimer] = useState(0);
  const [pitchText, setPitchText] = useState("Start pitching here... Imagine you are presenting the balanced 60s pitch.");
  const [interruptionHistory, setHistory] = useState<Interruption[]>([]);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startSimulation = () => {
    setIsSimulating(true);
    setEvaluation(null);
    setResponse("");
    setHistory([]);
    
    if (mode === "rapid-fire") {
      nextRapidFire();
    } else {
      // Set random interrupt timer
      const delay = mode === "beginner" ? 10000 : Math.random() * 5000 + 3000;
      timerRef.current = setTimeout(() => {
        interrupt();
      }, delay);
    }
  };

  const interrupt = () => {
    const intr = getRandomInterruption();
    setCurrentInterruption(intr);
    setHistory(prev => [...prev, intr]);
    setTimer(mode === "beginner" ? 30 : 15);
  };

  const nextRapidFire = () => {
    if (interruptionHistory.length >= 10) {
      setIsSimulating(false);
      return;
    }
    interrupt();
  };

  const handleSubmitResponse = () => {
    if (!currentInterruption) return;
    
    const evalResult = evaluateResponse(response, currentInterruption);
    setEvaluation(evalResult);
    
    if (mode === "rapid-fire") {
       // logic for next rapid fire would go here or after seeing evaluation
    } else {
       setIsSimulating(false);
    }
  };

  const reset = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsSimulating(false);
    setCurrentInterruption(null);
    setEvaluation(null);
    setResponse("");
    setTimer(0);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentInterruption && timeRemaining > 0 && !evaluation) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0 && currentInterruption && !evaluation) {
      handleSubmitResponse();
    }
    return () => clearInterval(interval);
  }, [currentInterruption, timeRemaining, evaluation]);

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-10">
          <div className="space-y-2">
            <Badge variant="gold" className="text-[10px] mb-2">Training Mode</Badge>
            <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
              Investor <span className="text-[#D4AF37]">Interruption Simulator</span>
            </h1>
            <p className="text-gray-400 max-w-xl">
              Entraînez-vous à gérer les interruptions d'investisseurs. Soyez direct, clair et ne perdez jamais le fil de votre vision.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["beginner", "advanced", "rapid-fire"] as Mode[]).map((m) => (
              <Button 
                key={m}
                variant={mode === m ? "goldPrimary" : "outline"}
                size="sm"
                onClick={() => setMode(m)}
                disabled={isSimulating}
                className="capitalize font-bold text-[10px] tracking-widest h-9"
              >
                {m.replace("-", " ")}
              </Button>
            ))}
          </div>
        </div>

        {!isSimulating && !evaluation && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="p-8 bg-black/40 border-white/10 backdrop-blur-xl space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Brain className="w-5 h-5 text-[#D4AF37]" />
                Prêt pour la simulation ?
              </h2>
              <p className="text-sm text-gray-400 leading-relaxed">
                Le simulateur va interrompre votre pitch à un moment aléatoire. <br />
                <span className="text-white font-bold">L'objectif :</span> répondre en moins de 30 secondes sans bégayer.
              </p>
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-gray-500 uppercase">Paramètres du mode {mode}</h4>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• Délai d'interruption : {mode === "beginner" ? "Lent (10s)" : "Rapide & Aléatoire"}</li>
                  <li>• Temps de réponse : {mode === "beginner" ? "30s" : "15s"}</li>
                </ul>
              </div>
              <Button className="w-full bg-[#D4AF37] text-black font-black h-12 rounded-xl" onClick={startSimulation}>
                Démarrer le Pitch
                <Play className="w-4 h-4 ml-2 fill-current" />
              </Button>
            </Card>

            <div className="space-y-6">
               <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-3xl space-y-4">
                  <h3 className="text-sm font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Conseils de Pro
                  </h3>
                  <p className="text-xs text-gray-400 italic">
                    "Une interruption n'est pas une attaque, c'est une preuve d'intérêt. Ne vous justifiez pas, affirmez."
                  </p>
               </div>
               <div className="p-6 bg-white/5 border border-white/5 rounded-3xl space-y-4">
                  <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest">Dernières Stats</h3>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase">Confidence Score</p>
                        <p className="text-2xl font-black">84%</p>
                     </div>
                     <div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase">Average Conciseness</p>
                        <p className="text-2xl font-black text-[#D4AF37]">92%</p>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {isSimulating && !currentInterruption && (
          <Card className="p-12 bg-black/60 border-[#D4AF37]/30 text-center space-y-8 animate-pulse">
             <div className="w-16 h-16 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto border border-[#D4AF37]/20">
                <Mic className="w-8 h-8 text-[#D4AF37]" />
             </div>
             <div className="space-y-4">
               <h2 className="text-2xl font-black">Pitch en cours...</h2>
               <p className="text-gray-400 max-w-sm mx-auto italic">
                 "Continuez à pitcher. L'investisseur vous écoute attentivement..."
               </p>
             </div>
             <div className="flex flex-col gap-3 max-w-xs mx-auto">
               <Button onClick={interrupt} className="bg-red-500 hover:bg-red-600 text-white font-black">
                 <AlertTriangle className="w-4 h-4 mr-2" />
                 M'interrompre maintenant
               </Button>
               <Button variant="ghost" onClick={reset} className="text-xs text-gray-500 underline">Arrêter la simulation</Button>
             </div>
          </Card>
        )}

        {currentInterruption && !evaluation && (
          <div className="space-y-8 animate-in fade-in zoom-in duration-500">
             <Card className="p-8 bg-red-500/10 border-red-500/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                   <div className={cn(
                     "w-12 h-12 rounded-full border-4 flex items-center justify-center font-black text-xl mb-2",
                     timeRemaining < 5 ? "border-red-500 text-red-500 animate-bounce" : "border-white/20 text-white"
                   )}>
                      {timeRemaining}
                   </div>
                </div>
                <div className="flex items-center gap-4 mb-6">
                   <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-white" />
                   </div>
                   <h2 className="text-xl font-black text-red-400 uppercase tracking-tighter">Interruption !</h2>
                </div>
                <p className="text-2xl font-bold leading-tight text-white mb-8">
                   "{currentInterruption.question}"
                </p>
                <div className="mb-6">
                   <ProgressBar 
                     value={timeRemaining} 
                     max={mode === "beginner" ? 30 : 15} 
                     accent={timeRemaining < 5 ? "#ef4444" : "#D4AF37"} 
                     className="h-1"
                   />
                </div>
                <div className="space-y-4">
                   <textarea 
                     autoFocus
                     value={response}
                     onChange={(e) => setResponse(e.target.value)}
                     placeholder="Tapez votre réponse ici (soyez rapide)..."
                     className="w-full h-32 bg-black/40 border border-white/10 rounded-2xl p-4 text-lg focus:ring-2 focus:ring-red-500 outline-none transition shadow-inner"
                   />
                   <div className="flex justify-between items-center">
                      <p className="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-2">
                         <Timer className="w-3 h-3" />
                         Répondez immédiatement
                      </p>
                      <Button onClick={handleSubmitResponse} className="bg-white text-black font-black px-8">
                         Répondre
                         <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                   </div>
                </div>
             </Card>
          </div>
        )}

        {evaluation && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom duration-700">
             <Card className="p-8 bg-black/40 border-white/10 space-y-6">
                <div className="flex items-center justify-between">
                   <h3 className="text-xl font-bold flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-400" />
                      Évaluation
                   </h3>
                   <div className="text-3xl font-black text-white">
                      {evaluation.score}<span className="text-[#D4AF37] text-lg">%</span>
                   </div>
                </div>
                
                <div className="space-y-6">
                   <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-gray-500">
                         <span>Overall Performance</span>
                         <span>{evaluation.score}%</span>
                      </div>
                      <ProgressBar value={evaluation.score} accent="gold" />
                   </div>
                   
                   <div>
                      <h4 className="text-[10px] font-black text-green-500 uppercase tracking-widest mb-2">Points Forts</h4>
                      <p className="text-sm text-gray-300 italic">"{evaluation.whatWasGood}"</p>
                   </div>
                   <div>
                      <h4 className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2">À Améliorer</h4>
                      <p className="text-sm text-gray-300 italic">"{evaluation.whatToImprove}"</p>
                   </div>
                   <div className="pt-6 border-t border-white/5 flex gap-4">
                      <Button variant="outline" className="flex-1 border-white/10 font-bold" onClick={startSimulation}>
                         <RefreshCw className="w-4 h-4 mr-2" />
                         Réessayer
                      </Button>
                      <Button variant="goldPrimary" className="flex-1 font-black" onClick={reset}>
                         Terminer
                      </Button>
                   </div>
                </div>
             </Card>

             <Card className="p-8 bg-zinc-900 border-white/5 space-y-6">
                <h3 className="text-xl font-bold flex items-center gap-2 text-[#D4AF37]">
                   <Sparkles className="w-5 h-5" />
                   Réponse Modèle
                </h3>
                <div className="p-6 bg-black/40 rounded-2xl border border-white/5">
                   <p className="text-gray-100 leading-relaxed font-medium">
                      "{evaluation.betterAnswer}"
                   </p>
                </div>
                <div className="space-y-3">
                   <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Points clés à retenir</h4>
                   <div className="flex flex-wrap gap-2">
                      {currentInterruption?.idealPoints.map((p, i) => (
                        <Badge key={i} className="bg-white/5 text-gray-400 border-white/10">{p}</Badge>
                      ))}
                   </div>
                </div>
             </Card>
          </div>
        )}

      </div>
    </div>
  );
}
