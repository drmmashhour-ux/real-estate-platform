"use client";

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  Calendar, 
  Users, 
  Filter, 
  LayoutGrid, 
  List, 
  ArrowUpRight,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { RecommendationSection } from '../../../components/bnhub/RecommendationSection';
import { getRecommendedListings, Listing, RecommendationResult } from '../../../../modules/bnhub/recommendationEngine';

// Mock Data
const MOCK_LISTINGS: Listing[] = [
  { id: "1", name: "Modern Loft in Old Montreal", price: 185, rating: 4.95, location: "Old Montreal", amenities: ["Wifi", "Kitchen", "Workspace"], features: ["Modern", "Loft"] },
  { id: "2", name: "Luxury Plateau Penthouse", price: 250, rating: 4.88, location: "Plateau", amenities: ["Wifi", "Pool", "Gym"], features: ["Luxury", "View"] },
  { id: "3", name: "Cozy Studio near McGill", price: 120, rating: 4.75, location: "Downtown", amenities: ["Wifi", "Kitchen"], features: ["Studio", "Student"] },
  { id: "4", name: "Zen Garden Oasis", price: 160, rating: 4.92, location: "Plateau", amenities: ["Wifi", "Garden", "Kitchen"], features: ["Zen", "Garden"] },
  { id: "5", name: "Industrial Style Condo", price: 195, rating: 4.82, location: "St-Henri", amenities: ["Wifi", "Workspace", "Kitchen"], features: ["Industrial"] },
  { id: "6", name: "Waterfront Luxury Villa", price: 450, rating: 4.98, location: "Lachine", amenities: ["Wifi", "Pool", "Waterfront"], features: ["Luxury", "Villa"] },
];

export default function ListingResultsPage() {
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [searchTerm, setSearchTerm] = useState("Montreal");

  useEffect(() => {
    // Generate recommendations based on mock preferences
    const prefs = {
      city: "Montreal",
      maxPrice: 300,
      essentialAmenities: ["Wifi", "Kitchen"],
      historyTags: ["Modern", "Luxury"]
    };
    const recs = getRecommendedListings(MOCK_LISTINGS, prefs);
    setRecommendations(recs);
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 font-sans selection:bg-[#D4AF37]/30">
      <div className="max-w-[1400px] mx-auto space-y-12">
        
        {/* Search Bar Header */}
        <header className="flex flex-col gap-8">
           <div className="flex flex-col md:flex-row items-center gap-4 bg-zinc-900/60 p-4 rounded-[2.5rem] border border-white/5 shadow-2xl backdrop-blur-xl">
              <div className="flex-1 flex items-center gap-3 px-6 border-r border-white/5">
                 <MapPin className="w-5 h-5 text-[#D4AF37]" />
                 <input 
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="bg-transparent border-none outline-none text-sm font-bold w-full placeholder:text-gray-600"
                   placeholder="Where are you going?"
                 />
              </div>
              <div className="flex-1 flex items-center gap-3 px-6 border-r border-white/5">
                 <Calendar className="w-5 h-5 text-gray-500" />
                 <span className="text-sm font-bold text-gray-300">Add Dates</span>
              </div>
              <div className="flex-1 flex items-center gap-3 px-6">
                 <Users className="w-5 h-5 text-gray-500" />
                 <span className="text-sm font-bold text-gray-300">2 Guests</span>
              </div>
              <Button className="bg-[#D4AF37] text-black h-12 w-12 rounded-full p-0 flex items-center justify-center shadow-lg">
                 <Search className="w-5 h-5" />
              </Button>
           </div>
        </header>

        {/* Recommendations Section */}
        <RecommendationSection recommendations={recommendations} />

        {/* Filters & Sort */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-t border-white/5 pt-12">
           <div className="flex items-center gap-3">
              <h2 className="text-3xl font-black tracking-tight">Search Results</h2>
              <Badge className="bg-white/5 text-gray-500 font-bold px-3 py-1 rounded-full border border-white/10">
                 {MOCK_LISTINGS.length} results
              </Badge>
           </div>
           <div className="flex items-center gap-4">
              <Button variant="outline" className="h-11 rounded-xl border-white/10 text-xs font-black tracking-widest px-6 hover:bg-white/5">
                 <Filter className="w-4 h-4 mr-2" />
                 FILTERS
              </Button>
              <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                 <Button variant="ghost" size="sm" className="h-9 w-9 p-0 bg-[#D4AF37] text-black">
                    <LayoutGrid className="w-4 h-4" />
                 </Button>
                 <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-gray-500">
                    <List className="w-4 h-4" />
                 </Button>
              </div>
           </div>
        </div>

        {/* All Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
           {MOCK_LISTINGS.map((listing) => (
             <Card key={listing.id} className="bg-transparent border-none group cursor-pointer">
                <div className="h-72 bg-zinc-900 rounded-[2.5rem] mb-4 relative overflow-hidden transition-transform duration-500 group-hover:scale-[1.02]">
                   <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                   <div className="absolute bottom-6 left-6">
                      <p className="text-2xl font-black text-white">${listing.price}<span className="text-sm text-gray-400 font-medium"> / night</span></p>
                   </div>
                   <div className="absolute top-6 right-6">
                      <div className="bg-black/40 backdrop-blur-md rounded-full px-3 py-1 flex items-center gap-1 border border-white/10">
                         <Star className="w-3 h-3 text-[#D4AF37] fill-current" />
                         <span className="text-xs font-black text-white">{listing.rating}</span>
                      </div>
                   </div>
                </div>
                <div className="px-2 space-y-1">
                   <h3 className="text-xl font-black text-white group-hover:text-[#D4AF37] transition-colors">{listing.name}</h3>
                   <p className="text-sm text-gray-500 font-medium">{listing.location}</p>
                </div>
             </Card>
           ))}
        </div>

      </div>
    </div>
  );
}
