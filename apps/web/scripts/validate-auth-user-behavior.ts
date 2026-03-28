/**
 * End-to-end auth behavior check (real HTTP + DB).
 * Flow: register → email verification GET → login → session cookies → dashboard → admin gate → logout.
 *
 * Requires: DATABASE_URL, Next server running (default http://127.0.0.1:3000).
 *
 *   pnpm --filter @lecipm/web exec tsx scripts/validate-auth-user-behavior.ts
 */
import { config } from "dotenv";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";

config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), "../../.env") });

const BASE = process.env.AUTH_VALIDATE_BASE_URL ?? "http://127.0.0.1:3000";
const prisma = new PrismaClient();

type StepResult = { name: string; ok: boolean; detail?: string };

const results: StepResult[] = [];

function record(name: string, ok: boolean, detail?: string) {
  results.push({ name, ok, detail });
  const s = ok ? "OK" : "FAIL";
  console.log(`[${s}] ${name}${detail ? `: ${detail}` : ""}`);
}

function cookieHeaderFromSetCookie(setCookie: string[] | undefined): string {
  if (!setCookie?.length) return "";
  return setCookie.map((c) => c.split(";")[0]?.trim()).filter(Boolean).join("; ");
}

async function fetchText(url: string, init?: RequestInit): Promise<{ status: number; location?: string; setCookie?: string[] }> {
  const res = await fetch(url, { ...init, redirect: "manual" });
  const setCookie =
    typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : parseSetCookieFallback(res.headers.get("set-cookie"));
  return {
    status: res.status,
    location: res.headers.get("location") ?? undefined,
    setCookie,
  };
}

function parseSetCookieFallback(raw: string | null): string[] | undefined {
  if (!raw) return undefined;
  return [raw];
}

async function main() {
  const email = `auth-validate-${Date.now()}@example.com`;
  const password = "ValidatePass123!";

  // Health
  try {
    const ping = await fetchText(`${BASE}/auth/login`, { method: "GET" });
    if (ping.status !== 200) {
      record("server", false, `${BASE}/auth/login returned ${ping.status}`);
      printSummary();
      process.exit(1);
    }
    record("server", true, BASE);
  } catch (e) {
    record("server", false, String(e));
    printSummary();
    process.exit(1);
  }

  // --- Signup ---
  let regJson: { ok?: boolean; userId?: string; needsEmailVerification?: boolean; error?: string };
  try {
    const reg = await fetch(`${BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        confirmPassword: password,
        acceptLegal: true,
        name: "Auth Validate",
      }),
    });
    regJson = (await reg.json().catch(() => ({}))) as typeof regJson;
    if (!reg.ok || !regJson.ok || !regJson.userId) {
      record("signup", false, regJson.error ?? `HTTP ${reg.status}`);
    } else {
      record("signup", true, `userId=${regJson.userId} needsEmailVerification=${regJson.needsEmailVerification ?? false}`);
    }
  } catch (e) {
    record("signup", false, String(e));
    regJson = {};
  }

  const dbUser = await prisma.user.findUnique({ where: { email } });
  record("signup_db", !!dbUser && !!dbUser.passwordHash, dbUser ? `id=${dbUser.id}` : "no row");

  const token = dbUser?.emailVerificationToken;
  if (!token) {
    record("verify_token", false, "no emailVerificationToken on user");
  }

  // --- Email verification (same as link in registration email — route handler + HTTP redirect) ---
  if (token) {
    const v = await fetchText(
      `${BASE}/api/auth/verify-email-token?token=${encodeURIComponent(token)}`,
      { method: "GET" },
    );
    const ok = v.status === 307 || v.status === 308;
    const loc = v.location ?? "";
    record("verify_email_http", ok && loc.includes("/auth/login"), `status=${v.status} → ${loc.slice(0, 80)}`);
  }

  const verified = await prisma.user.findUnique({
    where: { email },
    select: { emailVerifiedAt: true },
  });
  record("verify_email_db", !!verified?.emailVerifiedAt, verified?.emailVerifiedAt?.toISOString());

  // --- Login ---
  let sessionCookies = "";
  try {
    const login = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const loginJson = (await login.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    const setCookie = typeof login.headers.getSetCookie === "function" ? login.headers.getSetCookie() : undefined;
    sessionCookies = cookieHeaderFromSetCookie(setCookie);
    const hasSession = sessionCookies.includes("lecipm_guest_id=");
    if (!login.ok || !loginJson.ok || !hasSession) {
      record("login", false, loginJson.error ?? `HTTP ${login.status} cookies=${hasSession}`);
    } else {
      record("login", true, "lecipm_guest_id set");
    }
  } catch (e) {
    record("login", false, String(e));
  }

  // --- Session: dashboard ---
  const dash = await fetchText(`${BASE}/dashboard`, {
    method: "GET",
    headers: { Cookie: sessionCookies },
    redirect: "manual",
  });
  record(
    "session_dashboard",
    dash.status === 200 || (dash.status === 307 && !String(dash.location).includes("login")),
    `status=${dash.status} loc=${(dash.location ?? "").slice(0, 60)}`,
  );

  const dash2 = await fetchText(`${BASE}/dashboard/real-estate`, {
    method: "GET",
    headers: { Cookie: sessionCookies },
    redirect: "manual",
  });
  record(
    "session_nav_second_page",
    dash2.status === 200 || (dash2.status >= 300 && dash2.status < 400 && !String(dash2.location).includes("/auth/login")),
    `status=${dash2.status}`,
  );

  // --- Protected: admin as USER (proxy + layout enforce role) ---
  const adminRes = await fetchText(`${BASE}/admin`, {
    method: "GET",
    headers: { Cookie: sessionCookies, Accept: "text/html" },
  });
  const adminBlocked =
    (adminRes.status === 307 || adminRes.status === 308) &&
    String(adminRes.location).replace(/\/$/, "").includes("/dashboard");
  record(
    "protected_admin_user_blocked",
    adminBlocked,
    `status=${adminRes.status} → ${(adminRes.location ?? "").slice(0, 80)}`,
  );

  // --- No session: dashboard should send to login ---
  const anon = await fetchText(`${BASE}/dashboard`, { method: "GET", redirect: "manual" });
  const anonRedirectLogin =
    (anon.status === 307 || anon.status === 308) && String(anon.location).includes("/auth/login");
  record("protected_dashboard_anon", anonRedirectLogin, `status=${anon.status}`);

  // --- Logout (browser clears cookie; server returns Set-Cookie max-age=0) ---
  try {
    const lo = await fetch(`${BASE}/api/auth/logout`, {
      method: "POST",
      headers: { Cookie: sessionCookies },
    });
    const loJson = (await lo.json().catch(() => ({}))) as { ok?: boolean };
    const setCk = typeof lo.headers.getSetCookie === "function" ? lo.headers.getSetCookie() : [];
    const clearsSession = setCk.some((c) => /lecipm_guest_id=/i.test(c) && /max-age=0/i.test(c));
    record("logout_api", lo.ok && loJson.ok === true && clearsSession, `HTTP ${lo.status} clearCookie=${clearsSession}`);
  } catch (e) {
    record("logout_api", false, String(e));
  }

  // Simulate browser after logout: no Cookie header → must not see dashboard
  const afterLogoutAnon = await fetchText(`${BASE}/dashboard`, { method: "GET", redirect: "manual" });
  const loggedOutPublic =
    (afterLogoutAnon.status === 307 || afterLogoutAnon.status === 308) &&
    String(afterLogoutAnon.location).includes("/auth/login");
  record("logout_then_dashboard_without_cookie", loggedOutPublic, `status=${afterLogoutAnon.status}`);

  // After logout, replaying the captured cookie must not authenticate (server revokes `Session`).
  let replayApiDenied = false;
  let replayDashDetail = "";
  try {
    const replayEngagement = await fetch(`${BASE}/api/investment/engagement`, {
      method: "POST",
      headers: { Cookie: sessionCookies, "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    replayApiDenied = replayEngagement.status === 401;

    const replayDash = await fetch(`${BASE}/dashboard`, {
      method: "GET",
      headers: { Cookie: sessionCookies, Accept: "text/html" },
      redirect: "manual",
    });
    const replayDashText = await replayDash.text();
    /** Authenticated portfolio shell includes this RSC marker; replay after logout must not. */
    const replayShowsAuthedShell =
      replayDash.status === 200 && replayDashText.includes("PortfolioDashboardClient");
    const replayDashboardDenied = !replayShowsAuthedShell;
    replayDashDetail = `dash=${replayDash.status} authedShell=${replayShowsAuthedShell}`;

    record(
      "logout_server_invalidates_replayed_cookie",
      replayApiDenied && replayDashboardDenied,
      !replayApiDenied
        ? "replay API still authenticated (expected 401)"
        : !replayDashboardDenied
          ? "replay dashboard still shows authenticated portfolio shell"
          : `${replayDashDetail}`,
    );
  } catch (e) {
    record("logout_server_invalidates_replayed_cookie", false, String(e));
  }

  // --- Errors ---
  const badPass = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "WrongPassword999!" }),
  });
  const badPassJson = (await badPass.json().catch(() => ({}))) as { error?: string };
  record("error_wrong_password", badPass.status === 401 && /invalid/i.test(badPassJson.error ?? ""), `HTTP ${badPass.status}`);

  const badEmail = await fetch(`${BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "not-an-email",
      password: "password123",
      confirmPassword: "password123",
      acceptLegal: true,
    }),
  });
  const badEmailJson = (await badEmail.json().catch(() => ({}))) as { error?: string };
  record("error_invalid_email", badEmail.status === 400, `HTTP ${badEmail.status} ${badEmailJson.error ?? ""}`);

  // Cleanup
  await prisma.user.deleteMany({ where: { email } }).catch(() => {});

  printSummary();
  const failed = results.filter((r) => !r.ok);
  process.exit(failed.length ? 1 : 0);
}

function printSummary() {
  console.log("\n--- Summary ---");
  for (const r of results) {
    console.log(`${r.ok ? "OK " : "FAIL"} ${r.name}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
