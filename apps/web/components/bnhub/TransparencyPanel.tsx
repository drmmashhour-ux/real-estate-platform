import React from 'react';
import { ShieldCheck, Calendar, Clock, AlertCircle, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { TrustBadge } from './TrustBadge';

interface TransparencyPanelProps {
  trustScore: number;
  badges: string[];
  hostStats: {
    responseRate: string;
    responseTime: string;
    cancellationPolicy: string;
    listingHistory: string;
  };
  signals: string[];
}

export function TransparencyPanel({ trustScore, badges, hostStats, signals }: TransparencyPanelProps) {
  return (
    <Card className="bg-zinc-900/40 border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
      <CardHeader className="p-10 border-b border-white/5 bg-black/40 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#D4AF37]/10 rounded-2xl flex items-center justify-center border border-[#D4AF37]/20">
              <ShieldCheck className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <div>
              <CardTitle className="text-xl font-black tracking-tight">Trust & Transparency</CardTitle>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Verification & Safety Protocol</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Trust Score</p>
            <p className="text-3xl font-black text-[#D4AF37]">{trustScore.toFixed(1)}<span className="text-sm text-gray-600">/5</span></p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-10 space-y-10">
        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          {badges.map((badge, i) => (
            <TrustBadge key={i} type={badge.toLowerCase().replace(' ', '_') as any} />
          ))}
          {badges.length === 0 && <TrustBadge type="new_host" />}
        </div>

        {/* Host Stats */}
        <div className="grid grid-cols-2 gap-8 pt-4">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Response Rate
            </p>
            <p className="text-sm font-bold text-white">{hostStats.responseRate}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Listing History
            </p>
            <p className="text-sm font-bold text-white">{hostStats.listingHistory}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Cancellation
            </p>
            <p className="text-sm font-bold text-white">{hostStats.cancellationPolicy}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest flex items-center gap-1">
              <Info className="w-3 h-3" />
              Response Time
            </p>
            <p className="text-sm font-bold text-white">{hostStats.responseTime}</p>
          </div>
        </div>

        {/* Safety Signals */}
        <div className="space-y-4 pt-6 border-t border-white/5">
          <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Safety Signals</h4>
          <div className="space-y-2">
            {signals.map((signal, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                <p className="text-[10px] text-gray-400 font-medium italic">"{signal}"</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
