import { ClauseIssue } from "./clauseValidator";

export interface DraftingRule {
  key: string;
  check: (context: any) => ClauseIssue | null;
}

export const DRAFTING_RULES: DraftingRule[] = [
  {
    key: "EXPLICIT_WARRANTY",
    check: (ctx) => {
      if (ctx.answers?.withoutWarranty && !ctx.sections.find((s: any) => s.id === "LEGAL_WARRANTY")?.content.includes("sans garantie légale")) {
        return {
          clauseKey: "LEGAL_WARRANTY",
          issue: "L'exclusion de garantie doit être mentionnée explicitement dans la clause.",
          severity: "CRITICAL",
          blocking: true
        };
      }
      return null;
    }
  },
  {
    key: "PARTIES_MANDATORY",
    check: (ctx) => {
      const parties = ctx.sections.find((s: any) => s.id === "PARTIES");
      if (!parties || parties.content.length < 20) {
        return {
          clauseKey: "PARTIES",
          issue: "L'identification des parties est incomplète ou manquante.",
          severity: "CRITICAL",
          blocking: true
        };
      }
      return null;
    }
  }
];
