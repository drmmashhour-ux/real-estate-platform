"use client";
import React from "react";
import { Target, Flag, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/Badge";

interface CeoLongTermGoalsPanelProps {
  goals: any[];
}

export function CeoLongTermGoalsPanel({ goals }: CeoLongTermGoalsPanelProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-600" />
          Long-Term Strategic Goals
        </h3>
        <Badge variant="outline">{goals.length} Active Goals</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {goals.map((goal) => {
          const progress = Math.min(100, Math.max(0, (goal.currentValue / goal.targetValue) * 100));
          return (
            <Card key={goal.id} className="overflow-hidden">
              <CardHeader className="pb-2 space-y-0">
                <div className="flex justify-between items-start">
                  <Badge className={goal.priority > 2 ? "bg-amber-500" : "bg-slate-400"}>
                    P{goal.priority}
                  </Badge>
                  <span className="text-[10px] uppercase font-bold text-slate-400">{goal.domain}</span>
                </div>
                <CardTitle className="text-base pt-2">{goal.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Progress</span>
                    <span className="font-bold">{progress.toFixed(1)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <div className="flex justify-between items-end pt-1">
                    <div className="text-[10px] text-slate-400">
                      Target: {goal.targetValue} {goal.targetMetric}
                    </div>
                    <div className="text-xs font-medium">
                      Current: {goal.currentValue}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {goals.length === 0 && (
          <div className="col-span-full py-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
            <AlertCircle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No active long-term goals defined.</p>
          </div>
        )}
      </div>
    </div>
  );
}
