import React from "react";
import { AmfPrivateInvestmentDisclosure } from "./AmfPrivateInvestmentDisclosure";
import { BrokerDisclosureBadge } from "@/components/listings/BrokerDisclosureBadge";

interface DealInvestmentPacket {
  summary: string;
  price: number;
  risks: string;
  projections: string;
  createdByBroker?: {
    name: string;
    licenseNumber: string;
    practiceMode: string;
  };
}

interface DealInvestmentPacketViewProps {
  packet: DealInvestmentPacket;
  onSimulate: (data: {
    riskAccepted: boolean;
    notFinancialAdvice: boolean;
    independentDecision: boolean;
  }) => void;
  isLoading?: boolean;
}

/**
 * PHASE 4: INVESTOR SIDE (SIMULATION)
 * View component for the investment packet with simulation capabilities.
 */
export function DealInvestmentPacketView({ 
  packet, 
  onSimulate, 
  isLoading 
}: DealInvestmentPacketViewProps) {
  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
          <h2 className="text-2xl font-bold text-[#D4AF37]">Investment Opportunity Packet</h2>
          {packet.createdByBroker && (
            <BrokerDisclosureBadge 
              brokerName={packet.createdByBroker.name}
              licenseNumber={packet.createdByBroker.licenseNumber}
              practiceMode={packet.createdByBroker.practiceMode}
            />
          )}
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Executive Summary</h3>
              <p className="mt-1 text-slate-200 text-sm leading-relaxed">{packet.summary}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Target Acquisition Price</h3>
              <p className="mt-1 text-2xl font-bold text-white">
                {(packet.price / 100).toLocaleString('en-CA', { style: 'currency', currency: 'CAD' })}
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Financial Projections</h3>
              <p className="mt-1 text-slate-200 text-sm italic">{packet.projections}</p>
            </div>
            
            <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-4">
              <h3 className="text-sm font-semibold text-rose-400 uppercase tracking-wider">Risk Factors</h3>
              <p className="mt-1 text-rose-200 text-xs leading-relaxed">{packet.risks}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto">
        <AmfPrivateInvestmentDisclosure 
          onAccept={onSimulate}
          isLoading={isLoading}
        />
        <p className="mt-4 text-center text-[10px] text-slate-500">
          This is a simulation only. No real funds will be transferred at this stage.
          All investment decisions are made independently by the investor.
        </p>
      </div>
    </div>
  );
}
