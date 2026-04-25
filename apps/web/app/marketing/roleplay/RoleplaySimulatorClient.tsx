"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  MessageSquare, 
  Play, 
  RefreshCcw, 
  Trophy, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle2, 
  User, 
  Zap, 
  Send,
  BarChart3,
  Lightbulb,
  Shield
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { BROKER_SCENARIOS, simulateBrokerResponse, BrokerScenarioId, SimulatorResponse } from "@/modules/roleplay/simulator";

export function RoleplaySimulatorClient() {
  const [selectedScenarioId, setSelectedMarketScenario] = useState<BrokerScenarioId>("BUSY");
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [lastFeedback, setLastFeedback] = useState<SimulatorResponse["feedback"] | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scenario = BROKER_SCENARIOS.find(s => s.id === selectedScenarioId)!;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const startSimulation = () => {
    setMessages([{ role: "assistant", content: scenario.initialMessage }]);
    setLastFeedback(null);
    setIsSimulating(true);
  };

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMessage = { role: "user" as const, content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue("");

    // Simulate delay
    setTimeout(() => {
      const response = simulateBrokerResponse(text, selectedScenarioId, updatedMessages);
      setMessages(prev => [...prev, { role: "assistant", content: response.text }]);
      setLastFeedback(response.feedback);
    }, 800);
  };

  return (
    <div className="p-8 space-y-10 max-w-7xl mx-auto min-h-screen bg-black text-white">
      {/* Header */}
      <div className="flex justify-between items-end border-b border-white/5 pb-8">
        <div className="space-y-1">
          <Badge variant="gold" className="text-[8px] tracking-[0.3em] px-3 mb-2 font-black">OPERATOR TRAINING</Badge>
          <h1 className="text-4xl font-black tracking-tighter uppercase">Broker Roleplay</h1>
          <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Master the Québec Broker Call.</p>
        </div>
        {!isSimulating ? (
          <Button 
            variant="goldPrimary" 
            onClick={startSimulation}
            className="h-14 px-10 font-black text-[11px] tracking-[0.2em] rounded-2xl"
          >
            <Play className="w-4 h-4 mr-2" />
            START SESSION
          </Button>
        ) : (
          <Button 
            variant="ghost" 
            onClick={() => setIsSimulating(false)}
            className="h-14 px-8 font-black text-[11px] tracking-[0.2em] rounded-2xl border border-white/10"
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            RESET
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Scenario Selector & Info */}
        <div className="lg:col-span-4 space-y-6">
          <div className="space-y-4">
            <h2 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] px-2">Select Persona</h2>
            <div className="grid gap-2">
              {BROKER_SCENARIOS.map((s) => (
                <button
                  key={s.id}
                  disabled={isSimulating}
                  onClick={() => setSelectedMarketScenario(s.id)}
                  className={`w-full text-left p-5 rounded-3xl border transition-all ${
                    selectedScenarioId === s.id 
                      ? "bg-[#D4AF37]/10 border-[#D4AF37]/30 text-white" 
                      : "bg-zinc-900/50 border-white/5 text-zinc-500 hover:border-white/10"
                  } ${isSimulating && selectedScenarioId !== s.id ? "opacity-30" : ""}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-black uppercase tracking-tight">{s.name}</span>
                    <Badge variant={selectedScenarioId === s.id ? "gold" : "outline"} className="text-[8px]">
                      {s.traits[0]}
                    </Badge>
                  </div>
                  <p className="text-[10px] font-medium opacity-60 line-clamp-1">{s.description}</p>
                </button>
              ))}
            </div>
          </div>

          {isSimulating && (
            <Card className="bg-blue-500/5 border-blue-500/10 rounded-3xl p-6 space-y-4 animate-in fade-in slide-in-from-left duration-500">
              <div className="flex items-center gap-2 text-blue-400">
                <Shield className="w-4 h-4" />
                <h3 className="text-[10px] font-black uppercase tracking-widest">Active Objections</h3>
              </div>
              <div className="space-y-2">
                {scenario.objections.map((obj, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 bg-black/40 rounded-xl border border-white/5 text-[10px] text-zinc-400 font-medium">
                    <AlertCircle className="w-3 h-3 mt-0.5 shrink-0 text-amber-500" />
                    "{obj}"
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Chat / Simulation Area */}
        <div className="lg:col-span-8 space-y-6">
          {!isSimulating ? (
            <div className="h-[600px] flex flex-col items-center justify-center border border-dashed border-white/10 rounded-[3rem] bg-zinc-900/20 space-y-6 text-center p-12">
              <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-zinc-700" />
              </div>
              <div className="space-y-2 max-w-sm">
                <h3 className="text-xl font-black uppercase tracking-tight">Ready to Train?</h3>
                <p className="text-sm text-zinc-500 font-medium leading-relaxed">
                  Select a persona and start a conversation. You'll receive real-time feedback on your clarity, confidence, and closing skills.
                </p>
              </div>
              <Button 
                variant="goldPrimary" 
                onClick={startSimulation}
                className="h-12 px-8 font-black text-[10px] tracking-[0.2em] rounded-xl"
              >
                START TRAINING
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[700px]">
              {/* Chat Column */}
              <div className="lg:col-span-7 flex flex-col bg-zinc-900/50 border border-white/5 rounded-[2.5rem] overflow-hidden">
                <div className="bg-white/5 p-4 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#D4AF37]/10 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-[#D4AF37]" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest">{scenario.name}</span>
                  </div>
                  <Badge variant="outline" className="text-[8px] animate-pulse">LIVE SIMULATION</Badge>
                </div>

                <div 
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide"
                >
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === "assistant" ? "justify-start" : "justify-end"}`}>
                      <div className={`max-w-[85%] p-4 rounded-3xl text-sm leading-relaxed ${
                        m.role === "assistant" 
                          ? "bg-zinc-800 text-zinc-300 rounded-tl-none" 
                          : "bg-[#D4AF37] text-black font-bold rounded-tr-none shadow-xl shadow-[#D4AF37]/10"
                      }`}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-6 border-t border-white/5 bg-black/40">
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage(inputValue);
                    }}
                    className="relative"
                  >
                    <Input 
                      placeholder="Type your response or select a script below..."
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      className="h-14 bg-zinc-900 border-white/10 rounded-2xl pl-6 pr-14 text-sm"
                    />
                    <button 
                      type="submit"
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-3 text-[#D4AF37] hover:text-white transition-colors"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </form>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button 
                      onClick={() => handleSendMessage("I help brokers close more deals using AI.")}
                      className="text-[9px] font-black uppercase tracking-widest px-3 py-2 bg-white/5 border border-white/5 rounded-full hover:bg-white/10 transition-colors"
                    >
                      Script: Focus on ROI
                    </button>
                    <button 
                      onClick={() => handleSendMessage("Do you have 2 minutes for a quick demo?")}
                      className="text-[9px] font-black uppercase tracking-widest px-3 py-2 bg-white/5 border border-white/5 rounded-full hover:bg-white/10 transition-colors"
                    >
                      Script: Quick Demo
                    </button>
                  </div>
                </div>
              </div>

              {/* Feedback Column */}
              <div className="lg:col-span-5 space-y-6 overflow-y-auto scrollbar-hide">
                <Card className="bg-zinc-900 border-white/5 rounded-[2rem] overflow-hidden">
                  <CardHeader className="bg-white/5 p-6 pb-2 border-b border-white/5">
                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-blue-400" />
                      Session Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    {lastFeedback ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { label: "Clarity", val: lastFeedback.scores.clarity, color: "text-blue-400" },
                            { label: "Confidence", val: lastFeedback.scores.confidence, color: "text-[#D4AF37]" },
                            { label: "Closing", val: lastFeedback.scores.closing, color: "text-green-500" }
                          ].map((s, i) => (
                            <div key={i} className="text-center p-3 bg-white/5 rounded-2xl border border-white/5">
                              <p className="text-[8px] font-black text-zinc-500 uppercase mb-1">{s.label}</p>
                              <p className={`text-xl font-black ${s.color}`}>{s.val}%</p>
                            </div>
                          ))}
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <p className="text-[9px] font-black text-green-500 uppercase tracking-widest">Good</p>
                            <div className="space-y-1">
                              {lastFeedback.good.map((g, i) => (
                                <div key={i} className="flex items-start gap-2 text-[11px] text-zinc-300 font-medium">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                                  {g}
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div className="space-y-2 pt-2 border-t border-white/5">
                            <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest">To Improve</p>
                            <div className="space-y-1">
                              {lastFeedback.toImprove.map((imp, i) => (
                                <div key={i} className="flex items-start gap-2 text-[11px] text-zinc-300 font-medium">
                                  <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                                  {imp}
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="p-4 bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-2xl space-y-2">
                            <p className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest flex items-center gap-2">
                              <Lightbulb className="w-3 h-3" />
                              Better Answer
                            </p>
                            <p className="text-[11px] text-zinc-300 font-bold italic">
                              "{lastFeedback.suggestedAnswer}"
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="py-20 text-center space-y-4">
                        <Trophy className="w-12 h-12 text-zinc-800 mx-auto" />
                        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Waiting for response...</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
