"use client";

import { useMemo, useState } from "react";
import { getFormDefinition } from "@/modules/oaciq-mapper/form-definition.registry";
import { FormPreviewShell } from "@/components/oaciq-forms/FormPreviewShell";
import { SectionRenderer } from "./SectionRenderer";

export function DynamicFormRenderer({
  formKey,
  initialValues,
  onSave,
  readOnly,
}: {
  formKey: string;
  initialValues: Record<string, unknown>;
  onSave?: (values: Record<string, unknown>) => void | Promise<void>;
  readOnly?: boolean;
}) {
  const def = useMemo(() => getFormDefinition(formKey), [formKey]);
  const [values, setValues] = useState<Record<string, unknown>>(initialValues);

  if (!def) {
    return (
      <p className="text-sm text-red-300">
        Unknown form key <code>{formKey}</code> — no specimen registry entry.
      </p>
    );
  }

  function handleChange(fieldKey: string, value: unknown) {
    setValues((prev) => ({ ...prev, [fieldKey]: value }));
  }

  return (
    <FormPreviewShell formKey={def.formKey} title={def.title}>
      <div className="space-y-6">
        {def.sections
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((sec) => (
            <SectionRenderer
              key={sec.sectionKey}
              section={sec}
              values={values}
              onChange={handleChange}
              readOnly={readOnly}
            />
          ))}
        {onSave && !readOnly ? (
          <button
            type="button"
            className="rounded-xl bg-amber-500/90 px-4 py-2 text-sm font-medium text-black hover:bg-amber-400"
            onClick={() => void onSave(values)}
          >
            Save draft
          </button>
        ) : null}
      </div>
    </FormPreviewShell>
  );
}
