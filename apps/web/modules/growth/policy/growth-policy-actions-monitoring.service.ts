/**
 * [growth:policy-actions] — never throws.
 */

const P = "[growth:policy-actions]";

export function logGrowthPolicyActionBundle(params: {
  actionCount: number;
  topDomain?: string;
  hasTop: boolean;
}): void {
  try {
    console.info(
      `${P} bundle actions=${params.actionCount} top=${params.hasTop ? params.topDomain ?? "?" : "none"}`,
    );
  } catch {
    /* ignore */
  }
}

export function logGrowthPolicyActionClick(params: { policyId: string; domain: string; surface: string }): void {
  try {
    console.info(`${P} click policyId=${params.policyId} domain=${params.domain} surface=${params.surface}`);
  } catch {
    /* ignore */
  }
}

export function logGrowthPolicyDomainMapping(domain: string, surface: string): void {
  try {
    console.info(`${P} map domain=${domain} surface=${surface}`);
  } catch {
    /* ignore */
  }
}
