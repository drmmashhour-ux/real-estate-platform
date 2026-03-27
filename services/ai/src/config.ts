const port = Number(process.env.AI_SERVICE_PORT) || 4001;
const nodeEnv = process.env.NODE_ENV || "development";

export const config = {
  port,
  nodeEnv,
  basePath: process.env.AI_SERVICE_BASE_PATH || "/v1/ai",
};
