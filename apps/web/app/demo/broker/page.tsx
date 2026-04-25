"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Shield, 
  Zap, 
  CheckCircle, 
  Calendar, 
  ArrowRight, 
  Check, 
  BarChart3,
  Award,
  Play
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';

export default function BrokerDemoPage() {
  const searchParams = useSearchParams();
  const refId = searchParams.get('ref');
  const [hasTracked, setHasTracked] = useState(false);

  useEffect(() => {
    if (!hasTracked) {
      fetch('/api/demo/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refId }),
      }).catch(console.error);
      setHasTracked(true);
    }
  }, [refId, hasTracked]);

  const benefits = [
    {
      title: "Réduction des erreurs",
      desc: "Validation intelligente en temps réel sur tous les formulaires OACIQ.",
      icon: <Shield className="w-5 h-5 text-[#D4AF37]" />
    },
    {
      title: "Gain de temps massif",
      desc: "Pré-remplissage automatique des données de la fiche descriptive.",
      icon: <Zap className="w-5 h-5 text-[#D4AF37]" />
    },
    {
      title: "Éducation client",
      desc: "Explications claires des clauses pour sécuriser vos clients.",
      icon: <CheckCircle className="w-5 h-5 text-[#D4AF37]" />
    }
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Navbar */}
      <nav className="border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#D4AF37] rounded-lg flex items-center justify-center font-black text-black">L</div>
            <span className="font-black text-xl tracking-tighter">LECIPM <span className="text-[#D4AF37]">DEMO</span></span>
          </div>
          <Button 
            className="bg-[#D4AF37] hover:bg-[#B8962E] text-black font-bold rounded-full px-6 h-9 text-sm"
            onClick={() => window.open('https://calendly.com/lecipm-demo', '_blank')}
          >
            Réserver ma démo
          </Button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-16 md:py-24 space-y-20">
        {/* Hero & Video */}
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <Badge variant="outline" className="border-[#D4AF37]/30 text-[#D4AF37] bg-[#D4AF37]/5 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
              Aperçu Exclusif Courtier
            </Badge>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
              Gagnez 2h par offre avec la <br/>
              <span className="text-[#D4AF37]">Rédaction Intelligente.</span>
            </h1>
            <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto">
              Découvrez comment sécuriser vos transactions et automatiser votre conformité en moins de 2 minutes.
            </p>
          </div>

          {/* Video Container (Loom Placeholder) */}
          <div className="relative aspect-video w-full max-w-4xl mx-auto rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-[#D4AF37]/10 group">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
            
            {/* Replace this div with actual Loom embed in production */}
            <div className="absolute inset-0 bg-[#111] flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-[#D4AF37] rounded-full flex items-center justify-center mx-auto shadow-xl shadow-[#D4AF37]/20 group-hover:scale-110 transition cursor-pointer">
                  <Play className="w-8 h-8 text-black fill-current ml-1" />
                </div>
                <p className="text-sm font-bold text-gray-400">Cliquez pour lancer la démo</p>
              </div>
            </div>
            
            {/* Loom iFrame would go here:
            <iframe 
              src="https://www.loom.com/embed/your-id-here" 
              frameBorder="0" 
              webkitallowfullscreen 
              mozallowfullscreen 
              allowFullScreen 
              className="absolute inset-0 w-full h-full"
            />
            */}
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {benefits.map((benefit, idx) => (
            <Card key={idx} className="p-8 bg-white/5 border-white/5 hover:border-[#D4AF37]/20 transition group">
              <div className="w-12 h-12 bg-[#D4AF37]/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
                {benefit.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{benefit.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{benefit.desc}</p>
            </Card>
          ))}
        </div>

        {/* Final CTA Section */}
        <Card className="p-12 md:p-16 bg-gradient-to-br from-[#D4AF37]/20 to-black border-[#D4AF37]/30 rounded-[3rem] text-center space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/10 blur-[100px] rounded-full" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full" />
          
          <div className="relative z-10 space-y-4">
            <h2 className="text-3xl md:text-4xl font-black">Prêt à voir le système en action ?</h2>
            <p className="text-gray-300 max-w-xl mx-auto">
              Réservez une démo de 10 minutes avec un expert pour voir comment LECIPM s'adapte à vos besoins spécifiques.
            </p>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              className="bg-[#D4AF37] hover:bg-[#B8962E] text-black font-black px-10 h-14 rounded-2xl text-lg w-full sm:w-auto shadow-xl shadow-[#D4AF37]/20"
              onClick={() => window.open('https://calendly.com/lecipm-demo', '_blank')}
            >
              <Calendar className="w-5 h-5 mr-3" />
              Book 10-min Demo
            </Button>
            <Button 
              variant="outline"
              className="border-white/20 bg-white/5 hover:bg-white/10 text-white font-bold px-10 h-14 rounded-2xl text-lg w-full sm:w-auto"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              Revoir la démo
              <ArrowRight className="w-5 h-5 ml-3" />
            </Button>
          </div>

          <div className="relative z-10 pt-8 flex items-center justify-center gap-8 grayscale opacity-50">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest">OACIQ Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest">Law 25 Protected</span>
            </div>
          </div>
        </Card>
      </main>

      {/* Simple Footer */}
      <footer className="border-t border-white/5 py-12 px-6 text-center">
        <p className="text-gray-500 text-xs tracking-widest uppercase">
          © 2026 LECIPM QUÉBEC — TOUS DROITS RÉSERVÉS
        </p>
      </footer>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
