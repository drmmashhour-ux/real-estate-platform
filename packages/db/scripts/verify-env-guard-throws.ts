/**
 * CI / local: expected-failure / success cases for assertEnvSafety and assertDatabaseEnvironmentSafety.
 * Run: pnpm --filter @repo/db run verify:env-guard
 */
import { assertDatabaseEnvironmentSafety, assertEnvSafety } from "../src/env-guard";

function mustThrow(label: string, fn: () => void): void {
  try {
    fn();
  } catch {
    return;
  }
  throw new Error(`expected throw: ${label}`);
}

function mustOk(label: string, fn: () => void): void {
  try {
    fn();
  } catch (e) {
    throw new Error(`expected success for ${label}: ${e instanceof Error ? e.message : String(e)}`);
  }
}

function withEnv<T>(key: string, value: string | undefined, fn: () => T): T {
  const prev = process.env[key];
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
  try {
    return fn();
  } finally {
    if (prev === undefined) delete process.env[key];
    else process.env[key] = prev;
  }
}

// --- assertDatabaseEnvironmentSafety (INVESTOR_DEMO_MODE not set) ---
mustThrow("prod localhost", () =>
  assertDatabaseEnvironmentSafety({
    appId: "lecipm",
    appEnv: "production",
    databaseUrl: "postgresql://u:p@127.0.0.1:5432/app?sslmode=require",
  }),
);

mustThrow("lecipm syria name", () =>
  assertDatabaseEnvironmentSafety({
    appId: "lecipm",
    appEnv: "staging",
    databaseUrl: "postgresql://u:p@staging.db.example.com:5432/syria_staging?sslmode=require",
  }),
);

mustThrow("syria lecipm name", () =>
  assertDatabaseEnvironmentSafety({
    appId: "syria",
    appEnv: "staging",
    databaseUrl: "postgresql://u:p@staging.db.example.com:5432/lecipm_staging?sslmode=require",
  }),
);

mustThrow("staging no ssl", () =>
  assertDatabaseEnvironmentSafety({
    appId: "lecipm",
    appEnv: "staging",
    databaseUrl: "postgresql://u:p@db.rds.amazonaws.com:5432/app?sslmode=disable",
  }),
);

mustOk("dev local", () =>
  assertDatabaseEnvironmentSafety({
    appId: "lecipm",
    appEnv: "development",
    databaseUrl: "postgresql://u:p@localhost:5432/lecipm_dev",
  }),
);

// --- assertEnvSafety: staging must not match production URL ---
const PROD = "postgresql://a:b@pg.prod.example.com:5432/lecipm?sslmode=require";
const STG_SY = "postgresql://a:b@pg.staging.example.com:5432/syria_sybnb_stg?sslmode=require";
mustThrow("staging same as production", () =>
  withEnv("PRODUCTION_DATABASE_URL", PROD, () =>
    assertEnvSafety({ appId: "lecipm", appEnv: "staging", dbUrl: PROD, demoMode: false }),
  ),
);

// --- assertEnvSafety: demo on production app env ---
mustThrow("demo with APP_ENV production", () =>
  assertEnvSafety({ appId: "syria", appEnv: "production", dbUrl: STG_SY, demoMode: true }),
);

// --- assertEnvSafety: demo on production DB when PRODUCTION_DATABASE_URL is set (Syria) ---
const PROD_SY = "postgresql://a:b@pg.prod.example.com:5432/syria_sybnb?sslmode=require";
mustThrow("demo on production DSN", () =>
  withEnv("PRODUCTION_DATABASE_URL", PROD_SY, () =>
    assertEnvSafety({ appId: "syria", appEnv: "development", dbUrl: PROD_SY, demoMode: true }),
  ),
);

mustOk("demo with staging DSN and matching STAGING_DATABASE_URL", () =>
  withEnv("STAGING_DATABASE_URL", STG_SY, () =>
    withEnv("PRODUCTION_DATABASE_URL", PROD, () =>
      assertEnvSafety({ appId: "syria", appEnv: "development", dbUrl: STG_SY, demoMode: true }),
    ),
  ),
);

console.log("env-guard verify: all expected cases passed.");
