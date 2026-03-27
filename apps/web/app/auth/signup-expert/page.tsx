import Link from "next/link";
import { SignupExpertClient } from "./signup-expert-client";

export const metadata = {
  title: "Mortgage expert signup",
};

export default function SignupExpertPage() {
  return (
    <main className="min-h-screen bg-[#0B0B0B] px-4 py-12 text-white">
      <div className="mx-auto max-w-md">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C9A646]">LECIPM</p>
        <h1 className="mt-2 text-2xl font-bold">Mortgage expert signup</h1>
        <p className="mt-2 text-sm text-[#B3B3B3]">
          Create your account to receive assigned leads and appear on the public mortgage page (when active).
        </p>
        <SignupExpertClient />
        <p className="mt-6 text-center text-sm text-[#737373]">
          Already have an account?{" "}
          <Link href="/auth/login?next=/dashboard/expert" className="text-[#C9A646] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
