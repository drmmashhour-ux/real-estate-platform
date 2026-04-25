import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface HostStatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isUp: boolean;
  };
  description?: string;
  color?: string;
}

export function HostStatsCard({ title, value, icon: Icon, trend, description, color = "#D4AF37" }: HostStatsCardProps) {
  return (
    <Card className="bg-zinc-900/50 border-white/5 hover:border-white/10 transition-all duration-300 rounded-[2rem] overflow-hidden group">
      <CardContent className="p-8 space-y-4">
        <div className="flex justify-between items-start">
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10 group-hover:scale-110 transition-transform">
            <Icon className="w-6 h-6" style={{ color }} />
          </div>
          {trend && (
            <Badge className={trend.isUp ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}>
              {trend.isUp ? '+' : '-'}{trend.value}%
            </Badge>
          )}
        </div>
        <div>
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">{title}</p>
          <h3 className="text-3xl font-black tracking-tight">{value}</h3>
          {description && <p className="text-xs text-gray-600 mt-2 font-medium">{description}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
