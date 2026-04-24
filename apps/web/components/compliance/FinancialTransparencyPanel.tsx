"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Landmark, ArrowRightLeft } from "lucide-react";

interface Props {
  feeStructure: {
    platformFeePercent: number;
    brokerCommissionPercent: number;
    taxes: string;
  };
}

export function FinancialTransparencyPanel({ feeStructure }: Props) {
  return (
    <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
      <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
        <h3 className="font-bold text-white flex items-center italic tracking-tighter uppercase">
          <Landmark className="w-5 h-5 text-orange-500 mr-2" />
          Financial Transparency (AMF)
        </h3>
        <Badge variant="outline" className="text-zinc-500 border-zinc-800 text-[10px] uppercase font-bold">
          Standardized
        </Badge>
      </div>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-zinc-500" />
            <span className="text-xs font-bold text-zinc-300 uppercase">Platform Service Fee</span>
          </div>
          <span className="text-sm font-black text-white">{feeStructure.platformFeePercent}%</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ArrowRightLeft className="w-4 h-4 text-zinc-500" />
            <span className="text-xs font-bold text-zinc-300 uppercase">Average Broker Commission</span>
          </div>
          <span className="text-sm font-black text-white">{feeStructure.brokerCommissionPercent}%</span>
        </div>

        <div className="pt-3 border-t border-zinc-800">
          <p className="text-[10px] text-zinc-500 italic">
            * All fees are subject to {feeStructure.taxes} as per regional regulations. Platform fees are collected at point of transaction.
          </p>
        </div>
      </div>
    </Card>
  );
}
