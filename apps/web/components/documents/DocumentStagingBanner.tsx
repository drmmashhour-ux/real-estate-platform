"use client";

/** Staging / demo notice for document surfaces (NEXT_PUBLIC_ENV=staging). */
export function DocumentStagingBanner() {
  if (process.env.NEXT_PUBLIC_ENV !== "staging") return null;
  return (
    <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100/90">
      This is a demo document environment. Uploaded files are for testing only.
    </div>
  );
}
