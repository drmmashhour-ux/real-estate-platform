"use client";

import type { FieldDefinition } from "@/modules/oaciq-mapper/form-definition.types";

export function FieldRenderer({
  field,
  value,
  onChange,
  readOnly,
}: {
  field: FieldDefinition;
  value: unknown;
  onChange: (fieldKey: string, value: unknown) => void;
  readOnly?: boolean;
}) {
  const common =
    "w-full rounded-lg border border-zinc-700 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600";

  if (field.fieldType === "boolean") {
    return (
      <label className="flex items-center gap-2 text-sm text-zinc-300">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-zinc-600"
          checked={Boolean(value)}
          disabled={readOnly}
          onChange={(e) => onChange(field.fieldKey, e.target.checked)}
        />
        <span>
          {field.label}
          {field.required ? <span className="text-amber-400"> *</span> : null}
        </span>
      </label>
    );
  }

  if (field.fieldType === "textarea") {
    return (
      <label className="block text-sm text-zinc-300">
        <span className="mb-1 block">
          {field.label}
          {field.required ? <span className="text-amber-400"> *</span> : null}
        </span>
        <textarea
          className={common + " min-h-[88px]"}
          value={value === undefined || value === null ? "" : String(value)}
          disabled={readOnly}
          onChange={(e) => onChange(field.fieldKey, e.target.value)}
        />
      </label>
    );
  }

  return (
    <label className="block text-sm text-zinc-300">
      <span className="mb-1 block">
        {field.label}
        {field.required ? <span className="text-amber-400"> *</span> : null}
      </span>
      <input
        type={field.fieldType === "date" || field.fieldType === "datetime" ? "text" : "text"}
        className={common}
        value={value === undefined || value === null ? "" : String(value)}
        disabled={readOnly}
        onChange={(e) => onChange(field.fieldKey, e.target.value)}
      />
    </label>
  );
}
