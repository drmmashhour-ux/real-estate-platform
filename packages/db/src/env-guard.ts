import { databaseUrlDeclaresSsl, isLocalDatabaseHost } from "./database-url-ssl";

export type AppId = "lecipm" | "syria" | "hadialink";

/**
 * Resolves which logical environment the process is in (staging and production
 * are never inferred from plain NODE_ENV=test — use APP_ENV in CI when needed).
 */
export function normalizeAppEnv(
  appEnv: string | undefined,
  nodeEnv: string | undefined = typeof process !== "undefined" ? process.env.NODE_ENV : undefined,
): "development" | "staging" | "production" {
  const a = (appEnv ?? "").trim().toLowerCase();
  if (a === "staging" || a === "stage") return "staging";
  if (a === "production" || a === "prod") return "production";
  if (a === "development" || a === "dev") return "development";
  const n = (nodeEnv ?? "").trim().toLowerCase();
  if (n === "production") return "production";
  return "development";
}

function parsePostgresUrlStrict(raw: string): URL {
  const t = raw.trim();
  if (!t) {
    throw new Error("DATABASE_URL is required but was empty or missing.");
  }
  if (!t.startsWith("postgresql://") && !t.startsWith("postgres://")) {
    throw new Error("DATABASE_URL must use postgres:// or postgresql://.");
  }
  try {
    return new URL(t);
  } catch {
    throw new Error("DATABASE_URL is not a valid URL.");
  }
}

function redactedDatabaseHint(u: URL): string {
  const host = u.hostname || "(no-host)";
  const db = u.pathname || "/";
  return `postgres://***:***@${host}${db}${u.search || ""}`;
}

const LOCAL_SUBSTR_RE = /(?:^|\/\/)(?:localhost|127\.0\.0\.1|::1)(?::|\/|$)/i;

/** Compare two postgres URLs for same target (ignores password, normalizes). */
export function compareDbIdentity(a: string, b: string): boolean {
  return normalizeDbUrlForCompare(a) === normalizeDbUrlForCompare(b);
}

function normalizeDbUrlForCompare(raw: string): string {
  const t = raw.trim();
  if (!t || (!t.startsWith("postgresql://") && !t.startsWith("postgres://"))) {
    return t.toLowerCase();
  }
  try {
    const u = new URL(t);
    u.username = "";
    u.password = "";
    return u.toString().toLowerCase();
  } catch {
    return t.toLowerCase();
  }
}

export type AssertEnvSafetyOptions = {
  appId: AppId;
  appEnv: string | undefined;
  /** Final resolved database URL (DATABASE_URL). */
  dbUrl: string | undefined;
  /** INVESTOR_DEMO_MODE === "true" */
  demoMode: boolean;
};

/**
 * Full env + DB + demo safety. Never logs or throws raw passwords.
 * @returns `{ ok: true }` or throws a clear Error.
 */
export function assertEnvSafety(opts: AssertEnvSafetyOptions): { ok: true } {
  const { appId, appEnv, dbUrl, demoMode } = opts;
  const raw = dbUrl?.trim();
  if (!raw) {
    throw new Error(`DATABASE_URL is required (appId=${appId}).`);
  }

  const u = parsePostgresUrlStrict(raw);
  const effective = normalizeAppEnv(appEnv);
  const host = u.hostname;
  const lower = raw.toLowerCase();

  const prodUrl = process.env.PRODUCTION_DATABASE_URL?.trim();
  const stagingUrl = process.env.STAGING_DATABASE_URL?.trim();

  if (effective === "production" && (isLocalDatabaseHost(host) || LOCAL_SUBSTR_RE.test(raw))) {
    throw new Error(
      `production DATABASE_URL must not target localhost/127.0.0.1/::1 (hint: ${redactedDatabaseHint(u)}).`,
    );
  }

  if (effective === "staging" && (isLocalDatabaseHost(host) || /127\.0\.0\.1|localhost|::1/i.test(host))) {
    if (process.env.ALLOW_LOCAL_STAGING_DB !== "true") {
      throw new Error(
        "staging DATABASE_URL must not use a local host — set a remote staging DB, " +
          "or set ALLOW_LOCAL_STAGING_DB=true for explicit local-staging only.",
      );
    }
  }

  if (appId === "syria" && lower.includes("lecipm")) {
    throw new Error("Syria app must not use a database URL that references the LECIPM estate.");
  }

  if (appId === "lecipm" && (lower.includes("syria") || lower.includes("sybnb"))) {
    throw new Error("LECIPM app must not use a database URL that references Syria or SYBNB.");
  }

  if (appId === "hadialink" && (lower.includes("lecipm") || lower.includes("syria"))) {
    throw new Error("HadiaLink app must not use a database URL that references LECIPM or Syria.");
  }

  if (effective === "production" && !isLocalDatabaseHost(host) && !databaseUrlDeclaresSsl(u)) {
    throw new Error(
      `production DATABASE_URL must set sslmode=require (or verify-ca / verify-full) for non-local hosts ` +
        `(hint: ${redactedDatabaseHint(u)}).`,
    );
  }

  if (effective === "staging" && !isLocalDatabaseHost(host) && !databaseUrlDeclaresSsl(u)) {
    throw new Error(
      `staging DATABASE_URL must set sslmode=require (or verify-ca / verify-full) for non-local hosts ` +
        `(hint: ${redactedDatabaseHint(u)}).`,
    );
  }

  if (effective === "staging" && prodUrl && compareDbIdentity(raw, prodUrl)) {
    throw new Error(
      "staging DATABASE_URL must not be the same database as PRODUCTION_DATABASE_URL — use a separate staging instance.",
    );
  }

  if (demoMode) {
    if (effective === "production") {
      throw new Error("INVESTOR_DEMO_MODE cannot run in APP_ENV=production (use staging or development only).");
    }
    if (prodUrl && compareDbIdentity(raw, prodUrl)) {
      throw new Error("Investor demo must not use the production database URL.");
    }
    if (stagingUrl) {
      const matchesStaging = compareDbIdentity(raw, stagingUrl);
      const localDemoOk =
        effective === "development" &&
        isLocalDatabaseHost(host) &&
        process.env.ALLOW_INVESTOR_DEMO_LOCAL_DB === "true";
      if (!matchesStaging && !localDemoOk) {
        throw new Error(
          "INVESTOR_DEMO_MODE requires DATABASE_URL to match STAGING_DATABASE_URL when it is set " +
            "(or set ALLOW_INVESTOR_DEMO_LOCAL_DB=true with a local database in development only).",
        );
      }
    }
  }

  return { ok: true };
}

/**
 * @deprecated Use {@link assertEnvSafety} with explicit `demoMode`; kept for existing imports.
 * Derives `demoMode` from `process.env.INVESTOR_DEMO_MODE === "true"`.
 */
export function assertDatabaseEnvironmentSafety(opts: {
  appId: AppId;
  appEnv: string | undefined;
  databaseUrl: string | undefined;
}): { ok: true } {
  return assertEnvSafety({
    appId: opts.appId,
    appEnv: opts.appEnv,
    dbUrl: opts.databaseUrl,
    demoMode: typeof process !== "undefined" && process.env.INVESTOR_DEMO_MODE === "true",
  });
}
