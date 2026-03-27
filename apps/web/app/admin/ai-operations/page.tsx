"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AiQueueTable } from "@/components/ai/AiQueueTable";
import type { QueueItem } from "@/components/ai/AiQueueTable";
import { AiDecisionPanel } from "@/components/ai/AiDecisionPanel";
import type { DecisionResult } from "@/components/ai/AiDecisionPanel";
import { AiActionButtons } from "@/components/ai/AiActionButtons";

export default function AiOperationsPage() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [decision, setDecision] = useState<DecisionResult | null>(null);
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  const [enqueueType, setEnqueueType] = useState<"listing" | "booking" | "user" | "dispute">("listing");
  const [enqueueEntityId, setEnqueueEntityId] = useState("");
  const [enqueueLoading, setEnqueueLoading] = useState(false);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/queue?limit=100", { credentials: "same-origin" });
      const data = await res.json().catch(() => ({}));
      setItems(Array.isArray(data.items) ? data.items : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const selectedItem = selectedId ? items.find((i) => i.id === selectedId) : null;

  const runDecision = useCallback(async () => {
    if (!selectedId) return;
    setDecisionLoading(true);
    setDecision(null);
    try {
      const res = await fetch("/api/ai/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queueItemId: selectedId }),
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.recommendedAction != null) {
        setDecision({
          recommendedAction: data.recommendedAction,
          riskScore: data.riskScore ?? 0,
          trustScore: data.trustScore ?? 0,
          trustLevel: data.trustLevel ?? "medium",
          factors: Array.isArray(data.factors) ? data.factors : [],
          fraudAction: data.fraudAction,
        });
        loadQueue();
      }
    } finally {
      setDecisionLoading(false);
    }
  }, [selectedId, loadQueue]);

  useEffect(() => {
    if (selectedId && !decision && !decisionLoading) runDecision();
  }, [selectedId]);

  async function handleEnqueue(e: React.FormEvent) {
    e.preventDefault();
    if (!enqueueEntityId.trim()) return;
    setEnqueueLoading(true);
    try {
      const res = await fetch("/api/ai/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: enqueueType, entityId: enqueueEntityId.trim() }),
        credentials: "same-origin",
      });
      if (res.ok) {
        setEnqueueEntityId("");
        loadQueue();
      }
    } finally {
      setEnqueueLoading(false);
    }
  }

  async function handleAction(action: "approve" | "flag" | "block" | "escalate") {
    if (!selectedId) return;
    const res = await fetch("/api/ai/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ queueItemId: selectedId, action, autoMode }),
      credentials: "same-origin",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      alert(data.message || "Action failed");
      return;
    }
    loadQueue();
    setDecision(null);
    if (data.queueStatus !== "pending" && data.queueStatus !== "flagged") {
      setSelectedId(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <section className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            LECIPM Admin
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Autonomous AI Operations</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            Review and act on queue items (listings, bookings, users, disputes). AI suggests approve, flag, block, or review. Escalate to human anytime.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={autoMode}
                onChange={(e) => setAutoMode(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">AUTO-MODE (AI executes decisions)</span>
            </label>
            <button
              type="button"
              onClick={loadQueue}
              disabled={loading}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              {loading ? "Loading…" : "Refresh queue"}
            </button>
            <Link href="/admin/ai-control-center" className="text-sm font-medium text-slate-600 hover:underline dark:text-slate-400">AI Control Center</Link>
            <Link href="/admin/ai" className="text-sm font-medium text-slate-600 hover:underline dark:text-slate-400">AI OS</Link>
            <Link href="/admin" className="text-sm font-medium text-emerald-600 hover:underline dark:text-emerald-400">← Admin</Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Enqueue */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Add to queue</h2>
          <form onSubmit={handleEnqueue} className="mt-2 flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Type</label>
              <select
                value={enqueueType}
                onChange={(e) => setEnqueueType(e.target.value as typeof enqueueType)}
                className="mt-0.5 rounded border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="listing">listing</option>
                <option value="booking">booking</option>
                <option value="user">user</option>
                <option value="dispute">dispute</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Entity ID</label>
              <input
                type="text"
                value={enqueueEntityId}
                onChange={(e) => setEnqueueEntityId(e.target.value)}
                placeholder="UUID"
                className="mt-0.5 w-56 rounded border border-slate-300 bg-white px-2 py-1.5 font-mono text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>
            <button
              type="submit"
              disabled={enqueueLoading || !enqueueEntityId.trim()}
              className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-400 disabled:opacity-50"
            >
              {enqueueLoading ? "Adding…" : "Enqueue"}
            </button>
          </form>
        </section>

        {/* Queue table */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Queue</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Click a row to load AI decision and actions.</p>
          <div className="mt-4">
            <AiQueueTable
              items={items}
              selectedId={selectedId}
              onSelect={setSelectedId}
              loading={loading}
            />
          </div>
        </section>

        {/* Decision + Actions */}
        <div className="grid gap-6 lg:grid-cols-2">
          <section>
            <AiDecisionPanel
              queueItemId={selectedId}
              type={selectedItem?.type ?? ""}
              entityId={selectedItem?.entityId ?? ""}
              decision={decision}
              loading={decisionLoading}
              onRefreshDecision={runDecision}
            />
          </section>
          <section>
            <AiActionButtons
              queueItemId={selectedId}
              recommendedAction={decision?.recommendedAction ?? selectedItem?.recommendedAction ?? null}
              autoMode={autoMode}
              onAction={handleAction}
              onDone={loadQueue}
            />
          </section>
        </div>
      </div>
    </main>
  );
}
