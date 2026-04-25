"use client";

import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  ArrowRight, 
  X, 
  Zap, 
  FileText, 
  ShieldCheck,
  CreditCard
} from "lucide-react";
import { Button } from "../ui/Button";
import { cn } from "../../lib/utils";

interface Nudge {
  title: string;
  message: string;
  cta: string;
  link: string;
  milestone: string;
}

export const NudgePanel: React.FC<{ brokerId: string }> = ({ brokerId }) => {
  const [nudge, setNudge] = useState<Nudge | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // In real app, fetch from /api/brokers/nudge
    const fetchNudge = async () => {
       try {
         const res = await fetch(`/api/admin/outreach/nudge?brokerId=${brokerId}`);
         const data = await res.json();
         if (data.nudge) setNudge(data.nudge);
       } catch (err) {
         // Fallback to static for demo
         setNudge({
           title: "Prêt à commencer ?",
           message: "Créez votre première offre en 2 minutes avec notre assistant guidé.",
           cta: "Créer un draft",
           link: "/drafts/turbo",
           milestone: "createdDraft"
         });
       }
    };
    if (brokerId) fetchNudge();
  }, [brokerId]);

  if (!nudge || !isVisible) return null;

  const getIcon = () => {
    switch (nudge.milestone) {
      case "createdDraft": return <FileText className="w-5 h-5 text-blue-400" />;
      case "usedAI": return <Sparkles className="w-5 h-5 text-[#D4AF37]" />;
      case "completedDraft": return <ShieldCheck className="w-5 h-5 text-green-500" />;
      default: return <Zap className="w-5 h-5 text-[#D4AF37]" />;
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] max-w-sm w-full animate-in slide-in-from-right duration-500">
      <div className="bg-[#151515] border border-white/10 rounded-[24px] shadow-2xl overflow-hidden shadow-[#D4AF37]/5">
        <div className="p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
            {getIcon()}
          </div>
          <div className="flex-grow space-y-1">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-white">{nudge.title}</h4>
              <button onClick={() => setIsVisible(false)} className="text-gray-500 hover:text-white transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              {nudge.message}
            </p>
            <div className="pt-3">
              <Button 
                size="sm" 
                className="w-full bg-[#D4AF37] hover:bg-[#B8962E] text-black font-bold h-9 rounded-lg text-[10px] uppercase tracking-widest"
                onClick={() => window.location.href = nudge.link}
              >
                {nudge.cta}
                <ArrowRight className="w-3 h-3 ml-2" />
              </Button>
            </div>
          </div>
        </div>
        <div className="bg-[#D4AF37]/10 px-5 py-2 border-t border-[#D4AF37]/10 flex items-center justify-between">
          <span className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest">Conseil d'onboarding</span>
          <span className="text-[9px] text-[#D4AF37]/60">Étape 1 sur 3</span>
        </div>
      </div>
    </div>
  );
};
