import type { MapFormResult } from "../../mapper.types";
import { buildPreviewBundle } from "../../preview/preview-engine";
import { risDefinition } from "./ris.definition";

export function buildRisPreview(map: MapFormResult) {
  return buildPreviewBundle(risDefinition, map);
}
