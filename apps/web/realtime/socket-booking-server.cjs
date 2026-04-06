/**
 * Optional Socket.IO bridge for LECIPM booking events (Redis pub/sub → mobile clients).
 *
 * Requires REDIS_URL (same as Next.js). Run alongside the API:
 *   pnpm run realtime:socket
 *
 * Point the mobile app at EXPO_PUBLIC_REALTIME_URL (e.g. http://YOUR_LAN_IP:4010).
 * Not compatible with Vercel serverless; use a long-lived Node host or omit for push-only updates.
 */

const path = require("path");
const { createServer } = require("http");
const { Server } = require("socket.io");
const Redis = require("ioredis");
const { createClient } = require("@supabase/supabase-js");
const { PrismaClient } = require("@prisma/client");

require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const PORT = parseInt(process.env.REALTIME_PORT || "4010", 10);
const REDIS_URL = process.env.REDIS_URL;
const CHANNEL = process.env.LECIPM_BOOKING_REDIS_CHANNEL || "lecipm:booking";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!REDIS_URL) {
  console.error("[realtime] REDIS_URL is required.");
  process.exit(1);
}

const prisma = new PrismaClient();
const supabaseAdmin =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, { auth: { persistSession: false, autoRefreshToken: false } })
    : null;

const httpServer = createServer();
const io = new Server(httpServer, {
  path: "/socket.io",
  cors: { origin: true, methods: ["GET", "POST"] },
});

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token || !supabaseAdmin) {
      return next(new Error("unauthorized"));
    }
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) {
      return next(new Error("unauthorized"));
    }
    const su = data.user;
    let row = await prisma.user.findUnique({ where: { id: su.id }, select: { id: true } });
    if (!row && su.email) {
      row = await prisma.user.findUnique({ where: { email: su.email }, select: { id: true } });
    }
    if (!row) {
      return next(new Error("unauthorized"));
    }
    socket.data.prismaUserId = row.id;
    socket.join(`user:${row.id}`);
    next();
  } catch {
    next(new Error("unauthorized"));
  }
});

io.on("connection", (socket) => {
  socket.emit("connected", { userId: socket.data.prismaUserId });
});

const sub = new Redis(REDIS_URL);
sub.subscribe(CHANNEL, (err) => {
  if (err) console.error("[realtime] redis subscribe error", err);
});

sub.on("message", (channel, message) => {
  if (channel !== CHANNEL) return;
  try {
    const p = JSON.parse(message);
    const event = p.event;
    if (!event || typeof event !== "string") return;
    const data = {
      bookingId: p.bookingId,
      listingId: p.listingId,
      status: p.status,
      hostId: p.hostId,
      guestId: p.guestId,
    };
    if (p.hostId) io.to(`user:${p.hostId}`).emit(event, data);
    if (p.guestId && p.guestId !== p.hostId) io.to(`user:${p.guestId}`).emit(event, data);
  } catch (e) {
    console.warn("[realtime] bad message", e);
  }
});

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`[realtime] Socket.IO on 0.0.0.0:${PORT} (redis channel ${CHANNEL})`);
});

process.on("SIGINT", () => {
  sub.disconnect();
  void prisma.$disconnect();
  process.exit(0);
});
