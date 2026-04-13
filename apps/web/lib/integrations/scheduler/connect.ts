/**
 * OAuth / connection helpers for schedulers (Buffer public API; Metricool token in dashboard).
 */

/** Buffer OAuth authorize URL — register app at buffer.com/developers */
export function getBufferOAuthAuthorizeUrl(state: string): string | null {
  const clientId = process.env.BUFFER_CLIENT_ID?.trim();
  const redirect = process.env.BUFFER_OAUTH_REDIRECT_URI?.trim();
  if (!clientId || !redirect) return null;
  const u = new URL("https://bufferapp.com/oauth2/authorize");
  u.searchParams.set("client_id", clientId);
  u.searchParams.set("redirect_uri", redirect);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("state", state);
  return u.toString();
}

export async function exchangeBufferAuthorizationCode(code: string): Promise<{ access_token: string }> {
  const clientId = process.env.BUFFER_CLIENT_ID?.trim();
  const clientSecret = process.env.BUFFER_CLIENT_SECRET?.trim();
  const redirect = process.env.BUFFER_OAUTH_REDIRECT_URI?.trim();
  if (!clientId || !clientSecret || !redirect) {
    throw new Error("BUFFER_CLIENT_ID / BUFFER_CLIENT_SECRET / BUFFER_OAUTH_REDIRECT_URI not configured");
  }
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirect,
    code,
    grant_type: "authorization_code",
  });
  const res = await fetch("https://api.bufferapp.com/1/oauth2/token.json", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  const json = (await res.json()) as { access_token?: string; error?: string };
  if (!res.ok || !json.access_token) {
    throw new Error(json.error ?? "Buffer token exchange failed");
  }
  return { access_token: json.access_token };
}

/** Metricool has no standard OAuth in-app flow documented here — admins paste API token in env or future secure form. */
export function getMetricoolConnectInstructions(): string {
  return "Create an API token in Metricool (developer / integrations) and set METRICOOL_API_TOKEN and METRICOOL_BLOG_ID in server environment.";
}
