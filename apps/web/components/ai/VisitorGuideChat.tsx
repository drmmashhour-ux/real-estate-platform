"use client";

import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, ArrowRight, Zap, Info, ShieldCheck, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { generateVisitorGuideResponse, VisitorContext } from "@/modules/ai-guide/visitor-guide.agent";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/lib/tracking/events";

export function VisitorGuideChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "assistant" | "user"; content: string; quickReplies?: string[] }[]>([
    {
      role: "assistant",
      content: "Hey! I'm your LECIPM guide. How can I help you close more deals today?",
      quickReplies: ["What is this?", "How does it work?", "How do I get leads?"]
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const pathname = usePathname();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;

    // Track interaction (Phase 8)
    trackEvent("ai_guide_question", { question: text, route: pathname });

    setMessages(prev => [...prev, { role: "user", content: text }]);
    setInputValue("");

    setTimeout(() => {
      const context: VisitorContext = {
        route: pathname,
        isLoggedIn: false, // Default for guide, can be dynamic
        hasPurchasedBefore: false
      };
      
      const response = generateVisitorGuideResponse(text, context);
      
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: response.text,
        quickReplies: response.quickReplies
      }]);
    }, 600);
  };

  const handleQuickReply = (text: string) => {
    handleSendMessage(text);
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => {
          setIsOpen(true);
          trackEvent("ai_guide_opened", { route: pathname });
        }}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#D4AF37] text-black rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all z-50 animate-bounce"
      >
        <MessageSquare className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-full max-w-[350px] z-50 animate-in slide-in-from-bottom-4 duration-300">
      <Card className="bg-zinc-900 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden rounded-3xl">
        <div className="bg-[#D4AF37] p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black/20 rounded-full flex items-center justify-center">
              <Zap className="w-4 h-4 text-black" />
            </div>
            <div>
              <p className="text-[10px] font-black text-black/50 uppercase tracking-widest">AI Guide</p>
              <p className="text-xs font-black text-black uppercase">LECIPM Assistant</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-black/50 hover:text-black transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <CardContent className="p-0">
          <div 
            ref={scrollRef}
            className="h-[350px] overflow-y-auto p-4 space-y-4 scrollbar-hide bg-black/20"
          >
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "assistant" ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                  m.role === "assistant" 
                    ? "bg-white/5 text-zinc-300 rounded-tl-none border border-white/5" 
                    : "bg-[#D4AF37] text-black font-bold rounded-tr-none"
                }`}>
                  {m.content}
                  
                  {m.role === "assistant" && m.quickReplies && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {m.quickReplies.map((qr, qi) => (
                        <button
                          key={qi}
                          onClick={() => {
                            handleQuickReply(qr);
                            trackEvent("ai_guide_quick_reply", { reply: qr, route: pathname });
                          }}
                          className="bg-white/10 hover:bg-white/20 text-[10px] font-bold py-1 px-3 rounded-full transition-colors border border-white/5"
                        >
                          {qr}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-white/5 bg-zinc-900/80">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputValue);
              }}
              className="relative"
            >
              <input 
                type="text"
                placeholder="Ask me anything..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#D4AF37] transition-all"
              />
              <button 
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[#D4AF37] hover:text-white transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <p className="mt-2 text-[8px] text-zinc-600 font-bold uppercase text-center tracking-widest">
              Guided by LECIPM Intelligence
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
