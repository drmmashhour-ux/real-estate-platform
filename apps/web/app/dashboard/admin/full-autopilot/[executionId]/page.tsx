"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { AdminCommandBar } from "@/components/admin/AdminCommandBar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type DetailResponse = {
  execution?: Record<string, unknown>;
  platformAutopilotAction?: Record<string, unknown>;
  reviewBundle?: {
    sourceSystem: string;
    inputSummary: string;
    policy: Record<string, unknown>;
    execution: Record<string, unknown>;
    outcome: Record<string, unknown>;
  };
};

export default function FullAutopilotExecutionDetailPage() {
  const params = useParams();
  const executionId = typeof params.executionId === "string" ? params.executionId : "";
  const [data, setData] = useState<DetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!executionId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/full-autopilot/execution/${executionId}`);
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof j?.error === "string" ? j.error : "not_found");
        setData(null);
        return;
      }
      setData(j as DetailResponse);
    } catch {
      setError("network_error");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [executionId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function rollback() {
    await fetch(`/api/full-autopilot/rollback/${executionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "detail_page_rollback" }),
    });
    await load();
  }

  const b = data?.reviewBundle;

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <AdminCommandBar title="Autopilot execution review" />

      <div className="flex flex-wrap gap-3">
        <Link href="/dashboard/admin/full-autopilot" className="text-sm font-medium text-premium-gold hover:underline">
          ← Control center
        </Link>
      </div>

      {loading ?
        <p className="text-sm text-[#5C5C57]">Loading…</p>
      : null}
      {error ?
        <p className="text-sm text-red-700">{error}</p>
      : null}

      {b ?
        <>
          <Card variant="dashboardPanel" className="space-y-3 text-sm">
            <h1 className="text-lg font-semibold text-[#0B0B0B]">Explainability</h1>
            <p className="text-[#5C5C57]">
              Source system: <span className="font-medium text-[#0B0B0B]">{b.sourceSystem}</span>
            </p>
            <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-[#FAFAF7] p-3 text-xs text-[#0B0B0B]">
              {b.inputSummary}
            </pre>
          </Card>

          <Card variant="dashboardPanel" className="space-y-2 text-sm">
            <h2 className="font-semibold text-[#0B0B0B]">Policy decision</h2>
            <pre className="whitespace-pre-wrap text-xs text-[#5C5C57]">{JSON.stringify(b.policy, null, 2)}</pre>
          </Card>

          <Card variant="dashboardPanel" className="space-y-2 text-sm">
            <h2 className="font-semibold text-[#0B0B0B]">Execution metadata</h2>
            <pre className="whitespace-pre-wrap text-xs text-[#5C5C57]">{JSON.stringify(b.execution, null, 2)}</pre>
          </Card>

          <Card variant="dashboardPanel" className="space-y-2 text-sm">
            <h2 className="font-semibold text-[#0B0B0B]">Outcome linkage (advisory)</h2>
            <pre className="whitespace-pre-wrap text-xs text-[#5C5C57]">{JSON.stringify(b.outcome, null, 2)}</pre>
          </Card>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="!text-[#0B0B0B]" onClick={() => void rollback()}>
              Request rollback (if eligible)
            </Button>
          </div>
        </>
      : null}

      {!loading && data?.execution ?
        <Card variant="dashboardPanel" className="text-xs">
          <p className="font-semibold text-[#0B0B0B] mb-2">Raw execution row</p>
          <pre className="max-h-96 overflow-auto whitespace-pre-wrap">{JSON.stringify(data.execution, null, 2)}</pre>
        </Card>
      : null}
    </div>
  );
}
