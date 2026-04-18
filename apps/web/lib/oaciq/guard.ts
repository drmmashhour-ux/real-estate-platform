import { oaciqMapperFlags } from "@/config/feature-flags";

export function requireOaciqExactMapper(): Response | null {
  if (!oaciqMapperFlags.oaciqExactMapperV1) {
    return Response.json({ error: "OACIQ Exact Mapper disabled" }, { status: 403 });
  }
  return null;
}

const FORM_FLAG: Record<string, keyof typeof oaciqMapperFlags> = {
  PP: "oaciqPpMapperV1",
  CP: "oaciqCpMapperV1",
  DS: "oaciqDsMapperV1",
  IV: "oaciqIvMapperV1",
  RIS: "oaciqRisMapperV1",
  RH: "oaciqRhMapperV1",
};

export function requireOaciqFormMapper(formKey: string): Response | null {
  const blocked = requireOaciqExactMapper();
  if (blocked) return blocked;
  const fk = formKey.toUpperCase();
  const flag = FORM_FLAG[fk];
  if (flag && !oaciqMapperFlags[flag]) {
    return Response.json({ error: `OACIQ mapper disabled for form ${fk}` }, { status: 403 });
  }
  return null;
}

export function requireOaciqExecutionBridge(): Response | null {
  if (!oaciqMapperFlags.oaciqExecutionBridgeV1) {
    return Response.json({ error: "OACIQ execution bridge disabled" }, { status: 403 });
  }
  return null;
}
