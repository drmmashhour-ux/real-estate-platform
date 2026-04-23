"use client";

import * as React from "react";
import { format, addDays } from "date-fns";
import { 
  generateWeeklyPlan, 
  deployPlanToCalendar 
} from "@/modules/marketing-week-plan/marketing-week-plan.service";
import type { 
  WeeklyContentItem, 
  WeeklyContentPlan, 
  MarketingWeekPlanConfig 
} from "@/modules/marketing-week-plan/marketing-week-plan.types";
import { validateWeeklyPlan } from "@/modules/marketing-week-plan/marketing-week-plan-validation.service";
import { getJob } from "@/modules/auto-video/auto-video-job.service";
import { 
  CheckCircle2, 
  Clock, 
  Calendar, 
  PlaySquare, 
  Image as ImageIcon, 
  Layout, 
  ChevronRight,
  AlertCircle
} from "lucide-react";

const CONFIG: MarketingWeekPlanConfig = {
  city: "Montreal",
  focusAreas: ["Griffintown", "Downtown", "Old Montreal", "Westmount", "Laval"],
  audiences: ["BUYER", "INVESTOR", "BROKER"],
  goals: ["LEADS", "AWARENESS", "CONVERSION"],
};

export function MarketingWeekPlanDashboard() {
  const [plan, setPlan] = React.useState<WeeklyContentPlan | null>(null);
  const [selectedItem, setSelectedItem] = React.useState<WeeklyContentItem | null>(null);
  const [isDeploying, setIsDeploying] = React.useState(false);
  const [deploySuccess, setDeploySuccess] = React.useState(false);

  const handleGenerate = () => {
    const newPlan = generateWeeklyPlan(CONFIG);
    setPlan(newPlan);
    setSelectedItem(newPlan.items[0] || null);
    setDeploySuccess(false);
  };

  const handleDeploy = () => {
    if (!plan) return;
    setIsDeploying(true);
    // Simulate some logic
    setTimeout(() => {
      deployPlanToCalendar(plan);
      setIsDeploying(false);
      setDeploySuccess(true);
    }, 1000);
  };

  const validation = plan ? validateWeeklyPlan(plan.items) : null;

  return (
    <div className="space-y-8 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Week 1: Montreal Autopilot</h1>
          <p className="text-zinc-400 mt-1">Controlled content generation and approval pipeline.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleGenerate}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium transition-colors border border-zinc-700"
          >
            Regenerate Plan
          </button>
          <button
            disabled={!plan || !validation?.ok || isDeploying || deploySuccess}
            onClick={handleDeploy}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 rounded-lg font-bold transition-colors"
          >
            {isDeploying ? "Deploying..." : deploySuccess ? "Deployed to Calendar" : "Deploy to Calendar"}
          </button>
        </div>
      </div>

      {!plan ? (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-zinc-800 rounded-2xl bg-zinc-900/30">
          <Calendar className="w-12 h-12 text-zinc-700 mb-4" />
          <h3 className="text-xl font-medium text-zinc-400">No plan generated yet.</h3>
          <button
            onClick={handleGenerate}
            className="mt-4 px-6 py-2 bg-amber-500 text-zinc-950 rounded-full font-bold hover:bg-amber-400"
          >
            Generate Week 1 Plan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: List & Distribution */}
          <div className="lg:col-span-4 space-y-6">
            <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Layout className="w-5 h-5 text-amber-500" />
                Distribution
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Total Items</span>
                  <span className="font-mono text-amber-500">{plan.items.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Videos</span>
                  <span className="font-mono text-amber-500">{plan.items.filter(i => i.type === "VIDEO").length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Posters</span>
                  <span className="font-mono text-amber-500">{plan.items.filter(i => i.type === "POSTER").length}</span>
                </div>
                <div className="pt-3 border-t border-zinc-800">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2 font-bold">Goals</p>
                  <div className="flex flex-wrap gap-2">
                    {CONFIG.goals.map(g => (
                      <span key={g} className="px-2 py-0.5 bg-zinc-800 rounded text-[10px] text-zinc-300 border border-zinc-700">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
                <h2 className="font-bold">Approval Queue</h2>
                <span className="text-xs px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded border border-amber-500/20 font-bold uppercase">
                  Ready
                </span>
              </div>
              <div className="max-h-[500px] overflow-y-auto divide-y divide-zinc-800">
                {plan.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`w-full p-4 text-left hover:bg-zinc-800/50 transition-colors flex items-center gap-3 ${
                      selectedItem?.id === item.id ? "bg-zinc-800/80 border-l-4 border-amber-500" : "border-l-4 border-transparent"
                    }`}
                  >
                    <div className="shrink-0 w-10 h-10 rounded bg-zinc-950 border border-zinc-800 flex items-center justify-center">
                      {item.type === "VIDEO" ? <PlaySquare className="w-5 h-5 text-amber-500" /> : <ImageIcon className="w-5 h-5 text-zinc-500" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">{item.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-zinc-500 uppercase font-mono">Day {item.day}</span>
                        <span className="text-[10px] px-1 bg-zinc-800 rounded text-zinc-400 border border-zinc-700">{item.platform}</span>
                      </div>
                    </div>
                    <ChevronRight className="ml-auto w-4 h-4 text-zinc-600" />
                  </button>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column: Preview & Edit */}
          <div className="lg:col-span-8">
            {selectedItem ? (
              <div className="space-y-6">
                <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="text-xs text-amber-500 font-bold uppercase tracking-widest">
                        {selectedItem.type} PREVIEW
                      </span>
                      <h2 className="text-2xl font-bold mt-1">{selectedItem.title}</h2>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-zinc-400 text-sm">
                        <Clock className="w-4 h-4" />
                        Scheduled for Day {selectedItem.day} at {selectedItem.time}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Hook</label>
                        <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-amber-100 italic">
                          "{selectedItem.hook}"
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Script / Storyboard</label>
                        <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-300 whitespace-pre-line leading-relaxed">
                          {selectedItem.type === "VIDEO" && selectedItem.videoRequestId 
                            ? getJob(selectedItem.videoRequestId)?.shotList 
                            : selectedItem.script}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Call to Action</label>
                        <div className="px-3 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-lg font-bold">
                          {selectedItem.cta}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Caption</label>
                        <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-400">
                          {selectedItem.caption}
                          <div className="mt-3 flex flex-wrap gap-1">
                            {selectedItem.hashtags.map(h => (
                              <span key={h} className="text-amber-500/80">#{h}</span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg">
                        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Attributes</h4>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <p className="text-zinc-500 mb-1">Audience</p>
                            <p className="font-medium">{selectedItem.audience}</p>
                          </div>
                          <div>
                            <p className="text-zinc-500 mb-1">Goal</p>
                            <p className="font-medium">{selectedItem.goal}</p>
                          </div>
                          <div>
                            <p className="text-zinc-500 mb-1">Area</p>
                            <p className="font-medium">{selectedItem.area}</p>
                          </div>
                          <div>
                            <p className="text-zinc-500 mb-1">Platform</p>
                            <p className="font-medium">{selectedItem.platform}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-zinc-800 flex gap-3">
                    <button className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-bold border border-zinc-700">
                      Edit Content
                    </button>
                    <button className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-lg font-bold">
                      Approve This Item
                    </button>
                  </div>
                </section>

                {selectedItem.type === "VIDEO" && selectedItem.videoRequestId && (
                  <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <PlaySquare className="w-5 h-5 text-amber-500" />
                      Auto-Video Render Manifest (Preview)
                    </h3>
                    <pre className="p-4 bg-black rounded-lg text-[10px] text-zinc-500 overflow-x-auto">
                      {JSON.stringify(getJob(selectedItem.videoRequestId)?.manifest, null, 2)}
                    </pre>
                  </section>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-500 border border-zinc-800 border-dashed rounded-xl bg-zinc-900/30">
                Select an item from the queue to preview.
              </div>
            )}
          </div>
        </div>
      )}

      {plan && !validation?.ok && (
        <div className="p-4 bg-red-950/20 border border-red-900/50 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-red-500">Plan Validation Errors</h4>
            <ul className="mt-1 text-sm text-red-400 list-disc list-inside space-y-1">
              {validation?.errors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
      
      {deploySuccess && (
        <div className="p-4 bg-emerald-950/20 border border-emerald-900/50 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          <p className="text-emerald-500 font-bold">Plan successfully deployed to the Content Calendar!</p>
        </div>
      )}
    </div>
  );
}
