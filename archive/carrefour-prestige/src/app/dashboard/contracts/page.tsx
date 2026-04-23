export default function ContractsPage() {
  return (
    <div>
      <h1 className="text-2xl font-light text-white">Contracts</h1>
      <p className="mt-2 text-sm text-emerald-200/60">
        Generated PDFs reference `lib/contracts/generate-contract-pdf.ts` and Supabase Storage
        uploads (server-side).
      </p>
      <p className="mt-4 text-xs text-amber-200/70">
        Template only — requires lawyer/notary review before real use.
      </p>
    </div>
  );
}
