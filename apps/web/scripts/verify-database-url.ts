/**
 * Verifies DATABASE_URL is set, well-formed, and connects (no secrets printed).
 * Load order matches prisma.config.ts: .env, .env.local, resolveDatabaseUrlIntoEnv.
 */
import "./load-apps-web-env";
import { Client } from "pg";

function redactedSummary(url: string): {
  ok: boolean;
  host: string;
  port: string;
  database: string;
  hasSslMode: boolean;
  looksNeon: boolean;
  looksNeonPooler: boolean;
  looksSupabasePooler: boolean;
  error?: string;
} {
  try {
    const u = new URL(url.replace(/^postgres:\/\//, "postgresql://"));
    const hasSslMode = /sslmode=/i.test(url) || u.searchParams.has("sslmode");
    const host = u.hostname;
    return {
      ok: true,
      host,
      port: u.port || "5432",
      database: (u.pathname || "/").replace(/^\//, "") || "(none)",
      hasSslMode: hasSslMode,
      looksNeon: host.includes("neon.tech"),
      looksNeonPooler: host.includes("pooler") && host.includes("neon.tech"),
      looksSupabasePooler: host.includes("pooler.supabase.com") || u.port === "6543",
    };
  } catch (e) {
    return {
      ok: false,
      host: "",
      port: "",
      database: "",
      hasSslMode: false,
      looksNeon: false,
      looksNeonPooler: false,
      looksSupabasePooler: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    console.error("❌ DATABASE_URL is not set after .env + resolve (check SUPABASE_POOLER_URL, etc.)");
    process.exit(1);
  }

  const s = redactedSummary(url);
  if (!s.ok) {
    console.error("❌ DATABASE_URL is not a valid URL:", s.error);
    process.exit(1);
  }

  console.log("Connection target (redacted):");
  console.log(`  host=${s.host}`);
  console.log(`  port=${s.port}`);
  console.log(`  database=${s.database}`);
  console.log(`  sslmode in URL: ${s.hasSslMode ? "yes" : "no (app may add for remote — see database-url-ssl)"}`);
  if (s.looksNeon && !s.looksNeonPooler) {
    console.warn(
      "  ⚠ Neon: prefer the pooled connection string (host often contains -pooler) for serverless / many clients.",
    );
  }
  if (s.looksSupabasePooler) {
    console.log("  Supabase pooler pattern detected (6543 or pooler host).");
  }

  const client = new Client({ connectionString: url, connectionTimeoutMillis: 15_000 });
  try {
    await client.connect();
    console.log("DB CONNECTED");
    const r = await client.query<{ exists: boolean }>(
      `SELECT EXISTS (
         SELECT 1
         FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = 'lecipm_autonomous_optimization_runs'
       ) AS "exists"`,
    );
    const hasTable = r.rows[0]?.exists === true;
    console.log("✅ PostgreSQL: connected (SELECT 1 equivalent via pg driver)");
    console.log(
      hasTable
        ? '✅ Table public.lecipm_autonomous_optimization_runs exists'
        : '⚠ Table public.lecipm_autonomous_optimization_runs not found — run: pnpm exec prisma migrate deploy',
    );
    process.exit(0);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("❌ Connection failed.");
    console.error("   (Details below — often P1000: wrong user/password, expired role, or DB paused.)");
    console.error("   ", msg);
    console.error("");
    console.error("Checklist:");
    console.error("  1) Copy DATABASE_URL from Neon/Supabase dashboard (Pooled / Transaction mode).");
    console.error("  2) URL-encode special characters in the password.");
    console.error("  3) Ensure ?sslmode=require (or app will add for remote in resolve).");
    console.error("  4) Neon: unpause project; Supabase: project active; rotate password if unsure.");
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
}

void main();
