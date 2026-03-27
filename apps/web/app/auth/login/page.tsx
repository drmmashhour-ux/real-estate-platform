import Link from "next/link";
import { AuthLoginClient } from "./auth-login-client";

export const metadata = {
  title: "Sign in",
};

export default function AuthLoginPage() {
  return (
    <main className="min-h-screen bg-[#0B0B0B] px-4 py-12 text-white">
      <div className="mx-auto max-w-md">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C9A646]">LECIPM</p>
        <h1 className="mt-2 text-2xl font-bold">Sign in</h1>
        <p className="mt-2 text-sm text-[#B3B3B3]">Use the email and password for your account.</p>
        <AuthLoginClient />
        <p className="mt-6 text-center text-sm text-[#737373]">
          Mortgage expert?{" "}
          <Link href="/auth/signup-expert" className="text-[#C9A646] hover:underline">
            Apply here
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-[#737373]">
          Mortgage broker (leads dashboard)?{" "}
          <Link href="/auth/signup-broker" className="text-[#C9A646] hover:underline">
            Sign up
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-[#737373]">
          BNHub demo login:{" "}
          <Link href="/bnhub/login" className="text-[#737373] underline hover:text-white">
            /bnhub/login
          </Link>
        </p>
      </div>
    </main>
  );
}
