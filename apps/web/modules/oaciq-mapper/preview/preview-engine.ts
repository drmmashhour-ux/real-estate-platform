import type { FormDefinition } from "../form-definition.types";
import { getFormDefinition } from "../form-definition.registry";
import type { MapFormResult, PreviewBlock, PreviewBundle } from "../mapper.types";
import { formatPreviewValue } from "../utils/path-resolver";

const DRAFT: PreviewBundle["draftNotice"] = "Draft assistance — broker review required.";

export function buildPreviewBundle(def: FormDefinition, map: MapFormResult): PreviewBundle {
  const blocks: PreviewBlock[] = [];
  let order = 0;
  const orderedSections = def.previewOrder
    .map((k) => def.sections.find((s) => s.sectionKey === k))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  for (const section of orderedSections) {
    blocks.push({
      kind: "section",
      sectionKey: section.sectionKey,
      label: section.sectionLabel,
      valueDisplay: section.description ?? "",
      order: order++,
    });
    for (const f of section.fields) {
      const val = map.mappedFields[f.fieldKey];
      blocks.push({
        kind: "field",
        sectionKey: section.sectionKey,
        fieldKey: f.fieldKey,
        label: f.label,
        valueDisplay: formatPreviewValue(val),
        order: order++,
        validationRefs: f.validationRuleRefs,
      });
    }
  }

  return { formKey: def.formKey, blocks, draftNotice: DRAFT };
}

export function buildPreviewByKey(formKey: string, map: MapFormResult): PreviewBundle {
  const def = getFormDefinition(formKey);
  if (!def) throw new Error(`Unknown form: ${formKey}`);
  return buildPreviewBundle(def, map);
}
