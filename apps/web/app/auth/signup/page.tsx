import type { Metadata } from "next";
import { SignupPageClient } from "@/app/signup/signup-page-client";
import { normalizeSignupRefParam } from "@/lib/referrals";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create your LECIPM account — name, email, and password.",
};

/** Canonical client signup (full form) — pairs with /auth/login. */
export default async function AuthSignupPage({
  searchParams,
}: {
  searchParams?: Promise<{ ref?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const ref = normalizeSignupRefParam(params.ref);
  return <SignupPageClient refCode={ref} />;
}
