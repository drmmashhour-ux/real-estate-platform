export interface ClauseIssue {
  clauseKey: string;
  issue: string;
  severity: "WARNING" | "CRITICAL";
  blocking: boolean;
}

export function validateClauses(formKey: string, sections: { id: string, content: string }[]): ClauseIssue[] {
  const issues: ClauseIssue[] = [];

  sections.forEach(section => {
    const content = section.content.toLowerCase();

    // 1. Warranty Validation
    if (section.id === "LEGAL_WARRANTY") {
      if (!content.includes("garantie légale")) {
        issues.push({
          clauseKey: "LEGAL_WARRANTY",
          issue: "La clause de garantie légale est ambiguë ou manquante.",
          severity: "CRITICAL",
          blocking: true
        });
      }
    }

    // 2. Financing Validation
    if (section.id === "FINANCING") {
      if (content.includes("financement") && !/\d+/.test(content)) {
        issues.push({
          clauseKey: "FINANCING",
          issue: "Le délai de financement n'est pas spécifié numériquement.",
          severity: "CRITICAL",
          blocking: true
        });
      }
    }

    // 3. Inclusions Validation
    if (section.id === "INCLUSIONS_EXCLUSIONS") {
      if (content.includes("tous les") || content.includes("certains")) {
        issues.push({
          clauseKey: "INCLUSIONS_EXCLUSIONS",
          issue: "Les inclusions/exclusions utilisent des termes vagues (ex: 'tous les'). Veuillez les lister individuellement.",
          severity: "WARNING",
          blocking: false
        });
      }
    }

    // 4. Price Validation
    if (section.id === "PRICE") {
      if (!content.includes("$") && !content.includes("dollars")) {
        issues.push({
          clauseKey: "PRICE",
          issue: "Le prix ne semble pas être formaté correctement ou est manquant.",
          severity: "CRITICAL",
          blocking: true
        });
      }
    }
  });

  return issues;
}
