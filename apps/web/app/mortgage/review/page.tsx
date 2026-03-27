import Link from "next/link";
import { ReviewFormClient } from "./review-form-client";

export const metadata = {
  title: "Rate your mortgage expert",
  description: "Share feedback after your deal closes.",
};

export default function MortgageReviewPage() {
  return (
    <main className="min-h-screen bg-[#0B0B0B] text-white">
      <div className="mx-auto max-w-md px-4 py-12">
        <Link href="/" className="text-xs text-[#737373] hover:text-white">
          ← Home
        </Link>
        <h1 className="mt-6 text-2xl font-bold text-[#C9A646]">Rate your expert</h1>
        <p className="mt-2 text-sm text-[#B3B3B3]">
          Use the secure link from your closing confirmation. One review per completed deal.
        </p>
        <ReviewFormClient />
      </div>
    </main>
  );
}
