import { cookies } from "next/headers";
import { redirect } from "@/i18n/navigation";
import type { SyriaAppUser } from "@/generated/prisma";
import { prisma } from "./db";

const COOKIE = "syria_user_id";

export async function getSessionUser() {
  const jar = await cookies();
  const id = jar.get(COOKIE)?.value;
  if (!id) return null;
  return prisma.syriaAppUser.findUnique({ where: { id } });
}

export async function requireSessionUser(): Promise<SyriaAppUser> {
  const u = await getSessionUser();
  if (!u) redirect("/login");
  return u;
}

export async function requireAdmin() {
  const u = await requireSessionUser();
  if (u.role !== "ADMIN") redirect("/");
  return u;
}

/** For API routes — no redirect (returns null). */
export async function getAdminUser() {
  const u = await getSessionUser();
  if (!u || u.role !== "ADMIN") return null;
  return u;
}

export async function setSessionUserId(userId: string) {
  const jar = await cookies();
  jar.set(COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 60,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}
