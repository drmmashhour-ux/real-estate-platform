import Link from "next/link";

export default async function MobileProfilePage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const root = `/${locale}/${country}`;

  return (
    <div className="px-4 pb-8 pt-6">
      <h1 className="text-xl font-semibold text-white">Profile</h1>
      <p className="mt-2 text-sm text-white/50">Account, preferences, and workspace roles.</p>
      <div className="mt-8 space-y-2">
        <Link href={`${root}/auth/login`} className="block rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-sm text-white">
          Sign in
        </Link>
        <Link href={`${root}/support`} className="block rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-sm text-white/80">
          Support
        </Link>
      </div>
    </div>
  );
}
