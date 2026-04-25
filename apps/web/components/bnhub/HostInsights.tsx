import React from 'react';
import { 
  Sparkles, 
  TrendingUp, 
  Camera, 
  Tag, 
  Calendar, 
  AlertCircle,
  ChevronRight,
  MousePointer2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface Insight {
  id: string;
  type: 'price' | 'demand' | 'optimization' | 'opportunity';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  icon: any;
}

const INSIGHTS: Insight[] = [
  {
    id: '1',
    type: 'price',
    title: 'Price optimization opportunity',
    description: 'Your price is 15% lower than similar listings in Plateau-Mont-Royal.',
    impact: 'high',
    icon: Tag
  },
  {
    id: '2',
    type: 'demand',
    title: 'High weekend demand detected',
    description: 'Demand for July 1st weekend is 40% higher than average. Consider updating prices.',
    impact: 'high',
    icon: TrendingUp
  },
  {
    id: '3',
    type: 'optimization',
    title: 'Increase visibility with more photos',
    description: 'Listings with 20+ photos receive 2x more bookings. You currently have 12.',
    impact: 'medium',
    icon: Camera
  },
  {
    id: '4',
    type: 'opportunity',
    title: 'Missing essential amenity',
    description: 'Many guests are searching for "Office Space". Adding a desk could increase bookings by 10%.',
    impact: 'medium',
    icon: AlertCircle
  }
];

export function HostInsights() {
  return (
    <Card className="bg-zinc-900/40 border-white/5 rounded-[3rem] overflow-hidden shadow-2xl h-full flex flex-col">
      <CardHeader className="p-10 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#D4AF37]/10 rounded-2xl flex items-center justify-center border border-[#D4AF37]/20">
            <Sparkles className="w-6 h-6 text-[#D4AF37]" />
          </div>
          <div>
            <CardTitle className="text-xl font-black tracking-tight">AI Insights & Optimization</CardTitle>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Personalized performance tips</p>
          </div>
        </div>
        <Badge variant="gold" className="text-[10px] uppercase tracking-widest px-3 py-1 bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20">Active Now</Badge>
      </CardHeader>
      <CardContent className="p-10 flex-1 overflow-y-auto space-y-6 scrollbar-hide">
        {INSIGHTS.map((insight) => (
          <div key={insight.id} className="p-6 bg-white/5 border border-white/5 rounded-[2rem] group hover:bg-white/[0.08] transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <Badge className={
                insight.impact === 'high' ? "bg-red-500/10 text-red-500" : 
                insight.impact === 'medium' ? "bg-yellow-500/10 text-yellow-500" : 
                "bg-blue-500/10 text-blue-500"
              }>
                {insight.impact.toUpperCase()} IMPACT
              </Badge>
            </div>
            <div className="flex gap-6 items-start">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 shrink-0 group-hover:scale-110 transition-transform">
                <insight.icon className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <div className="space-y-2 pr-12">
                <h4 className="font-black text-sm text-white group-hover:text-[#D4AF37] transition-colors">{insight.title}</h4>
                <p className="text-xs text-gray-500 font-medium leading-relaxed italic">"{insight.description}"</p>
                <div className="pt-4">
                  <Button variant="ghost" size="sm" className="h-8 px-4 rounded-xl text-[10px] font-black tracking-widest bg-white/5 hover:bg-[#D4AF37] hover:text-black transition-all">
                    APPLY NOW
                    <ChevronRight className="w-3 h-3 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
      <div className="p-8 border-t border-white/5 bg-black/40 backdrop-blur-xl">
        <Button className="w-full h-14 bg-white/5 border border-white/10 hover:bg-[#D4AF37] hover:text-black font-black text-xs tracking-[0.2em] rounded-2xl transition-all uppercase group">
          View Detailed Analytics
          <TrendingUp className="w-4 h-4 ml-3 group-hover:scale-110 transition-transform" />
        </Button>
      </div>
    </Card>
  );
}
