"use client";

import { useMemo, useState } from "react";
import type { DraftTemplate } from "@/src/modules/ai-drafting/templates/templateEngine";

type Props = { templates: DraftTemplate[] };

export function DraftEditor({ templates }: Props) {
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [values, setValues] = useState<Record<string, string>>({});
  const [suggestion, setSuggestion] = useState<string>("");
  const [issues, setIssues] = useState<Array<{ message: string; severity: string }>>([]);
  const [preview, setPreview] = useState<string>("");

  const template = useMemo(() => templates.find((t) => t.id === templateId) ?? null, [templates, templateId]);

  async function generate() {
    if (!template) return;
    const res = await fetch("/api/drafting/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateId: template.id, values }),
    });
    const json = await res.json();
    setPreview(json.document?.content ?? "");
  }

  async function validate() {
    if (!template) return;
    const res = await fetch("/api/drafting/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateId: template.id, values }),
    });
    const json = await res.json();
    setIssues(json.issues ?? []);
  }

  async function suggest(fieldKey: string) {
    if (!template) return;
    const res = await fetch("/api/drafting/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateId: template.id, fieldKey, context: values }),
    });
    const json = await res.json();
    setSuggestion(json.suggestion ?? "");
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <div className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-4">
        <label className="block text-sm text-slate-300">Template</label>
        <select className="w-full rounded-lg bg-black/40 p-2 text-sm" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
          {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>

        {template?.fields.map((field) => (
          <div key={field.key} className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs text-slate-300">{field.label}{field.required ? " *" : ""}</label>
              <button type="button" className="text-xs text-[#C9A646]" onClick={() => suggest(field.key)}>AI suggest</button>
            </div>
            <input
              className="w-full rounded-lg bg-black/40 p-2 text-sm"
              placeholder={field.placeholder ?? ""}
              value={values[field.key] ?? ""}
              onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
            />
          </div>
        ))}

        <div className="flex gap-2">
          <button type="button" onClick={validate} className="rounded-lg border border-white/20 px-3 py-2 text-xs">Validate</button>
          <button type="button" onClick={generate} className="rounded-lg bg-[#C9A646] px-3 py-2 text-xs text-black">Generate</button>
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-4">
        <p className="text-sm font-medium text-white">AI suggestion</p>
        <p className="rounded-lg border border-white/10 bg-black/40 p-3 text-xs text-slate-300">{suggestion || "Select a field and click AI suggest."}</p>

        <p className="text-sm font-medium text-white">Validation warnings</p>
        <div className="space-y-2">
          {issues.length ? issues.map((i, idx) => (
            <p key={idx} className={`rounded-lg p-2 text-xs ${i.severity === "error" ? "bg-rose-500/15 text-rose-200" : "bg-amber-500/15 text-amber-100"}`}>{i.message}</p>
          )) : <p className="text-xs text-slate-400">No issues yet.</p>}
        </div>

        <p className="text-sm font-medium text-white">Preview document</p>
        <pre className="whitespace-pre-wrap rounded-lg border border-white/10 bg-black/40 p-3 text-xs text-slate-200">{preview || "Generate to preview document."}</pre>
      </div>
    </div>
  );
}
