const { execSync } = require("child_process");

function run(cmd) {
  execSync(cmd, { stdio: "inherit" });
}

console.log("🧹 Cleaning demo data...");

run("pnpm demo:reset");

console.log("✅ Demo data cleaned");
