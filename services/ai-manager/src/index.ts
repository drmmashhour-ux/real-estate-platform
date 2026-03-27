import { app } from "./app.js";
import { config } from "./config.js";

const server = app.listen(config.port, () => {
  console.log(`AI Manager listening on port ${config.port}, base path ${config.basePath}`);
});

process.on("SIGTERM", () => {
  server.close(() => process.exit(0));
});
