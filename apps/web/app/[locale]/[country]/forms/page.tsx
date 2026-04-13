import Link from "next/link";

/**
 * Forms hub – lightweight landing. Form UI lives here or on linked pages only.
 * Not embedded in dashboard or luxury hub.
 */
export default function FormsPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-2xl font-semibold">Forms</h1>
        <p className="mt-2 text-slate-400">
          Contact, design templates, and other forms. Form content loads only when you open a form.
        </p>
        <ul className="mt-8 space-y-4">
          <li>
            <Link
              href="/forms/amendments"
              className="block rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-slate-700 hover:bg-slate-900/80"
            >
              <span className="font-medium text-slate-200">Amendments (OACIQ)</span>
              <p className="mt-1 text-sm text-slate-500">Amendment to brokerage contract / extension of acceptance or time period.</p>
            </Link>
          </li>
          <li>
            <Link
              href="/contact"
              className="block rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-slate-700 hover:bg-slate-900/80"
            >
              <span className="font-medium text-slate-200">Contact</span>
              <p className="mt-1 text-sm text-slate-500">Get in touch with the platform.</p>
            </Link>
          </li>
          <li>
            <Link
              href="/design-templates"
              className="block rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-slate-700 hover:bg-slate-900/80"
            >
              <span className="font-medium text-slate-200">Design templates</span>
              <p className="mt-1 text-sm text-slate-500">Canva templates and AI-generated copy.</p>
            </Link>
          </li>
        </ul>
        <p className="mt-8 text-xs text-slate-500">
          Admin forms: <Link href="/admin/forms" className="text-amber-400 hover:underline">/admin/forms</Link>
        </p>
      </div>
    </main>
  );
}
