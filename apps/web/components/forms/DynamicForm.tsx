"use client";

import { useMemo, useState } from "react";
import type { ContractTemplateDefinition, ContractTemplateField } from "@/modules/contracts/templates";
import { fieldsForSection, sortSections } from "@/modules/contracts/templates";

export type DynamicFormValues = Record<string, string | number | boolean | "">;

type Props = {
  definition: ContractTemplateDefinition;
  initialValues?: DynamicFormValues;
  onSubmit: (values: DynamicFormValues) => void | Promise<void>;
  submitLabel?: string;
  disabled?: boolean;
  error?: string | null;
};

function FieldInput({
  field,
  value,
  onChange,
  disabled,
}: {
  field: ContractTemplateField;
  value: string | number | boolean | "";
  onChange: (v: string | number | boolean) => void;
  disabled?: boolean;
}) {
  const base =
    "mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500";
  switch (field.fieldType) {
    case "textarea":
      return (
        <textarea
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          placeholder={field.placeholder}
          disabled={disabled}
          className={base}
        />
      );
    case "number":
      return (
        <input
          type="number"
          value={value === "" || value === undefined ? "" : Number(value)}
          onChange={(e) => onChange(e.target.value === "" ? "" : parseFloat(e.target.value))}
          disabled={disabled}
          className={base}
        />
      );
    case "currency":
      return (
        <input
          type="number"
          step="0.01"
          min="0"
          value={value === "" || value === undefined ? "" : Number(value)}
          onChange={(e) => onChange(e.target.value === "" ? "" : parseFloat(e.target.value))}
          disabled={disabled}
          className={base}
        />
      );
    case "date":
      return (
        <input
          type="date"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={base}
        />
      );
    case "boolean":
      return (
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={value === true}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
          />
          {field.label}
        </label>
      );
    case "select":
      return (
        <select
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={base}
        >
          <option value="">Select…</option>
          {(field.options ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    default:
      return (
        <input
          type="text"
          value={typeof value === "string" ? value : String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          disabled={disabled}
          className={base}
        />
      );
  }
}

export function DynamicForm({
  definition,
  initialValues = {},
  onSubmit,
  submitLabel = "Save",
  disabled,
  error,
}: Props) {
  const [values, setValues] = useState<DynamicFormValues>(() => ({ ...initialValues }));
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const sections = useMemo(() => sortSections(definition.sections), [definition.sections]);

  function setField(key: string, v: string | number | boolean) {
    setValues((prev) => ({ ...prev, [key]: v }));
    setLocalError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);
    setLoading(true);
    try {
      await onSubmit(values);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  const err = error ?? localError;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {sections.map((sec) => {
        const fields = fieldsForSection(definition, sec.key);
        if (fields.length === 0) return null;
        return (
          <section key={sec.id} className="space-y-4">
            <h3 className="text-base font-semibold text-white">{sec.title}</h3>
            <div className="space-y-4">
              {fields.map((field) => (
                <div key={field.id}>
                  {field.fieldType !== "boolean" && (
                    <label className="block text-sm text-slate-400">
                      {field.label}
                      {field.required ? <span className="text-amber-400"> *</span> : null}
                    </label>
                  )}
                  <FieldInput
                    field={field}
                    value={values[field.key] ?? ""}
                    onChange={(v) => setField(field.key, v)}
                    disabled={disabled || loading}
                  />
                </div>
              ))}
            </div>
          </section>
        );
      })}
      {err && <p className="text-sm text-red-400">{err}</p>}
      <button
        type="submit"
        disabled={disabled || loading}
        className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
      >
        {loading ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
