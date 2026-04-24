"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ShieldCheck, 
  FileText, 
  Lock, 
  Eye, 
  Download,
  AlertTriangle,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface Consent {
  id: string;
  consentType: string;
  granted: boolean;
  grantedAt: string;
}

interface Props {
  consents: Consent[];
  onRefresh?: () => void;
}

export function ComplianceOverview({ consents, onRefresh }: Props) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/compliance/data-export");
      const json = await res.json();
      
      // Trigger download
      const blob = new Blob([JSON.stringify(json.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lecipm-data-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error("Export failed", err);
    } finally {
      setExporting(false);
    }
  };

  const getConsentStatus = (type: string) => {
    const consent = consents.find(c => c.consentType === type);
    return consent?.granted ?? false;
  };

  const REQUIRED_CONSENTS = [
    { type: "OACIQ_DISCLOSURE", label: "Real Estate Regulatory Disclosure (OACIQ)" },
    { type: "AMF_TRANSPARENCY", label: "Financial Transparency & Fees (AMF)" },
    { type: "DATA_PRIVACY", label: "Personal Data Processing (Law 25)" },
    { type: "AI_USAGE", label: "AI & Algorithmic Recommendation Usage" }
  ];

  return (
    <div className="space-y-6">
      <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
          <h3 className="font-bold text-white flex items-center italic tracking-tighter uppercase">
            <ShieldCheck className="w-5 h-5 text-emerald-500 mr-2" />
            Regulatory Consents
          </h3>
          <Badge variant="outline" className="text-zinc-500 border-zinc-800 text-[10px] uppercase font-bold">
            Audit Ready
          </Badge>
        </div>
        <div className="divide-y divide-zinc-800">
          {REQUIRED_CONSENTS.map((c) => {
            const isGranted = getConsentStatus(c.type);
            return (
              <div key={c.type} className="p-4 flex items-center justify-between group hover:bg-zinc-800/30 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${isGranted ? "bg-emerald-500/10" : "bg-zinc-800"}`}>
                    <FileText className={`w-4 h-4 ${isGranted ? "text-emerald-500" : "text-zinc-600"}`} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-200 uppercase tracking-tight">{c.label}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5 italic">Required for full platform access</p>
                  </div>
                </div>
                <Badge className={`text-[10px] font-black uppercase ${isGranted ? "bg-emerald-500/20 text-emerald-500 border-emerald-500/30" : "bg-zinc-800 text-zinc-500 border-zinc-700"}`}>
                  {isGranted ? "Granted" : "Pending"}
                </Badge>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 bg-zinc-900 border-zinc-800 border-l-4 border-l-blue-500">
          <div className="flex items-start justify-between">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Eye className="w-5 h-5 text-blue-400" />
                <h4 className="font-black text-white uppercase italic tracking-tighter">Your Data Rights</h4>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                In accordance with Québec Law 25, you have the right to access, rectify, and request the deletion of your personal data.
              </p>
              <div className="flex space-x-3 pt-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="bg-zinc-950 border-zinc-800 text-[10px] uppercase font-black tracking-widest h-8"
                  onClick={handleExport}
                  disabled={exporting}
                >
                  <Download className="w-3 h-3 mr-2" />
                  Request Export
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="bg-zinc-950 border-zinc-800 text-[10px] uppercase font-black tracking-widest h-8 text-red-400 hover:text-red-300"
                >
                  <Lock className="w-3 h-3 mr-2" />
                  Request Deletion
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-zinc-900 border-zinc-800 border-l-4 border-l-orange-500">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Info className="w-5 h-5 text-orange-400" />
              <h4 className="font-black text-white uppercase italic tracking-tighter">Platform Disclaimers</h4>
            </div>
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-3 h-3 text-orange-500 mt-1 flex-shrink-0" />
                <p className="text-[10px] text-zinc-500 italic leading-snug">
                  <span className="text-zinc-300 font-bold uppercase not-italic">AI Usage:</span> This platform utilizes automated algorithms for ranking and recommendation. All final real estate decisions should be verified by a licensed professional.
                </p>
              </div>
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-3 h-3 text-orange-500 mt-1 flex-shrink-0" />
                <p className="text-[10px] text-zinc-500 italic leading-snug">
                  <span className="text-zinc-300 font-bold uppercase not-italic">Financial Transparency:</span> All fees and commissions are displayed in CAD and are subject to relevant Québec/Canada taxes.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
