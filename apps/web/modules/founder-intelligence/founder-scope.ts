import type { ExecutiveScope } from "../owner-access/owner-access.types";

export function executiveScopeToStored(scope: ExecutiveScope): {
  scopeKind: string;
  scopeOfficeIdsJson: string[];
} {
  if (scope.kind === "platform") {
    return { scopeKind: "platform", scopeOfficeIdsJson: [] };
  }
  return { scopeKind: "office", scopeOfficeIdsJson: scope.officeIds };
}

export function storedScopeMatchesSession(
  scope: ExecutiveScope,
  rowScopeKind: string,
  rowOfficeIdsJson: unknown,
): boolean {
  if (scope.kind === "platform" && rowScopeKind === "platform") return true;
  if (scope.kind === "office" && rowScopeKind === "office") {
    const ids = Array.isArray(rowOfficeIdsJson) ? (rowOfficeIdsJson as string[]) : [];
    return scope.officeIds.some((id) => ids.includes(id));
  }
  return false;
}
