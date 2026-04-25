"use client";
import React, { useState } from "react";
import { CeoStrategyMemoryPanel } from "@/components/ceo-ai/CeoStrategyMemoryPanel";
import { CeoDecisionOutcomeTable } from "@/components/ceo-ai/CeoDecisionOutcomeTable";
import { CeoLongTermGoalsPanel } from "@/components/ceo-ai/CeoLongTermGoalsPanel";
import { Brain, TrendingUp, BarChart3, ShieldAlert, Cpu } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LaunchSequencerSummaryStrip } from "@/components/launch-sequencer/LaunchSequencerSummaryStrip";

interface CeoDashboardClientProps {
  initialSnapshot: any;
  strategicSnapshot: any;
  weeklyPlan: any;
}

export function CeoDashboardClient({ initialSnapshot, strategicSnapshot, weeklyPlan }: CeoDashboardClientProps) {
  const [snapshot] = useState(initialSnapshot);
  const [strategic] = useState(strategicSnapshot);
  const [plan] = useState(weeklyPlan);

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Global Stats */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Brain className="h-8 w-8 text-blue-600" />
            CEO Strategic Hub
          </h1>
          <p className="text-slate-500">Autonomous intelligence layer monitoring and optimizing LECIPM ecosystem.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          SYSTEM ACTIVE • LAST CYCLE: {new Date(snapshot.timestamp).toLocaleTimeString()}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard 
          title="Growth Trend" 
          value={`${(snapshot.context.growth.trend * 100).toFixed(1)}%`} 
          description="30-day lead volume change"
          icon={<TrendingUp className="h-4 w-4 text-emerald-500" />}
          trend={snapshot.context.growth.trend > 0 ? "up" : "down"}
        />
        <MetricCard 
          title="Conversion" 
          value={`${(snapshot.context.context.deals.closeRate * 100).toFixed(1)}%`} 
          description="Avg deal close rate"
          icon={<BarChart3 className="h-4 w-4 text-blue-500" />}
        />
        <MetricCard 
          title="Agent Reliability" 
          value={`${(snapshot.context.context.agents.successSignals * 100).toFixed(1)}%`} 
          description="Avg success rate per decision"
          icon={<Cpu className="h-4 w-4 text-purple-500" />}
        />
        <MetricCard 
          title="Risk Signals" 
          value={snapshot.context.context.deals.avgRejectionRate > 0.3 ? "ELEVATED" : "LOW"} 
          description="Deal rejection & rollout friction"
          icon={<ShieldAlert className={`h-4 w-4 ${snapshot.context.context.deals.avgRejectionRate > 0.3 ? "text-rose-500" : "text-slate-400"}`} />}
          status={snapshot.context.context.deals.avgRejectionRate > 0.3 ? "warning" : "stable"}
        />
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-950 p-1">
        <LaunchSequencerSummaryStrip dashboardHref="/dashboard/launch-sequencer" />
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Strategic Overview</TabsTrigger>
          <TabsTrigger value="weekly">Weekly Plan</TabsTrigger>
          <TabsTrigger value="insights">Deep Insights</TabsTrigger>
          <TabsTrigger value="memory">Strategy Memory</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2 space-y-6">
              <CeoLongTermGoalsPanel goals={snapshot.longTermGoals} />
              
              <Card>
                <CardHeader>
                  <CardTitle>Executive Summary</CardTitle>
                  <CardDescription>Strategic synthesis of current platform state</CardDescription>
                </CardHeader>
                <CardContent>
                  {strategic ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <p className="text-[10px] font-bold text-blue-600 uppercase">Performance</p>
                          <p className="text-xl font-bold">{strategic.summaryJson.performanceScore.toFixed(0)}</p>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-lg">
                          <p className="text-[10px] font-bold text-emerald-600 uppercase">Growth Index</p>
                          <p className="text-xl font-bold">{strategic.summaryJson.growthIndex.toFixed(0)}</p>
                        </div>
                        <div className="p-3 bg-rose-50 rounded-lg">
                          <p className="text-[10px] font-bold text-rose-600 uppercase">Risk Level</p>
                          <p className="text-xl font-bold">{strategic.summaryJson.riskLevel}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold">Strategic Recommendations</h4>
                        <div className="space-y-2">
                          {strategic.recommendationsJson.map((r: any, i: number) => (
                            <div key={i} className="flex items-start gap-3 p-2 rounded border bg-slate-50/50">
                              <Badge className={r.priorityScore > 85 ? "bg-rose-500" : "bg-blue-500"}>{r.type}</Badge>
                              <div className="space-y-1">
                                <p className="text-sm font-medium">{r.targetType} Strategy Update</p>
                                <p className="text-xs text-slate-500">{r.rationaleJson.reason}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 italic">No strategic snapshot generated. Run a CEO cycle to begin.</p>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Context</CardTitle>
                  <CardDescription>Current state snapshot</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ContextItem label="Active Deals" value={snapshot.context.context.deals.volume} />
                  <ContextItem label="ESG Avg Score" value={snapshot.context.context.esg.avgScore.toFixed(1)} />
                  <ContextItem label="City Rollouts" value={snapshot.context.context.rollout.activeCount} />
                  <ContextItem label="Active Agents" value={snapshot.context.context.agents.activeAgents} />
                </CardContent>
              </Card>

              <Card className="bg-slate-900 text-white">
                <CardHeader>
                  <CardTitle className="text-white">AI CEO Advisor</CardTitle>
                  <CardDescription className="text-slate-400">Real-time strategic guidance</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-slate-300">
                    "Based on current trends, we should accelerate ESG-focused deal sourcing in Laval. 
                    Growth remains strong but deal conversion is lagging in the commercial segment. 
                    Prioritize operational efficiency improvements in the closing process this week."
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="weekly" className="space-y-6">
          {plan ? (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Top 5 Strategic Priorities</CardTitle>
                  <CardDescription>Actions with highest projected impact</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {plan.topPriorities.map((p: any, i: number) => (
                      <div key={i} className="flex items-center gap-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-sm">
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{p.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px] py-0">{p.type}</Badge>
                            <span className="text-[10px] text-slate-400">Impact Score: {p.priority}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Deals to Close</CardTitle>
                    <CardDescription>High-value opportunities for this week</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {plan.dealsToClose.map((d: any) => (
                        <div key={d.id} className="flex justify-between items-center p-2 rounded border bg-slate-50/50">
                          <span className="text-sm font-medium">{d.dealCode || d.id.slice(0, 8)}</span>
                          <span className="text-sm font-bold text-emerald-600">${(Number(d.priceCents) / 100000).toFixed(0)}k</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>AI Tasks</CardTitle>
                    <CardDescription>Automated optimizations in progress</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {plan.aiTasks.map((t: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                          <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                          {t}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {plan.companyAi ? (
                  <Card className="border-violet-200 bg-violet-50/40">
                    <CardHeader>
                      <CardTitle>Company evolution signals</CardTitle>
                      <CardDescription>
                        Long-horizon patterns from Company AI — advisory only; review adaptations on the Company AI
                        dashboard.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      {plan.companyAi.patterns?.length ? (
                        <ul className="list-disc space-y-1 pl-4 text-slate-700">
                          {plan.companyAi.patterns.slice(0, 3).map((p: { id: string; statement: string }) => (
                            <li key={p.id}>{p.statement}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-slate-500">No strong patterns in the latest monthly window.</p>
                      )}
                      {plan.companyAi.deprioritizeSegments?.length ? (
                        <div>
                          <p className="font-medium text-rose-700">Deprioritize</p>
                          <ul className="list-disc pl-4 text-slate-600">
                            {plan.companyAi.deprioritizeSegments.map((s: string) => (
                              <li key={s}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      <p className="text-xs text-slate-500">
                        Proposed adaptations: {plan.companyAi.proposedAdaptationsCount} · Rolled out / approved:{" "}
                        {plan.companyAi.rolledOutCount}
                      </p>
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500 italic">No weekly plan available. Run a strategic cycle to generate.</p>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Platform Performance Insights</CardTitle>
              <CardDescription>Deep analysis of bottlenecks, growth engines, and risks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {strategic?.performanceJson.insights.map((insight: any, i: number) => (
                  <InsightCard key={i} insight={insight} />
                ))}
                {strategic?.growthJson.insights.map((insight: any, i: number) => (
                  <InsightCard key={i} insight={insight} />
                ))}
                {strategic?.riskJson.insights.map((insight: any, i: number) => (
                  <InsightCard key={i} insight={insight} />
                ))}
                {strategic?.opportunitiesJson.insights.map((insight: any, i: number) => (
                  <InsightCard key={i} insight={insight} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="memory" className="space-y-4">
          <CeoStrategyMemoryPanel 
            topPatterns={snapshot.topPatterns} 
            avoidPatterns={snapshot.avoidPatterns} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InsightCard({ insight }: any) {
  return (
    <div className="p-4 rounded-xl border bg-white shadow-sm space-y-3">
      <div className="flex justify-between items-start">
        <Badge variant={insight.category === "RISK" ? "destructive" : "outline"}>{insight.category}</Badge>
        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
          IMPACT: {insight.impactScore}
        </div>
      </div>
      <div>
        <h4 className="text-sm font-bold">{insight.title}</h4>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{insight.description}</p>
      </div>
      <div className="pt-2 border-t flex justify-between items-center">
        <span className="text-[10px] text-slate-400 italic">Confidence: {insight.confidenceScore}%</span>
      </div>
    </div>
  );
}

function MetricCard({ title, value, description, icon, trend, status }: any) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

function ContextItem({ label, value }: any) {
  return (
    <div className="flex justify-between items-center py-2 border-b last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}
