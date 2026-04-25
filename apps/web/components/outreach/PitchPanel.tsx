import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Mic, Zap, AlertTriangle, Target, Info, Rocket } from 'lucide-react';

export const PitchPanel: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Mic className="w-5 h-5 text-[#D4AF37]" />
          Pitch Center
        </h2>
        <div className="flex gap-2">
          <Badge variant="gold">Investor Ready</Badge>
        </div>
      </div>

      <div className="grid gap-6">
        {/* 30-Second Killer Pitch */}
        <Card className="bg-black/60 border-white/5 border-l-2 border-l-orange-500">
          <CardHeader className="py-3 bg-white/5 border-b border-white/10">
            <CardTitle className="text-xs font-black text-orange-500 uppercase tracking-widest flex items-center gap-2">
              <Zap className="w-3 h-3 fill-current" />
              30s — Killer Pitch (Fast Hook)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 text-sm text-gray-200 leading-relaxed italic">
            “Real estate contracts in Québec are complex, risky, and still largely manual. <br /><br />
            LECIPM is an AI-driven platform that guides users step-by-step to create offers, detects errors in real time, and blocks risky or incomplete transactions before they’re signed. <br /><br />
            Unlike generic AI, we combine structured compliance rules with AI—so documents are not just generated, they’re validated. <br /><br />
            We monetize per contract and through broker tools, starting in Québec where compliance requirements are strict. <br /><br />
            Our vision is to become the intelligent layer behind every real estate transaction.”
          </CardContent>
        </Card>

        {/* 60-Second Balanced Pitch */}
        <Card className="bg-black/60 border-white/5 border-l-2 border-l-[#D4AF37]">
          <CardHeader className="py-3 bg-white/5 border-b border-white/10">
            <CardTitle className="text-xs font-black text-[#D4AF37] uppercase tracking-widest flex items-center gap-2">
              <Mic className="w-3 h-3" />
              60s — Investor Pitch (Balanced)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 text-sm text-gray-200 leading-relaxed italic">
            “Buying or selling real estate in Québec involves complex contracts, legal risk, and a lot of manual work. <br /><br />
            LECIPM is an AI-powered drafting and compliance platform that guides users step-by-step through creating offers, detects risks like warranty exclusions, explains clauses, and prevents errors before signature. <br /><br />
            What makes us different is that we don’t rely on AI alone—we combine structured compliance logic with AI assistance to ensure clarity and reduce risk. <br /><br />
            We monetize through pay-per-contract and broker tools, starting with Québec as a focused, compliance-heavy market. <br /><br />
            Our goal is to become the intelligent transaction layer for real estate—where every deal is created, validated, and completed through one system.”
          </CardContent>
        </Card>

        {/* 90-Second Strong Version */}
        <Card className="bg-[#D4AF37]/5 border-[#D4AF37]/20 border-l-2 border-l-[#D4AF37]">
          <CardHeader className="py-3 bg-[#D4AF37]/10 border-b border-[#D4AF37]/10">
            <CardTitle className="text-xs font-black text-[#D4AF37] uppercase tracking-widest flex items-center gap-2">
              <Rocket className="w-3 h-3 fill-current" />
              90s — Strong Version (Deep Dive)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 text-sm text-gray-100 leading-relaxed font-medium">
            “Real estate transactions in Québec are complex, regulated, and still heavily manual—especially when it comes to drafting offers, validating clauses, and managing risk. <br /><br />
            This leads to lost time, errors, and exposure for both brokers and clients. <br /><br />
            LECIPM solves this by combining AI with structured compliance logic. <br /><br />
            Users are guided step-by-step through drafting, the system detects issues in real time, explains critical clauses like legal warranty exclusions, and prevents invalid or risky transactions from being completed. <br /><br />
            Unlike generic AI tools, our platform enforces structure, validation, and transparency throughout the entire drafting process. <br /><br />
            We start with a simple model: pay-per-contract for consumers and efficiency + lead tools for brokers. <br /><br />
            Québec is our entry point because of its strict compliance environment, but the problem exists globally. <br /><br />
            Our vision is to become the operating system for real estate transactions—where drafting, validation, and execution all happen through one intelligent layer.”
          </CardContent>
        </Card>

        {/* Delivery Guide */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-zinc-900/50 border border-white/5 rounded-2xl space-y-2">
            <h4 className="text-[10px] font-black text-gray-500 uppercase">Usage Guide</h4>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• 30s : Cold intro / Quick hook</li>
              <li>• 60s : Standard balanced pitch</li>
              <li>• 90s : Serious investor / Deep dive</li>
            </ul>
          </div>
          <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl space-y-2">
            <h4 className="text-[10px] font-black text-red-400 uppercase">Légal (À Éviter)</h4>
            <ul className="text-xs text-gray-400 space-y-1">
              <li className="line-through">• "Legally approved"</li>
              <li>✔ "Compliance-driven"</li>
              <li>✔ "Assistive layer"</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

const Badge: React.FC<{ children: React.ReactNode, variant?: string, className?: string }> = ({ children, variant, className }) => (
  <span className={cn("px-2 py-0.5 rounded-full font-bold uppercase tracking-widest", variant === "gold" ? "bg-[#D4AF37] text-black" : "bg-white/10 text-gray-400", className)}>
    {children}
  </span>
);

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
