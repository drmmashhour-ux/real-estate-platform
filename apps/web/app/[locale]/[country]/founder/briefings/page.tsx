"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { BriefingHistoryTable } from "@/components/executive-briefing/BriefingHistoryTable";

type Row = {
  id: string;
  periodStart: string;
  periodEnd: string;
  status: string;
};

export default function FounderBriefingsPage() {
  const params = useParams<{ locale: string; country: string }>();
  const basePath = `/${params.locale}/${params.country}/founder`;
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [genMsg, setGenMsg] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/founder/briefings", { credentials: "include" });
        const j = (await res.json()) as { briefings?: Row[]; error?: string };
        if (!res.ok) throw new Error(j.error ?? "Erreur");
        setRows(j.briefings ?? []);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Erreur");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function generate() {
    setGenMsg(null);
    try {
      const res = await fetch("/api/founder/briefings/generate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ window: "7d" }),
      });
      const j = (await res.json()) as { briefingId?: string; error?: string };
      if (!res.ok) throw new Error(j.error ?? "Erreur");
      setGenMsg(`Briefing ${j.briefingId} généré — à revoir avant diffusion.`);
      const list = await fetch("/api/founder/briefings", { credentials: "include" });
      const lj = (await list.json()) as { briefings?: Row[] };
      setRows(lj.briefings ?? []);
    } catch (e) {
      setGenMsg(e instanceof Error ? e.message : "Erreur");
    }
  }

  if (loading) return <p className="text-sm text-zinc-500">Chargement…</p>;
  if (err) {
    return <p className="text-sm text-red-300">{err}</p>;
  }

  return (
    <div className="space-y-6">
      <Link href={basePath} className="text-sm text-amber-200/80 hover:underline">
        ← Espace fondateur
      </Link>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold">Briefings exécutifs</h1>
        <button
          type="button"
          className="rounded-lg bg-amber-500/90 px-4 py-2 text-sm font-medium text-black"
          onClick={() => void generate()}
        >
          Générer (7 j)
        </button>
      </div>
      {genMsg && <p className="text-sm text-zinc-400">{genMsg}</p>}
      <BriefingHistoryTable rows={rows} basePath={basePath} />
    </div>
  );
}
