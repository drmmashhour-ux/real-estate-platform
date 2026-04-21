"use client";

import { useMemo, useState } from "react";
import type { RenoclimatFormDraft } from "@/modules/green-ai/form-assistant/form.types";
import { runFormAssistant } from "@/modules/green-ai/form-assistant/form-assistant.engine";
import type { GreenEngineInput } from "@/modules/green/green.types";
import { evaluateGreenEngine } from "@/modules/green/green.engine";
import { FIELD_GUIDANCE } from "@/modules/green-ai/form-assistant/form-assistant.engine";

const emptyDraft: RenoclimatFormDraft = {
  ownerName: "",
  address: "",
  municipality: "",
  postalCode: "",
  propertyType: "",
  yearBuilt: undefined,
  heatingSystem: "",
  insulation: "",
  windows: "",
  plannedUpgrades: [],
  additionalNotes: "",
};

export function GreenFormsAssistantClient() {
  const [intake, setIntake] = useState<GreenEngineInput>({
    propertyType: "House",
    yearBuilt: 1985,
    insulationQuality: "average",
    windowsQuality: "double",
    heatingType: "Natural gas furnace",
    surfaceSqft: 1800,
  });

  const [manual, setManual] = useState<RenoclimatFormDraft>(emptyDraft);

  const derived = useMemo(() => {
    const engine = evaluateGreenEngine(intake);
    return runFormAssistant({
      intake,
      improvements: engine.improvements,
      overrides: {
        ownerName: manual.ownerName,
        address: manual.address,
        municipality: manual.municipality || undefined,
        postalCode: manual.postalCode || undefined,
        propertyType: manual.propertyType || intake.propertyType || "",
        yearBuilt: manual.yearBuilt ?? intake.yearBuilt,
        heatingSystem: manual.heatingSystem,
        insulation: manual.insulation,
        windows: manual.windows,
        plannedUpgrades: manual.plannedUpgrades,
        additionalNotes: manual.additionalNotes,
      },
      meta: {
        ownerName: manual.ownerName,
        address: manual.address,
        municipality: manual.municipality,
        postalCode: manual.postalCode,
        additionalNotes: manual.additionalNotes,
      },
    });
  }, [intake, manual]);

  function copyPlain() {
    void navigator.clipboard.writeText(derived.export.plainText);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-10">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400/90">Green forms</p>
        <h1 className="mt-1 font-serif text-3xl font-semibold text-white">Rénoclimat prep assistant</h1>
        <p className="mt-2 max-w-2xl text-sm text-premium-secondary">
          Draft intake-style answers locally in your browser. LECIPM never submits these fields to government systems.
        </p>
        <div className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-sm text-amber-100/95">
          {derived.disclaimer}
          <span className="mt-2 block text-[11px] text-amber-200/80">
            ❌ No automatic submission. ❌ Do not imply an official filing.
          </span>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="card-premium space-y-4 p-6">
          <h2 className="text-lg font-semibold text-white">Property intake (auto-fill source)</h2>
          <label className="block text-xs text-slate-400">
            Property type
            <input
              value={intake.propertyType ?? ""}
              onChange={(e) => setIntake((s) => ({ ...s, propertyType: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
            />
          </label>
          <label className="block text-xs text-slate-400">
            Year built
            <input
              type="number"
              value={intake.yearBuilt ?? ""}
              onChange={(e) =>
                setIntake((s) => ({
                  ...s,
                  yearBuilt: e.target.value === "" ? undefined : Number(e.target.value),
                }))
              }
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
            />
          </label>
          <label className="block text-xs text-slate-400">
            Heating (describe)
            <input
              value={intake.heatingType ?? ""}
              onChange={(e) => setIntake((s) => ({ ...s, heatingType: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
            />
          </label>
          <label className="block text-xs text-slate-400">
            Insulation quality
            <select
              value={intake.insulationQuality ?? "unknown"}
              onChange={(e) =>
                setIntake((s) => ({
                  ...s,
                  insulationQuality: e.target.value as GreenEngineInput["insulationQuality"],
                }))
              }
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
            >
              <option value="poor">Poor</option>
              <option value="average">Average</option>
              <option value="good">Good</option>
              <option value="unknown">Unknown</option>
            </select>
          </label>
          <label className="block text-xs text-slate-400">
            Windows
            <select
              value={intake.windowsQuality ?? "unknown"}
              onChange={(e) =>
                setIntake((s) => ({
                  ...s,
                  windowsQuality: e.target.value as GreenEngineInput["windowsQuality"],
                }))
              }
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
            >
              <option value="single">Single</option>
              <option value="double">Double</option>
              <option value="triple_high_performance">Triple / high-performance</option>
              <option value="unknown">Unknown</option>
            </select>
          </label>
        </section>

        <section className="card-premium space-y-4 p-6">
          <h2 className="text-lg font-semibold text-white">Editable draft fields</h2>
          <label className="block text-xs text-slate-400">
            {FIELD_GUIDANCE.propertyType?.label}
            <input
              value={manual.propertyType}
              onChange={(e) => setManual((s) => ({ ...s, propertyType: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
            />
            <span className="mt-1 block text-[11px] text-slate-500">{FIELD_GUIDANCE.propertyType?.explanation}</span>
          </label>
          <label className="block text-xs text-slate-400">
            Year built (override)
            <input
              type="number"
              value={manual.yearBuilt ?? ""}
              onChange={(e) =>
                setManual((s) => ({
                  ...s,
                  yearBuilt: e.target.value === "" ? undefined : Number(e.target.value),
                }))
              }
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
            />
          </label>
          {(
            [
              "ownerName",
              "address",
              "municipality",
              "postalCode",
              "heatingSystem",
              "insulation",
              "windows",
              "additionalNotes",
            ] as const
          ).map((key) => (
            <label key={key} className="block text-xs text-slate-400">
              {FIELD_GUIDANCE[key]?.label ?? key}
              <textarea
                rows={key === "additionalNotes" ? 3 : 2}
                value={(manual[key] as string) ?? ""}
                onChange={(e) =>
                  setManual((s) => ({
                    ...s,
                    [key]: e.target.value,
                  }))
                }
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
              />
              <span className="mt-1 block text-[11px] text-slate-500">{FIELD_GUIDANCE[key]?.explanation}</span>
              <span className="mt-0.5 block text-[11px] italic text-emerald-200/70">
                Example: {FIELD_GUIDANCE[key]?.example}
              </span>
            </label>
          ))}
          <label className="block text-xs text-slate-400">
            Planned upgrades (one per line)
            <textarea
              rows={5}
              value={manual.plannedUpgrades.join("\n")}
              onChange={(e) =>
                setManual((s) => ({
                  ...s,
                  plannedUpgrades: e.target.value
                    .split("\n")
                    .map((x) => x.trim())
                    .filter(Boolean),
                }))
              }
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 font-mono text-xs text-white"
            />
          </label>
        </section>
      </div>

      <section className="card-premium p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">Validation</h2>
          <button
            type="button"
            onClick={() => copyPlain()}
            className="rounded-xl bg-premium-gold px-4 py-2 text-sm font-bold text-[#0B0B0B]"
          >
            Copy plain-text draft
          </button>
        </div>
        <p className={`mt-2 text-sm ${derived.validation.isReady ? "text-emerald-300" : "text-amber-200"}`}>
          {derived.validation.isReady
            ? "Core fields present — still verify against official PDFs."
            : "Complete highlighted fields before relying on this draft."}
        </p>
        {derived.validation.missingFields.length > 0 ? (
          <ul className="mt-3 list-inside list-disc text-sm text-amber-200/95">
            {derived.validation.missingFields.map((f) => (
              <li key={f}>Missing: {f}</li>
            ))}
          </ul>
        ) : null}
        {derived.validation.issues.map((i) => (
          <p key={i.fieldId + i.message} className="mt-2 text-xs text-slate-400">
            {i.message}
          </p>
        ))}
      </section>

      <section className="card-premium p-6">
        <h2 className="text-lg font-semibold text-white">Form preview</h2>
        <pre className="mt-4 max-h-[420px] overflow-auto rounded-xl border border-white/10 bg-black/40 p-4 text-xs leading-relaxed text-slate-200">
          {derived.export.plainText}
        </pre>
      </section>

      <section className="card-premium p-6">
        <h2 className="text-lg font-semibold text-white">PDF-ready sections</h2>
        <div className="mt-4 space-y-4">
          {derived.pdfReady.map((sec) => (
            <div key={sec.title} className="rounded-xl border border-white/10 bg-black/30 p-4">
              <p className="text-sm font-semibold text-emerald-200">{sec.title}</p>
              <ul className="mt-2 list-inside list-disc text-sm text-slate-300">
                {sec.lines.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
