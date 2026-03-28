"use client";

import type { ContractTemplateField } from "@/modules/contracts/templates";

type Props = {
  field: ContractTemplateField;
  value: string;
  onChange: (key: string, value: string) => void;
  hint?: string;
  disabled?: boolean;
};

export function ContractDraftFieldInput({ field, value, onChange, hint, disabled }: Props) {
  const base =
    "mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-premium-gold/50 focus:outline-none focus:ring-1 focus:ring-premium-gold/30";

  const showHint = hint?.trim();

  if (field.fieldType === "boolean") {
    const checked = value === "true" || value === "yes" || value === "1";
    return (
      <div className="space-y-1">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={checked}
            disabled={disabled}
            onChange={(e) => onChange(field.key, e.target.checked ? "true" : "false")}
            className="mt-1 h-4 w-4 rounded border-white/20 bg-black/60 text-premium-gold focus:ring-premium-gold"
          />
          <span>
            <span className="text-sm text-slate-200">{field.label}</span>
            {field.required ? <span className="text-amber-400"> *</span> : null}
          </span>
        </label>
        {showHint ? (
          <p className="ml-7 text-xs text-amber-200/80">{hint}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-slate-400">
        {field.label}
        {field.required ? <span className="text-amber-400"> *</span> : null}
      </label>
      {field.fieldType === "textarea" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(field.key, e.target.value)}
          disabled={disabled}
          rows={5}
          placeholder={field.placeholder}
          className={base}
        />
      ) : field.fieldType === "select" && field.options?.length ? (
        <select
          value={value}
          onChange={(e) => onChange(field.key, e.target.value)}
          disabled={disabled}
          className={base}
        >
          <option value="">Select…</option>
          {field.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={field.fieldType === "number" || field.fieldType === "currency" ? "number" : "text"}
          value={value}
          onChange={(e) => onChange(field.key, e.target.value)}
          disabled={disabled}
          placeholder={field.placeholder}
          className={base}
        />
      )}
      {showHint ? <p className="text-xs text-amber-200/85">{hint}</p> : null}
    </div>
  );
}
