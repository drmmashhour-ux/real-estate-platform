import { createClient } from "@supabase/supabase-js";
import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSupabaseAuthIdFromRequest } from "@/lib/bnhub/getSupabaseAuthIdFromRequest";
import { getBnhubHostListingCountForUser } from "@/lib/bnhub/supabaseHostListings";

export type MobileAuthUser = {
  id: string;
  email: string | null;
  role: PlatformRole;
  name: string | null;
};

export type MobileAppRole = "guest" | "host" | "admin";

export function resolveMobileAppRole(
  user: MobileAuthUser,
  prismaHostListingCount: number,
  bnhubHostListingCount = 0
): MobileAppRole {
  if (user.role === PlatformRole.ADMIN) return "admin";
  if (user.role === PlatformRole.HOST || prismaHostListingCount > 0 || bnhubHostListingCount > 0) {
    return "host";
  }
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
 * Maps to Prisma `User` by id first, then email; otherwise returns a **Supabase-only** profile
 * (BNHub hybrid guest + account) so `/api/mobile/v1/me` works without a Prisma row.
 * `app_metadata.bnhub_admin === true` elevates to ADMIN for API RBAC without Prisma.
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
  if (user) {
    const meta = supa.app_metadata as Record<string, unknown> | undefined;
    if (meta?.bnhub_admin === true && user.role !== PlatformRole.ADMIN) {
      return { ...user, role: PlatformRole.ADMIN };
    }
    return user;
  }

  const meta = supa.app_metadata as Record<string, unknown> | undefined;
  if (meta?.bnhub_admin === true) {
    return {
      id: supa.id,
      email: supa.email ?? null,
      role: PlatformRole.ADMIN,
      name: typeof (supa.user_metadata as { name?: string } | null)?.name === "string"
        ? (supa.user_metadata as { name: string }).name
        : null,
    };
  }

  return {
    id: supa.id,
    email: supa.email ?? null,
    role: PlatformRole.USER,
    name: typeof (supa.user_metadata as { name?: string } | null)?.name === "string"
      ? (supa.user_metadata as { name: string }).name
      : null,
  };
}

/**
 * Resolves dashboard role using Prisma host listings + BNHub `listings.host_user_id`
 * (uses Supabase Auth id from JWT for BNHub, not Prisma id when they differ).
 */
export async function resolveMobileAppRoleFromRequest(
  request: Request,
  user: MobileAuthUser
): Promise<MobileAppRole> {
  const prismaHostCount = await prisma.shortTermListing.count({ where: { ownerId: user.id } }).catch(() => 0);
  const supaId = await getSupabaseAuthIdFromRequest(request);
  const bnhubCount = supaId ? await getBnhubHostListingCountForUser(supaId) : 0;
  return resolveMobileAppRole(user, prismaHostCount, bnhubCount);
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

function httpError(status: number, message: string): never {
  const err = new Error(message);
  (err as Error & { status: number }).status = status;
  throw err;
}

/** Host or admin (Prisma/Supabase metadata) or BNHub listing ownership. */
export async function assertBnhubHostOrAdmin(request: Request): Promise<MobileAuthUser> {
  const u = await getMobileAuthUser(request);
  if (!u) httpError(401, "Unauthorized");
  const role = await resolveMobileAppRoleFromRequest(request, u);
  if (role !== "host" && role !== "admin") {
    httpError(403, "Forbidden");
  }
  return u;
}
