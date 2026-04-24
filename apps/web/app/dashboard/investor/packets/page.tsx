"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type DealPacket = {
  id: string;
  capitalDeal: {
    id: string;
    title: string;
    listing?: {
      title: string;
    };
  };
  entity: {
    name: string;
  };
  underwritingRecommendation: string;
  createdAt: string;
};

export default function FundPacketsPage() {
  const [packets, setPackets] = useState<DealPacket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/fund/deal-packets");
        const json = await res.json();
        if (json.success) {
          setPackets(json.packets);
        } else {
          setError(json.error || "Failed to load packets");
        }
      } catch (e) {
        setError("Network error or missing compliance onboarding.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Incoming Deal Packets</h1>
            <div className="inline-block rounded-full bg-amber-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-600 border border-amber-500/20">
              Investment activity (AMF)
            </div>
            <div className="inline-block rounded-full bg-slate-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 border border-slate-500/20">
              Simulation mode
            </div>
          </div>
          <p className="mt-3 text-slate-500 max-w-2xl leading-relaxed">
            Review structured deal packets handed off from the brokerage division.
            Only the fund domain may transform these packets into investor-facing allocation plans and simulation materials.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
            <p className="text-sm font-medium text-slate-400">Loading incoming deal flow...</p>
          </div>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl border border-red-200 bg-red-50 flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900">Compliance Blocker</h3>
            <p className="text-sm text-slate-600 max-w-sm">{error}</p>
          </div>
          <Link href="/dashboard/investor/onboarding" className="mt-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors">
            Complete Investor Onboarding
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packets.map((packet) => (
            <div key={packet.id} className="group relative flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-500/30 transition-all">
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100 group-hover:bg-amber-100 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border border-slate-200 px-2 py-0.5 rounded-full bg-slate-50">
                    ID: {packet.id.slice(-6)}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-lg text-slate-900 tracking-tight leading-tight group-hover:text-amber-700 transition-colors">
                    {packet.capitalDeal.title}
                  </h3>
                  <p className="text-xs font-medium text-slate-400">
                    Originated by: <span className="text-slate-600 underline decoration-slate-200">{packet.entity.name}</span>
                  </p>
                </div>

                <div className="pt-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter mb-2">Underwriting Memo</p>
                  <p className="text-sm text-slate-600 line-clamp-3 italic leading-relaxed">
                    "{packet.underwritingRecommendation}"
                  </p>
                </div>

                <div className="flex items-center gap-4 pt-2">
                   <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Received</span>
                      <span className="text-xs font-semibold text-slate-700">{new Date(packet.createdAt).toLocaleDateString()}</span>
                   </div>
                   <div className="w-px h-6 bg-slate-100"></div>
                   <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Allocation</span>
                      <span className="text-xs font-semibold text-emerald-600">Simulating...</span>
                   </div>
                </div>
              </div>

              <div className="mt-auto p-4 border-t border-slate-50 bg-slate-50/50 rounded-b-2xl">
                <Link 
                  href={`/dashboard/investor/deal-packets/${packet.id}`}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all shadow-sm"
                >
                  View Full Packet & Simulate
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}

          {packets.length === 0 && (
            <div className="col-span-full py-24 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
              <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-200 mb-4 border border-slate-100">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15a2.25 2.25 0 002.25-2.25v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z" />
                </svg>
              </div>
              <h3 className="text-slate-900 font-bold">No deal flow yet</h3>
              <p className="text-sm text-slate-500 mt-1">Waiting for the brokerage side to hand off new opportunities.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
