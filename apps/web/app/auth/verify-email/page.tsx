import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export const metadata = {
  title: "Verify email",
};

/** One-click email verification from link sent after /api/auth/register (USER). */
export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token?.trim()) {
    redirect("/auth/login?error=missing_token");
  }

  const user = await prisma.user.findFirst({
    where: {
      emailVerificationToken: token.trim(),
      emailVerificationExpires: { gt: new Date() },
    },
  });

  if (!user) {
    redirect("/auth/login?error=invalid_token");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerifiedAt: new Date(),
      emailVerificationToken: null,
      emailVerificationExpires: null,
    },
  });

  redirect("/auth/login?verified=1&next=/onboarding");
}
