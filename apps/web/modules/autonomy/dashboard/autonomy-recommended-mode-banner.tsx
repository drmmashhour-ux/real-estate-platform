"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { 
  Sparkles, 
  ArrowRight, 
  Info, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  ShieldCheck,
  Zap,
  Bot
} from "lucide-react";

type AutonomyMode = 
  | "OFF"
  | "ASSIST"
  | "SAFE_AUTOPILOT"
  | "FULL_AUTOPILOT_APPROVAL";

type ModeRecommendation = {
  suggestedMode: AutonomyMode;
  reason: string;
  confidence: number;
  factors: {
    label: string;
    value: string | number;
    impact: "positive" | "negative" | "neutral";
  }[];
};

export const AutonomyRecommendedModeBanner: React.FC = () => {
  const [recommendation, setRecommendation] = useState<ModeRecommendation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendation = async () => {
      try {
        const res = await fetch("/api/autonomy/mode-recommendation");
        const data = await res.json();
        setRecommendation(data.recommendation);
      } catch (error) {
        console.error("Failed to fetch recommendation", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecommendation();
  }, []);

  if (loading) return (
    <div className="animate-pulse bg-indigo-50/50 h-32 rounded-3xl border border-indigo-100/50" />
  );

  if (!recommendation) return null;

  const getModeStyles = (mode: AutonomyMode) => {
    switch (mode) {
      case "FULL_AUTOPILOT_APPROVAL":
        return { 
          bg: "bg-indigo-600", 
          text: "text-white", 
          icon: <Bot className="w-5 h-5" />,
          label: "Full Autopilot (Approval Required)"
        };
      case "SAFE_AUTOPILOT":
        return { 
          bg: "bg-emerald-600", 
          text: "text-white", 
          icon: <ShieldCheck className="w-5 h-5" />,
          label: "Safe Autopilot"
        };
      case "ASSIST":
        return { 
          bg: "bg-blue-600", 
          text: "text-white", 
          icon: <Zap className="w-5 h-5" />,
          label: "Assisted Mode"
        };
      case "OFF":
        return { 
          bg: "bg-slate-800", 
          text: "text-white", 
          icon: <AlertCircle className="w-5 h-5" />,
          label: "Manual Mode"
        };
    }
  };

  const handleApplyMode = async () => {
    if (!recommendation) return;
    try {
      const res = await fetch("/api/autonomy/mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          mode: recommendation.suggestedMode, 
          reason: `AI Recommended: ${recommendation.reason}` 
        }),
      });
      if (res.ok) {
        alert(`System mode updated to ${recommendation.suggestedMode}`);
      }
    } catch (error) {
      console.error("Failed to apply mode", error);
    }
  };

  const style = getModeStyles(recommendation.suggestedMode);

  return (
    <Card className="p-1 px-1 rounded-[2rem] border-none shadow-xl shadow-indigo-100/50 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700">
      <div className="bg-white/95 backdrop-blur-sm m-[1px] rounded-[1.95rem] p-6 py-5 flex flex-col md:flex-row items-center gap-6">
        <div className="flex-1">
          {/* ... existing content ... */}
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-indigo-50 p-1.5 rounded-lg">
              <Sparkles className="w-4 h-4 text-indigo-600" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">AI Governance Intelligence</span>
          </div>
          
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            Recommended Mode: 
            <span className={`px-4 py-1 rounded-full text-xs font-bold flex items-center gap-2 ${style.bg} ${style.text}`}>
              {style.icon} {style.label}
            </span>
          </h2>
          
          <p className="text-sm text-slate-500 mt-2 font-medium leading-relaxed max-w-2xl">
            {recommendation.reason}
          </p>
          
          <div className="flex flex-wrap gap-4 mt-4">
            {recommendation.factors.map((factor, i) => (
              <div key={i} className="flex items-center gap-1.5">
                {factor.impact === "positive" ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                ) : factor.impact === "negative" ? (
                  <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                ) : (
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">{factor.label}:</span>
                <span className="text-[11px] font-black text-slate-800">{factor.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 shrink-0">
          <Button 
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-8 py-6 rounded-2xl shadow-lg shadow-indigo-200 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 group"
            onClick={handleApplyMode}
          >
            Apply Mode <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
              Confidence: {(recommendation.confidence * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};
