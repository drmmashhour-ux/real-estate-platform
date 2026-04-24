"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, ChevronRight, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TurboDraft {
  id: string;
  title: string;
  formKey: string;
  status: string;
  createdAt: string;
  canProceed: boolean;
}

interface Props {
  role: "BUYER" | "SELLER" | "BROKER";
}

export function TurboDraftList({ role }: Props) {
  const [drafts, setDrafts] = useState<TurboDraft[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDrafts() {
      try {
        const res = await fetch("/api/turbo-draft/list");
        const data = await res.json();
        setDrafts(data);
      } catch (err) {
        console.error("Failed to fetch drafts", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDrafts();
  }, []);

  if (loading) return <div className="animate-pulse space-y-4">
    {[1, 2, 3].map(i => <div key={i} className="h-20 w-full rounded-2xl bg-white/5" />)}
  </div>;

  if (drafts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/5 p-12 text-center">
        <FileText className="mb-4 h-12 w-12 text-zinc-700" />
        <h3 className="text-lg font-black uppercase tracking-tighter text-zinc-500 italic">No Drafts Yet</h3>
        <p className="mt-2 text-xs text-zinc-600">Start a new Turbo Draft from a listing or the sell portal.</p>
        <Link 
          href="/listings" 
          className="mt-6 rounded-xl bg-white/10 px-6 py-2 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-white/20"
        >
          Browse Listings
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {drafts.map((draft) => (
        <Link 
          key={draft.id} 
          href={`/drafts/${draft.id}`}
          className="group flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 p-4 transition-all hover:border-[#D4AF37]/30 hover:bg-[#D4AF37]/5"
        >
          <div className="flex items-center gap-4">
            <div className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl transition-all group-hover:scale-110",
              draft.canProceed ? "bg-emerald-500/10 text-emerald-500" : "bg-zinc-800 text-zinc-500"
            )}>
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-tight text-white italic">{draft.title}</h4>
              <div className="mt-1 flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(draft.createdAt).toLocaleDateString()}
                </span>
                <span className={cn(
                  "flex items-center gap-1",
                  draft.canProceed ? "text-emerald-500" : "text-amber-500"
                )}>
                  {draft.canProceed ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                  {draft.status}
                </span>
              </div>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-zinc-700 transition-transform group-hover:translate-x-1 group-hover:text-[#D4AF37]" />
        </Link>
      ))}
    </div>
  );
}
