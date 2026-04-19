/**
 * [investor-share] — never throws.
 */

const P = "[investor-share]";

export function logInvestorShareCreated(params: { shareId: string; hasExpiry: boolean }): void {
  try {
    console.info(`${P} created id=${params.shareId} expiry=${params.hasExpiry}`);
  } catch {
    /* ignore */
  }
}

export function logInvestorShareRevoked(shareId: string): void {
  try {
    console.info(`${P} revoked id=${shareId}`);
  } catch {
    /* ignore */
  }
}

export function logInvestorShareView(shareId: string, viewCount: number): void {
  try {
    console.info(`${P} view id=${shareId} count=${viewCount}`);
  } catch {
    /* ignore */
  }
}

export function logInvestorShareInvalid(kind: "not_found" | "revoked" | "expired"): void {
  try {
    console.info(`${P} invalid-token kind=${kind}`);
  } catch {
    /* ignore */
  }
}
