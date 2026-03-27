import Link from "next/link";

export default function LegalCenterFrPage() {
  return (
    <div className="text-white">
      <h1 className="text-3xl font-bold">Centre juridique</h1>
      <ul className="mt-8 space-y-3 text-sm">
        <li>
          <Link href="/fr/legal/terms" className="text-[#C9A646] hover:underline">
            Conditions d&apos;utilisation (résumé FR)
          </Link>
        </li>
        <li>
          <Link href="/fr/legal/privacy" className="text-[#C9A646] hover:underline">
            Confidentialité (résumé FR)
          </Link>
        </li>
        <li>
          <Link href="/fr/legal/copyright" className="text-[#C9A646] hover:underline">
            Droit d&apos;auteur
          </Link>
        </li>
        <li>
          <Link href="/legal" className="text-[#B3B3B3] hover:text-[#E8C547]">
            English legal center →
          </Link>
        </li>
      </ul>
    </div>
  );
}
