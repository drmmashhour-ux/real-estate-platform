"use client";

import React, { useState, useEffect } from "react";
import { 
  Database, 
  Share2, 
  BrainCircuit, 
  TrendingUp, 
  ShieldCheck, 
  Users, 
  Zap, 
  ArrowUpRight,
  Target,
  BarChart3
} from "lucide-react";

interface DefensibilityData {
  dataGrowth: {
    totalListings: number;
    listingGrowthPercent: number;
    uniqueDataPoints: number;
    proprietaryClauses: number;
    dataRetentionRate: number;
  };
  networkStrength: {
    activeBrokers: number;
    networkDensity: number;
    referralConversionRate: number;
    marketPenetration: number;
    churnRate: number;
  };
  aiImprovement: {
    modelAccuracy: number;
    draftingSpeedImprovement: number;
    riskDetectionHitRate: number;
    learningLoopsCompleted: number;
    autonomousResolutionRate: number;
  };
  successMetrics: {
    retention: number;
    dataAdvantageScore: number;
    competitiveMoatDepth: string;
  };
  updatedAt: string;
}

export default function DefensibilityDashboard() {
  const [data, setData] = useState<DefensibilityData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/admin/defensibility");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Failed to fetch defensibility metrics", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent"></div>
      </div>
    );
  }

  if (!data) return <div>Failed to load data</div>;

  return (
    <div className="min-h-screen bg-[#050505] p-8 text-white">
      <div className="mx-auto max-w-7xl space-y-12">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/5 text-[#D4AF37] text-[10px] font-black uppercase tracking-widest mb-4">
              <ShieldCheck className="w-3 h-3" />
              LECIPM Moat Analysis
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tighter italic italic">
              Tableau de <span className="text-[#D4AF37]">Défendabilité</span>
            </h1>
            <p className="mt-2 text-zinc-500 font-medium">
              Analyse de l'avantage concurrentiel et de la profondeur du fossé (moat).
            </p>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Profondeur du Moat</div>
            <div className="text-2xl font-black text-emerald-500 italic uppercase">
              {data.successMetrics.competitiveMoatDepth}
            </div>
          </div>
        </div>

        {/* Success Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard 
            title="Rétention Utilisateur" 
            value={`${data.successMetrics.retention}%`} 
            icon={<Target className="w-5 h-5 text-emerald-500" />}
            description="Le système s'améliore à chaque usage, augmentant la dépendance vertueuse."
          />
          <MetricCard 
            title="Data Advantage" 
            value={`${data.successMetrics.dataAdvantageScore}/100`} 
            icon={<TrendingUp className="w-5 h-5 text-blue-500" />}
            description="Score de rareté et d'exclusivité des données propriétaires."
          />
          <MetricCard 
            title="Network Strength" 
            value={`${data.networkStrength.networkDensity * 100}%`} 
            icon={<Users className="w-5 h-5 text-[#D4AF37]" />}
            description="Densité des connexions entre acheteurs, vendeurs et courtiers."
          />
        </div>

        {/* Main Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Data Growth Section */}
          <SectionContainer 
            title="Croissance des Données" 
            icon={<Database className="w-6 h-6 text-[#D4AF37]" />}
            subtitle="Avantage par accumulation"
          >
            <DetailRow label="Inscriptions totales" value={data.dataGrowth.totalListings.toLocaleString()} />
            <DetailRow label="Croissance (MoM)" value={`+${data.dataGrowth.listingGrowthPercent}%`} positive />
            <DetailRow label="Points de données uniques" value={`${(data.dataGrowth.uniqueDataPoints / 1000).toFixed(0)}k`} />
            <DetailRow label="Clauses propriétaires" value={data.dataGrowth.proprietaryClauses.toString()} />
            <DetailRow label="Taux de rétention data" value={`${data.dataGrowth.dataRetentionRate}%`} />
            <div className="mt-6 pt-6 border-t border-white/5">
              <p className="text-xs text-zinc-500 italic">
                Plus nous avons de données, plus notre IA est précise, plus nous attirons d'utilisateurs.
              </p>
            </div>
          </SectionContainer>

          {/* Network Strength Section */}
          <SectionContainer 
            title="Force du Réseau" 
            icon={<Share2 className="w-6 h-6 text-blue-500" />}
            subtitle="Effet de réseau (Flywheel)"
          >
            <DetailRow label="Courtiers actifs" value={data.networkStrength.activeBrokers.toLocaleString()} />
            <DetailRow label="Taux de conversion referral" value={`${data.networkStrength.referralConversionRate}%`} positive />
            <DetailRow label="Pénétration du marché QC" value={`${data.networkStrength.marketPenetration}%`} />
            <DetailRow label="Churn rate (Brokers)" value={`${data.networkStrength.churnRate}%`} negative />
            <div className="mt-8 space-y-4">
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${data.networkStrength.marketPenetration * 2}%` }} />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Objectif Domination: 30%</p>
            </div>
          </SectionContainer>

          {/* AI Improvement Section */}
          <SectionContainer 
            title="Amélioration IA" 
            icon={<BrainCircuit className="w-6 h-6 text-emerald-500" />}
            subtitle="Apprentissage continu"
          >
            <DetailRow label="Précision du modèle" value={`${data.aiImprovement.modelAccuracy}%`} />
            <DetailRow label="Gain de vitesse (vs Manuel)" value={`${data.aiImprovement.draftingSpeedImprovement}%`} positive />
            <DetailRow label="Taux de détection des risques" value={`${data.aiImprovement.riskDetectionHitRate}%`} />
            <DetailRow label="Boucles d'apprentissage" value={data.aiImprovement.learningLoopsCompleted.toString()} />
            <DetailRow label="Résolution autonome" value={`${data.aiImprovement.autonomousResolutionRate}%`} />
            <div className="mt-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold mb-1 uppercase">
                <Zap className="w-3 h-3" /> Auto-Optimisation
              </div>
              <p className="text-[11px] text-zinc-300">
                Le système identifie et corrige seul 34.5% des anomalies de rédaction sans intervention humaine.
              </p>
            </div>
          </SectionContainer>
        </div>

        {/* Final Check Footer */}
        <div className="rounded-[40px] border border-white/10 bg-gradient-to-br from-black to-zinc-900 p-12 text-center">
          <h2 className="text-2xl font-black uppercase italic mb-4 tracking-tighter">Évaluation Finale du Système</h2>
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <CheckItem title="Avantage Réel" description="La structure de données est impossible à répliquer sans 5 ans d'historique." />
            <CheckItem title="Amélioration Temporelle" description="Chaque transaction rend le système plus intelligent et plus sûr." />
            <CheckItem title="Bénéfice Utilisateur" description="Les utilisateurs bénéficient d'une sécurité juridique inégalée." />
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, description }: any) {
  return (
    <div className="rounded-3xl border border-white/5 bg-white/5 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="p-2 rounded-xl bg-white/5">{icon}</div>
        <ArrowUpRight className="w-4 h-4 text-zinc-700" />
      </div>
      <div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">{title}</div>
        <div className="text-3xl font-black italic">{value}</div>
      </div>
      <p className="text-xs text-zinc-600 leading-relaxed font-medium">{description}</p>
    </div>
  );
}

function SectionContainer({ title, icon, subtitle, children }: any) {
  return (
    <div className="rounded-[32px] border border-white/5 bg-black/40 p-8 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 rounded-2xl bg-white/5">{icon}</div>
        <div>
          <h3 className="text-lg font-black uppercase italic tracking-tight">{title}</h3>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{subtitle}</p>
        </div>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

function DetailRow({ label, value, positive, negative }: any) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <span className="text-sm text-zinc-400 font-medium">{label}</span>
      <span className={cn(
        "text-sm font-bold font-mono",
        positive ? "text-emerald-500" : negative ? "text-rose-500" : "text-white"
      )}>
        {value}
      </span>
    </div>
  );
}

function CheckItem({ title, description }: any) {
  return (
    <div className="space-y-3">
      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-500">
        <ShieldCheck className="w-5 h-5" />
      </div>
      <h4 className="text-sm font-bold uppercase tracking-widest text-white">{title}</h4>
      <p className="text-xs text-zinc-500 max-w-[200px] mx-auto leading-relaxed">{description}</p>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
