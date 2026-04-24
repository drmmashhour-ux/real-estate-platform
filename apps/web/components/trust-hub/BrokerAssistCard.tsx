"use client";

import { useState } from "react";
import { UserCheck, ArrowRight, ShieldCheck, Check } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";

interface Props {
  draftId: string;
  reasonFr?: string;
}

export function BrokerAssistCard({ draftId, reasonFr }: Props) {
  const [requested, setRequested] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  async function handleRequest() {
    setLoading(true);
    try {
      const res = await fetch("/api/trust-hub/broker-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftId, reasonFr })
      });
      if (res.ok) {
        setRequested(true);
        showToast("Demande de révision envoyée", "success");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-premium-gold/30 bg-gradient-to-br from-black to-premium-gold/5 p-8 shadow-2xl">
      <div className="absolute right-0 top-0 h-40 w-40 translate-x-1/2 -translate-y-1/2 bg-premium-gold/10 blur-[100px]" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex items-start gap-6">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-premium-gold/10 shadow-inner">
            <UserCheck className="h-8 w-8 text-premium-gold" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">
              Service <span className="text-premium-gold">Broker Assist</span>
            </h3>
            <p className="text-sm text-neutral-400 max-w-md leading-relaxed">
              Faites réviser votre brouillon par un courtier immobilier licencié pour $275. 
              Une protection juridique supplémentaire pour vos transactions complexes.
            </p>
          </div>
        </div>

        <button 
          onClick={handleRequest}
          disabled={requested || loading}
          className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-premium-gold text-black font-black uppercase tracking-widest text-xs transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
        >
          {requested ? (
            <><Check className="h-4 w-4" /> Demande Envoyée</>
          ) : loading ? (
            "Traitement..."
          ) : (
            <><ShieldCheck className="h-4 w-4" /> Faire réviser l&apos;offre <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" /></>
          )}
        </button>
      </div>
    </div>
  );
}
