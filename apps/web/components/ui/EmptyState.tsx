import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  ctaText?: string;
  ctaHref?: string;
  onCtaClick?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  ctaText,
  ctaHref,
  onCtaClick,
}: EmptyStateProps) {
  return (
    <Card className="flex flex-col items-center justify-center p-12 text-center bg-zinc-950 border-zinc-800 border-dashed">
      <div className="p-4 rounded-full bg-zinc-900 mb-6">
        <Icon className="w-10 h-10 text-zinc-700" />
      </div>
      <h3 className="text-xl font-bold text-white uppercase tracking-tight mb-2 italic">
        {title}
      </h3>
      <p className="text-zinc-500 text-sm max-w-xs mb-8 font-medium">
        {description}
      </p>
      {ctaText && (
        ctaHref ? (
          <Link href={ctaHref}>
            <Button className="bg-premium-gold hover:bg-premium-gold/90 text-black font-black uppercase text-xs tracking-widest px-8">
              {ctaText}
            </Button>
          </Link>
        ) : (
          <Button 
            onClick={onCtaClick}
            className="bg-premium-gold hover:bg-premium-gold/90 text-black font-black uppercase text-xs tracking-widest px-8"
          >
            {ctaText}
          </Button>
        )
      )}
    </Card>
  );
}
