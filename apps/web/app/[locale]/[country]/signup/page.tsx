import { redirect } from "next/navigation";

/** /signup → /auth/signup (same form; keeps referral ?ref= working). */
export default async function SignupPage({
  searchParams,
}: {
  searchParams?: Promise<{ ref?: string; src?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const ref = params.ref?.trim();
  const src = params.src?.trim();
  const q = new URLSearchParams();
  if (ref) q.set("ref", ref);
  if (src) q.set("src", src);
  const qs = q.toString();
  redirect(`/auth/signup${qs ? `?${qs}` : ""}`);
}
