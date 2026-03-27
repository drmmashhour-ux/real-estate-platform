import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UserRole } from "@prisma/client";

export type CurrentUser = {
  id: string;
  email: string;
  role: UserRole;
  supabaseId: string | null;
};

const ROLES: UserRole[] = [
  "BUYER",
  "SELLER",
  "BROKER",
  "INVESTOR",
  "ADMIN",
];

function roleFromMetadata(authUser: {
  user_metadata?: Record<string, unknown>;
}): UserRole {
  const raw = authUser.user_metadata?.role;
  if (typeof raw === "string" && ROLES.includes(raw as UserRole)) {
    return raw as UserRole;
  }
  return "BUYER";
}

/**
 * Resolves the Prisma user for the Supabase session, creating a linked row + profile on first visit.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser?.email) return null;

  const desiredRole = roleFromMetadata(authUser);

  let dbUser = await prisma.user.findUnique({
    where: { email: authUser.email },
    include: { profile: true },
  });

  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: {
        email: authUser.email,
        supabaseId: authUser.id,
        role: desiredRole,
        profile: { create: {} },
      },
      include: { profile: true },
    });
  } else {
    if (dbUser.supabaseId !== authUser.id) {
      await prisma.user.update({
        where: { id: dbUser.id },
        data: { supabaseId: authUser.id },
      });
    }
    if (!dbUser.profile) {
      await prisma.profile.create({ data: { userId: dbUser.id } });
    }
  }

  const fresh = await prisma.user.findUniqueOrThrow({
    where: { id: dbUser.id },
  });

  return {
    id: fresh.id,
    email: fresh.email,
    role: fresh.role,
    supabaseId: fresh.supabaseId,
  };
}

export async function requireRole(allowed: UserRole[]): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  if (!allowed.includes(user.role)) {
    throw new Error("Forbidden");
  }
  return user;
}
