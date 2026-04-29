import "server-only";

export function rankProjectsForInvestment<T extends { id: string }>(
  projects: T[],
  _unitsByProject: Record<string, unknown[]>,
): Array<Record<string, unknown>> {
  void _unitsByProject;
  return projects.map((p, i) => ({
    projectId: p.id,
    score: Math.max(0, 95 - i),
    reason: "stub_rank",
    appreciationPotential: 5,
    rentalYield: 3,
    riskScore: 40,
    rank: i + 1,
  }));
}
