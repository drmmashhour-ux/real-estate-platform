import React from "react";
import { AllocationStrategyMode } from "@/modules/capital-ai/capital-allocator.types";
import { Shield, Zap, Scale, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";

export function CapitalStrategySelector({ 
  selected, 
  onChange 
}: { 
  selected: AllocationStrategyMode; 
  onChange: (mode: AllocationStrategyMode) => void;
}) {
  const modes: { id: AllocationStrategyMode; label: string; icon: any; description: string }[] = [
    { 
      id: "CONSERVATIVE", 
      label: "Conservative", 
      icon: Shield, 
      description: "Low risk exposure, high diversification, prioritizes capital preservation." 
    },
    { 
      id: "BALANCED", 
      label: "Balanced", 
      icon: Scale, 
      description: "Optimized risk-reward ratio across diversified sectors and regions." 
    },
    { 
      id: "AGGRESSIVE", 
      label: "Aggressive", 
      icon: Zap, 
      description: "Higher risk tolerance for maximum directional growth potential." 
    },
    { 
      id: "ESG_FOCUSED", 
      label: "ESG Focused", 
      icon: Leaf, 
      description: "Prioritizes deals with high environmental and social impact scores." 
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {modes.map((m) => {
        const Icon = m.icon;
        const isActive = selected === m.id;
        
        return (
          <button
            key={m.id}
            onClick={() => onChange(m.id)}
            className={cn(
              "flex flex-col items-start p-4 rounded-xl border transition-all text-left",
              isActive 
                ? "border-premium-gold bg-premium-gold/10 ring-1 ring-premium-gold" 
                : "border-white/10 bg-black/40 hover:border-white/20"
            )}
          >
            <div className={cn(
              "p-2 rounded-lg mb-3",
              isActive ? "bg-premium-gold text-black" : "bg-white/5 text-[#737373]"
            )}>
              <Icon className="w-4 h-4" />
            </div>
            <h3 className={cn(
              "text-xs font-bold uppercase tracking-widest mb-1",
              isActive ? "text-premium-gold" : "text-white"
            )}>
              {m.label}
            </h3>
            <p className="text-[10px] text-[#737373] leading-relaxed">
              {m.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}
