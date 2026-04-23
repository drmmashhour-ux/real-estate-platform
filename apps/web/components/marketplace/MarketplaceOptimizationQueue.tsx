"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type UiStatus = "PROPOSED" | "APPROVED" | "REJECTED" | "IMPLEMENTED" | "EXPIRED";

type ProposalRow = {
  id: string;
  domain: string;
  action: string;
  rationale: string;
  confidence: number;
  impactEstimate: number | null;
  requiresApproval: boolean;
  uiStatus: UiStatus;
  createdAt: string;
};

async function postJson(url: string, body: Record<string, unknown>) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

export function MarketplaceOptimizationQueue() {
  const [rows, setRows] = useState<ProposalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/autonomous-brain/proposals");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data?.error === "string" ? data.error : "load_failed");
        setRows([]);
        return;
      }
      setRows((data.proposals ?? []) as ProposalRow[]);
    } catch {
      setError("network_error");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const noteFor = (id: string) => notes[id] ?? "";

  async function runAction(id: string, kind: "approve" | "reject" | "implement" | "expire") {
    setBusyId(id);
    const note = noteFor(id).trim();
    const path =
      kind === "approve" ? "approve"
      : kind === "reject" ? "reject"
      : kind === "implement" ? "implement"
      : "expire";
    const { ok, data } = await postJson(`/api/autonomous-brain/proposals/${id}/${path}`, {
      note: note || undefined,
    });
    setBusyId(null);
    if (!ok) {
      setError(typeof data?.error === "string" ? data.error : `${kind}_failed`);
      return;
    }
    setError(null);
    await load();
  }

  return (
    <Card variant="dashboardPanel" className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-[#0B0B0B]">Marketplace Optimization Proposals</h3>
        <p className="text-sm text-[#5C5C57]">
          Backed by <code className="text-xs">autonomy_decisions</code> with baseline snapshots. Human approval
          required where flagged. <span className="font-medium text-[#0B0B0B]">Advisory / governed apply</span>{" "}
          — implement runs the existing validated payload path.
        </p>
      </div>

      {error ?
        <p className="text-sm text-red-700">{error}</p>
      : null}
      {loading ?
        <p className="text-sm text-[#5C5C57]">Loading proposals…</p>
      : null}

      {!loading && rows.length === 0 ?
        <p className="text-sm text-[#5C5C57]">No proposals in range.</p>
      : null}

      {!loading && rows.length > 0 ?
        <div className="space-y-4">
          {rows.map((r) => (
            <div
              key={r.id}
              className="rounded-lg border border-[#D9D9D2] bg-[#FAFAF7] p-4 text-sm text-[#0B0B0B]"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">
                    {r.domain} · {r.action}
                  </p>
                  <p className="mt-1 text-[#5C5C57]">{r.rationale}</p>
                  <p className="mt-2 text-xs text-[#5C5C57]">
                    Confidence {(r.confidence * 100).toFixed(0)}% · Impact est.{" "}
                    {(r.impactEstimate ?? r.confidence).toFixed(2)} · Requires approval:{" "}
                    {r.requiresApproval ? "yes" : "no"} · Status:{" "}
                    <span className="font-medium text-[#0B0B0B]">{r.uiStatus}</span>
                  </p>
                  <p className="mt-1 text-xs text-[#5C5C57]">
                    Data: autonomy payload + baseline metrics JSON on the decision row.
                  </p>
                </div>
              </div>

              <label className="mt-3 block text-xs text-[#5C5C57]">
                Note / reason (optional)
                <textarea
                  value={noteFor(r.id)}
                  onChange={(e) => setNotes((prev) => ({ ...prev, [r.id]: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-[#D9D9D2] bg-white px-2 py-1.5 text-[#0B0B0B]"
                  rows={2}
                />
              </label>

              <div className="mt-3 flex flex-wrap gap-2">
                {r.uiStatus === "PROPOSED" ?
                  <>
                    <Button
                      size="sm"
                      variant="goldPrimary"
                      loading={busyId === r.id}
                      onClick={() => void runAction(r.id, "approve")}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      loading={busyId === r.id}
                      onClick={() => void runAction(r.id, "reject")}
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="!border-[#D9D9D2] !text-[#0B0B0B] hover:!bg-[#FAFAF7]"
                      loading={busyId === r.id}
                      onClick={() => void runAction(r.id, "expire")}
                    >
                      Mark expired
                    </Button>
                  </>
                : null}
                {r.uiStatus === "APPROVED" ?
                  <Button
                    size="sm"
                    variant="primary"
                    loading={busyId === r.id}
                    onClick={() => void runAction(r.id, "implement")}
                  >
                    Mark implemented
                  </Button>
                : null}
                {r.uiStatus === "IMPLEMENTED" ?
                  <span className="text-xs text-[#5C5C57]">Applied — review outcomes below.</span>
                : null}
                {r.uiStatus === "REJECTED" || r.uiStatus === "EXPIRED" ?
                  <span className="text-xs text-[#5C5C57]">Closed — no further actions.</span>
                : null}
              </div>
            </div>
          ))}
        </div>
      : null}
    </Card>
  );
}
