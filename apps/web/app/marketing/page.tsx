import type { Metadata } from "next";
import Link from "next/link";
import { PLATFORM_NAME, PLATFORM_CARREFOUR_NAME, PLATFORM_OPERATOR } from "@/lib/brand/platform";

export const metadata: Metadata = {
  title: "Welcome to LECIPM — Discover Our Platform",
  description:
    "Learn about LECIPM (Le Carrefour Immobilier Prestige) — Quebec's trusted AI-powered real estate platform for buying, selling, renting, and short-term stays.",
};

const FEATURES = [
  {
    title: "Marketplace immobilier",
    titleEn: "Real Estate Marketplace",
    desc: "Achetez, vendez ou louez des propriétés avec des outils de recherche avancés, des évaluations IA et des courtiers vérifiés.",
    descEn: "Buy, sell, or rent properties with advanced search tools, AI valuations, and verified brokers.",
    icon: "🏠",
  },
  {
    title: "BNHub — Séjours courts",
    titleEn: "BNHub — Short-Term Stays",
    desc: "Réservez des hébergements uniques au Québec ou inscrivez votre propriété comme hôte — paiements sécurisés via Stripe Connect.",
    descEn: "Book unique stays across Quebec or list your property as a host — secure payments via Stripe Connect.",
    icon: "🛏️",
  },
  {
    title: "CRM Courtier",
    titleEn: "Broker CRM",
    desc: "Gestion de leads, pipeline de transactions et outils de monétisation pour les courtiers immobiliers.",
    descEn: "Lead management, deal pipeline, and monetization tools for real estate brokers.",
    icon: "📊",
  },
  {
    title: "Outils hypothécaires",
    titleEn: "Mortgage Hub",
    desc: "Profils d'experts hypothécaires, routage de leads et crédits par abonnement.",
    descEn: "Mortgage specialist profiles, lead routing, and subscription-based lead credits.",
    icon: "🏦",
  },
  {
    title: "Analyse IA des transactions",
    titleEn: "AI Deal Analyzer",
    desc: "Comparables, scénarios d'investissement, analyse de portefeuille et conseiller de prix — propulsés par l'IA.",
    descEn: "Comparables, investment scenarios, portfolio analysis, and pricing advisor — powered by AI.",
    icon: "🤖",
  },
  {
    title: "Confiance & Sécurité",
    titleEn: "Trust & Safety",
    desc: "TrustGraph vérifie les identités, détecte la fraude et protège chaque transaction sur la plateforme.",
    descEn: "TrustGraph verifies identities, detects fraud, and protects every transaction on the platform.",
    icon: "🛡️",
  },
  {
    title: "Assistante IA vocale",
    titleEn: "AI Voice Assistant",
    desc: "Une assistante qui parle français québécois, anglais et arabe — prête à guider chaque client par voix ou texte.",
    descEn: "An assistant that speaks Québécois French, English, and Arabic — ready to guide every client by voice or text.",
    icon: "🎙️",
  },
  {
    title: "Design Studio",
    titleEn: "Design Studio",
    desc: "Visualisez le design intérieur de votre future propriété avec notre studio interactif.",
    descEn: "Visualize the interior design of your future property with our interactive studio.",
    icon: "🎨",
  },
];

const TRUST_STATS = [
  { value: "100%", label: "Québec-based", labelFr: "Basé au Québec" },
  { value: "3", label: "Languages", labelFr: "Langues" },
  { value: "24/7", label: "AI Assistant", labelFr: "Assistante IA" },
  { value: "Stripe", label: "Secure Payments", labelFr: "Paiements sécurisés" },
];

export default function MarketingHubPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[#D4AF37]/20">
        <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/5 via-transparent to-[#D4AF37]/5" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
          <p className="mb-4 inline-block rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
            {PLATFORM_CARREFOUR_NAME}
          </p>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Bienvenue chez{" "}
            <span className="text-[#D4AF37]">{PLATFORM_NAME}</span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/70 sm:text-xl" lang="fr-CA">
            La plateforme immobilière propulsée par l&apos;IA au service du Québec.
            Achat, vente, location, séjours courts — tout en un.
          </p>
          <p className="mt-2 max-w-2xl text-base text-white/50" lang="en">
            Quebec&apos;s AI-powered real estate platform. Buying, selling, renting, short stays — all in one place.
          </p>
          <p className="mt-2 max-w-2xl text-base text-white/50" lang="ar" dir="rtl">
            منصة العقارات المدعومة بالذكاء الاصطناعي في كيبيك. بيع، شراء، تأجير، إقامات قصيرة — كل شيء في مكان واحد.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/bnhub"
              className="rounded-full bg-[#D4AF37] px-8 py-3.5 text-base font-semibold text-black shadow-[0_8px_30px_rgba(212,175,55,0.35)] transition hover:scale-[1.02] hover:shadow-[0_12px_40px_rgba(212,175,55,0.5)]"
            >
              Explorer BNHub
            </Link>
            <Link
              href="/marketplace"
              className="rounded-full border-2 border-[#D4AF37]/50 px-8 py-3.5 text-base font-semibold text-[#D4AF37] transition hover:bg-[#D4AF37]/10"
            >
              Marketplace
            </Link>
            <Link
              href="/contact"
              className="rounded-full border border-white/20 px-8 py-3.5 text-base font-semibold text-white/80 transition hover:bg-white/5"
            >
              Contactez-nous
            </Link>
          </div>
        </div>
      </section>

      {/* Trust stats */}
      <section className="border-b border-white/10 bg-black/40">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-6 px-4 py-10 sm:grid-cols-4 sm:px-6">
          {TRUST_STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl font-bold text-[#D4AF37] sm:text-3xl">{s.value}</p>
              <p className="mt-1 text-xs text-white/60">{s.labelFr}</p>
              <p className="text-xs text-white/40">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Who is LECIPM */}
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">
            <span className="text-[#D4AF37]">Qui est LECIPM ?</span>
            <span className="ml-3 text-white/50 text-lg font-normal">Who is LECIPM?</span>
          </h2>
          <div className="mt-8 space-y-6 text-base leading-relaxed text-white/80">
            <p lang="fr-CA">
              <strong>{PLATFORM_NAME}</strong> ({PLATFORM_CARREFOUR_NAME}) est un écosystème immobilier
              complet fondé par <strong>{PLATFORM_OPERATOR}</strong>. Notre plateforme réunit acheteurs,
              vendeurs, courtiers, investisseurs et locataires dans un environnement numérique sécurisé
              et vérifié.
            </p>
            <p lang="fr-CA">
              Nous croyons que l&apos;immobilier doit être accessible, transparent et sécuritaire pour
              tous — du premier acheteur à l&apos;investisseur expérimenté. Notre assistante IA parle
              français québécois, anglais canadien et arabe pour servir notre communauté diversifiée.
            </p>
            <p lang="en" className="text-white/60">
              {PLATFORM_NAME} ({PLATFORM_CARREFOUR_NAME}) is a comprehensive real estate ecosystem
              founded by {PLATFORM_OPERATOR}. Our platform connects buyers, sellers, brokers, investors,
              and renters in a secure, verified digital environment. We believe real estate should be
              accessible, transparent, and secure for everyone.
            </p>
            <p lang="ar" dir="rtl" className="text-white/60">
              {PLATFORM_NAME} ({PLATFORM_CARREFOUR_NAME}) هي منظومة عقارية شاملة أسسها {PLATFORM_OPERATOR}.
              تربط منصتنا بين المشترين والبائعين والوسطاء والمستثمرين والمستأجرين في بيئة رقمية آمنة وموثوقة.
              نؤمن بأن العقارات يجب أن تكون متاحة وشفافة وآمنة للجميع.
            </p>
          </div>
        </div>
      </section>

      {/* Platform features */}
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <h2 className="mb-12 text-center text-2xl font-bold sm:text-3xl">
            <span className="text-[#D4AF37]">Notre plateforme</span>
            <span className="ml-3 text-white/50 text-lg font-normal">Our Platform</span>
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div
                key={f.titleEn}
                className="group rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-[#D4AF37]/30 hover:bg-[#D4AF37]/5"
              >
                <p className="mb-3 text-3xl">{f.icon}</p>
                <h3 className="text-sm font-bold text-[#D4AF37]">{f.title}</h3>
                <p className="mt-0.5 text-xs text-white/40">{f.titleEn}</p>
                <p className="mt-3 text-sm leading-relaxed text-white/70" lang="fr-CA">{f.desc}</p>
                <p className="mt-1 text-xs text-white/40" lang="en">{f.descEn}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[#D4AF37]/10 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <h2 className="text-2xl font-bold sm:text-3xl" lang="fr-CA">
            Prêt à découvrir LECIPM ?
          </h2>
          <p className="mt-2 text-base text-white/50" lang="en">
            Ready to discover LECIPM?
          </p>
          <p className="mt-4 text-base text-white/70" lang="fr-CA">
            Explorez nos propriétés, réservez un séjour BNHub ou parlez avec notre assistante IA — elle est prête à vous aider en français, anglais ou arabe.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/"
              className="rounded-full bg-[#D4AF37] px-8 py-3.5 text-base font-semibold text-black shadow-[0_8px_30px_rgba(212,175,55,0.35)] transition hover:scale-[1.02]"
            >
              Commencer
            </Link>
            <Link
              href="/about-platform"
              className="rounded-full border-2 border-[#D4AF37]/50 px-8 py-3.5 text-base font-semibold text-[#D4AF37] transition hover:bg-[#D4AF37]/10"
            >
              En savoir plus
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
