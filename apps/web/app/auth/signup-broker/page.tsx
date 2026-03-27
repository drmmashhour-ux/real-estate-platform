import Link from "next/link";
import { SignupBrokerClient } from "./signup-broker-client";

export const metadata = {
  title: "Mortgage broker signup",
};

export default function SignupBrokerPage() {
  return (
    <main className="min-h-screen bg-[#0B0B0B] px-4 py-12 text-white">
      <div className="mx-auto max-w-md">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C9A646]">LECIPM</p>
        <h1 className="mt-2 text-2xl font-bold">Mortgage broker signup</h1>
        <p className="mt-2 text-sm text-[#B3B3B3]">
          Create your account, then complete your professional profile for admin review.
        </p>
        <SignupBrokerClient />
        <p className="mt-6 rounded-xl border border-white/10 bg-[#14110a]/80 px-3 py-2 text-xs leading-relaxed text-slate-400">
          This platform connects clients with brokers. All professionals must comply with AMF regulations.
        </p>
        <p className="mt-4 text-center text-sm text-[#737373]">
          Already have an account?{" "}
          <Link href="/auth/login?next=%2Fbroker%2Fcomplete-profile" className="text-[#C9A646] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
