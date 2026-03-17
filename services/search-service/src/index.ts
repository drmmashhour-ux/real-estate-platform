import { app } from "./app.js";
import { config, validateEnv } from "./config.js";

validateEnv();
const server = app.listen(config.port, () => {
  console.log(`Search service listening on port ${config.port}`);
});

process.on("SIGTERM", () => {
  server.close(() => process.exit(0));
});
