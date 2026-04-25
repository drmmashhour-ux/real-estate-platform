import React from 'react';
import { Sparkles, Star, DollarSign, MapPin, Heart } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { RecommendationResult } from '../../modules/bnhub/recommendationEngine';

interface RecommendationSectionProps {
  recommendations: RecommendationResult[];
}

export function RecommendationSection({ recommendations }: RecommendationSectionProps) {
  if (recommendations.length === 0) return null;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#D4AF37]/10 rounded-2xl flex items-center justify-center border border-[#D4AF37]/20">
            <Sparkles className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight">Recommended for you</h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Smart picks based on your preferences</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {recommendations.map((rec) => (
          <Card key={rec.listing.id} className="bg-zinc-900/40 border-white/5 hover:border-[#D4AF37]/30 transition-all duration-500 rounded-[2.5rem] overflow-hidden group shadow-2xl">
            <div className="h-48 bg-zinc-800 relative overflow-hidden">
               {/* Mock Image Placeholder */}
               <div className="absolute inset-0 flex items-center justify-center text-gray-700">
                  <MapPin className="w-12 h-12 opacity-20" />
               </div>
               <div className="absolute top-4 left-4">
                  <Badge variant="gold" className="text-[8px] font-black uppercase tracking-widest px-2 py-1">
                     {rec.tag === 'VALUE' ? 'Best Value' : 
                      rec.tag === 'RATING' ? 'Top Rated' : 
                      rec.tag === 'LOCATION' ? 'Prime Location' : 'Personal Match'}
                  </Badge>
               </div>
               <button className="absolute top-4 right-4 w-8 h-8 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:text-red-500 transition-colors">
                  <Heart className="w-4 h-4" />
               </button>
            </div>
            <CardContent className="p-6 space-y-4">
               <div className="space-y-1">
                  <div className="flex justify-between items-start">
                     <h3 className="font-black text-lg text-white group-hover:text-[#D4AF37] transition-colors line-clamp-1">{rec.listing.name}</h3>
                  </div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-1">
                     <MapPin className="w-3 h-3" />
                     {rec.listing.location}
                  </p>
               </div>

               <div className="flex items-center justify-between py-2 border-y border-white/5">
                  <div className="flex items-center gap-1">
                     <Star className="w-3 h-3 text-[#D4AF37] fill-current" />
                     <span className="text-sm font-black text-white">{rec.listing.rating}</span>
                  </div>
                  <div className="text-right">
                     <span className="text-lg font-black text-white">${rec.listing.price}</span>
                     <span className="text-[10px] text-gray-500 font-bold uppercase ml-1">/ night</span>
                  </div>
               </div>

               <div className="pt-2">
                  <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/10 p-3 rounded-xl flex items-start gap-3">
                     <Info className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                     <p className="text-[10px] text-gray-300 italic leading-snug">"{rec.reason}"</p>
                  </div>
               </div>

               <Button className="w-full h-12 bg-white/5 border border-white/10 hover:bg-[#D4AF37] hover:text-black font-black text-[10px] tracking-widest rounded-xl transition-all uppercase mt-2">
                  View Details
               </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function Info(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}
