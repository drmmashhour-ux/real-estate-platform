import Link from "next/link";

export default function LegalCenterFrPage() {
  return (
    <div className="text-white">
      <h1 className="text-3xl font-bold">Centre juridique</h1>
      <ul className="mt-8 space-y-3 text-sm">
        <li>
          <Link href="/fr/legal/terms" className="text-premium-gold hover:underline">
            Conditions d&apos;utilisation (résumé FR)
          </Link>
        </li>
        <li>
          <Link href="/fr/legal/privacy" className="text-premium-gold hover:underline">
            Confidentialité (résumé FR)
          </Link>
        </li>
        <li>
          <Link href="/fr/legal/copyright" className="text-premium-gold hover:underline">
            Droit d&apos;auteur
          </Link>
        </li>
        <li>
          <Link href="/legal" className="text-[#B3B3B3] hover:text-premium-gold">
            English legal center →
          </Link>
        </li>
      </ul>
    </div>
  );
}
