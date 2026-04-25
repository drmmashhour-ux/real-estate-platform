"use client";

import React, { useState } from "react";
import { 
  Play, 
  MousePointer2, 
  MessageSquare, 
  Clock, 
  AlertCircle, 
  CheckSquare, 
  HelpCircle, 
  ChevronRight, 
  ChevronLeft,
  Layout,
  Zap,
  ShieldCheck,
  CreditCard,
  FileText,
  Search,
  Monitor,
  Sparkles,
  Target
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

interface DemoStep {
  id: number;
  title: string;
  instruction: string;
  script: string;
  presenterNote: string;
  timing: string;
  backupScript: string;
}

const DEMO_STEPS: DemoStep[] = [
  {
    id: 1,
    title: "Opening Hook",
    instruction: "Stand center, no screen interaction yet.",
    script: "Real estate transactions in Québec are complex, manual, and risky. LECIPM turns that into a guided AI-assisted transaction flow.",
    presenterNote: "Establish authority. Pause for 2 seconds after the hook.",
    timing: "10s",
    backupScript: "Most buyers and sellers feel lost in the paperwork. We solve that with intelligence."
  },
  {
    id: 2,
    title: "Click: Open Listing Page",
    instruction: "Show property page (e.g., /listing/123).",
    script: "We start where the user starts: on a property.",
    presenterNote: "Keep the UI clean. Point to the property details.",
    timing: "5s",
    backupScript: "The journey begins with a property they love."
  },
  {
    id: 3,
    title: "Click: Faire une offre Turbo",
    instruction: "Click the prominent 'Faire une offre Turbo' button.",
    script: "One click launches a guided offer flow.",
    presenterNote: "Highlight the speed of entry compared to traditional methods.",
    timing: "5s",
    backupScript: "Instead of searching for forms, the system provides them instantly."
  },
  {
    id: 4,
    title: "Show Guided Form",
    instruction: "Scroll through the multi-step form quickly.",
    script: "This is not a blank form. It guides the user step by step.",
    presenterNote: "Mention that it uses OACIQ-compliant structures behind the scenes.",
    timing: "10s",
    backupScript: "We break down complex legal requirements into simple user inputs."
  },
  {
    id: 5,
    title: "Trigger: Buyer Not Represented",
    instruction: "Show the system detection of unrepresented status.",
    script: "The system detects when the buyer is not represented and explains the limited role of the broker.",
    presenterNote: "This is a key compliance feature for Law 25 and OACIQ rules.",
    timing: "10s",
    backupScript: "We ensure transparency about representation from the very first minute."
  },
  {
    id: 6,
    title: "Trigger: Sans Garantie Légale",
    instruction: "Select the 'Exclusion of Legal Warranty' checkbox.",
    script: "Here we select a risky clause. LECIPM immediately explains the consequence and requires acknowledgment.",
    presenterNote: "Show the 'CRITICAL' notice that pops up.",
    timing: "15s",
    backupScript: "We protect the user from signing away their rights without full understanding."
  },
  {
    id: 7,
    title: "Click: AI Review",
    instruction: "Trigger the AI Review panel.",
    script: "AI reviews the draft, but it cannot bypass compliance. It flags risks and suggests safer wording.",
    presenterNote: "Emphasize that AI is an assistant, not the decider.",
    timing: "15s",
    backupScript: "Our proprietary engine checks for contradictions and missing clauses."
  },
  {
    id: 8,
    title: "Show Compliance Score",
    instruction: "Point to the Trust Hub / Compliance Score widget.",
    script: "The Trust Hub shows whether the document is ready or still risky.",
    presenterNote: "The score is a tangible metric for the 'readiness' of the deal.",
    timing: "10s",
    backupScript: "We turn legal ambiguity into a clear, actionable score."
  },
  {
    id: 9,
    title: "Attempt Signature Early",
    instruction: "Try to click 'Signer' while score is low or notices are pending.",
    script: "Now I try to sign too early. The system blocks it.",
    presenterNote: "This 'Signature Gate' is our most powerful safety feature.",
    timing: "10s",
    backupScript: "The system is non-bypassable. Safety over speed, always."
  },
  {
    id: 10,
    title: "Fix Missing Items",
    instruction: "Acknowledge a notice and fix one input.",
    script: "After notices are acknowledged and issues fixed, the draft becomes ready.",
    presenterNote: "Show the score jumping up as issues are resolved.",
    timing: "10s",
    backupScript: "Resolution is guided, ensuring the user is never stuck."
  },
  {
    id: 11,
    title: "Show Payment",
    instruction: "Proceed to the final step where the payment wall appears.",
    script: "Revenue starts with pay-per-contract and broker tools.",
    presenterNote: "Mention the $15-$49 per-draft model for consumers.",
    timing: "10s",
    backupScript: "Monetization is integrated directly into the transaction success path."
  },
  {
    id: 12,
    title: "Show PDF + Audit Trail",
    instruction: "Generate the PDF and show the Forensic Audit Log.",
    script: "Every action is logged, and the final document is versioned with proof.",
    presenterNote: "Point out the SHA-256 hash at the bottom of the document.",
    timing: "15s",
    backupScript: "We create a permanent, immutable record for forensic accountability."
  },
  {
    id: 13,
    title: "Closing",
    instruction: "Close the demo and return to the slide deck.",
    script: "LECIPM is building the intelligent transaction layer for Québec real estate.",
    presenterNote: "Final powerful statement. Open for applause/transition.",
    timing: "10s",
    backupScript: "We are the trust layer for the future of real estate."
  }
];

export default function LiveDemoScript() {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const currentStep = DEMO_STEPS[currentStepIdx];

  const nextStep = () => {
    if (currentStepIdx < DEMO_STEPS.length - 1) {
      setCurrentStepIdx(currentStepIdx + 1);
    }
  };

  const prevStep = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx(currentStepIdx - 1);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-10">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
               <Badge variant="gold" className="text-[10px] uppercase tracking-[0.2em] px-3 py-1 bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20 font-black">Investor Mode</Badge>
               <div className="w-1 h-1 rounded-full bg-white/20" />
               <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">v2.1 Demo Script</span>
            </div>
            <h1 className="text-5xl font-black tracking-tighter leading-none">
              LECIPM <span className="text-[#D4AF37] italic">Live Demo Command</span>
            </h1>
            <p className="text-gray-400 max-w-2xl text-lg font-medium leading-relaxed">
              Le guide complet pour une démonstration investisseur percutante. Suivez les étapes, respectez le timing et maîtrisez le récit.
            </p>
          </div>
          <div className="flex gap-3">
             <Button variant="outline" className="h-12 border-white/10 font-bold text-xs tracking-widest uppercase hover:bg-white/5 px-6">
                <HelpCircle className="w-4 h-4 mr-2" />
                INVESTOR Q&A
             </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Main Content: Step by Step */}
          <div className="lg:col-span-8 space-y-8">
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] flex items-center gap-2">
                  <Monitor className="w-3 h-3" />
                  Live Demo Workflow
               </h3>
               <div className="flex items-center gap-4">
                  <span className="text-xs font-black text-gray-600">STEP {currentStep.id} / {DEMO_STEPS.length}</span>
                  <div className="flex gap-1">
                     {DEMO_STEPS.map((_, i) => (
                       <div key={i} className={cn(
                         "h-1 w-4 rounded-full transition-all duration-300",
                         i === currentStepIdx ? "bg-[#D4AF37] w-8" : 
                         i < currentStepIdx ? "bg-green-500/40" : "bg-white/10"
                       )} />
                     ))}
                  </div>
               </div>
            </div>

            <Card className="bg-zinc-900/50 border-white/5 rounded-[3rem] overflow-hidden shadow-2xl transition-all duration-500 transform hover:scale-[1.01]">
               <div className="p-10 space-y-10">
                  <div className="flex items-center justify-between border-b border-white/5 pb-8">
                     <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-[#D4AF37]/10 rounded-2xl flex items-center justify-center border border-[#D4AF37]/20">
                           <Play className="w-6 h-6 text-[#D4AF37] fill-current" />
                        </div>
                        <h2 className="text-3xl font-black tracking-tight">{currentStep.title}</h2>
                     </div>
                     <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-black text-white">{currentStep.timing}</span>
                     </div>
                  </div>

                  <div className="space-y-12">
                     {/* Instruction */}
                     <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                           <MousePointer2 className="w-4 h-4 text-[#D4AF37]" />
                           WHAT TO DO (CLICK)
                        </h4>
                        <div className="p-6 bg-white/5 border border-white/5 rounded-2xl text-lg font-bold text-white border-l-4 border-l-[#D4AF37]">
                           {currentStep.instruction}
                        </div>
                     </div>

                     {/* Script */}
                     <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                           <MessageSquare className="w-4 h-4 text-blue-400" />
                           WHAT TO SAY (SCRIPT)
                        </h4>
                        <div className="p-8 bg-blue-500/5 border border-blue-500/10 rounded-3xl text-2xl font-black leading-tight italic text-blue-50">
                           "{currentStep.script}"
                        </div>
                     </div>

                     {/* Backup */}
                     <div className="space-y-4 opacity-50 hover:opacity-100 transition-opacity">
                        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                           <AlertCircle className="w-4 h-4" />
                           BACKUP SCRIPT (IF SLOW)
                        </h4>
                        <p className="text-sm text-gray-400 font-medium italic px-4">
                           "{currentStep.backupScript}"
                        </p>
                     </div>
                  </div>
               </div>

               <div className="p-8 bg-black/40 border-t border-white/5 flex justify-between items-center">
                  <Button 
                    variant="ghost" 
                    onClick={prevStep} 
                    disabled={currentStepIdx === 0}
                    className="h-12 px-6 font-black text-xs tracking-widest uppercase hover:bg-white/5 disabled:opacity-30"
                  >
                     <ChevronLeft className="w-4 h-4 mr-2" />
                     BACK
                  </Button>
                  <Button 
                    onClick={nextStep} 
                    disabled={currentStepIdx === DEMO_STEPS.length - 1}
                    className="h-14 px-10 bg-[#D4AF37] text-black font-black text-sm tracking-widest uppercase rounded-2xl shadow-[0_0_30px_rgba(212,175,55,0.15)] hover:scale-105 transition-transform"
                  >
                     NEXT STEP
                     <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
               </div>
            </Card>

            {/* Presenter Notes */}
            <Card className="p-8 bg-zinc-900/30 border-dashed border-white/10 rounded-[2.5rem] flex items-start gap-6">
               <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center shrink-0 border border-white/5">
                  <Sparkles className="w-6 h-6 text-yellow-400" />
               </div>
               <div className="space-y-2">
                  <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Presenter Secret Notes</h4>
                  <p className="text-gray-300 font-medium leading-relaxed italic">
                     "{currentStep.presenterNote}"
                  </p>
               </div>
            </Card>
          </div>

          {/* Right Column: Checklist & Resources */}
          <div className="lg:col-span-4 space-y-10">
             
             {/* Demo Checklist */}
             <section className="space-y-6">
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] ml-2 flex items-center gap-2">
                   <CheckSquare className="w-3 h-3" />
                   Pre-Demo Checklist
                </h3>
                <Card className="p-8 bg-zinc-900/50 border-white/5 rounded-[2.5rem] space-y-6">
                   {[
                     "Check internet connection (stable 10Mbps+)",
                     "Reset all demo data to 'Listing 123'",
                     "Ensure 'Production Mode' flag is ON",
                     "Clean browser cache/history",
                     "Mute all notifications (Mac focus mode)",
                     "Have backup 4G hotspot ready"
                   ].map((item, i) => (
                     <div key={i} className="flex items-center gap-4 group">
                        <div className="w-6 h-6 rounded-lg border border-white/10 flex items-center justify-center group-hover:bg-[#D4AF37]/20 group-hover:border-[#D4AF37]/40 transition-all cursor-pointer">
                           <div className="w-2 h-2 rounded-sm bg-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <span className="text-sm text-gray-400 group-hover:text-white transition-colors">{item}</span>
                     </div>
                   ))}
                </Card>
             </section>

             {/* Investor FAQ Quick Link */}
             <section className="space-y-6">
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] ml-2 flex items-center gap-2">
                   <Target className="w-3 h-3" />
                   Investor Focus
                </h3>
                <div className="grid grid-cols-1 gap-4">
                   <div className="p-6 bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-3xl space-y-4">
                      <h4 className="text-sm font-black text-white flex items-center gap-2">
                         <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
                         Defense Moat
                      </h4>
                      <p className="text-xs text-gray-400 leading-relaxed italic">
                         "Remind them: DocuSign is signature. ChatGPT is text. LECIPM is compliant transaction logic."
                      </p>
                   </div>
                   <div className="p-6 bg-blue-500/5 border border-blue-500/20 rounded-3xl space-y-4">
                      <h4 className="text-sm font-black text-white flex items-center gap-2">
                         <CreditCard className="w-5 h-5 text-blue-400" />
                         Monetization
                      </h4>
                      <p className="text-xs text-gray-400 leading-relaxed italic">
                         "Transaction fee ($15) + Professional SaaS layer. High volume, high frequency."
                      </p>
                   </div>
                   <div className="p-6 bg-green-500/5 border border-green-500/20 rounded-3xl space-y-4">
                      <h4 className="text-sm font-black text-white flex items-center gap-2">
                         <FileText className="w-5 h-5 text-green-400" />
                         Forensic Audit
                      </h4>
                      <p className="text-xs text-gray-400 leading-relaxed italic">
                         "Our forensic log is the trust anchor that makes us the regulator's best friend."
                      </p>
                   </div>
                </div>
             </section>

          </div>
        </div>

      </div>
    </div>
  );
}
