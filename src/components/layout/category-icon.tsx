import { Baby, Cross, Droplets, Dumbbell, Pill, Sparkles, Sun, Thermometer, Package, type LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  pill: Pill,
  thermometer: Thermometer,
  sun: Sun,
  droplets: Droplets,
  sparkles: Sparkles,
  dumbbell: Dumbbell,
  cross: Cross,
  baby: Baby,
};

export const CATEGORY_ICON_OPTIONS = Object.keys(ICONS);

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? Package;
  return <Icon className={className} aria-hidden />;
}
