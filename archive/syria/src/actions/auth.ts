"use server";

import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { prisma } from "@/lib/db";
import { clearSession, setSessionUserId } from "@/lib/auth";

export async function loginWithEmail(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email.includes("@")) {
    return;
  }

  const name = String(formData.get("name") ?? "").trim() || null;
  const asAdmin = formData.get("as_admin") === "on";
  const adminEmails = (process.env.SYRIA_ADMIN_EMAILS ?? "admin@syria.local")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const promoteAdmin = asAdmin && adminEmails.includes(email);
  const role = promoteAdmin ? "ADMIN" : "USER";

  const user = await prisma.syriaAppUser.upsert({
    where: { email },
    create: {
      email,
      name,
      role,
    },
    update: {
      name: name ?? undefined,
      ...(promoteAdmin ? { role: "ADMIN" as const } : {}),
    },
  });

  await setSessionUserId(user.id);
  const locale = await getLocale();
  redirect({
    href: user.role === "ADMIN" ? "/admin" : "/dashboard",
    locale,
  });
}

export async function logout(): Promise<void> {
  await clearSession();
  const locale = await getLocale();
  redirect({ href: "/", locale });
}
