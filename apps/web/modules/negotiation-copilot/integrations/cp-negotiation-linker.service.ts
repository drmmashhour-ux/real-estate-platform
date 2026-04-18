import type { MapFormResult } from "@/modules/oaciq-mapper/mapper.types";

export function extractCpAmendments(map: MapFormResult): Record<string, unknown> {
  return { ...map.mappedFields };
}
