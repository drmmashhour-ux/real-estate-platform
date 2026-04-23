"use client";

import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  BarChart3,
  Bot,
  Brain,
  Building2,
  Calendar,
  Coins,
  FileText,
  Globe2,
  Heart,
  Home,
  Inbox,
  Layers,
  LineChart,
  MapPin,
  MessageSquare,
  Phone,
  Sparkles,
  Users,
  Settings,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  home: Home,
  inbox: Inbox,
  calendar: Calendar,
  building: Building2,
  message: MessageSquare,
  phone: Phone,
  chart: BarChart3,
  lineChart: LineChart,
  settings: Settings,
  sparkles: Sparkles,
  users: Users,
  layers: Layers,
  brain: Brain,
  globe: Globe2,
  heart: Heart,
  map: MapPin,
  coins: Coins,
  bot: Bot,
  alert: AlertTriangle,
  file: FileText,
};

export function LecipmNavIcon({ name, className }: { name: string; className?: string }) {
  const Icon = MAP[name] ?? Home;
  return <Icon className={className} aria-hidden />;
}
