import type { MapFormResult } from "../../mapper.types";
import { buildPreviewBundle } from "../../preview/preview-engine";
import { dsDefinition } from "./ds.definition";

export function buildDsPreview(map: MapFormResult) {
  return buildPreviewBundle(dsDefinition, map);
}
