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
import { INTERRUPTIONS } from "../../../modules/investor/interruptionEngine";

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

export default function PitchRefinement() {
  const [activeSegment, setActiveSegment] = useState<PitchSegment>(PITCH_BLOCKS[0]);
  const [viewMode, setViewMode] = useState<"refine" | "demo" | "battlecard">("refine");

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
            <Button 
              variant={viewMode === "battlecard" ? "goldPrimary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("battlecard")}
              className="font-bold text-[10px] tracking-widest px-6"
            >
              <Target className="w-3 h-3 mr-2" />
              BATTLE CARD
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
                {/* ... existing refine content ... */}
              </div>
            ) : viewMode === "demo" ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-left duration-500">
                {/* ... existing demo content ... */}
              </div>
            ) : (
              <div className="space-y-8 animate-in zoom-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {INTERRUPTIONS.map((item, i) => (
                      <Card key={i} className="bg-zinc-900/50 border-white/5 overflow-hidden group hover:border-[#D4AF37]/30 transition-all">
                         <CardHeader className="p-6 bg-white/5 border-b border-white/5">
                            <CardTitle className="text-sm font-black text-white flex items-center gap-3">
                               <MessageSquare className="w-4 h-4 text-[#D4AF37]" />
                               {item.question}
                            </CardTitle>
                         </CardHeader>
                         <CardContent className="p-6 space-y-4">
                            <div className="space-y-2">
                               <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Strong Answer</p>
                               <p className="text-sm font-bold text-[#D4AF37] leading-relaxed italic">
                                  "{item.modelAnswer}"
                                </p>
                            </div>
                            <div className="pt-4 border-t border-white/5 space-y-2">
                               <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Key Points to Anchor</p>
                               <div className="flex flex-wrap gap-2">
                                  {item.idealPoints.map((point, pi) => (
                                     <Badge key={pi} className="bg-white/5 text-gray-400 border-white/10 text-[8px] font-bold">
                                        {point}
                                     </Badge>
                                  ))}
                               </div>
                            </div>
                         </CardContent>
                      </Card>
                   ))}
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
