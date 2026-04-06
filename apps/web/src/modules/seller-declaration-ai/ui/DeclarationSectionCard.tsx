import type { DeclarationSection } from "@/src/modules/seller-declaration-ai/domain/declaration.types";

type Props = {
  section: DeclarationSection;
  values: Record<string, unknown>;
  sectionReady: boolean;
  sectionWarnings: string[];
  sectionContentIssues?: Array<{ severity: "warning" | "block"; message: string; suggestion: string }>;
  onChange: (key: string, value: string | boolean) => void;
  onExplain: (sectionKey: string) => void;
  onSuggest: (sectionKey: string) => void;
};

export function DeclarationSectionCard({
  section,
  values,
  sectionReady,
  sectionWarnings,
  sectionContentIssues = [],
  onChange,
  onExplain,
  onSuggest,
}: Props) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/25 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-white">{section.label}</p>
          <p className="text-xs text-slate-400">{section.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${sectionReady ? "bg-emerald-500/20 text-emerald-200" : "bg-amber-500/20 text-amber-100"}`}>
            {sectionReady ? "ready" : "needs review"}
          </span>
          <button type="button" className="text-xs text-slate-300 hover:text-white" onClick={() => onExplain(section.key)}>Explain</button>
          <button type="button" className="text-xs text-premium-gold hover:underline" onClick={() => onSuggest(section.key)}>Suggest</button>
        </div>
      </div>

      {sectionWarnings.length ? (
        <p className="mb-2 rounded-lg bg-amber-500/10 px-2 py-1 text-xs text-amber-100">{sectionWarnings.join(" | ")}</p>
      ) : null}

      {sectionContentIssues.length ? (
        <div className="mb-2 rounded-lg border border-rose-400/20 bg-rose-500/10 px-2 py-2 text-xs text-rose-100">
          <p className="font-medium">Content compliance</p>
          <div className="mt-1 space-y-1">
            {sectionContentIssues.slice(0, 3).map((issue) => (
              <p key={`${issue.message}-${issue.suggestion}`}>
                <span className="font-semibold uppercase">{issue.severity}</span>: {issue.message} {issue.suggestion}
              </p>
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        {section.fields.map((field) => {
          const value = values[field.key];
          const required = field.required ? " *" : "";

          if (field.inputType === "boolean") {
            return (
              <label key={field.key} className="flex items-center justify-between rounded-lg bg-white/5 px-2 py-2 text-xs text-slate-200">
                <span>{field.label}{required}</span>
                <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(field.key, e.target.checked)} />
              </label>
            );
          }

          if (field.inputType === "textarea") {
            return (
              <label key={field.key} className="block text-xs text-slate-300">
                {field.label}{required}
                <textarea className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 p-2 text-xs text-white" rows={3} value={String(value ?? "")} onChange={(e) => onChange(field.key, e.target.value)} />
                <span className="mt-1 block text-[10px] text-slate-500">{field.helpText}</span>
              </label>
            );
          }

          if (field.inputType === "select") {
            return (
              <label key={field.key} className="block text-xs text-slate-300">
                {field.label}{required}
                <select className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 p-2 text-xs text-white" value={String(value ?? "")} onChange={(e) => onChange(field.key, e.target.value)}>
                  <option value="">Select</option>
                  {(field.options ?? []).map((opt) => <option key={opt} value={opt}>{opt.replace(/_/g, " ")}</option>)}
                </select>
                <span className="mt-1 block text-[10px] text-slate-500">{field.helpText}</span>
              </label>
            );
          }

          return (
            <label key={field.key} className="block text-xs text-slate-300">
              {field.label}{required}
              <input className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 p-2 text-xs text-white" value={String(value ?? "")} onChange={(e) => onChange(field.key, e.target.value)} />
              <span className="mt-1 block text-[10px] text-slate-500">{field.helpText}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
