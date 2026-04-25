import React from 'react';
import { Star, MessageSquare, User, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface Review {
  id: string;
  propertyRating: number;
  comment: string;
  createdAt: string;
  guest: {
    name: string;
    avatar?: string;
  };
}

interface ReviewSectionProps {
  reviews: Review[];
  averageRating: number;
}

export function ReviewSection({ reviews, averageRating }: ReviewSectionProps) {
  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
            <Star className="w-6 h-6 text-[#D4AF37] fill-current" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight">{averageRating.toFixed(1)} Rating</h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Based on {reviews.length} reviews</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {reviews.length === 0 ? (
          <div className="p-12 text-center bg-white/5 border border-dashed border-white/10 rounded-[3rem] opacity-40">
            <MessageSquare className="w-12 h-12 mx-auto mb-4" />
            <p className="text-sm font-medium">No reviews yet for this listing.</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="p-8 bg-zinc-900/40 border border-white/5 rounded-[2.5rem] space-y-4 hover:border-white/10 transition-all">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                    <User className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white">{review.guest.name}</h4>
                    <p className="text-[10px] text-gray-600 font-bold uppercase flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={cn(
                        "w-3 h-3",
                        i < review.propertyRating ? "text-[#D4AF37] fill-current" : "text-gray-800"
                      )} 
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed font-medium italic">
                "{review.comment}"
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
