"use client";
import React from "react";
import { Brain, TrendingUp, TrendingDown, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CeoStrategyMemoryPanelProps {
  topPatterns: any[];
  avoidPatterns: any[];
}

export function CeoStrategyMemoryPanel({ topPatterns, avoidPatterns }: CeoStrategyMemoryPanelProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="border-emerald-500/20 bg-emerald-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-emerald-700">
            <TrendingUp className="h-5 w-5" />
            Winning Strategies
          </CardTitle>
          <CardDescription>Proven patterns with high success scores</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topPatterns.length === 0 && <p className="text-sm text-slate-500">No high-performing patterns yet.</p>}
            {topPatterns.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg bg-white/50 p-2 shadow-sm">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{p.domain}</p>
                  <p className="text-sm font-medium">{p.patternKey.split('_')[0]} Strategy</p>
                </div>
                <div className="text-right">
                  <Badge className="bg-emerald-500">Score: {p.score.toFixed(1)}</Badge>
                  <p className="mt-1 text-[10px] text-slate-400">Used {p.timesUsed}x</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-rose-500/20 bg-rose-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-rose-700">
            <TrendingDown className="h-5 w-5" />
            Risk Patterns
          </CardTitle>
          <CardDescription>Strategies that failed to deliver impact</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {avoidPatterns.length === 0 && <p className="text-sm text-slate-500">No high-risk patterns detected.</p>}
            {avoidPatterns.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg bg-white/50 p-2 shadow-sm">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{p.domain}</p>
                  <p className="text-sm font-medium">{p.patternKey.split('_')[0]} Strategy</p>
                </div>
                <div className="text-right">
                  <Badge variant="destructive">Score: {p.score.toFixed(1)}</Badge>
                  <p className="mt-1 text-[10px] text-slate-400">Used {p.timesUsed}x</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
