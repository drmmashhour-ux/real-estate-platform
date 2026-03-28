import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Verify email",
};

/**
 * Legacy path from older emails — delegates to the route handler so verification uses real HTTP redirects.
 */
export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token?.trim()) {
    redirect("/auth/login?error=missing_token");
  }
  redirect(`/api/auth/verify-email-token?token=${encodeURIComponent(token.trim())}`);
}
