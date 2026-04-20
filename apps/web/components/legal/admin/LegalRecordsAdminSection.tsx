"use client";

import { useEffect, useMemo, useState } from "react";
import { LegalRecordDetailsCard, type LegalRecordAdminRow } from "./LegalRecordDetailsCard";
import { LegalRecordTable } from "./LegalRecordTable";

type ApiPayload = {
  records: LegalRecordAdminRow[];
  flags?: string[];
  disabled?: boolean;
};

export function LegalRecordsAdminSection({
  entityType,
  entityId,
}: {
  entityType?: string | null;
  entityId?: string | null;
}) {
  const [data, setData] = useState<ApiPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const qs = new URLSearchParams();
    if (entityType) qs.set("entityType", entityType);
    if (entityId) qs.set("entityId", entityId);
    const url = `/api/admin/legal/records${qs.toString() ? `?${qs.toString()}` : ""}`;
    void fetch(url, { credentials: "same-origin" })
      .then((r) => r.json() as Promise<ApiPayload>)
      .then((j) => {
        if (cancelled) return;
        setData(j);
        const first = j.records?.[0]?.id;
        if (first) setSelectedId(first);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [entityType, entityId]);

  const selected = useMemo(() => data?.records?.find((r) => r.id === selectedId) ?? null, [data, selectedId]);

  if (loading) {
    return <p className="text-xs text-slate-500">Loading legal records…</p>;
  }

  if (data?.disabled) {
    return (
      <p className="text-xs text-slate-500">
        Legal record import admin API is disabled (set FEATURE_LEGAL_RECORD_IMPORT_V1 and admin review flag).
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {data?.flags?.length ?
        <p className="text-[10px] text-slate-500">Flags: {data.flags.join(", ")}</p>
      : null}
      <LegalRecordTable
        records={Array.isArray(data?.records) ? data!.records : []}
        selectedId={selectedId}
        onSelect={(id) => setSelectedId(id)}
      />
      {selected ?
        <LegalRecordDetailsCard record={selected} />
      : null}
    </div>
  );
}
