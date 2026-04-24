"use client";

import { useState, useEffect } from "react";
import { QuebecEsgRecommendation } from "@/modules/green-ai/quebec-esg-recommendation.service";
import { QUEBEC_ESG_CRITERIA_DISCLAIMER } from "@/modules/green-ai/quebec-esg.engine";
import { GreenEngineInput } from "@/modules/green/green.types";
import { Zap, TrendingUp, Check, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  baseInput: GreenEngineInput;
  recommendations: QuebecEsgRecommendation[];
}

export function QuebecEsgSimulator({ baseInput, recommendations }: Props) {
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [simulation, setSimulation] = useState<{
    currentScore: number;
    projectedScore: number;
    delta: number;
    label: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const toggleRecommendation = (key: string) => {
    setSelectedKeys(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  useEffect(() => {
    async function runSimulation() {
      setLoading(true);
      try {
        const res = await fetch("/api/green/simulate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ baseInput, recommendationKeys: selectedKeys }),
        });
        const data = await res.json();
        setSimulation(data);
      } catch (err) {
        console.error("Simulation failed", err);
      } finally {
        setLoading(false);
      }
    }

    void runSimulation();
  }, [selectedKeys, baseInput]);

  return (
    <div className="space-y-8 rounded-3xl border border-white/5 bg-zinc-900/20 p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h3 className="text-xl font-black uppercase italic tracking-tight text-white">Simulateur d&apos;Amélioration</h3>
          <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Sélectionnez des travaux pour voir l&apos;impact</p>
        </div>

        {simulation && (
          <div className="flex items-center gap-6 rounded-2xl bg-black/40 p-4 border border-white/5">
            <div className="text-center">
              <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Actuel</p>
              <p className="text-2xl font-black text-white/50">{simulation.currentScore}</p>
            </div>
            <TrendingUp className="h-5 w-5 text-premium-gold animate-pulse" />
            <div className="text-center">
              <p className="text-[8px] font-black uppercase tracking-widest text-premium-gold">Projeté</p>
              <p className="text-3xl font-black text-premium-gold">{simulation.projectedScore}</p>
            </div>
            <div className="border-l border-white/10 pl-4">
              <p className="text-[8px] font-black uppercase tracking-widest text-emerald-500">Gain</p>
              <p className="text-lg font-black text-emerald-500">+{simulation.delta}</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {recommendations.map((rec) => {
          const isSelected = selectedKeys.includes(rec.key);
          return (
            <button
              key={rec.key}
              onClick={() => toggleRecommendation(rec.key)}
              className={cn(
                "flex items-center justify-between gap-4 rounded-xl border p-4 text-left transition-all",
                isSelected 
                  ? "border-premium-gold bg-premium-gold/10 shadow-lg shadow-premium-gold/5" 
                  : "border-white/5 bg-white/5 hover:border-white/20"
              )}
            >
              <div className="space-y-1">
                <p className={cn(
                  "text-[10px] font-bold tracking-tight",
                  isSelected ? "text-premium-gold" : "text-white"
                )}>
                  {rec.title}
                </p>
                <p className="text-[9px] text-zinc-500 uppercase font-black">+{rec.estimatedScoreLift} points</p>
              </div>
              <div className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-all",
                isSelected ? "border-premium-gold bg-premium-gold text-black" : "border-white/20"
              )}>
                {isSelected && <Check className="h-4 w-4" />}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-4 border-t border-white/5 pt-6">
        <div className="flex items-center gap-2 text-[10px] text-zinc-500 italic">
          <ShieldCheck className="h-3 w-3 shrink-0" />
          <p>{QUEBEC_ESG_CRITERIA_DISCLAIMER}</p>
        </div>
      </div>
    </div>
  );
}
