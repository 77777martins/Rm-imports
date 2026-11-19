"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BadgePercent, LayoutDashboard, LogOut, Menu, Package, UserRound, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { CategoryIcon } from "./category-icon";
import { useLogout, type SessionUser } from "./user-menu";
import { useOnPathnameChange } from "@/hooks/use-close-on-navigate";

interface Props {
  categories: { id: string; name: string; slug: string; icon: string }[];
  user: SessionUser | null;
  storeName: string;
}

export function MobileMenu({ categories, user, storeName }: Props) {
  const [open, setOpen] = useState(false);
  const logout = useLogout();

  useOnPathnameChange(() => setOpen(false));
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const link = "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-700 hover:bg-primary-50 hover:text-primary";

  return (
    <>
      <button onClick={() => setOpen(true)} className="rounded-xl p-2 text-slate-700 hover:bg-slate-100 lg:hidden" aria-label="Abrir menu">
        <Menu className="size-6" />
      </button>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[90] lg:hidden">
            <motion.div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.nav
              aria-label="Menu principal"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.35 }}
              className="absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 p-4">
                <Logo storeName={storeName} />
                <button onClick={() => setOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Fechar menu">
                  <X className="size-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                <div className="mb-3 rounded-2xl bg-gradient-to-br from-primary to-secondary p-4 text-white">
                  {user ? (
                    <p className="text-sm">Olá, <strong>{user.name.split(" ")[0]}</strong>!</p>
                  ) : (
                    <Link href="/entrar" className="flex items-center gap-2 text-sm font-semibold">
                      <UserRound className="size-5" /> Entre ou cadastre-se
                    </Link>
                  )}
                </div>
                <p className="px-3 pb-1 pt-2 text-xs font-bold uppercase tracking-wider text-slate-400">Categorias</p>
                <Link href="/produtos?promo=1" className={link}>
                  <BadgePercent className="size-5 text-red-500" /> Ofertas
                </Link>
                {categories.map((c) => (
                  <Link key={c.id} href={`/produtos?categoria=${c.slug}`} className={link}>
                    <CategoryIcon name={c.icon} className="size-5 text-primary" /> {c.name}
                  </Link>
                ))}
                {user && (
                  <>
                    <p className="px-3 pb-1 pt-4 text-xs font-bold uppercase tracking-wider text-slate-400">Minha conta</p>
                    {user.role === "ADMIN" && (
                      <Link href="/admin" className={link}>
                        <LayoutDashboard className="size-5" /> Painel administrativo
                      </Link>
                    )}
                    <Link href="/conta" className={link}>
                      <UserRound className="size-5" /> Meus dados
                    </Link>
                    <Link href="/conta/pedidos" className={link}>
                      <Package className="size-5" /> Meus pedidos
                    </Link>
                    <button onClick={logout} className={`${link} w-full text-red-600`}>
                      <LogOut className="size-5" /> Sair
                    </button>
                  </>
                )}
              </div>
            </motion.nav>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
