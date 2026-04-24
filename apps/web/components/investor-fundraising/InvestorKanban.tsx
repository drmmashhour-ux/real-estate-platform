"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, DollarSign, MessageSquare } from "lucide-react";

interface Investor {
  id: string;
  name: string;
  email: string;
  stage: string;
  notes?: string;
  targetAmount?: number;
  actualAmount?: number;
  interactions: any[];
}

interface Props {
  investors: Investor[];
}

const STAGES = ["NEW", "CONTACTED", "INTERESTED", "NEGOTIATING", "CLOSED"];

export function InvestorKanban({ investors }: Props) {
  const getStageColor = (stage: string) => {
    switch (stage) {
      case "NEW": return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20";
      case "CONTACTED": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "INTERESTED": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "NEGOTIATING": return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "CLOSED": return "bg-green-500/10 text-green-500 border-green-500/20";
      default: return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
      {STAGES.map((stage) => (
        <div key={stage} className="min-w-[250px] space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{stage}</h3>
            <Badge variant="outline" className="text-[10px] h-5 border-zinc-800 text-zinc-600">
              {investors.filter((i) => i.stage === stage).length}
            </Badge>
          </div>
          
          <div className="space-y-3">
            {investors
              .filter((i) => i.stage === stage)
              .map((investor) => (
                <Card key={investor.id} className="p-3 bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors group">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-bold text-white text-xs truncate mr-2">{investor.name}</p>
                    <User className="w-3 h-3 text-zinc-700 group-hover:text-blue-500 transition-colors" />
                  </div>
                  
                  <div className="space-y-1.5">
                    <div className="flex items-center text-[10px] text-zinc-500">
                      <Mail className="w-3 h-3 mr-1.5" />
                      <span className="truncate">{investor.email}</span>
                    </div>
                    
                    {investor.targetAmount !== undefined && (
                      <div className="flex items-center text-[10px] text-zinc-400 font-bold">
                        <DollarSign className="w-3 h-3 mr-1.5 text-green-500" />
                        <span>${(investor.targetAmount / 100).toLocaleString()}</span>
                        {investor.actualAmount && investor.actualAmount > 0 && (
                          <span className="ml-1 text-green-500">
                            / ${(investor.actualAmount / 100).toLocaleString()}
                          </span>
                        )}
                      </div>
                    )}
                    
                    {investor.interactions.length > 0 && (
                      <div className="flex items-center text-[9px] text-zinc-600 italic">
                        <MessageSquare className="w-3 h-3 mr-1.5" />
                        <span>Last: {new Date(investor.interactions[0].date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
