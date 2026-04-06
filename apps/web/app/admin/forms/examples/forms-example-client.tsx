"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PrintPageButton } from "@/components/ui/PrintPageButton";

type ExampleItem = {
  id: string;
  label: string;
  version: string;
  sampleText: string;
  filledPreview: Array<{
    title: string;
    fields: Array<{
      label: string;
      value: string;
      status?: "filled" | "review";
    }>;
  }>;
};

type Analysis = {
  detectedFormId: string;
  detectedLabel: string;
  confidence: "high" | "medium" | "low";
  version: string | null;
  sections: string[];
  autofillable: string[];
  reviewRequired: string[];
  notes: string[];
  filledPreview: Array<{
    title: string;
    fields: Array<{
      label: string;
      value: string;
      status?: "filled" | "review";
    }>;
  }>;
};

type PreviewSection = Analysis["filledPreview"][number];

type LibraryItem = {
  name: string;
  path: string;
  type: string;
  sizeBytes: number;
  modifiedAt: string;
};

export function FormsExampleClient({ examples }: { examples: ExampleItem[] }) {
  const [selectedId, setSelectedId] = useState<string>(examples[0]?.id ?? "");
  const selectedExample = useMemo(
    () => examples.find((entry) => entry.id === selectedId) ?? examples[0] ?? null,
    [examples, selectedId]
  );
  const [rawText, setRawText] = useState<string>(selectedExample?.sampleText ?? "");
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [libraryPath, setLibraryPath] = useState<string>("");
  const [libraryError, setLibraryError] = useState<string | null>(null);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [selectedLibraryName, setSelectedLibraryName] = useState<string>("");
  const [loadingLibraryFile, setLoadingLibraryFile] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [draftSections, setDraftSections] = useState<PreviewSection[]>([]);
  const [savingDraft, setSavingDraft] = useState(false);
  const [saveResult, setSaveResult] = useState<{ submissionId: string; redirectTo: string } | null>(null);
  const [sendingForSign, setSendingForSign] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadLibrary() {
      setLibraryLoading(true);
      try {
        const response = await fetch("/api/admin/forms/library");
        const data = await response.json().catch(() => ({}));
        if (!active) return;
        setLibraryItems(Array.isArray(data?.forms) ? data.forms : []);
        setLibraryPath(typeof data?.directory === "string" ? data.directory : "");
        setLibraryError(typeof data?.error === "string" ? data.error : null);
      } catch {
        if (!active) return;
        setLibraryError("Could not load Desktop forms folder.");
      } finally {
        if (active) setLibraryLoading(false);
      }
    }

    loadLibrary();
    return () => {
      active = false;
    };
  }, []);

  async function runExample(text: string) {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/forms/examples/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: text }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data?.error ?? "Analysis failed.");
        setAnalysis(null);
        setDraftSections([]);
        return;
      }
      const nextAnalysis = data.analysis ?? null;
      setAnalysis(nextAnalysis);
      setDraftSections(Array.isArray(nextAnalysis?.filledPreview) ? nextAnalysis.filledPreview : []);
    } catch {
      setError("Could not analyze example text.");
      setAnalysis(null);
      setDraftSections([]);
    } finally {
      setLoading(false);
    }
  }

  function loadExample(id: string) {
    setSelectedId(id);
    setSelectedLibraryName("");
    const next = examples.find((entry) => entry.id === id);
    if (next) {
      setRawText(next.sampleText);
      setAnalysis(null);
      setError(null);
      setDraftSections(next.filledPreview ?? []);
      setSaveResult(null);
    }
  }

  async function loadLibraryFile(name: string) {
    setSelectedLibraryName(name);
    setLoadingLibraryFile(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/forms/library/read?name=${encodeURIComponent(name)}`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data?.error ?? "Could not load selected form.");
        return;
      }
      setRawText(typeof data?.text === "string" ? data.text : "");
      setAnalysis(null);
      setDraftSections([]);
      setSaveResult(null);
    } catch {
      setError("Could not load selected form.");
    } finally {
      setLoadingLibraryFile(false);
    }
  }

  function updateDraftField(sectionIndex: number, fieldIndex: number, value: string) {
    setDraftSections((current) =>
      current.map((section, sIdx) =>
        sIdx !== sectionIndex
          ? section
          : {
              ...section,
              fields: section.fields.map((field, fIdx) =>
                fIdx !== fieldIndex ? field : { ...field, value }
              ),
            }
      )
    );
  }

  async function saveDraft() {
    const payload = buildPayloadFromSections(draftSections, {
      detectedFormId: analysis?.detectedFormId ?? selectedExample?.id ?? "unknown",
      detectedLabel: analysis?.detectedLabel ?? selectedExample?.label ?? "Unknown form",
      sourceFileName: selectedLibraryName || null,
    });

    setSavingDraft(true);
    setError(null);
    setSaveResult(null);
    try {
      const response = await fetch("/api/admin/forms/examples/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formType: analysis?.detectedFormId ?? selectedExample?.id ?? "oaciq-refill-draft",
          sourceFileName: selectedLibraryName || null,
          payload,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data?.error ?? "Could not save draft.");
        return;
      }
      setSaveResult({
        submissionId: data.submissionId,
        redirectTo: data.redirectTo,
      });
    } catch {
      setError("Could not save draft.");
    } finally {
      setSavingDraft(false);
    }
  }

  async function sendSavedDraftForSign() {
    if (!saveResult?.submissionId) return;
    setSendingForSign(true);
    setError(null);
    try {
      const response = await fetch(`/api/forms/${saveResult.submissionId}/send-for-sign`, {
        method: "POST",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data?.error ?? "Could not send signature email.");
      }
    } catch {
      setError("Could not send signature email.");
    } finally {
      setSendingForSign(false);
    }
  }

  return (
    <section className="mt-8 rounded-2xl border border-amber-500/20 bg-slate-900/70 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-300">
            AI form refill example
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            Test if the AI recognizes and prepares a refill draft
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-400">
            Use the built-in OACIQ examples first, then paste extracted text from a real PDF or DOCX to compare the result.
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        {examples.map((entry) => {
          const active = entry.id === selectedId;
          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => loadExample(entry.id)}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                active
                  ? "border-amber-400 bg-amber-500/20 text-amber-100"
                  : "border-slate-700 bg-slate-950/70 text-slate-300 hover:border-slate-500"
              }`}
            >
              {entry.label}
            </button>
          );
        })}
      </div>

      {selectedLibraryName || selectedExample?.filledPreview?.length || draftSections.length ? (
        <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-emerald-100">Sample filled draft</h3>
              <p className="mt-1 text-sm text-slate-400">
                {selectedLibraryName
                  ? "This draft is generated from the extracted text of the selected real form."
                  : "This is a prefilled example showing how the platform can present a review-first refill result."}
              </p>
            </div>
            <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200">
              {selectedLibraryName ? "Generated preview" : "Example only"}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <PrintPageButton
              label="Print preview"
              className="rounded-xl border border-emerald-400/40 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-500/10"
            />
            <button
              type="button"
              onClick={saveDraft}
              disabled={savingDraft || draftSections.length === 0}
              className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
            >
              {savingDraft ? "Saving draft..." : "Save as draft"}
            </button>
            {saveResult ? (
              <Link
                href={saveResult.redirectTo}
                className="rounded-xl border border-emerald-400/40 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-500/10"
              >
                Open saved draft
              </Link>
            ) : null}
            {saveResult ? (
              <button
                type="button"
                onClick={sendSavedDraftForSign}
                disabled={sendingForSign}
                className="rounded-xl border border-amber-400/40 px-4 py-2 text-sm font-medium text-amber-100 transition hover:bg-amber-500/10 disabled:opacity-50"
              >
                {sendingForSign ? "Sending..." : "Send by e-mail for sign"}
              </button>
            ) : null}
          </div>
          {saveResult ? (
            <p className="mt-3 text-sm text-emerald-200">
              Draft saved successfully as `{saveResult.submissionId}`.
            </p>
          ) : null}

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {draftSections.map((section, sectionIndex) => (
              <div
                key={section.title}
                className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4"
              >
                <h4 className="text-sm font-semibold text-white">{section.title}</h4>
                <div className="mt-3 space-y-3">
                  {section.fields.map((field, fieldIndex) => (
                    <div
                      key={`${section.title}-${field.label}`}
                      className="rounded-xl border border-slate-800 bg-slate-900/70 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
                          {field.label}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                            field.status === "review"
                              ? "bg-amber-500/15 text-amber-200"
                              : "bg-emerald-500/15 text-emerald-200"
                          }`}
                        >
                          {field.status === "review" ? "Review" : "Filled"}
                        </span>
                      </div>
                      <input
                        type="text"
                        value={field.value}
                        onChange={(event) =>
                          updateDraftField(sectionIndex, fieldIndex, event.target.value)
                        }
                        className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-5 grid gap-5 xl:grid-cols-[0.55fr_1.05fr_0.8fr]">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
          <h3 className="text-sm font-semibold text-slate-100">Desktop forms folder</h3>
          <p className="mt-2 text-xs text-slate-500">
            {libraryPath || "Folder path not available."}
          </p>
          {libraryLoading ? (
            <p className="mt-3 text-sm text-slate-400">Loading files...</p>
          ) : null}
          {libraryError ? (
            <p className="mt-3 text-sm text-amber-300">{libraryError}</p>
          ) : null}
          <div className="mt-4 max-h-[420px] space-y-2 overflow-auto">
            {libraryItems.length === 0 ? (
              <p className="text-sm text-slate-500">
                No supported `pdf`, `docx`, or `txt` files found yet.
              </p>
            ) : (
              libraryItems.map((item) => {
                const active = item.name === selectedLibraryName;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => loadLibraryFile(item.name)}
                    className={`block w-full rounded-xl border p-3 text-left transition ${
                      active
                        ? "border-amber-400 bg-amber-500/10"
                        : "border-slate-800 bg-slate-900/70 hover:border-slate-600"
                    }`}
                  >
                    <p className="text-sm font-medium text-slate-100">{item.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.type} · {Math.max(1, Math.round(item.sizeBytes / 1024))} KB
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200">
            Extracted form text
          </label>
          <textarea
            value={rawText}
            onChange={(event) => setRawText(event.target.value)}
            className="min-h-[280px] w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-amber-400"
            placeholder="Paste PDF or DOCX extracted text here..."
          />
          <div className="mt-3 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => runExample(rawText)}
              disabled={loading || loadingLibraryFile}
              className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:opacity-50"
            >
              {loading ? "Analyzing..." : "Analyze refill example"}
            </button>
            {selectedExample ? (
              <button
                type="button"
                onClick={() => {
                  setRawText(selectedExample.sampleText);
                  setAnalysis(null);
                  setError(null);
                }}
                className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-500"
              >
                Reset sample text
              </button>
            ) : null}
          </div>
          {loadingLibraryFile ? (
            <p className="mt-3 text-sm text-slate-400">Reading selected form and extracting text...</p>
          ) : null}
          {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
          <h3 className="text-sm font-semibold text-slate-100">Analysis result</h3>
          {!analysis ? (
            <p className="mt-3 text-sm text-slate-500">
              Run the analyzer to see detected form type, sections, and refillable fields.
            </p>
          ) : (
            <div className="mt-3 space-y-4 text-sm">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Detected form</p>
                <p className="mt-1 font-medium text-white">{analysis.detectedLabel}</p>
                <p className="text-slate-400">
                  {analysis.version ?? "No version"} · confidence {analysis.confidence}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Sections recognized</p>
                <ul className="mt-2 space-y-1 text-slate-300">
                  {analysis.sections.map((entry) => (
                    <li key={entry}>• {entry}</li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Autofill candidates</p>
                <ul className="mt-2 space-y-1 text-emerald-300">
                  {analysis.autofillable.map((entry) => (
                    <li key={entry}>• {entry}</li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Human review required</p>
                <ul className="mt-2 space-y-1 text-amber-200">
                  {analysis.reviewRequired.map((entry) => (
                    <li key={entry}>• {entry}</li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Notes</p>
                <ul className="mt-2 space-y-1 text-slate-400">
                  {analysis.notes.map((entry) => (
                    <li key={entry}>• {entry}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function buildPayloadFromSections(
  sections: PreviewSection[],
  meta: {
    detectedFormId: string;
    detectedLabel: string;
    sourceFileName: string | null;
  }
) {
  const payload: Record<string, unknown> = {
    detectedFormId: meta.detectedFormId,
    detectedLabel: meta.detectedLabel,
    sourceFileName: meta.sourceFileName,
  };

  sections.forEach((section) => {
    section.fields.forEach((field) => {
      const key = `${slugify(section.title)}__${slugify(field.label)}`;
      payload[key] = field.value;

      if (/buyer/i.test(field.label) && /name/i.test(field.label)) payload.buyer_name = field.value;
      if (/seller/i.test(field.label) && /name/i.test(field.label)) payload.seller_name = field.value;
      if (/email/i.test(field.label)) payload.email = field.value;
      if (/address/i.test(field.label)) payload.address = field.value;
      if (/price/i.test(field.label)) payload.price = field.value;
      if (/deposit/i.test(field.label)) payload.deposit = field.value;
    });
  });

  return payload;
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}
