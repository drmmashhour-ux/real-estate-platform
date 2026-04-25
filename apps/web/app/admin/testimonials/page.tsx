"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

type Row = {
  id: string;
  name: string;
  city: string;
  quote: string;
  rating: number;
  createdAt: string;
  broker: { id: string; email: string | null };
};

export default function AdminTestimonialsPage() {
  const [rows, setRows] = React.useState<Row[] | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setErr(null);
    try {
      const res = await fetch("/api/admin/testimonials", { credentials: "include" });
      const j = (await res.json()) as { testimonials?: Row[]; error?: string };
      if (!res.ok) {
        setErr(j.error ?? "Failed to load");
        return;
      }
      setRows(j.testimonials ?? []);
    } catch {
      setErr("Network error");
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function approve(id: string, isApproved: boolean) {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/testimonials/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isApproved }),
      });
      if (res.ok) {
        void load();
      } else {
        setErr("Update failed");
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-6 text-zinc-100">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Broker testimonials</h1>
          <p className="text-sm text-zinc-500">Approve before quotes appear on public pages.</p>
        </div>
        {err ? <p className="text-sm text-red-400">{err}</p> : null}
        {rows === null ? (
          <p className="text-sm text-zinc-500">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-zinc-500">No pending testimonials.</p>
        ) : (
          <ul className="space-y-4">
            {rows.map((t) => (
              <li key={t.id}>
                <Card className="border-white/10 bg-zinc-900/80">
                  <CardHeader>
                    <CardTitle className="text-base">
                      {t.name} <span className="text-zinc-500">· {t.city}</span>
                    </CardTitle>
                    <p className="text-xs text-zinc-500">
                      {t.broker.email} · rating {t.rating}/5 · {new Date(t.createdAt).toLocaleString()}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <blockquote className="text-sm text-zinc-200">&ldquo;{t.quote}&rdquo;</blockquote>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="goldPrimary"
                        disabled={busy === t.id}
                        onClick={() => void approve(t.id, true)}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy === t.id}
                        onClick={() => void approve(t.id, false)}
                      >
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
