"use client";

import React from 'react';
import { 
  Star, 
  MapPin, 
  ShieldCheck, 
  ArrowLeft, 
  Heart, 
  Share2, 
  Calendar,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { ReviewSection } from '../../../../components/bnhub/ReviewSection';
import { TransparencyPanel } from '../../../../components/bnhub/TransparencyPanel';
import { TrustBadge } from '../../../../components/bnhub/TrustBadge';
import { calculateTrustScore } from '../../../../../modules/bnhub/trustEngine';

// Mock Data for a single listing
const MOCK_LISTING = {
  id: "listing-1",
  name: "Modern Loft in Old Montreal",
  description: "Experience the heart of the city in this stunning industrial loft. High ceilings, exposed brick, and premium amenities.",
  location: "Old Montreal, QC",
  price: 185,
  createdAt: "2026-01-15T10:00:00Z",
  host: {
    name: "Alex Johnson",
    isVerified: true,
    responseRate: "100%",
    responseTime: "Under an hour",
    cancellationPolicy: "Flexible",
    listingHistory: "Host for 2 years"
  }
};

const MOCK_REVIEWS = [
  {
    id: "r1",
    propertyRating: 5,
    comment: "Absolutely amazing stay! The loft is even better than the photos. Very clean andAlex was super responsive.",
    createdAt: "2026-04-10T14:30:00Z",
    guest: { name: "Sarah M." }
  },
  {
    id: "r2",
    propertyRating: 4,
    comment: "Great location and style. A bit noisy at night but that's expected in Old Montreal.",
    createdAt: "2026-03-25T09:15:00Z",
    guest: { name: "Mark D." }
  },
  {
    id: "r3",
    propertyRating: 5,
    comment: "Perfect for my business trip. Fast wifi and comfortable bed. Will be back!",
    createdAt: "2026-03-12T18:45:00Z",
    guest: { name: "Emma L." }
  }
];

export default function ListingDetailPage() {
  const trustData = calculateTrustScore(MOCK_LISTING, MOCK_REVIEWS);
  const avgRating = MOCK_REVIEWS.reduce((acc, r) => acc + r.propertyRating, 0) / MOCK_REVIEWS.length;

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 font-sans selection:bg-[#D4AF37]/30">
      <div className="max-w-[1200px] mx-auto space-y-12">
        
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
           <Button variant="ghost" className="text-gray-500 hover:text-white group">
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Search
           </Button>
           <div className="flex gap-2">
              <Button variant="outline" className="h-10 w-10 p-0 border-white/10 rounded-xl hover:bg-white/5">
                 <Share2 className="w-4 h-4" />
              </Button>
              <Button variant="outline" className="h-10 w-10 p-0 border-white/10 rounded-xl hover:bg-white/5">
                 <Heart className="w-4 h-4" />
              </Button>
           </div>
        </div>

        {/* Header Section */}
        <div className="space-y-6">
           <div className="flex flex-wrap gap-2">
              <TrustBadge type="verified_listing" />
              <TrustBadge type="highly_rated" />
           </div>
           <div className="space-y-2">
              <h1 className="text-5xl font-black tracking-tighter">{MOCK_LISTING.name}</h1>
              <div className="flex items-center gap-4 text-gray-500 font-bold uppercase tracking-widest text-xs">
                 <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-[#D4AF37] fill-current" />
                    <span className="text-white">{avgRating.toFixed(1)}</span>
                    <span>({MOCK_REVIEWS.length} reviews)</span>
                 </div>
                 <div className="w-1 h-1 rounded-full bg-white/20" />
                 <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>{MOCK_LISTING.location}</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
           
           {/* Left Content */}
           <div className="lg:col-span-8 space-y-16">
              
              {/* Main Image Mock */}
              <div className="h-[500px] bg-zinc-900 rounded-[3rem] overflow-hidden relative group">
                 <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                 <div className="absolute inset-0 flex items-center justify-center opacity-20">
                    <Layout className="w-24 h-24" />
                 </div>
                 <div className="absolute bottom-10 left-10">
                    <Button variant="goldPrimary" className="rounded-2xl px-8 h-12 font-black text-xs tracking-widest uppercase">
                       View All Photos
                    </Button>
                 </div>
              </div>

              {/* Description */}
              <section className="space-y-4">
                 <h2 className="text-2xl font-black">About this place</h2>
                 <p className="text-gray-400 text-lg leading-relaxed font-medium">
                    {MOCK_LISTING.description}
                 </p>
              </section>

              {/* Reviews */}
              <ReviewSection reviews={MOCK_REVIEWS} averageRating={avgRating} />

           </div>

           {/* Right Sidebar: Booking & Trust */}
           <div className="lg:col-span-4 space-y-8">
              
              {/* Booking Card (Simple) */}
              <Card className="p-8 bg-zinc-900 border-[#D4AF37]/20 border rounded-[3rem] space-y-6 shadow-2xl sticky top-12">
                 <div className="flex justify-between items-end">
                    <div>
                       <span className="text-3xl font-black">${MOCK_LISTING.price}</span>
                       <span className="text-gray-500 font-bold uppercase text-xs ml-2">/ night</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">
                       <Star className="w-3 h-3 fill-current" />
                       {avgRating.toFixed(1)}
                    </div>
                 </div>

                 <div className="space-y-4">
                    <div className="grid grid-cols-2 bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                       <div className="p-4 border-r border-white/10">
                          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Check-in</p>
                          <p className="text-xs font-bold">Add date</p>
                       </div>
                       <div className="p-4">
                          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Check-out</p>
                          <p className="text-xs font-bold">Add date</p>
                       </div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                       <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Guests</p>
                       <p className="text-xs font-bold">2 Guests</p>
                    </div>
                 </div>

                 <Button className="w-full h-16 bg-[#D4AF37] text-black font-black text-lg rounded-2xl hover:scale-105 transition-transform uppercase">
                    Reserve Now
                 </Button>

                 <p className="text-[10px] text-gray-500 text-center font-bold uppercase tracking-widest">You won't be charged yet</p>
              </Card>

              {/* Trust Transparency Panel */}
              <TransparencyPanel 
                trustScore={trustData.score}
                badges={trustData.badges}
                hostStats={MOCK_LISTING.host}
                signals={trustData.signals}
              />

           </div>

        </div>

      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

function Layout(props: any) {
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
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="21" x2="9" y2="9" />
    </svg>
  );
}
