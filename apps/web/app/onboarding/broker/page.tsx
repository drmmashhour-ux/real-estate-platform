"use client";

import React, { useState, useEffect } from "react";
import { 
  CheckCircle2, 
  Circle, 
  Sparkles, 
  FileText, 
  ShieldCheck, 
  ArrowRight,
  Zap,
  HelpCircle
} from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { ProgressBar } from "../../../components/ui/ProgressBar";

interface ActivationState {
  createdDraft: boolean;
  usedAI: boolean;
  completedDraft: boolean;
  firstPayment: boolean;
  assistMode: boolean;
}

export default function BrokerOnboardingPage() {
  const [state, setState] = useState<ActivationState>({
    createdDraft: false,
    usedAI: false,
    completedDraft: false,
    firstPayment: false,
    assistMode: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, fetch from /api/onboarding/status
    const timer = setTimeout(() => {
      setState({
        createdDraft: true,
        usedAI: false,
        completedDraft: false,
        firstPayment: false,
        assistMode: true
      });
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const steps = [
    {
      id: "draft",
      title: "Créer un draft",
      desc: "Lancez votre première offre ou contrat de courtage.",
      done: state.createdDraft,
      icon: <FileText className="w-5 h-5" />,
      action: "/drafts/turbo"
    },
    {
      id: "ai",
      title: "Tester AI Review",
      desc: "Laissez l'IA analyser vos clauses pour plus de sécurité.",
      done: state.usedAI,
      icon: <Sparkles className="w-5 h-5 text-[#D4AF37]" />,
      action: "/drafts/turbo" // usually within the draft flow
    },
    {
      id: "finalize",
      title: "Finaliser un document",
      desc: "Générez le PDF final et préparez la signature.",
      done: state.completedDraft,
      icon: <ShieldCheck className="w-5 h-5 text-green-500" />,
      action: "/drafts"
    }
  ];

  const completedCount = steps.filter(s => s.done).length;
  const progress = Math.round((completedCount / steps.length) * 100);

  if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center">Chargement...</div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6">
      <div className="max-w-3xl mx-auto space-y-12 py-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-[10px] font-bold text-green-500 uppercase tracking-widest">
            Mode Activation Activé
          </div>
          <h1 className="text-4xl font-black tracking-tight">Bienvenue sur <span className="text-[#D4AF37]">LECIPM</span></h1>
          <p className="text-gray-400 text-lg">
            Votre parcours vers une pratique immobilière plus sûre et plus rapide commence ici.
          </p>
        </div>

        {/* Progress Card */}
        <Card className="p-8 bg-black/40 border-[#D4AF37]/20 backdrop-blur-xl">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold italic">Votre progression</h2>
              <span className="text-2xl font-black text-[#D4AF37]">{progress}%</span>
            </div>
            <ProgressBar progress={progress} className="h-3 bg-white/5" barClassName="bg-[#D4AF37]" />
            <p className="text-sm text-gray-500">
              {progress === 100 
                ? "Félicitations ! Vous êtes prêt à dominer votre marché." 
                : "Complétez ces étapes pour maîtriser l'outil et sécuriser vos premiers dossiers."}
            </p>
          </div>
        </Card>

        {/* Steps List */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Étapes suivantes</h3>
          {steps.map((step) => (
            <div 
              key={step.id}
              className={`flex items-center justify-between p-6 rounded-2xl border transition ${
                step.done 
                  ? "bg-green-500/5 border-green-500/20" 
                  : "bg-white/5 border-white/5 hover:border-white/10"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  step.done ? "bg-green-500/20 text-green-500" : "bg-white/5 text-gray-400"
                }`}>
                  {step.done ? <CheckCircle2 className="w-6 h-6" /> : step.icon}
                </div>
                <div>
                  <h4 className={`font-bold ${step.done ? "text-green-500" : "text-white"}`}>
                    {step.title}
                  </h4>
                  <p className="text-xs text-gray-500">{step.desc}</p>
                </div>
              </div>
              {!step.done && (
                <Button 
                  size="sm"
                  className="bg-white text-black hover:bg-gray-200 font-bold rounded-lg px-4"
                  onClick={() => window.location.href = step.action}
                >
                  Démarrer
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Assist Mode Banner */}
        {state.assistMode && (
          <div className="p-6 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#D4AF37] rounded-full flex items-center justify-center text-black">
                <Zap className="w-6 h-6 fill-current" />
              </div>
              <div>
                <h4 className="font-bold text-[#D4AF37]">Mode Accompagnement Activé</h4>
                <p className="text-xs text-gray-400">Notre équipe vous guide pas à pas sur votre premier dossier réel.</p>
              </div>
            </div>
            <Button 
              variant="outline"
              size="sm"
              className="border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/10"
              onClick={() => window.location.href = "https://calendly.com/lecipm/assist"}
            >
              Besoin d'aide ?
            </Button>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="text-center pt-8 border-t border-white/5">
          <p className="text-sm text-gray-500 mb-4 italic">"Une seule erreur évitée rentabilise l'outil pour l'année."</p>
          <Button 
            className="bg-[#D4AF37] hover:bg-[#B8962E] text-black font-black h-14 px-10 rounded-2xl text-lg shadow-lg shadow-[#D4AF37]/20"
            onClick={() => window.location.href = "/drafts/turbo"}
          >
            Lancer mon premier dossier
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
