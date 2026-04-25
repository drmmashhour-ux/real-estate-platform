import React, { useState } from "react";
import { UserCheck, Shield, ChevronRight, Check, Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

interface Props {
  draftId: string;
  reasonFr: string;
  status?: "NONE" | "REQUESTED" | "ACCEPTED" | "COMPLETED";
  onRequest?: () => void;
  className?: string;
}

export const BrokerAssistCard: React.FC<Props> = ({ draftId, reasonFr, status = "NONE", onRequest, className }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(status);

  const handleRequest = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/trust-hub/broker-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftId, action: "REQUEST" }),
      });
      if (res.ok) {
        setCurrentStatus("REQUESTED");
        onRequest?.();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (currentStatus === "REQUESTED") {
    return (
      <div className={cn("rounded-2xl border border-blue-500/30 bg-blue-500/5 p-6 backdrop-blur-xl", className)}>
        <div className="flex items-center gap-4">
          <div className="shrink-0 p-3 rounded-2xl bg-blue-500/20 text-blue-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-blue-100">Demande envoyée</h3>
            <p className="text-sm text-blue-200/60 leading-relaxed">
              Un courtier partenaire a été notifié pour réviser votre document.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (currentStatus === "ACCEPTED" || currentStatus === "COMPLETED") {
    return (
      <div className={cn("rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 backdrop-blur-xl", className)}>
        <div className="flex items-center gap-4">
          <div className="shrink-0 p-3 rounded-2xl bg-emerald-500/20 text-emerald-400">
            <Check className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-emerald-100">Révision professionnelle activée</h3>
            <p className="text-sm text-emerald-200/60 leading-relaxed">
              Votre document est sous la supervision d'un professionnel.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("group relative overflow-hidden rounded-2xl border border-[#D4AF37]/20 bg-black/40 p-6 backdrop-blur-xl transition hover:border-[#D4AF37]/40", className)}>
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition">
        <UserCheck className="w-32 h-32" />
      </div>

      <div className="relative space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#D4AF37]/20 text-[#D4AF37]">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Révision Professionnelle</h3>
        </div>

        <p className="text-sm text-zinc-400 leading-relaxed">
          {reasonFr}
        </p>

        <button
          onClick={handleRequest}
          disabled={isLoading}
          className="w-full mt-2 inline-flex min-h-[52px] items-center justify-center rounded-2xl bg-[#D4AF37] px-8 text-base font-bold text-black shadow-lg shadow-[#D4AF37]/25 transition hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Faire réviser par un courtier
              <ChevronRight className="w-5 h-5 ml-2" />
            </>
          )}
        </button>

        <p className="text-[10px] text-center text-zinc-500 font-medium italic">
          Service optionnel. Des frais peuvent s'appliquer.
        </p>
      </div>
    </div>
  );
};
