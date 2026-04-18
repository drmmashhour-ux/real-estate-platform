import type { MapFormResult } from "../../mapper.types";
import { buildPreviewBundle } from "../../preview/preview-engine";
import { cpDefinition } from "./cp.definition";

export function buildCpPreview(map: MapFormResult) {
  return buildPreviewBundle(cpDefinition, map);
}
