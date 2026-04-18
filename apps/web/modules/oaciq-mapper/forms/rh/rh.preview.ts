import type { MapFormResult } from "../../mapper.types";
import { buildPreviewBundle } from "../../preview/preview-engine";
import { rhDefinition } from "./rh.definition";

export function buildRhPreview(map: MapFormResult) {
  return buildPreviewBundle(rhDefinition, map);
}
