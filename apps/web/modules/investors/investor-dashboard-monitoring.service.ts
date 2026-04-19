/**
 * [investor-dashboard] — never throws.
 */

const P = "[investor-dashboard]";

export function logInvestorDashboardBuilt(params: {
  metricCount: number;
  sparseBundle: boolean;
  missingAreas: number;
}): void {
  try {
    console.info(
      `${P} built metrics=${params.metricCount} sparse=${params.sparseBundle} missingAreas=${params.missingAreas}`,
    );
  } catch {
    /* ignore */
  }
}

export function logInvestorDashboardMissing(area: string): void {
  try {
    console.info(`${P} missing-data ${area}`);
  } catch {
    /* ignore */
  }
}
