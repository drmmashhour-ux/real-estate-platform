import type { MapFormResult } from "../../mapper.types";
import { buildPreviewBundle } from "../../preview/preview-engine";
import { ivDefinition } from "./iv.definition";

export function buildIvPreview(map: MapFormResult) {
  return buildPreviewBundle(ivDefinition, map);
}
