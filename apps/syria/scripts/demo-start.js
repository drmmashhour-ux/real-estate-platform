const { execSync } = require("child_process");

if (process.env.APP_ENV === "production") {
  throw new Error("❌ demo:start not allowed in production");
}

function run(cmd) {
  console.log("▶", cmd);
  execSync(cmd, { stdio: "inherit", shell: true });
}

console.log("🚀 Starting Investor Demo Setup\n");

process.env.INVESTOR_DEMO_MODE = "true";
process.env.DEMO_DATA_ENABLED = "true";

run("pnpm demo:reset || true");
run("pnpm demo:seed");
run("pnpm dev");
