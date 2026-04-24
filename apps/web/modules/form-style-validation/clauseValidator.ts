export interface ClauseIssue {
  clauseKey: string;
  issue: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
  blocking: boolean;
}

export function validateClauses(formKey: string, sections: { title: string; content: string }[]): ClauseIssue[] {
  const issues: ClauseIssue[] = [];

  sections.forEach(section => {
    const title = section.title.toUpperCase();
    const content = section.content.toLowerCase();

    // 1. Warranty Check
    if (title === "LEGAL_WARRANTY") {
      if (!content.includes("garantie légale") && !content.includes("legal warranty")) {
        issues.push({
          clauseKey: "WARRANTY_MISSING_EXPLICIT",
          issue: "Warranty clause must be explicit and unambiguous.",
          severity: "CRITICAL",
          blocking: true
        });
      }
    }

    // 2. Financing Delay Check
    if (title === "FINANCING") {
      if (!/\d+/.test(content)) {
        issues.push({
          clauseKey: "MISSING_FINANCING_DELAY",
          issue: "Financing section must include a specific delay in days.",
          severity: "CRITICAL",
          blocking: true
        });
      }
    }

    // 3. Vague Inclusions
    if (title === "INCLUSIONS_EXCLUSIONS") {
      const vagueWords = ["etc", "tout", "all", "tout le reste", "every"];
      if (vagueWords.some(word => content.includes(word))) {
        issues.push({
          clauseKey: "VAGUE_INCLUSIONS",
          issue: "Avoid vague terms like 'etc' or 'all' in inclusions/exclusions.",
          severity: "WARNING",
          blocking: false
        });
      }
    }
  });

  return issues;
}
