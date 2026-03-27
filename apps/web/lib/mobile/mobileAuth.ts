import { createClient } from "@supabase/supabase-js";
import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";

export type MobileAuthUser = {
  id: string;
  email: string | null;
  role: PlatformRole;
  name: string | null;
};

export type MobileAppRole = "guest" | "host" | "admin";

export function resolveMobileAppRole(user: MobileAuthUser, hostListingCount: number): MobileAppRole {
  if (user.role === PlatformRole.ADMIN) return "admin";
  if (user.role === PlatformRole.HOST || hostListingCount > 0) return "host";
  return "guest";
}

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/**
 * Validates `Authorization: Bearer <access_token>` via Supabase (service role).
 * Maps to Prisma `User` by id first, then email.
 */
export async function getMobileAuthUser(request: Request): Promise<MobileAuthUser | null> {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7).trim();
  if (!token) return null;

  const admin = supabaseAdmin();
  if (!admin) {
    console.warn("[mobile-auth] SUPABASE_SERVICE_ROLE_KEY missing — cannot verify mobile tokens");
    return null;
  }

  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return null;

  const supa = data.user;
  let user = await prisma.user.findUnique({
    where: { id: supa.id },
    select: { id: true, email: true, role: true, name: true },
  });
  if (!user && supa.email) {
    user = await prisma.user.findUnique({
      where: { email: supa.email },
      select: { id: true, email: true, role: true, name: true },
    });
  }
  return user;
}

export async function requireMobileUser(request: Request): Promise<MobileAuthUser> {
  const u = await getMobileAuthUser(request);
  if (!u) {
    const err = new Error("UNAUTHORIZED");
    (err as Error & { status: number }).status = 401;
    throw err;
  }
  return u;
}

export async function requireMobileAdmin(request: Request): Promise<MobileAuthUser> {
  const u = await requireMobileUser(request);
  if (u.role !== PlatformRole.ADMIN) {
    const err = new Error("FORBIDDEN");
    (err as Error & { status: number }).status = 403;
    throw err;
  }
  return u;
}
