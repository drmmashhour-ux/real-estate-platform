"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ContractTemplateDefinition, ContractTemplateField, TemplateSectionKey } from "@/modules/contracts/templates";
import { TEMPLATE_SECTION_KEYS, fieldsForSection, sortSections } from "@/modules/contracts/templates";
import {
  analyzeContractDraft,
  autoFixDraftValues,
  canSaveDraft,
  improveTextDraft,
  type DraftAnalysis,
} from "@/lib/contracts/draft-assistant-analyze";
import { DraftingAssistantPanel } from "@/components/ai/DraftingAssistantPanel";
import { ContractDraftFieldInput } from "@/components/admin/ContractDraftFieldInput";

function sectionTitle(def: ContractTemplateDefinition, key: TemplateSectionKey): string {
  const s = def.sections.find((x) => x.key === key);
  if (s?.title) return s.title;
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function StatusDot({ status }: { status: "complete" | "warning" | "error" | "empty" }) {
  const cls =
    status === "complete"
      ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"
      : status === "warning"
        ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]"
        : status === "error"
          ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
          : "bg-slate-600";
  return <span className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${cls}`} title={status} />;
}

export function ContractBuilderEditor({ id }: { id: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [contractType, setContractType] = useState("");
  const [def, setDef] = useState<ContractTemplateDefinition | null>(null);
  const [draftValues, setDraftValues] = useState<Record<string, string>>({});
  const [draftHydrated, setDraftHydrated] = useState(false);
  const [analysis, setAnalysis] = useState<DraftAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"idle" | "check" | "fix" | "improve">("idle");
  const [showStructure, setShowStructure] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/contract-draft-templates/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load");
      setName(data.name ?? "");
      setSlug(data.slug ?? "");
      setContractType(data.contractType ?? "");
      setDef(data.definition as ContractTemplateDefinition);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!def || draftHydrated) return;
    try {
      const raw = localStorage.getItem(`contract-builder-draft-${id}`);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, string>;
        if (parsed && typeof parsed === "object") setDraftValues(parsed);
      }
    } catch {
      /* ignore */
    }
    setDraftHydrated(true);
  }, [def, id, draftHydrated]);

  useEffect(() => {
    if (!def || !draftHydrated) return;
    try {
      localStorage.setItem(`contract-builder-draft-${id}`, JSON.stringify(draftValues));
    } catch {
      /* ignore */
    }
  }, [id, draftValues, def, draftHydrated]);

  useEffect(() => {
    if (!def) return;
    setAnalysis(analyzeContractDraft(def, draftValues));
  }, [def, draftValues]);

  const sectionsOrdered = useMemo(() => (def ? sortSections(def.sections) : []), [def]);

  function setDraft(key: string, value: string) {
    setDraftValues((prev) => ({ ...prev, [key]: value }));
  }

  function moveSection(index: number, dir: -1 | 1) {
    if (!def) return;
    const next = [...sectionsOrdered];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    const reordered = next.map((s, i) => ({ ...s, sortOrder: i }));
    setDef({ ...def, sections: reordered });
  }

  function toggleFieldRequired(fieldId: string) {
    if (!def) return;
    const fields = def.fields.map((f) => (f.id === fieldId ? { ...f, required: !f.required } : f));
    setDef({ ...def, fields });
  }

  function scrollToSection(key: TemplateSectionKey) {
    const el = document.getElementById(`draft-section-${key}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function runComplianceCheck() {
    if (!def) return;
    setBusy("check");
    await new Promise((r) => setTimeout(r, 180));
    setAnalysis(analyzeContractDraft(def, draftValues));
    setBusy("idle");
  }

  async function runAutoFix() {
    if (!def) return;
    setBusy("fix");
    await new Promise((r) => setTimeout(r, 180));
    setDraftValues(autoFixDraftValues(def, draftValues));
    setBusy("idle");
  }

  async function runImproveText() {
    if (!def) return;
    setBusy("improve");
    await new Promise((r) => setTimeout(r, 200));
    setDraftValues(improveTextDraft(def, draftValues));
    setBusy("idle");
  }

  async function save() {
    if (!def) return;
    const gate = canSaveDraft(def, draftValues);
    if (!gate.ok) {
      setError(gate.message);
      void runComplianceCheck();
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/contract-draft-templates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          contractType,
          definition: def,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm("Delete this template?")) return;
    const res = await fetch(`/api/admin/contract-draft-templates/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Delete failed");
      return;
    }
    router.push("/admin/contracts-builder");
    router.refresh();
  }

  if (loading || !def) {
    return <p className="text-slate-400">{loading ? "Loading…" : "No definition"}</p>;
  }

  const sectionStatus = analysis?.sectionStatus;

  return (
    <div className="flex min-h-[calc(100vh-5rem)] flex-col">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link href="/admin/contracts-builder" className="text-sm text-[#C9A646] hover:underline">
          ← Templates
        </Link>
      </div>

      <div className="mb-6 grid gap-4 rounded-2xl border border-white/10 bg-black/30 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block text-sm">
          <span className="text-slate-400">Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-slate-100"
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-400">Slug</span>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-slate-100"
          />
        </label>
        <label className="block text-sm sm:col-span-2 lg:col-span-2">
          <span className="text-slate-400">Contract type</span>
          <input
            value={contractType}
            onChange={(e) => setContractType(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-slate-100"
          />
        </label>
      </div>

      <div className="grid min-h-[560px] flex-1 grid-cols-1 gap-0 overflow-hidden rounded-2xl border border-white/10 bg-[#070707] lg:grid-cols-[220px_1fr_300px] xl:grid-cols-[240px_1fr_320px]">
        {/* Left — section navigation */}
        <nav className="border-b border-white/10 p-3 lg:border-b-0 lg:border-r">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Sections</p>
          <ul className="space-y-1">
            {TEMPLATE_SECTION_KEYS.map((key) => {
              const st = sectionStatus?.[key] ?? "empty";
              return (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => scrollToSection(key)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-slate-200 hover:bg-white/5"
                  >
                    <StatusDot status={st} />
                    <span className="min-w-0 flex-1 truncate">{sectionTitle(def, key)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            onClick={() => setShowStructure((s) => !s)}
            className="mt-4 w-full rounded-lg border border-white/10 py-2 text-xs text-slate-400 hover:bg-white/5"
          >
            {showStructure ? "Hide" : "Show"} template structure
          </button>
        </nav>

        {/* Center — draft form */}
        <div className="min-h-0 overflow-y-auto border-b border-white/10 p-4 lg:border-b-0 lg:border-r">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-white">Contract draft</h2>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void save()}
                disabled={saving}
                className="rounded-xl bg-[#C9A646] px-4 py-2 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save template"}
              </button>
              <button
                type="button"
                onClick={() => void remove()}
                className="rounded-xl border border-red-800 px-3 py-2 text-sm text-red-300 hover:bg-red-950/40"
              >
                Delete
              </button>
            </div>
          </div>
          {error ? <p className="mb-4 text-sm text-red-400">{error}</p> : null}

          <div className="space-y-8">
            {sectionsOrdered.map((sec) => {
              const fields = fieldsForSection(def, sec.key);
              if (fields.length === 0) {
                return (
                  <section
                    key={sec.id}
                    id={`draft-section-${sec.key}`}
                    className="scroll-mt-4 rounded-2xl border border-dashed border-white/10 bg-black/20 p-6"
                  >
                    <h3 className="text-base font-semibold text-slate-300">{sec.title}</h3>
                    <p className="mt-2 text-sm text-slate-500">No fields in this section yet.</p>
                  </section>
                );
              }
              return (
                <section
                  key={sec.id}
                  id={`draft-section-${sec.key}`}
                  className="scroll-mt-4 rounded-2xl border border-white/10 bg-black/40 p-5 shadow-sm"
                >
                  <h3 className="border-b border-white/5 pb-3 text-base font-semibold text-[#E8C547]">
                    {sec.title}
                  </h3>
                  <div className="mt-4 space-y-5">
                    {fields.map((f: ContractTemplateField) => (
                      <ContractDraftFieldInput
                        key={f.id}
                        field={f}
                        value={draftValues[f.key] ?? ""}
                        onChange={setDraft}
                        hint={analysis?.fieldHints[f.key]}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>

          {showStructure ? (
            <div className="mt-10 space-y-6 border-t border-white/10 pt-8">
              <h3 className="text-sm font-semibold text-slate-300">Template structure</h3>
              <p className="text-xs text-slate-500">
                Reorder sections and mark fields required. This defines the schema; the draft above is a preview fill-in.
              </p>
              <ul className="space-y-2">
                {sectionsOrdered.map((s, i) => (
                  <li
                    key={s.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/40 px-3 py-2"
                  >
                    <span className="text-sm text-slate-200">{s.title}</span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => moveSection(i, -1)}
                        disabled={i === 0}
                        className="rounded border border-white/20 px-2 py-0.5 text-xs text-slate-400 disabled:opacity-30"
                      >
                        Up
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSection(i, 1)}
                        disabled={i === sectionsOrdered.length - 1}
                        className="rounded border border-white/20 px-2 py-0.5 text-xs text-slate-400 disabled:opacity-30"
                      >
                        Down
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <ul className="space-y-2">
                {def.fields.map((f: ContractTemplateField) => (
                  <li
                    key={f.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 px-3 py-2"
                  >
                    <span className="text-xs text-slate-400">
                      {f.label} · <code className="text-slate-500">{f.key}</code>
                    </span>
                    <label className="flex items-center gap-2 text-xs text-slate-300">
                      <input
                        type="checkbox"
                        checked={f.required}
                        onChange={() => toggleFieldRequired(f.id)}
                      />
                      Required
                    </label>
                  </li>
                ))}
              </ul>
              <section className="rounded-xl border border-slate-700/80 bg-slate-950/40 p-3">
                <h4 className="text-xs font-medium text-slate-400">Attachments</h4>
                <ul className="mt-2 text-xs text-slate-500">
                  {def.attachments.map((a) => (
                    <li key={a.type}>
                      {a.type} {a.required ? "(required)" : "(optional)"}
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          ) : null}
        </div>

        {/* Right — AI */}
        <DraftingAssistantPanel
          analysis={analysis}
          busy={busy}
          onCheckCompliance={() => void runComplianceCheck()}
          onAutoFix={() => void runAutoFix()}
          onImproveText={() => void runImproveText()}
          formAiContext={{
            sectionTitle: name || contractType || "Contract draft",
            draftText: JSON.stringify(draftValues),
          }}
        />
      </div>
    </div>
  );
}
