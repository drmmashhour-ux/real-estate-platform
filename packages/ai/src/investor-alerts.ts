export type InvestorAlert = {
  type: string;
  message: string;
  projectId?: string;
  priority: "low" | "medium" | "high";
};

export function detectOpportunities(userProfile: unknown, projects: any[] = []): InvestorAlert[] {
  return projects.slice(0, 3).map((p) => ({
    type: "new-match",
    message: `${p.name ?? "Project"} may fit your profile`,
    projectId: p.id,
    priority: p.featured ? "high" : "medium",
  }));
}

export function detectPriceChanges(projects: any[] = []): InvestorAlert[] {
  return projects.slice(0, 2).map((p) => ({
    type: "price-drop",
    message: `Price trend looks favorable for ${p.name ?? "this project"}`,
    projectId: p.id,
    priority: "medium",
  }));
}

export function detectNewMatches(userProfile: unknown): InvestorAlert[] {
  return [{
    type: "new-match",
    message: "New matched opportunities are available in your market.",
    priority: "low",
  }];
}
