import type { MapFormResult } from "@/modules/oaciq-mapper/mapper.types";

export function extractPpNegotiationFields(map: MapFormResult): Record<string, unknown> {
  return { ...map.mappedFields };
}
