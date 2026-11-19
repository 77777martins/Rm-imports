"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Package, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLogout } from "@/components/layout/user-menu";

const links = [
  { href: "/conta", label: "Meus dados", icon: UserRound, exact: true },
  { href: "/conta/pedidos", label: "Meus pedidos", icon: Package },
];

export function AccountNav() {
  const pathname = usePathname();
  const logout = useLogout();
  return (
    <nav aria-label="Minha conta" className="flex gap-2 overflow-x-auto scrollbar-none lg:flex-col">
      {links.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
              active ? "bg-primary text-white shadow-sm" : "bg-white text-slate-600 hover:bg-primary-50 hover:text-primary",
            )}
          >
            <Icon className="size-4" /> {label}
          </Link>
        );
      })}
      <button onClick={logout} className="flex items-center gap-2.5 whitespace-nowrap rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50">
        <LogOut className="size-4" /> Sair
      </button>
    </nav>
  );
}
