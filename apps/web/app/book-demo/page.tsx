"use client";

import React, { useState } from "react";
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  Shield, 
  Zap, 
  ArrowRight,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card } from "../../components/ui/Card";

export default function BookDemoPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    experience: "1-3"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/book-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setSubmitted(true);
      }
    } catch (err) {
      console.error("Booking failed", err);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 text-center space-y-6 border-[#D4AF37]/30 bg-black/40 backdrop-blur-xl">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-3xl font-black">C'est confirmé !</h1>
          <p className="text-gray-400">
            Merci {formData.name}. Nous avons bien reçu votre demande de démo. 
            Un membre de notre équipe vous contactera dans les prochaines 24 heures pour confirmer l'heure exacte.
          </p>
          <div className="pt-4">
            <Button 
              className="w-full bg-[#D4AF37] text-black font-bold h-12 rounded-xl"
              onClick={() => window.location.href = "/"}
            >
              Retour à l'accueil
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="max-w-6xl mx-auto px-6 py-12 md:py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        {/* Left Side: Value Prop */}
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-full text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest">
            Onboarding Courtiers
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
            Réserver une démo <br />
            <span className="text-[#D4AF37]">(10 minutes)</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl leading-relaxed">
            Découvrez comment réduire le temps passé sur les formulaires, 
            éliminer les erreurs de rédaction et sécuriser vos transactions avec l'IA.
          </p>

          <div className="space-y-4 pt-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <div>
                <h3 className="font-bold">Session ultra-rapide</h3>
                <p className="text-sm text-gray-500">10 minutes chrono. On respecte votre temps.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold">Démonstration concrète</h3>
                <p className="text-sm text-gray-500">Pas de slides. On vous montre l'outil en direct sur un vrai cas.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <h3 className="font-bold">Zéro engagement</h3>
                <p className="text-sm text-gray-500">Voyez si ça fit avec votre pratique, tout simplement.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div>
          <Card className="p-8 bg-black/40 border-white/10 backdrop-blur-2xl shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Nom Complet</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                  <Input 
                    required
                    placeholder="Jean Tremblay"
                    className="pl-10 h-12 bg-white/5 border-white/10 focus:border-[#D4AF37]/50"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Email Pro</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                    <Input 
                      required
                      type="email"
                      placeholder="jean@agence.ca"
                      className="pl-10 h-12 bg-white/5 border-white/10 focus:border-[#D4AF37]/50"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Téléphone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                    <Input 
                      required
                      placeholder="514-000-0000"
                      className="pl-10 h-12 bg-white/5 border-white/10 focus:border-[#D4AF37]/50"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Ville</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                    <Input 
                      required
                      placeholder="Montréal"
                      className="pl-10 h-12 bg-white/5 border-white/10 focus:border-[#D4AF37]/50"
                      value={formData.city}
                      onChange={e => setFormData({...formData, city: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Expérience</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                    <select 
                      className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 h-12 text-sm focus:outline-none focus:ring-1 focus:ring-[#D4AF37] appearance-none"
                      value={formData.experience}
                      onChange={e => setFormData({...formData, experience: e.target.value})}
                    >
                      <option value="1-3">1-3 ans</option>
                      <option value="4-10">4-10 ans</option>
                      <option value="10+">10+ ans</option>
                    </select>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[#D4AF37] hover:bg-[#B8962E] text-black font-black h-14 rounded-2xl text-lg shadow-lg shadow-[#D4AF37]/20 mt-4"
              >
                {loading ? "Traitement..." : "Confirmer mon rendez-vous"}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              <p className="text-center text-[10px] text-gray-500 italic">
                En vous inscrivant, vous acceptez de recevoir des communications relatives à votre démo. 
                Conformité Loi 25 garantie.
              </p>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
