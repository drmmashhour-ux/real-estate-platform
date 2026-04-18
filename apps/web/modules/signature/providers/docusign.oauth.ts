import { SignJWT, importPKCS8 } from "jose";

const TOKEN_URL = process.env.DOCUSIGN_OAUTH_BASE ?? "https://account-d.docusign.com/oauth/token";

/**
 * DocuSign JWT Grant (server-to-server). Requires:
 * - DOCUSIGN_INTEGRATION_KEY (iss)
 * - DOCUSIGN_USER_ID (sub) — impersonated user
 * - DOCUSIGN_PRIVATE_KEY — PEM RSA private key (use \\n for newlines in env)
 * - DOCUSIGN_OAUTH_AUDIENCE — default account-d.docusign.com (production: account.docusign.com)
 */
export async function getDocuSignAccessToken(): Promise<{ access_token: string; expires_in: number }> {
  const integrationKey = process.env.DOCUSIGN_INTEGRATION_KEY;
  const userId = process.env.DOCUSIGN_USER_ID;
  const pem = process.env.DOCUSIGN_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const audience = process.env.DOCUSIGN_OAUTH_AUDIENCE ?? "account-d.docusign.com";

  if (!integrationKey || !userId || !pem) {
    throw new Error("DocuSign OAuth env missing: DOCUSIGN_INTEGRATION_KEY, DOCUSIGN_USER_ID, DOCUSIGN_PRIVATE_KEY");
  }

  const key = await importPKCS8(pem, "RS256");
  const now = Math.floor(Date.now() / 1000);
  const assertion = await new SignJWT({})
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(integrationKey)
    .setSubject(userId)
    .setAudience(audience)
    .setIssuedAt(now)
    .setExpirationTime(now + 600)
    .sign(key);

  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion,
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = (await res.json()) as { access_token?: string; expires_in?: number; error?: string };
  if (!res.ok || !json.access_token) {
    throw new Error(`DocuSign token error: ${json.error ?? res.status} ${JSON.stringify(json)}`);
  }
  return { access_token: json.access_token, expires_in: json.expires_in ?? 3600 };
}
