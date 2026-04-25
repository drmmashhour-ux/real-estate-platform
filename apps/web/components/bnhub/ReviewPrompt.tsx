import React, { useState } from 'react';
import { Star, MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';

interface ReviewPromptProps {
  listingId: string;
  bookingId: string;
}

export function ReviewPrompt({ listingId, bookingId }: ReviewPromptProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (rating === 0) return;
    // Mock API call
    console.log(`Submitting review for booking ${bookingId}: ${rating} stars, "${comment}"`);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <Card className="p-8 bg-green-500/10 border-green-500/30 rounded-[2.5rem] text-center space-y-4 animate-in zoom-in duration-500">
        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
        <div>
          <h3 className="text-xl font-black text-white">Review Submitted!</h3>
          <p className="text-sm text-gray-400">Thank you for helping the BNHub community stay safe and informed.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-10 bg-zinc-900 border-[#D4AF37]/20 border rounded-[3rem] space-y-8 shadow-2xl">
      <div className="space-y-2 text-center">
        <h3 className="text-2xl font-black tracking-tight">How was your stay?</h3>
        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Your feedback increases platform trust</p>
      </div>

      <div className="flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button 
            key={star} 
            onClick={() => setRating(star)}
            className="group transition-transform active:scale-90"
          >
            <Star 
              className={cn(
                "w-10 h-10 transition-colors",
                rating >= star ? "text-[#D4AF37] fill-current" : "text-gray-800 group-hover:text-[#D4AF37]/50"
              )} 
            />
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <textarea 
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience (cleanliness, accuracy, communication)..."
          className="w-full h-32 bg-black/40 border border-white/10 rounded-2xl p-4 text-sm focus:ring-1 focus:ring-[#D4AF37] outline-none transition shadow-inner"
        />
        <Button 
          onClick={handleSubmit}
          disabled={rating === 0}
          className="w-full h-14 bg-[#D4AF37] text-black font-black text-sm tracking-widest uppercase rounded-2xl shadow-lg disabled:opacity-50"
        >
          Submit Review
          <Send className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </Card>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
