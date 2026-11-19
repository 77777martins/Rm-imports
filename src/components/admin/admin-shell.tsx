"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, LayoutDashboard, LogOut, Menu, Package, Settings, ShoppingBag, Tags, Users, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { useLogout } from "@/components/layout/user-menu";
import { cn } from "@/lib/utils";
import { useOnPathnameChange } from "@/hooks/use-close-on-navigate";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/produtos", label: "Produtos", icon: Package },
  { href: "/admin/categorias", label: "Categorias", icon: Tags },
  { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag },
  { href: "/admin/clientes", label: "Clientes", icon: Users },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <ul className="space-y-1">
      {NAV.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                active ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white",
              )}
            >
              <Icon className="size-5" /> {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function AdminShell({ user, storeName, children }: { user: { name: string; email: string }; storeName: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const logout = useLogout();
  useOnPathnameChange(() => setOpen(false));

  const sidebar = (
    <div className="flex h-full flex-col bg-gradient-to-b from-primary-900 to-slate-950 p-4">
      <div className="mb-8 px-2 pt-2">
        <Logo storeName={storeName} light href="/admin" />
        <p className="mt-2 text-[11px] font-semibold uppercase tracking-widest text-white/50">Painel administrativo</p>
      </div>
      <nav aria-label="Administração" className="flex-1">
        <NavLinks onNavigate={() => setOpen(false)} />
      </nav>
      <div className="space-y-1 border-t border-white/10 pt-4">
        <Link href="/" target="_blank" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white">
          <ExternalLink className="size-5" /> Ver loja
        </Link>
        <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white">
          <LogOut className="size-5" /> Sair
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">{sidebar}</aside>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div className="absolute inset-0 bg-slate-900/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.aside initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", bounce: 0, duration: 0.3 }} className="absolute inset-y-0 left-0 w-72">
              {sidebar}
              <button onClick={() => setOpen(false)} className="absolute right-3 top-3 rounded-lg p-2 text-white/70 hover:bg-white/10" aria-label="Fechar menu">
                <X className="size-5" />
              </button>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
          <button onClick={() => setOpen(true)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Abrir menu">
            <Menu className="size-5" />
          </button>
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800">Ambiente de demonstração</span>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-800">{user.name}</p>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
            <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-primary to-secondary text-sm font-bold text-white">{user.name.charAt(0)}</span>
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
