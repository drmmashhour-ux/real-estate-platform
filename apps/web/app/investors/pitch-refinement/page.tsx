"use client";

import React, { useState } from "react";
import { 
  FileText, 
  Map, 
  Monitor, 
  Sparkles, 
  ArrowRight, 
  Layout, 
  CheckCircle2, 
  MessageSquare,
  Zap,
  MousePointer2,
  Eye,
  ChevronRight,
  Target
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { PITCH_BLOCKS, refinePitch, PitchSegment } from "../../../modules/investor/pitchRefiner";

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

export default function PitchRefinement() {
  const [activeSegment, setActiveSegment] = useState<PitchSegment>(PITCH_BLOCKS[0]);
  const [viewMode, setViewMode] = useState<"refine" | "demo">("refine");

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-10">
          <div className="space-y-2">
            <Badge variant="gold" className="text-[10px] mb-2 uppercase tracking-tighter">Strategic Alignment</Badge>
            <h1 className="text-4xl font-black tracking-tight">
              Demo-Aligned <span className="text-[#D4AF37]">Pitch Refiner</span>
            </h1>
            <p className="text-gray-400 max-w-xl">
              Alignez votre discours sur le produit réel. Transformez des concepts vagues en démonstrations tangibles et convaincantes.
            </p>
          </div>
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            <Button 
              variant={viewMode === "refine" ? "goldPrimary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("refine")}
              className="font-bold text-[10px] tracking-widest px-6"
            >
              <Sparkles className="w-3 h-3 mr-2" />
              REFINEMENT
            </Button>
            <Button 
              variant={viewMode === "demo" ? "goldPrimary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("demo")}
              className="font-bold text-[10px] tracking-widest px-6"
            >
              <Monitor className="w-3 h-3 mr-2" />
              DEMO SYNC
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sidebar Navigation */}
          <div className="lg:col-span-3 space-y-2">
            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4 ml-2">Pitch Structure</h3>
            {PITCH_BLOCKS.map((block) => (
              <button
                key={block.id}
                onClick={() => setActiveSegment(block)}
                className={cn(
                  "w-full text-left p-4 rounded-2xl transition-all duration-300 group flex items-center justify-between border",
                  activeSegment.id === block.id 
                    ? "bg-[#D4AF37]/10 border-[#D4AF37]/30 text-white" 
                    : "bg-transparent border-transparent text-gray-500 hover:bg-white/5"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    activeSegment.id === block.id ? "bg-[#D4AF37]" : "bg-white/10"
                  )} />
                  <span className="font-bold text-sm">{block.title}</span>
                </div>
                <ChevronRight className={cn(
                  "w-4 h-4 transition-transform",
                  activeSegment.id === block.id ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0 group-hover:opacity-50"
                )} />
              </button>
            ))}
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-9 space-y-6">
            
            {viewMode === "refine" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-right duration-500">
                {/* Original Pitch */}
                <Card className="bg-black/40 border-white/5 flex flex-col h-full">
                  <CardHeader className="border-b border-white/5">
                    <CardTitle className="text-sm font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Original Version
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 flex-1 flex flex-col justify-center text-center italic text-gray-400 leading-relaxed">
                    "{activeSegment.before}"
                  </CardContent>
                </Card>

                {/* Refined Pitch */}
                <Card className="bg-[#D4AF37]/5 border-[#D4AF37]/20 flex flex-col h-full relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4">
                     <Badge variant="gold" className="animate-pulse">Refined</Badge>
                  </div>
                  <CardHeader className="border-b border-[#D4AF37]/10">
                    <CardTitle className="text-sm font-black text-[#D4AF37] uppercase tracking-widest flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      High-Impact Script
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 flex-1 flex flex-col justify-center text-center text-xl font-bold text-white leading-tight">
                    "{activeSegment.after}"
                  </CardContent>
                </Card>

                {/* Mapping Information */}
                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div className="p-6 bg-white/5 border border-white/5 rounded-3xl flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400">
                         <Layout className="w-6 h-6" />
                      </div>
                      <div>
                         <p className="text-[10px] font-black text-gray-500 uppercase">UI Mapping</p>
                         <p className="font-bold text-white">{activeSegment.uiMapping}</p>
                      </div>
                   </div>
                   <div className="p-6 bg-white/5 border border-white/5 rounded-3xl flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-400">
                         <Target className="w-6 h-6" />
                      </div>
                      <div>
                         <p className="text-[10px] font-black text-gray-500 uppercase">Demo Focus</p>
                         <p className="font-bold text-white">{activeSegment.demoAction}</p>
                      </div>
                   </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in slide-in-from-left duration-500">
                 <Card className="bg-zinc-900 border-white/5 p-12 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-[100px] -mr-32 -mt-32" />
                    
                    <div className="max-w-2xl mx-auto space-y-12">
                       <div className="space-y-4 text-center">
                          <h3 className="text-3xl font-black">{activeSegment.title}</h3>
                          <div className="h-1 w-24 bg-[#D4AF37] mx-auto rounded-full" />
                       </div>

                       <div className="space-y-10">
                          {/* Step 1: Say */}
                          <div className="flex gap-6 items-start">
                             <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center shrink-0 font-black text-xs">1</div>
                             <div className="space-y-2">
                                <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                   <MessageSquare className="w-4 h-4" />
                                   WHAT TO SAY
                                </h4>
                                <p className="text-xl font-bold text-white leading-relaxed italic">
                                   "{activeSegment.after}"
                                </p>
                             </div>
                          </div>

                          {/* Step 2: Show */}
                          <div className="flex gap-6 items-start">
                             <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center shrink-0 font-black text-xs">2</div>
                             <div className="space-y-2">
                                <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                   <Eye className="w-4 h-4" />
                                   WHAT TO SHOW
                                </h4>
                                <p className="text-lg font-bold text-[#D4AF37]">
                                   {activeSegment.uiMapping}
                                </p>
                             </div>
                          </div>

                          {/* Step 3: Action */}
                          <div className="flex gap-6 items-start">
                             <div className="w-10 h-10 bg-[#D4AF37] text-black rounded-full flex items-center justify-center shrink-0 font-black text-xs shadow-[0_0_20px_rgba(212,175,55,0.3)]">3</div>
                             <div className="space-y-2">
                                <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                   <MousePointer2 className="w-4 h-4" />
                                   WHERE TO CLICK
                                </h4>
                                <p className="text-lg font-bold text-white">
                                   {activeSegment.demoAction}
                                </p>
                             </div>
                          </div>
                       </div>
                    </div>
                 </Card>

                 <div className="flex justify-between items-center bg-white/5 border border-white/5 p-6 rounded-3xl">
                    <Button variant="ghost" onClick={() => {
                      const idx = PITCH_BLOCKS.findIndex(b => b.id === activeSegment.id);
                      if (idx > 0) setActiveSegment(PITCH_BLOCKS[idx - 1]);
                    }}>
                       Précédent
                    </Button>
                    <div className="flex gap-2">
                       {PITCH_BLOCKS.map((b) => (
                         <div key={b.id} className={cn(
                           "w-2 h-2 rounded-full",
                           activeSegment.id === b.id ? "bg-[#D4AF37]" : "bg-white/10"
                         )} />
                       ))}
                    </div>
                    <Button variant="goldPrimary" onClick={() => {
                      const idx = PITCH_BLOCKS.findIndex(b => b.id === activeSegment.id);
                      if (idx < PITCH_BLOCKS.length - 1) setActiveSegment(PITCH_BLOCKS[idx + 1]);
                    }}>
                       Suivant
                       <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                 </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
