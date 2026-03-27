import Link from "next/link";

export default function FrLegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div lang="fr" className="min-h-screen bg-[#0B0B0B] text-white">
      <header className="border-b border-[#C9A646]/25 bg-[#121212]/95">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-sm text-[#B3B3B3] hover:text-[#C9A646]">
            ← Accueil
          </Link>
          <div className="flex gap-4 text-sm">
            <Link href="/fr/legal" className="font-semibold text-[#C9A646]">
              FR
            </Link>
            <span className="text-[#444]">|</span>
            <Link href="/legal" className="text-[#737373] hover:text-[#E8C547]">
              EN
            </Link>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-4 py-10">{children}</div>
    </div>
  );
}
