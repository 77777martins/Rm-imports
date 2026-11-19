import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon: React.ReactNode;
  tone?: "primary" | "secondary" | "amber" | "violet";
}

const tones = {
  primary: "bg-primary-50 text-primary",
  secondary: "bg-secondary-50 text-secondary",
  amber: "bg-amber-50 text-amber-600",
  violet: "bg-violet-50 text-violet-600",
};

export function StatCard({ label, value, hint, icon, tone = "primary" }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-1.5 whitespace-nowrap text-xl font-extrabold tracking-tight text-slate-900 tabular-nums 2xl:text-2xl">{value}</p>
        </div>
        <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl", tones[tone])}>{icon}</span>
      </div>
      {hint && <p className="mt-3 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
