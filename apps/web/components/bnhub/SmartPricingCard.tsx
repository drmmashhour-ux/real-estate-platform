import React, { useState } from 'react';
import { TrendingUp, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { getSuggestedPrice, ListingData } from "@/modules/bnhub/pricingEngine";

interface SmartPricingCardProps {
  listing: ListingData;
}

export function SmartPricingCard({ listing }: SmartPricingCardProps) {
  const [suggestion, setSuggestion] = useState(() => getSuggestedPrice(listing, new Date()));
  const [applied, setApplied] = useState(false);
  const [ignored, setIgnored] = useState(false);

  if (applied) {
    return (
      <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-4 animate-in fade-in duration-500">
        <CheckCircle2 className="w-6 h-6 text-green-500" />
        <div className="space-y-1">
          <p className="text-xs font-black text-green-500 uppercase tracking-widest">Pricing Applied</p>
          <p className="text-sm font-bold text-white">New rate: ${suggestion.suggestedPrice}/night</p>
        </div>
      </div>
    );
  }

  if (ignored) return null;

  return (
    <div className="p-6 bg-black/40 border border-[#D4AF37]/20 rounded-[2rem] space-y-6 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4">
        <Badge variant="gold" className="text-[8px] animate-pulse">SMART SUGGESTION</Badge>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#D4AF37]/10 rounded-xl flex items-center justify-center border border-[#D4AF37]/20">
            <TrendingUp className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Smart Pricing</p>
            <h4 className="text-lg font-black text-white">${suggestion.suggestedPrice}/night</h4>
          </div>
        </div>

        <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-2">
          <div className="flex items-center gap-2">
            <Badge className={suggestion.changePercent >= 0 ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}>
              {suggestion.changePercent >= 0 ? '+' : ''}{suggestion.changePercent}% revenue
            </Badge>
            <Badge className="bg-blue-500/10 text-blue-400 text-[8px]">{suggestion.confidenceLevel.toUpperCase()} CONFIDENCE</Badge>
          </div>
          <p className="text-xs text-gray-400 font-medium italic">"{suggestion.reason}"</p>
        </div>

        <div className="flex gap-3">
          <Button 
            onClick={() => setApplied(true)}
            className="flex-1 h-10 bg-[#D4AF37] text-black font-black text-[10px] tracking-widest rounded-xl uppercase hover:scale-105 transition-transform"
          >
            Apply Suggestion
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => setIgnored(true)}
            className="h-10 px-4 border border-white/10 rounded-xl hover:bg-white/5"
          >
            <XCircle className="w-4 h-4 text-gray-500" />
          </Button>
        </div>
      </div>
    </div>
  );
}
