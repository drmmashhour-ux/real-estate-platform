import { redirect } from "next/navigation";

/** /signup → /auth/signup (same form; keeps referral ?ref= working). */
export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const params = await searchParams;
  const ref = params.ref?.trim();
  const q = ref ? `?ref=${encodeURIComponent(ref)}` : "";
  redirect(`/auth/signup${q}`);
}
