import Link from "next/link";
import { cn } from "@/lib/utils";

/** Marca MedFácil: cruz farmacêutica com braço em forma de cápsula. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn("size-10", className)} aria-hidden>
      <defs>
        <linearGradient id="mf-logo-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--primary)" />
          <stop offset="1" stopColor="var(--secondary)" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="14" fill="url(#mf-logo-grad)" />
      <rect x="19" y="9" width="10" height="30" rx="3" fill="white" />
      <rect x="9" y="19" width="30" height="10" rx="5" fill="white" />
      <rect x="24" y="19" width="15" height="10" rx="5" fill="white" opacity="0.55" />
      <circle cx="34" cy="14" r="3" fill="white" opacity="0.9" />
    </svg>
  );
}

interface LogoProps {
  storeName?: string;
  logoUrl?: string | null;
  className?: string;
  light?: boolean;
  href?: string;
}

export function Logo({ storeName = "MedFácil", logoUrl, className, light, href = "/" }: LogoProps) {
  // Divide "MedFácil" em "Med" + "Fácil" para o efeito bicolor.
  const match = /^(\p{Lu}\p{Ll}+)(\p{Lu}.*)$/u.exec(storeName);
  return (
    <Link href={href} className={cn("flex items-center gap-2.5", className)} aria-label={`${storeName} — página inicial`}>
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt="" className="h-10 w-auto max-w-[120px] object-contain" referrerPolicy="no-referrer" />
      ) : (
        <LogoMark />
      )}
      <span className={cn("text-xl font-extrabold tracking-tight", light ? "text-white" : "text-slate-900")}>
        {match ? (
          <>
            {match[1]}
            <span className={light ? "text-primary-100" : "text-primary"}>{match[2]}</span>
          </>
        ) : (
          storeName
        )}
      </span>
    </Link>
  );
}
