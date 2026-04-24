"use client";

import { useMemo } from "react";
import { 
  Database, 
  Share2, 
  Cpu, 
  TrendingUp, 
  ShieldCheck, 
  Zap, 
  Users, 
  Lock,
  LineChart,
  Network,
  BrainCircuit,
  BarChart3
} from "lucide-react";

export function DefensibilityDashboardClient() {
  const dataGrowth = useMemo(() => [
    { label: "Legal Clauses Processed", value: "84,290", growth: "+12%" },
    { label: "OACIQ Rules Mapped", value: "3,150", growth: "+5%" },
    { label: "Listing Data Points", value: "1.2M", growth: "+24%" },
    { label: "User Feedback Loops", value: "12,400", growth: "+18%" },
  ], []);

  const networkMetrics = useMemo(() => [
    { label: "Verified Brokers", value: "1,420", trend: "Strong" },
    { label: "Buyer-Broker Connections", value: "8,900", trend: "Increasing" },
    { label: "Shared Intelligence Logs", value: "450k", trend: "Critical" },
    { label: "Platform Trust Score", value: "98.4%", trend: "Stable" },
  ], []);

  const aiMetrics = useMemo(() => [
    { label: "Prefill Accuracy", value: "94.2%", improve: "+2.1%" },
    { label: "Risk Detection Speed", value: "0.4s", improve: "-0.2s" },
    { label: "Draft Alignment Score", value: "97.8%", improve: "+0.5%" },
    { label: "Auto-Correction Rate", value: "68%", improve: "+12%" },
  ], []);

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-8 text-zinc-100">
      <header className="space-y-4 border-b border-premium-gold/20 pb-8">
        <div className="flex items-center gap-3 text-premium-gold">
          <ShieldCheck className="h-6 w-6" />
          <p className="text-xs font-black uppercase tracking-[0.3em] italic">Stratégie & Défendabilité</p>
        </div>
        <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">LECIPM Defensive Moat</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-zinc-500">
          Visualisation de l'avantage concurrentiel de LECIPM. Plus nous traitons de données, plus notre réseau se densifie et plus notre IA s'affine, rendant la plateforme impossible à répliquer.
        </p>
      </header>

      {/* SECTION: DATA GROWTH */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-premium-gold/10 text-premium-gold shadow-lg shadow-premium-gold/5">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase italic tracking-tight text-white">Data Growth</h2>
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">L'accumulation d'actifs informationnels</p>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {dataGrowth.map((item) => (
            <div key={item.label} className="group relative overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/40 p-6 transition-all hover:border-premium-gold/20">
              <div className="absolute right-0 top-0 h-20 w-20 translate-x-1/2 -translate-y-1/2 bg-premium-gold/5 blur-3xl transition-opacity group-hover:opacity-100" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{item.label}</p>
              <div className="mt-2 flex items-baseline justify-between">
                <p className="text-2xl font-black text-white">{item.value}</p>
                <p className="text-xs font-bold text-emerald-500">{item.growth}</p>
              </div>
              <div className="mt-4 h-1 w-full rounded-full bg-zinc-800 overflow-hidden">
                <div className="h-full bg-premium-gold w-[70%] group-hover:w-[75%] transition-all duration-1000" />
              </div>
            </div>
          ))}
        </div>
        
        <div className="rounded-2xl border border-white/5 bg-black/40 p-8">
          <div className="flex items-start gap-6">
            <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-800 text-zinc-400 sm:flex">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-white uppercase italic tracking-tight">Avantage de Données Réel</h4>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Chaque transaction sur LECIPM enrichit notre bibliothèque de clauses et notre compréhension des comportements du marché québécois. 
                Ce "Flywheel" de données permet d'anticiper les risques juridiques avant même qu'ils n'apparaissent dans un brouillon.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: NETWORK STRENGTH */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-premium-gold/10 text-premium-gold shadow-lg shadow-premium-gold/5">
            <Share2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase italic tracking-tight text-white">Network Strength</h2>
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Effets de réseau et écosystème</p>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {networkMetrics.map((item) => (
            <div key={item.label} className="group relative overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/40 p-6 transition-all hover:border-premium-gold/20">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{item.label}</p>
              <div className="mt-2 flex items-baseline justify-between">
                <p className="text-2xl font-black text-white">{item.value}</p>
                <div className="flex items-center gap-1 rounded-full bg-premium-gold/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-tighter text-premium-gold">
                  <Zap className="h-2 w-2" /> {item.trend}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/5 bg-zinc-900/40 p-8 space-y-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800 text-premium-gold">
              <Users className="h-5 w-5" />
            </div>
            <h4 className="text-lg font-black text-white uppercase italic tracking-tight">Densité de l'Écosystème</h4>
            <p className="text-sm text-zinc-500 leading-relaxed">
              La force de LECIPM réside dans sa capacité à connecter acheteurs non représentés et courtiers experts. 
              Plus il y a de courtiers utilisant le Trust Hub, plus la valeur pour l'acheteur augmente, créant un cycle de rétention auto-entretenu.
            </p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-zinc-900/40 p-8 space-y-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800 text-premium-gold">
              <Lock className="h-5 w-5" />
            </div>
            <h4 className="text-lg font-black text-white uppercase italic tracking-tight">Barrières à l'Entrée</h4>
            <p className="text-sm text-zinc-500 leading-relaxed">
              L'intégration profonde avec les registres fonciers, les systèmes de signature et les outils de conformité OACIQ 
              crée des coûts de changement élevés pour les utilisateurs et une barrière technologique pour les nouveaux entrants.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION: AI IMPROVEMENT */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-premium-gold/10 text-premium-gold shadow-lg shadow-premium-gold/5">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase italic tracking-tight text-white">AI Improvement</h2>
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Apprentissage continu et optimisation</p>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {aiMetrics.map((item) => (
            <div key={item.label} className="group relative overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/40 p-6 transition-all hover:border-premium-gold/20">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{item.label}</p>
              <div className="mt-2 flex items-baseline justify-between">
                <p className="text-2xl font-black text-white">{item.value}</p>
                <p className="text-xs font-bold text-emerald-500">{item.improve}</p>
              </div>
              <div className="mt-4 flex gap-1">
                {[1,2,3,4,5,6,7,8].map(i => (
                  <div key={i} className={`h-1 flex-1 rounded-full ${i <= 6 ? 'bg-premium-gold' : 'bg-zinc-800'}`} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-premium-gold/20 bg-gradient-to-br from-black to-premium-gold/5 p-10">
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[2.5rem] bg-premium-gold shadow-2xl shadow-premium-gold/20">
              <TrendingUp className="h-10 w-10 text-black" />
            </div>
            <div className="space-y-4">
              <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">
                Le Système s'Améliore Seul
              </h3>
              <p className="text-zinc-400 leading-relaxed max-w-3xl">
                Notre architecture d'intelligence ne se contente pas de traiter des documents. Elle apprend de chaque correction faite par un courtier expert. 
                Ce cycle d'entraînement "Human-in-the-loop" garantit que LECIPM devient chaque jour plus précis, réduisant le besoin de supervision humaine 
                tout en augmentant la sécurité juridique.
              </p>
              <div className="flex gap-4">
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                  <div className="h-2 w-2 rounded-full bg-premium-gold animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">Continuous Evolution Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CHECK / SUCCESS METRICS FOOTER */}
      <footer className="mt-20 border-t border-white/5 pt-12 pb-20">
        <div className="grid gap-12 lg:grid-cols-3">
          <div className="space-y-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <Check className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-black uppercase tracking-widest text-white italic">Advantage Real</h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              L'avantage n'est pas théorique. Il est mesurable par la vitesse de rédaction et la réduction des erreurs de conformité constatée par les courtiers partenaires.
            </p>
          </div>
          <div className="space-y-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-black uppercase tracking-widest text-white italic">Self-Improving</h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Le système s'améliore à chaque interaction. Les modèles d'IA sont ré-entraînés mensuellement sur les logs de correction anonymisés.
            </p>
          </div>
          <div className="space-y-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-premium-gold/10 text-premium-gold">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-black uppercase tracking-widest text-white italic">Continuous Benefit</h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Les utilisateurs bénéficient d'une sécurité juridique accrue sans effort supplémentaire, car la plateforme intègre automatiquement les nouvelles normes.
            </p>
          </div>
        </div>
        
        <div className="mt-16 rounded-2xl bg-zinc-900/50 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <BarChart3 className="h-6 w-6 text-zinc-500" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Success Metric</p>
              <p className="text-sm font-bold text-white tracking-tight italic">Rétention Croissante & Barrière Concurrentielle</p>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-center">
              <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Retention</p>
              <p className="text-lg font-black text-emerald-500">+18%</p>
            </div>
            <div className="text-center border-l border-white/5 pl-8">
              <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Moat Strength</p>
              <p className="text-lg font-black text-premium-gold">Critical</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
