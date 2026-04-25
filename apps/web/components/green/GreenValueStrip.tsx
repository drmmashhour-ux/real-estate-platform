import React from 'react';
import { Brain, Search, TrendingUp, Leaf } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';

export function GreenValueStrip() {
  const pillars = [
    {
      title: "Smarter decisions",
      description: "Understand the long-term efficiency and value of every property.",
      icon: Brain,
      color: "#22c55e"
    },
    {
      title: "Hidden value detection",
      description: "Identify properties with high improvement potential that others miss.",
      icon: Search,
      color: "#D4AF37"
    },
    {
      title: "Improvement insights",
      description: "Get concrete ideas to boost a home's efficiency and market value.",
      icon: TrendingUp,
      color: "#3b82f6"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-12 border-y border-white/5 bg-black/40 backdrop-blur-xl px-6">
      {pillars.map((pillar, i) => (
        <div key={i} className="flex flex-col items-center text-center space-y-4 group">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
            <pillar.icon className="w-8 h-8" style={{ color: pillar.color }} />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-black tracking-tight text-white uppercase">{pillar.title}</h3>
            <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-[250px] mx-auto">
              {pillar.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
