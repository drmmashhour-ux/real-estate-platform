import type { Server } from "node:http";
import { WebSocketServer, WebSocket } from "ws";

let wss: WebSocketServer | null = null;

/**
 * Attach once to the Node HTTP server (custom server only — see `apps/syria/server.ts`).
 * No-op `broadcast` when `getWSServer` was never called (e.g. `next dev` / Vercel).
 */
export function getWSServer(server: Server): WebSocketServer {
  if (!wss) {
    wss = new WebSocketServer({ server });
  }
  return wss;
}

export type SybnbRealtimeEvent =
  | { type: "booking_updated"; bookingId: string; status?: string }
  | { type: "message"; bookingId: string };

export function broadcast(event: SybnbRealtimeEvent): void {
  if (!wss) return;

  const payload = JSON.stringify(event);

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}
