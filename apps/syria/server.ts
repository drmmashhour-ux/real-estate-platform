/**
 * Custom Next.js + WebSocket entry (Darlink Syria).
 *
 * Usage: `pnpm dev:ws` from `apps/syria` — attaches `ws` to the same HTTP port as Next (default 3002).
 * Standard `pnpm dev` keeps default Next dev server (no in-process WebSocket).
 */

import http from "node:http";
import next from "next";
import { getWSServer } from "./src/lib/realtime/ws-server";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME ?? "0.0.0.0";
const port = Number.parseInt(process.env.PORT ?? "3002", 10);

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = http.createServer((req, res) => {
    void handle(req, res);
  });
  getWSServer(server);
  server.listen(port, hostname, () => {
    console.log(`[syria] ready http://${hostname}:${port} (WebSocket on same port)`);
  });
});
