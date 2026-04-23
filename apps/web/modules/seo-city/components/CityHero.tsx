import Image from "next/image";
import Link from "next/link";

type Props = {
  title: string;
  subtitle: string;
  imageSrc: string;
  imageAlt: string;
  primaryCta: { href: string; label: string };
  secondaryCta?: { href: string; label: string };
};

export function CityHero({ title, subtitle, imageSrc, imageAlt, primaryCta, secondaryCta }: Props) {
  return (
    <section className="relative flex min-h-[380px] items-end sm:min-h-[440px]">
      <Image src={imageSrc} alt={imageAlt} fill className="object-cover" sizes="100vw" priority />
      <div className="absolute inset-0 bg-black/55" aria-hidden />
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">{title}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-white/95">{subtitle}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={primaryCta.href}
            className="inline-flex rounded-full bg-rose-600 px-6 py-3 text-sm font-bold text-white hover:bg-rose-500"
          >
            {primaryCta.label}
          </Link>
          {secondaryCta ? (
            <Link
              href={secondaryCta.href}
              className="inline-flex rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              {secondaryCta.label}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
