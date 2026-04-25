"use client";

import React from 'react';
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  DollarSign, 
  Plus, 
  Layout, 
  Settings, 
  ArrowUpRight,
  Eye,
  MousePointer2,
  CheckCircle2,
  AlertCircle,
  Zap,
  Star,
  Camera,
  Edit3,
  Search,
  ChevronRight
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { HostStatsCard } from '../../../components/bnhub/HostStatsCard';
import { HostInsights } from '../../../components/bnhub/HostInsights';
import { SmartPricingCard } from '../../../components/bnhub/SmartPricingCard';

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

export default function HostDashboardPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 font-sans selection:bg-[#D4AF37]/30">
      <div className="max-w-[1600px] mx-auto space-y-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
               <Badge variant="gold" className="text-[10px] uppercase tracking-[0.2em] px-3 py-1 bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20 font-black">HOST COMMAND CENTER</Badge>
               <div className="w-1 h-1 rounded-full bg-white/20" />
               <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Performance & Growth</span>
            </div>
            <h1 className="text-6xl font-black tracking-tighter leading-none">
              Welcome back, <span className="text-[#D4AF37] italic">Host.</span>
            </h1>
            <p className="text-gray-400 max-w-2xl text-xl font-medium leading-relaxed">
              Your listings are performing 12% better than last month. Here's how to increase your revenue even further.
            </p>
          </div>
          <div className="flex gap-4">
             <Button className="bg-[#D4AF37] text-black h-16 px-10 rounded-[1.5rem] font-black text-sm tracking-widest shadow-[0_0_30px_rgba(212,175,55,0.2)] hover:scale-105 transition-transform uppercase">
                <Plus className="w-5 h-5 mr-3" />
                Add New Listing
             </Button>
          </div>
        </div>

        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
           <HostStatsCard 
             title="Total Earnings" 
             value="$12,450.00" 
             icon={DollarSign} 
             trend={{ value: 12, isUp: true }}
             description="Net revenue this month"
           />
           <HostStatsCard 
             title="Bookings" 
             value="24" 
             icon={Calendar} 
             trend={{ value: 8, isUp: true }}
             description="Confirmed stays"
           />
           <HostStatsCard 
             title="Occupancy Rate" 
             value="84%" 
             icon={TrendingUp} 
             trend={{ value: 4, isUp: true }}
             description="Above market average (72%)"
             color="#3b82f6"
           />
           <HostStatsCard 
             title="Avg. Rating" 
             value="4.92" 
             icon={Star} 
             description="Based on 112 reviews"
             color="#22c55e"
           />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Main Content: Listing Performance */}
          <div className="lg:col-span-8 space-y-10">
             
             {/* Listing Performance Table */}
             <section className="space-y-6">
                <div className="flex items-center justify-between">
                   <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] flex items-center gap-2">
                      <Layout className="w-3 h-3" />
                      Active Listings Performance
                   </h3>
                   <Button variant="ghost" size="sm" className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest hover:bg-[#D4AF37]/10">
                      View All Listings
                   </Button>
                </div>
                <div className="space-y-4">
                   {[
                     { name: "Modern Loft in Old Montreal", views: 1240, bookings: 12, conv: "0.96%", status: "Active" },
                     { name: "Luxury Plateau Penthouse", views: 890, bookings: 8, conv: "0.89%", status: "Active" },
                     { name: "Cozy Studio near McGill", views: 650, bookings: 4, conv: "0.61%", status: "Action Needed" }
                   ].map((listing, i) => (
                     <Card key={i} className="bg-zinc-900/40 border-white/5 hover:border-white/10 transition-all rounded-[2rem] overflow-hidden group">
                        <CardContent className="p-8 flex items-center justify-between">
                           <div className="flex items-center gap-6">
                              <div className="w-16 h-16 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden">
                                 <Layout className="w-8 h-8 text-gray-700" />
                              </div>
                              <div>
                                 <h4 className="text-lg font-black group-hover:text-[#D4AF37] transition-colors">{listing.name}</h4>
                                 <div className="flex items-center gap-3 mt-1">
                                    <Badge className={listing.status === "Active" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}>
                                       {listing.status}
                                    </Badge>
                                    <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Plateau, Montreal</span>
                                 </div>
                              </div>
                           </div>
                           <div className="flex items-center gap-12">
                              <div className="text-center">
                                 <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Views</p>
                                 <p className="text-xl font-black">{listing.views}</p>
                              </div>
                              <div className="text-center">
                                 <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Bookings</p>
                                 <p className="text-xl font-black">{listing.bookings}</p>
                              </div>
                              <div className="text-center">
                                 <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Conv.</p>
                                 <p className="text-xl font-black text-[#D4AF37]">{listing.conv}</p>
                              </div>
                              <Button variant="outline" size="sm" className="h-10 w-10 p-0 border-white/10 rounded-xl hover:bg-white/5">
                                 <ChevronRight className="w-4 h-4" />
                              </Button>
                           </div>
                        </CardContent>
                     </Card>
                   ))}
                </div>
             </section>

             {/* Listing Optimization & Quick Actions */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section className="space-y-6">
                   <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] flex items-center gap-2">
                      <Zap className="w-3 h-3" />
                      Quick Actions
                   </h3>
                   <div className="grid grid-cols-2 gap-4">
                      <Button className="h-24 bg-white/5 border border-white/5 hover:border-[#D4AF37]/30 hover:bg-[#D4AF37]/5 rounded-[2rem] flex flex-col gap-2 group transition-all">
                         <DollarSign className="w-6 h-6 text-[#D4AF37] group-hover:scale-110 transition-transform" />
                         <span className="text-[10px] font-black uppercase tracking-widest">Adjust Pricing</span>
                      </Button>
                      <Button className="h-24 bg-white/5 border border-white/5 hover:border-blue-500/30 hover:bg-blue-500/5 rounded-[2rem] flex flex-col gap-2 group transition-all">
                         <Edit3 className="w-6 h-6 text-blue-400 group-hover:scale-110 transition-transform" />
                         <span className="text-[10px] font-black uppercase tracking-widest">Edit Details</span>
                      </Button>
                      <Button className="h-24 bg-white/5 border border-white/5 hover:border-green-500/30 hover:bg-green-500/5 rounded-[2rem] flex flex-col gap-2 group transition-all">
                         <Camera className="w-6 h-6 text-green-400 group-hover:scale-110 transition-transform" />
                         <span className="text-[10px] font-black uppercase tracking-widest">Add Photos</span>
                      </Button>
                      <Button className="h-24 bg-white/5 border border-white/5 hover:border-purple-500/30 hover:bg-purple-500/5 rounded-[2rem] flex flex-col gap-2 group transition-all">
                         <Calendar className="w-6 h-6 text-purple-400 group-hover:scale-110 transition-transform" />
                         <span className="text-[10px] font-black uppercase tracking-widest">Calendar</span>
                      </Button>
                   </div>
                </section>

                <section className="space-y-6">
                   <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] flex items-center gap-2">
                      <AlertCircle className="w-3 h-3" />
                      Dynamic Optimization
                   </h3>
                   <div className="space-y-4">
                      <SmartPricingCard 
                        listing={{
                          id: "listing-1",
                          basePrice: 165,
                          occupancyRate: 0.85,
                          location: "Montreal",
                          similarListingsAvgPrice: 180
                        }} 
                      />
                      <div className="p-8 bg-black/40 border border-white/5 rounded-[2.5rem] space-y-4 relative overflow-hidden group">
                         <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-[40px] group-hover:bg-blue-500/10 transition-all" />
                         <div className="space-y-2 relative z-10">
                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Guest Experience</p>
                            <p className="text-xs font-bold text-white italic">"3 guests waiting for responses. Reply within 10 mins to maintain your Superhost trend."</p>
                            <Button className="w-full h-10 bg-white/5 border border-white/10 text-white font-black text-[10px] tracking-widest rounded-xl uppercase hover:bg-white/10 transition-all mt-4">
                               View Messages
                            </Button>
                         </div>
                      </div>
                   </div>
                </section>
             </div>
          </div>

          {/* Right Column: Insights & Recommendations */}
          <div className="lg:col-span-4 h-full">
             <HostInsights />
          </div>

        </div>

      </div>
    </div>
  );
}
