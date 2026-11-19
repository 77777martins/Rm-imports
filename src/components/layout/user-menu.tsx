"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, LayoutDashboard, LogOut, Package, UserRound } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";

export interface SessionUser {
  name: string;
  email: string;
  role: "ADMIN" | "CUSTOMER";
}

export function useLogout() {
  const router = useRouter();
  return async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      toast.success("Você saiu da sua conta.");
      router.push("/");
      router.refresh();
    }
  };
}

export function UserMenu({ user }: { user: SessionUser | null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const logout = useLogout();

  useEffect(() => {
    const onClick = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  if (!user) {
    return (
      <Link href="/entrar" className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-slate-700 transition-colors hover:bg-primary-50 hover:text-primary">
        <UserRound className="size-6" />
        <span className="hidden text-left text-xs leading-tight lg:block">
          Olá, visitante
          <strong className="block text-sm text-slate-900">Entre ou cadastre-se</strong>
        </span>
      </Link>
    );
  }

  const firstName = user.name.split(" ")[0];
  const item = "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-primary-50 hover:text-primary";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-slate-700 transition-colors hover:bg-primary-50 hover:text-primary"
      >
        <span className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-primary to-secondary text-sm font-bold text-white">
          {firstName.charAt(0).toUpperCase()}
        </span>
        <span className="hidden text-left text-xs leading-tight lg:block">
          Olá, {firstName}
          <strong className="block text-sm text-slate-900">Minha conta</strong>
        </span>
        <ChevronDown className="hidden size-4 lg:block" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-2 w-60 rounded-2xl border border-slate-100 bg-white p-1.5 shadow-lift"
            onClick={() => setOpen(false)}
          >
            <div className="border-b border-slate-100 px-3 py-2.5">
              <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
            </div>
            {user.role === "ADMIN" && (
              <Link href="/admin" role="menuitem" className={item}>
                <LayoutDashboard className="size-4" /> Painel administrativo
              </Link>
            )}
            <Link href="/conta" role="menuitem" className={item}>
              <UserRound className="size-4" /> Meus dados
            </Link>
            <Link href="/conta/pedidos" role="menuitem" className={item}>
              <Package className="size-4" /> Meus pedidos
            </Link>
            <button role="menuitem" onClick={logout} className={`${item} w-full text-red-600 hover:bg-red-50 hover:text-red-700`}>
              <LogOut className="size-4" /> Sair
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
