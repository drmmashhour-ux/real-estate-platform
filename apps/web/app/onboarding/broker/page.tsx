"use client";

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  ArrowRight,
  ChevronRight,
  FileText,
  Play
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import Link from 'next/link';

interface ActivationState {
  createdDraft: boolean;
  usedAI: boolean;
  completedDraft: boolean;
  firstPayment: boolean;
  assistMode: boolean;
}

export default function BrokerOnboardingPage() {
  const [state, setState] = useState<ActivationState | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock userId for demo
  const mockUserId = "broker_123";

  useEffect(() => {
    fetchActivation();
  }, []);

  const fetchActivation = async () => {
    try {
      const res = await fetch(`/api/broker/activation?userId=${mockUserId}`);
      const data = await res.json();
      setState(data);
    } catch (err) {
      console.error('Failed to fetch activation state', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !state) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#D4AF37]"></div>
    </div>
  );

  const steps = [
    { 
      id: 'createdDraft', 
      label: 'Créer votre premier draft', 
      desc: 'Démarrez une offre ou un contrat de courtage.',
      completed: state.createdDraft,
      href: '/drafts/turbo',
      prompt: "Créez votre première offre en 2 minutes"
    },
    { 
      id: 'usedAI', 
      label: 'Tester AI Review', 
      desc: 'Laissez l\'intelligence analyser votre contenu.',
      completed: state.usedAI,
      href: '/drafts/turbo',
      prompt: "Essayez l’analyse AI"
    },
    { 
      id: 'completedDraft', 
      label: 'Finaliser un document', 
      desc: 'Générez la version finale pour signature.',
      completed: state.completedDraft,
      href: '/drafts/turbo',
      prompt: "Finalisez votre premier document"
    }
  ];

  const completedCount = steps.filter(s => s.completed).length;
  const progress = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div className="space-y-4 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-full text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">
            <Sparkles className="w-3 h-3" />
            Activation Courtier
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight">Bienvenue sur <span className="text-[#D4AF37]">LECIPM.</span></h1>
          <p className="text-gray-400 text-lg max-w-2xl">
            Votre parcours pour sécuriser et automatiser vos transactions commence ici. 
            Complétez ces étapes pour maîtriser la plateforme.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Progress Section */}
          <div className="md:col-span-2 space-y-6">
            <Card className="p-8 bg-black/40 border-white/5 backdrop-blur-xl space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Votre progression</h2>
                <span className="text-2xl font-black text-[#D4AF37]">{progress}%</span>
              </div>
              
              <div className="space-y-2">
                <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#D4AF37] transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(212,175,55,0.4)]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4">
                {steps.map((step) => (
                  <Link key={step.id} href={step.href}>
                    <div className={cn(
                      "group p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between mb-4",
                      step.completed 
                        ? "bg-green-500/5 border-green-500/20" 
                        : "bg-white/5 border-white/10 hover:border-[#D4AF37]/40"
                    )}>
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center transition",
                          step.completed ? "bg-green-500 text-black" : "border-2 border-gray-600 text-transparent"
                        )}>
                          {step.completed ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className={cn("font-bold", step.completed ? "text-green-400" : "text-white")}>{step.label}</p>
                          <p className="text-xs text-gray-500">{step.desc}</p>
                        </div>
                      </div>
                      {!step.completed && <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-[#D4AF37] transition" />}
                    </div>
                  </Link>
                ))}
              </div>
            </Card>

            {/* In-app Prompt Trigger */}
            {!state.completedDraft && (
              <Card className="p-6 bg-gradient-to-r from-blue-600/20 to-transparent border-blue-500/30">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center">
                    <Zap className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-white">
                      {steps.find(s => !s.completed)?.prompt || "Prêt à continuer ?"}
                    </p>
                    <p className="text-xs text-gray-400">Passez à l'étape suivante pour activer votre compte.</p>
                  </div>
                  <Link href="/drafts/turbo">
                    <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg px-6">
                      C'est parti
                    </Button>
                  </Link>
                </div>
              </Card>
            )}
          </div>

          {/* Side Info */}
          <div className="space-y-6">
            <Card className="p-6 bg-[#D4AF37]/5 border-[#D4AF37]/20">
              <h3 className="text-sm font-black text-[#D4AF37] uppercase tracking-wider mb-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Mode Assisté Actif
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Le système vous guide pas à pas. L'IA surveille chaque clause pour s'assurer que vous respectez les normes OACIQ.
              </p>
              <div className="mt-6 p-3 bg-black/40 rounded-xl border border-[#D4AF37]/10 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                  <Play className="w-4 h-4 text-[#D4AF37]" />
                </div>
                <span className="text-[10px] font-bold text-gray-300">Vidéo: Tutoriel 10 min</span>
              </div>
            </Card>

            <Card className="p-6 bg-white/5 border-white/5">
              <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4">Besoin d'aide ?</h3>
              <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                Nos experts en conformité sont disponibles pour une session de travail réelle sur l'un de vos dossiers.
              </p>
              <Button variant="outline" className="w-full border-white/10 bg-white/5 text-xs h-10 rounded-xl">
                Contacter un expert
              </Button>
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
