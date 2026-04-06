"use client";

import { InsuranceLeadForm } from "@/components/InsuranceLeadForm";

export function ListingInsuranceLeadSection({ listingId }: { listingId: string }) {
  const flip = listingId.charCodeAt(listingId.length - 1) % 2 === 0;
  return (
    <section className="border-t border-slate-800 bg-slate-950 px-4 py-10">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Protect this property</h2>
          <p className="mt-1 text-sm text-slate-400">
            Optional quotes from licensed partners — no obligation. Your consent is recorded when you submit.
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-2">
          <InsuranceLeadForm
            variant={flip ? "A" : "B"}
            leadType="property"
            source="listing"
            listingId={listingId}
            headline="Get a home insurance quote"
            subheadline="Share your email and a partner can follow up about coverage for this home."
          />
          <InsuranceLeadForm
            variant={flip ? "B" : "A"}
            leadType="mortgage"
            source="listing"
            listingId={listingId}
            headline="Mortgage-related protection"
            subheadline="Life, disability, or creditor insurance tied to your purchase — partner follow-up only with your consent."
          />
        </div>
      </div>
    </section>
  );
}
