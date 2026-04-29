"use client";

/**
 * Browser WebSocket client for SYBNB real-time hints (custom Node server with `ws`).
 * On Vercel / default `next dev`, leave disabled — no native WS on the same origin.
 *
 * Enable local WS:
 * - Run `pnpm dev:ws` from `apps/syria` (custom server attaches `ws`), **or**
 * - Set `NEXT_PUBLIC_SYBNB_WS_URL=wss://your-relay.example`
 *
 * Optional: `NEXT_PUBLIC_SYBNB_WS_ENABLED=1` uses same-origin `ws(s)://host:port` when URL unset.
 */

export type SybnbRealtimePayload =
  | { type: "booking_updated"; bookingId: string; status?: string }
  | { type: "message"; bookingId: string };

export type ConnectSybnbWSOpts = {
  onMessage: (data: SybnbRealtimePayload) => void;
  onConnectedChange?: (connected: boolean) => void;
};

function resolveWsUrl(): string | null {
  const explicit = process.env.NEXT_PUBLIC_SYBNB_WS_URL?.trim();
  if (explicit) return explicit;
  if (typeof window === "undefined") return null;
  if (process.env.NEXT_PUBLIC_SYBNB_WS_ENABLED !== "1") return null;
  const { protocol, hostname, port } = window.location;
  const wsProto = protocol === "https:" ? "wss:" : "ws:";
  const p = port ? `:${port}` : "";
  return `${wsProto}//${hostname}${p}`;
}

/** Connect with auto-reconnect; returns dispose. */
export function connectSybnbWS(opts: ConnectSybnbWSOpts): () => void {
  if (typeof window === "undefined") return () => {};

  let socket: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;

  function clearReconnectTimer() {
    if (reconnectTimer != null) {
      window.clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  }

  function teardownSocket() {
    clearReconnectTimer();
    try {
      socket?.close();
    } catch {
      /* ignore */
    }
    socket = null;
  }

  function connect() {
    const url = resolveWsUrl();
    if (!url) {
      opts.onConnectedChange?.(false);
      return;
    }
    teardownSocket();
    try {
      socket = new WebSocket(url);
    } catch {
      opts.onConnectedChange?.(false);
      reconnectTimer = window.setTimeout(connect, 2000);
      return;
    }

    socket.onopen = () => opts.onConnectedChange?.(true);
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(String(event.data)) as SybnbRealtimePayload;
        opts.onMessage(data);
      } catch {
        /* ignore */
      }
    };
    socket.onclose = () => {
      opts.onConnectedChange?.(false);
      if (stopped) return;
      reconnectTimer = window.setTimeout(connect, 2000);
    };
    socket.onerror = () => {
      try {
        socket?.close();
      } catch {
        /* ignore */
      }
    };
  }

  connect();

  return () => {
    stopped = true;
    teardownSocket();
    opts.onConnectedChange?.(false);
  };
}

export function sendSybnbWS(data: unknown): void {
  /* Reserved — server pushes events; clients do not chat over WS in MVP */
  void data;
}
