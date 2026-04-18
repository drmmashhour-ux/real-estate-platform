import { listFormDefinitions } from "../form-definition.registry";
import type { SourcePathRegistry } from "./source-paths.types";

/** Aggregates declared source paths from all registered form definitions (for UI / debug). */
export function buildSourcePathRegistry(): SourcePathRegistry {
  const reg: SourcePathRegistry = {};
  for (const def of listFormDefinitions()) {
    for (const sec of def.sections) {
      for (const f of sec.fields) {
        reg[f.fieldKey] = f.sourcePaths.map((path) => ({ path }));
      }
    }
  }
  return reg;
}
