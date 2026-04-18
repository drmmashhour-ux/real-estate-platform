"use client";

import type { SectionDefinition } from "@/modules/oaciq-mapper/form-definition.types";
import { FieldRenderer } from "./FieldRenderer";

export function SectionRenderer({
  section,
  values,
  onChange,
  readOnly,
}: {
  section: SectionDefinition;
  values: Record<string, unknown>;
  onChange: (fieldKey: string, value: unknown) => void;
  readOnly?: boolean;
}) {
  return (
    <section className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
      <h3 className="text-sm font-semibold text-zinc-100">{section.sectionLabel}</h3>
      {section.description ? <p className="text-xs text-zinc-500">{section.description}</p> : null}
      <div className="grid gap-3 md:grid-cols-2">
        {section.fields.map((f) => (
          <FieldRenderer
            key={f.fieldKey}
            field={f}
            value={values[f.fieldKey]}
            onChange={onChange}
            readOnly={readOnly}
          />
        ))}
      </div>
    </section>
  );
}
