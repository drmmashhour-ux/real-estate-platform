import type { MapFormResult } from "../../mapper.types";
import { buildPreviewBundle } from "../../preview/preview-engine";
import { ppDefinition } from "./pp.definition";

export function buildPpPreview(map: MapFormResult) {
  return buildPreviewBundle(ppDefinition, map);
}
