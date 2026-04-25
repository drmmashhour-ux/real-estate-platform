import { Metadata } from "next";
import { ShieldCheck, Scale, FileText, UserCheck, Lock, Globe } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Conformité & Confiance | LECIPM",
  description: "Comment LECIPM assure la clarté et la transparence de vos transactions immobilières au Québec.",
};

export default function TrustPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-16 lg:pt-32 lg:pb-24">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/5 text-[#D4AF37] text-xs font-black uppercase tracking-widest mb-8">
            <ShieldCheck className="w-4 h-4" />
            Quebec Trust Hub Layer
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter italic mb-6">
            Un parcours de rédaction <br />
            <span className="text-[#D4AF37]">plus clair, plus transparent</span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 max-w-3xl mx-auto leading-relaxed">
            LECIPM aide les utilisateurs à comprendre les clauses, vérifier les risques, suivre les avis importants et préparer des documents plus clairs avant signature.
          </p>
        </div>
      </section>

      {/* Core Principles */}
      <section className="py-24 border-t border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl border border-white/5 bg-white/5 backdrop-blur-xl">
              <Scale className="w-10 h-10 text-[#D4AF37] mb-6" />
              <h3 className="text-xl font-bold mb-4 uppercase italic">Conformité au Québec</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Notre moteur de rédaction est aligné sur les formulaires types du Québec et intègre les meilleures pratiques de rédaction immobilière.
              </p>
            </div>
            <div className="p-8 rounded-3xl border border-white/5 bg-white/5 backdrop-blur-xl">
              <FileText className="w-10 h-10 text-[#D4AF37] mb-6" />
              <h3 className="text-xl font-bold mb-4 uppercase italic">Transparence Totale</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Chaque clause est expliquée en langage clair. Nous identifions les risques et suggérons des alternatives plus sécuritaires.
              </p>
            </div>
            <div className="p-8 rounded-3xl border border-white/5 bg-white/5 backdrop-blur-xl">
              <UserCheck className="w-10 h-10 text-[#D4AF37] mb-6" />
              <h3 className="text-xl font-bold mb-4 uppercase italic">Accès aux Experts</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Vous n'êtes jamais seul. À tout moment, demandez la révision de votre projet par un courtier immobilier partenaire.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Law 25 & Data */}
      <section className="py-24 bg-white/5 border-y border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter">
                  Protection des données <br />
                  <span className="text-blue-500">& Loi 25</span>
                </h2>
                <p className="text-zinc-400">
                  LECIPM prend la confidentialité au sérieux. Nous sommes en pleine conformité avec la Loi 25 sur la protection des renseignements personnels au Québec.
                </p>
              </div>
              <ul className="space-y-4">
                {[
                  "Consentement explicite pour chaque usage de données",
                  "Anonymisation des données de marché",
                  "Chiffrement de bout en bout des documents",
                  "Droit à l'oubli et portabilité des données"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-medium">
                    <Lock className="w-4 h-4 text-blue-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="aspect-square rounded-3xl bg-zinc-900 border border-white/5 flex flex-col items-center justify-center p-8 text-center gap-4">
                <Globe className="w-8 h-8 text-[#D4AF37]" />
                <div className="text-2xl font-black">100%</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Hébergé au Canada</div>
              </div>
              <div className="aspect-square rounded-3xl bg-zinc-900 border border-white/5 flex flex-col items-center justify-center p-8 text-center gap-4">
                <ShieldCheck className="w-8 h-8 text-emerald-500" />
                <div className="text-2xl font-black">Vérifié</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Conformité OACIQ-Style</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer Section */}
      <section className="py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="p-12 rounded-[40px] border border-white/10 bg-black text-center space-y-8">
            <h2 className="text-2xl font-black uppercase italic">Note Importante</h2>
            <div className="space-y-4 text-zinc-500 text-sm leading-relaxed text-justify md:text-center">
              <p>
                LECIPM est une plateforme technologique d&apos;aide à la rédaction et à la gestion de transactions immobilières. Nous ne sommes pas l&apos;OACIQ, nous ne sommes pas un cabinet d&apos;avocats et nous ne fournissons pas d&apos;avis juridiques.
              </p>
              <p>
                Le système "Quebec Trust Hub" est conçu pour guider les utilisateurs vers des choix de rédaction plus clairs et pour faciliter la collaboration avec des courtiers immobiliers autorisés au Québec. 
              </p>
              <p>
                L&apos;utilisation de LECIPM ne garantit pas la validité légale finale d&apos;un contrat, laquelle dépend de la situation spécifique et devrait être validée par un professionnel (courtier, avocat ou notaire) au besoin.
              </p>
            </div>
            <div className="pt-8 flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/drafts/turbo" className="px-8 py-4 rounded-2xl bg-[#D4AF37] text-black font-black uppercase tracking-widest text-xs hover:brightness-110 transition">
                Commencer une rédaction
              </Link>
              <Link href="https://www.oaciq.com" target="_blank" className="px-8 py-4 rounded-2xl border border-white/10 text-white font-black uppercase tracking-widest text-xs hover:bg-white/5 transition">
                Visiter l&apos;OACIQ
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer minimal */}
      <footer className="py-12 border-t border-white/5 text-center">
        <p className="text-xs text-zinc-600 font-medium">
          &copy; 2026 LECIPM Québec. Tous droits réservés.
        </p>
      </footer>
    </div>
  );
}
