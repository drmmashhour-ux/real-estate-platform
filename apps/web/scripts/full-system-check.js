/**
 * One-shot local e2e: Docker Postgres → Prisma → test-db → dev server → GET /api/db-test
 * Run from `apps/web`: `pnpm system:check`
 * Requires: Docker, DATABASE_URL pointing at local Postgres (e.g. localhost:5433 per docker-compose.local-db.yml)
 */
const { execSync, spawn } = require("child_process");
const net = require("net");
const path = require("path");

const APP_ROOT = path.join(__dirname, "..");
/** Host port from docker-compose.local-db.yml: "5433:5432" */
const LOCAL_DB_PORT = 5433;
const DEV_PORT = 3001;

function run(cmd) {
  console.log(`\n▶ ${cmd}`);
  execSync(cmd, { stdio: "inherit", cwd: APP_ROOT, shell: true, env: process.env });
}

function waitForPort(port, host = "127.0.0.1", timeout = 15000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    function tryConnect() {
      const socket = new net.Socket();

      socket.setTimeout(1000);

      socket.on("connect", () => {
        socket.destroy();
        resolve(true);
      });

      const retry = () => {
        try {
          socket.destroy();
        } catch {
          /* ignore */
        }
        if (Date.now() - start > timeout) {
          reject(new Error("DB or service not ready in time"));
        } else {
          setTimeout(tryConnect, 1000);
        }
      };

      socket.on("error", retry);
      socket.on("timeout", retry);

      socket.connect(port, host);
    }

    tryConnect();
  });
}

(async () => {
  let server;
  let exitCode = 1;
  try {
    console.log("\n🚀 FULL SYSTEM CHECK START\n");

    // 1. Start DB
    run("pnpm db:local:up");

    // 2. Wait for DB (host port 5433)
    console.log("⏳ Waiting for DB on port " + LOCAL_DB_PORT + "...");
    await waitForPort(LOCAL_DB_PORT, "127.0.0.1", 120000);
    console.log("✅ DB is ready");

    // 3. Prisma generate
    run("pnpm exec prisma generate --schema=./prisma/schema.prisma");

    // 4. Migrate
    run("pnpm exec prisma migrate deploy --schema=./prisma/schema.prisma");

    // 5. Test DB
    run("pnpm test-db");

    // 6. Start server (background)
    console.log("\n▶ Starting dev server...");
    server = spawn("pnpm", ["dev"], {
      stdio: "inherit",
      shell: true,
      cwd: APP_ROOT,
      env: process.env,
    });

    // 7. Wait for HTTP port
    console.log("⏳ Waiting for Next.js on " + DEV_PORT + "...");
    await waitForPort(DEV_PORT, "127.0.0.1", 120000);

    // 8. API test
    const apiUrl = "http://127.0.0.1:" + DEV_PORT + "/api/db-test";
    const out = execFileSync("curl", ["-sfS", apiUrl], { encoding: "utf8" });
    const body = JSON.parse(out);
    if (body.status !== "ok") {
      throw new Error("API /api/db-test did not return status ok: " + out.slice(0, 200));
    }

    console.log("\n✅ FULL SYSTEM CHECK PASSED\n");
    exitCode = 0;
  } catch (e) {
    console.error("\n❌ FULL SYSTEM CHECK FAILED\n");
    console.error(e && e.message ? e.message : e);
  } finally {
    if (server) {
      try {
        server.kill("SIGTERM");
      } catch {
        /* ignore */
      }
    }
  }
  process.exit(exitCode);
})();
