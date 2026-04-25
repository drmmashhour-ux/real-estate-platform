"use client";

import { useEffect, useState } from "react";
import { DealHandoffStatus } from "@/components/compliance/DealHandoffStatus";

type CapitalDeal = {
  id: string;
  title: string;
  status: string;
  handoffReady: boolean;
  packetId?: string;
  listingAddress: string;
  updatedAt: string;
};

export default function BrokerHandoffPage() {
  const [deals, setDeals] = useState<CapitalDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/broker/capital-deals");
        const json = await res.json();
        if (json.success) {
          setDeals(json.deals);
        } else {
          setError(json.error || "Failed to load deals");
        }
      } catch (e) {
        setError("Network error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="p-6 space-y-6 text-white min-h-screen bg-zinc-950">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-[#D4AF37]">Deal Handoff (Brokerage)</h1>
          <div className="inline-block rounded-full bg-blue-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-blue-500 border border-blue-500/20">
            Brokerage activity (OACIQ)
          </div>
        </div>
        <p className="mt-2 text-white/60 max-w-2xl text-sm">
          Prepare and transfer structured deal data from the licensed brokerage side to the investment/fund side. 
          The bridge ensures legal separation between deal sourcing and capital solicitation.
        </p>
      </div>

      {loading ? (
        <p className="text-white/50 animate-pulse">Scanning pipeline for handoff-ready deals...</p>
      ) : error ? (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-sm">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deals.map((deal) => (
            <div key={deal.id} className="rounded-2xl border border-white/10 bg-black/40 p-5 space-y-4 hover:border-[#D4AF37]/30 transition-colors group">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="font-semibold text-white group-hover:text-[#D4AF37] transition-colors">{deal.title}</h3>
                  <p className="text-xs text-white/40">{deal.listingAddress}</p>
                </div>
                <DealHandoffStatus handoffReady={deal.handoffReady} packetId={deal.packetId} />
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex justify-between text-xs">
                  <span className="text-white/40 font-medium">Underwriting Status</span>
                  <span className="text-[#D4AF37] font-semibold">Completed</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/40 font-medium">Compliance Check</span>
                  <span className="text-emerald-500 font-semibold uppercase tracking-tighter">Verified</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/40 font-medium">Last Modified</span>
                  <span className="text-white/60">{new Date(deal.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button className="flex-1 px-3 py-2 rounded-lg bg-[#D4AF37] text-black text-xs font-bold hover:bg-[#B8962D] transition-colors shadow-lg shadow-[#D4AF37]/10">
                  {deal.handoffReady ? "Update Handoff Packet" : "Prepare Handoff"}
                </button>
                {deal.handoffReady && (
                  <button className="px-3 py-2 rounded-lg border border-white/10 text-white/60 text-xs hover:bg-white/5 transition-colors">
                    View Logs
                  </button>
                )}
              </div>
            </div>
          ))}

          {deals.length === 0 && (
            <div className="col-span-full py-12 text-center border-2 border-dashed border-white/5 rounded-2xl">
              <p className="text-white/40 text-sm font-medium">No capital deals found in your pipeline.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
