import Link from "next/link";

export const metadata = { title: "Staging access" };

/** Shown when NEXT_PUBLIC_STAGING_ROLE_GATE is on and the signed-in role is not allowed on staging. */
export default function StagingRestrictedPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="text-xl font-semibold text-white">Staging access</h1>
      <p className="mt-4 text-sm leading-relaxed text-[#B3B3B3]">
        This staging environment is limited to demo roles (client, tester, admin). Your account role is not enabled
        here. Use a demo login or ask the team for a staging tester account.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/auth/login"
          className="rounded-xl bg-premium-gold px-5 py-2.5 text-sm font-semibold text-[#0B0B0B]"
        >
          Sign in with another account
        </Link>
        <Link href="/" className="rounded-xl border border-white/15 px-5 py-2.5 text-sm text-white/90">
          Home
        </Link>
      </div>
    </div>
  );
}
