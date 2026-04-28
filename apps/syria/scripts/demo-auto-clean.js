setTimeout(() => {
  require("child_process").execSync("pnpm demo:cleanup", {
    stdio: "inherit",
  });
}, 1000 * 60 * 60); // 1 hour
