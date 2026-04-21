"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type Briefing = {
  executiveSummary?: string;
  topCriticalItems?: Array<{ title: string; entityId: string; summary: string }>;
  topApprovalsNeeded?: Array<{ taskId: string; title: string }>;
  policyMode?: string;
};

export function ExecutiveHubClient({ basePath }: { basePath: string }) {
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [runNotice, setRunNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const res = await fetch("/api/agents/briefing", { credentials: "include" });
      const j = (await res.json()) as Briefing & { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Failed");
      setBriefing(j);
    } catch {
      setErr("Executive briefing unavailable.");
      setBriefing(null);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function runPortfolioAgents() {
    setBusy(true);
    setErr(null);
    setRunNotice(null);
    try {
      const res = await fetch("/api/agents/run/portfolio", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runMode: "MANUAL" }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Run failed");
      await load();
      setRunNotice(typeof j.executiveSummary === "string" ? j.executiveSummary : "Run completed.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Run failed");
    } finally {
      setBusy(false);
    }
  }

  if (err && !briefing) {
    return (
      <div className="rounded-lg border border-destructive/30 p-4 text-sm">
        {err}
        <Button variant="outline" size="sm" className="ml-2" type="button" onClick={() => void load()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <section className="rounded-xl border bg-card p-4">
        <h2 className="text-lg font-semibold">Executive overview</h2>
        <p className="mt-2 text-sm text-muted-foreground">{briefing?.executiveSummary ?? "Loading…"}</p>
        <p className="mt-2 text-xs text-muted-foreground">Policy: {briefing?.policyMode ?? "—"}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" disabled={busy} onClick={() => void runPortfolioAgents()}>
            {busy ? "Running…" : "Run portfolio agents"}
          </Button>
          <Button variant="outline" type="button" asChild>
            <Link href={`${basePath}/dashboard/executive/tasks`}>Tasks</Link>
          </Button>
          <Button variant="outline" type="button" asChild>
            <Link href={`${basePath}/dashboard/executive/briefing`}>Briefing</Link>
          </Button>
          <Button variant="outline" type="button" asChild>
            <Link href={`${basePath}/dashboard/executive/monitoring`}>Monitoring</Link>
          </Button>
          <Button variant="outline" type="button" asChild>
            <Link href={`${basePath}/dashboard/executive/agents`}>Agents</Link>
          </Button>
        </div>
        {runNotice && briefing ?
          <p className="mt-3 text-xs text-emerald-800">{runNotice}</p>
        : null}
        {err && briefing ?
          <p className="mt-3 text-xs text-destructive">{err}</p>
        : null}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border p-4">
          <h3 className="font-semibold">Critical items</h3>
          <ul className="mt-2 space-y-2 text-sm">
            {(briefing?.topCriticalItems ?? []).slice(0, 6).map((x, i) => (
              <li key={i} className="rounded-md border border-dashed px-3 py-2">
                <span className="font-medium">{x.title}</span>
                <p className="text-muted-foreground">{x.summary}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border p-4">
          <h3 className="font-semibold">Approvals needed</h3>
          <ul className="mt-2 space-y-2 text-sm">
            {(briefing?.topApprovalsNeeded ?? []).slice(0, 8).map((x) => (
              <li key={x.taskId}>
                <Link className="text-primary underline-offset-4 hover:underline" href={`${basePath}/dashboard/executive/tasks`}>
                  {x.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
