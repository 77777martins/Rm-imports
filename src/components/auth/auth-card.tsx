import { ShieldCheck } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";

export function AuthCard({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="container-page flex justify-center py-10 md:py-16">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card sm:p-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <LogoMark className="mb-4 size-12" />
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{title}</h1>
            {subtitle && <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>}
          </div>
          {children}
        </div>
        {footer && <div className="mt-5 text-center text-sm text-slate-600">{footer}</div>}
        <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-slate-400">
          <ShieldCheck className="size-3.5" /> Senhas protegidas com bcrypt · sessão em cookie httpOnly
        </p>
      </div>
    </div>
  );
}
