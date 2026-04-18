"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FieldPreviewRow } from "@/components/oaciq-forms/FieldPreviewRow";
import { FormDependencyPanel } from "@/components/oaciq-forms/FormDependencyPanel";
import { FormPreviewShell } from "@/components/oaciq-forms/FormPreviewShell";
import { SectionPreviewCard } from "@/components/oaciq-forms/SectionPreviewCard";
import { CanonicalDealEditor } from "./CanonicalDealEditor";
import { CrossFormIssuesPanel } from "./CrossFormIssuesPanel";
import { ExactFieldMappingPanel } from "./ExactFieldMappingPanel";
import { ExecutionBridgePanel } from "./ExecutionBridgePanel";
import { FormSelectorRail } from "./FormSelectorRail";
import { OfficialExecutionStatusCard } from "./OfficialExecutionStatusCard";

type MapResponse = {
  map: {
    formKey: string;
    missingRequiredKeys: string[];
    fieldTrace: { fieldKey: string; sourcePath: string; confidence: number; unmapped?: boolean }[];
    warnings: string[];
  };
  preview?: {
    blocks: { kind: string; sectionKey?: string; fieldKey?: string; label: string; valueDisplay: string; order: number }[];
  };
};

type DepsResponse = {
  requiredForms: string[];
  recommendedForms: string[];
  blockingMissingForms: string[];
  notes: string[];
};

type ValidateResponse = {
  globalIssues?: { severity: "info" | "warning" | "critical"; code: string; message: string; formKey?: string }[];
};

export function ExactMapperWorkspace({ dealId }: { dealId: string }) {
  const [formKey, setFormKey] = useState("PP");
  const [overlayJson, setOverlayJson] = useState("");
  const [mapData, setMapData] = useState<MapResponse | null>(null);
  const [previewBlocks, setPreviewBlocks] = useState<MapResponse["preview"] | null>(null);
  const [deps, setDeps] = useState<DepsResponse | null>(null);
  const [globalIssues, setGlobalIssues] = useState<ValidateResponse["globalIssues"]>([]);
  const [debug, setDebug] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const overlayRef = useRef(overlayJson);
  overlayRef.current = overlayJson;

  const parseOverlayRef = () => {
    const raw = overlayRef.current;
    if (!raw.trim()) return undefined;
    try {
      const o = JSON.parse(raw) as unknown;
      return o as Record<string, unknown>;
    } catch {
      return undefined;
    }
  };

  const refresh = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const overlay = parseOverlayRef();
      const res = await fetch(`/api/deals/${dealId}/map/${encodeURIComponent(formKey)}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(overlay ? { canonicalOverlay: overlay } : {}),
      });
      const data = (await res.json()) as MapResponse & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Map failed");
      setMapData(data);

      const prev = await fetch(`/api/deals/${dealId}/preview/${encodeURIComponent(formKey)}`, { credentials: "include" });
      const prevData = (await prev.json()) as { preview: MapResponse["preview"]; error?: string };
      if (prev.ok) setPreviewBlocks(prevData.preview);

      const depRes = await fetch(`/api/deals/${dealId}/dependencies?forms=${encodeURIComponent(formKey)}`, {
        credentials: "include",
      });
      const depData = (await depRes.json()) as DepsResponse & { error?: string };
      if (depRes.ok) setDeps(depData);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [dealId, formKey]);

  useEffect(() => {
    void refresh();
  }, [dealId, formKey, refresh]);

  async function runValidateAll() {
    setLoading(true);
    setErr(null);
    try {
      const overlay = parseOverlayRef();
      const res = await fetch(`/api/deals/${dealId}/validate/exact`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activeFormKeys: ["PP", "CP", "DS", "IV", "RIS", "RH"],
          ...(overlay ? { canonicalOverlay: overlay } : {}),
        }),
      });
      const data = (await res.json()) as ValidateResponse & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Validation failed");
      setGlobalIssues(data.globalIssues ?? []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  const blocks = previewBlocks?.blocks ?? [];
  const sectionBlocks = blocks.filter((b) => b.kind === "section");
  const fieldBlocks = blocks.filter((b) => b.kind === "field");

  return (
    <div className="space-y-6 rounded-2xl border border-emerald-500/20 bg-black/35 p-5">
      <div className="rounded-xl border border-emerald-500/25 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-100/90">
        <p className="font-semibold text-emerald-200">Exact OACIQ mapper (specimen field registry v1)</p>
        <p className="mt-1 text-xs text-emerald-100/75">
          Field-by-field assistance only. Outputs stay draft until broker review. Not an official executable form.
        </p>
      </div>

      <FormSelectorRail value={formKey} onChange={setFormKey} />

      <CanonicalDealEditor value={overlayJson} onChange={setOverlayJson} />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={loading}
          onClick={() => void refresh()}
          className="rounded-lg bg-emerald-600/90 px-3 py-2 text-xs font-medium text-white"
        >
          Refresh map
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => void runValidateAll()}
          className="rounded-lg border border-emerald-500/40 px-3 py-2 text-xs text-emerald-200"
        >
          Run cross-form validation
        </button>
        <label className="flex items-center gap-2 text-xs text-ds-text-secondary">
          <input type="checkbox" checked={debug} onChange={(e) => setDebug(e.target.checked)} />
          Debug (source paths)
        </label>
      </div>

      {err ? <p className="text-sm text-amber-300">{err}</p> : null}

      {mapData?.map ? (
        <ExactFieldMappingPanel
          missingRequiredKeys={mapData.map.missingRequiredKeys}
          fieldTrace={mapData.map.fieldTrace}
          debug={debug}
        />
      ) : null}

      {deps ? (
        <FormDependencyPanel
          requiredForms={deps.requiredForms}
          recommendedForms={deps.recommendedForms}
          blockingMissingForms={deps.blockingMissingForms}
          notes={deps.notes}
        />
      ) : null}

      <div>
        <h4 className="text-sm font-medium text-ds-text">Cross-form / global issues</h4>
        <CrossFormIssuesPanel issues={globalIssues ?? []} />
      </div>

      <OfficialExecutionStatusCard dealId={dealId} />
      <ExecutionBridgePanel dealId={dealId} formKey={formKey} />

      <FormPreviewShell formKey={formKey} title="Ordered preview blocks mirror registry section order">
        {sectionBlocks.length === 0 ? (
          <p className="text-xs text-ds-text-secondary">No preview blocks yet — refresh map or check form key.</p>
        ) : (
          sectionBlocks.map((sec) => (
            <SectionPreviewCard key={sec.sectionKey ?? sec.label} title={sec.label} description={sec.valueDisplay}>
              {fieldBlocks
                .filter((f) => f.sectionKey === sec.sectionKey)
                .map((f) => {
                  const trace = mapData?.map.fieldTrace.find((t) => t.fieldKey === f.fieldKey);
                  return (
                    <FieldPreviewRow
                      key={f.fieldKey}
                      label={f.label}
                      valueDisplay={f.valueDisplay}
                      fieldKey={f.fieldKey ?? ""}
                      unmapped={trace?.unmapped}
                      debug={debug}
                      sourcePath={trace?.sourcePath}
                      confidence={trace?.confidence}
                    />
                  );
                })}
            </SectionPreviewCard>
          ))
        )}
      </FormPreviewShell>
    </div>
  );
}
