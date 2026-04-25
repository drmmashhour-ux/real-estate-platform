import React from 'react';
import { ShieldCheck, UserCheck, Star, AlertTriangle, Shield } from 'lucide-react';
import { Badge } from '../ui/Badge';

export type BadgeType = "verified_listing" | "verified_host" | "highly_rated" | "low_risk" | "new_host";

interface TrustBadgeProps {
  type: BadgeType;
}

const BADGE_CONFIG: Record<BadgeType, { label: string; icon: any; color: string; bg: string }> = {
  verified_listing: {
    label: "Verified Listing",
    icon: ShieldCheck,
    color: "#D4AF37",
    bg: "bg-[#D4AF37]/10"
  },
  verified_host: {
    label: "Verified Host",
    icon: UserCheck,
    color: "#3b82f6",
    bg: "bg-blue-500/10"
  },
  highly_rated: {
    label: "Highly Rated",
    icon: Star,
    color: "#22c55e",
    bg: "bg-green-500/10"
  },
  low_risk: {
    label: "Low Risk",
    icon: Shield,
    color: "#a855f7",
    bg: "bg-purple-500/10"
  },
  new_host: {
    label: "New Host",
    icon: AlertTriangle,
    color: "#94a3b8",
    bg: "bg-slate-500/10"
  }
};

export function TrustBadge({ type }: TrustBadgeProps) {
  const config = BADGE_CONFIG[type];
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border border-white/5 ${config.bg}`}>
      <Icon className="w-3 h-3" style={{ color: config.color }} />
      <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: config.color }}>
        {config.label}
      </span>
    </div>
  );
}
