"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { WhatsAppIcon } from "@/components/brand/social-icons";

/**
 * Botão de WhatsApp DEMONSTRATIVO: abre um balão explicativo em vez de
 * redirecionar para um número real.
 */
export function WhatsAppButton({ storeName }: { storeName: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            className="w-72 overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-100"
            role="dialog"
            aria-label="Atendimento via WhatsApp (demonstração)"
          >
            <div className="flex items-center justify-between bg-[#075e54] px-4 py-3 text-white">
              <div className="flex items-center gap-2">
                <WhatsAppIcon className="size-5" />
                <div>
                  <p className="text-sm font-semibold">{storeName}</p>
                  <p className="text-[11px] text-white/75">Atendimento demonstrativo</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Fechar" className="rounded p-1 hover:bg-white/10">
                <X className="size-4" />
              </button>
            </div>
            <div className="bg-[#ece5dd] p-4">
              <div className="rounded-xl rounded-tl-none bg-white p-3 text-sm text-slate-700 shadow-sm">
                Olá! 👋 Este é um <strong>botão demonstrativo</strong>. Em uma loja real, ele abriria uma conversa no WhatsApp com a equipe de atendimento.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((o) => !o)}
        aria-label="Atendimento via WhatsApp (demonstração)"
        aria-expanded={open}
        className="relative grid size-14 place-items-center rounded-full bg-[#25d366] text-white shadow-lg shadow-[#25d366]/40"
      >
        <span className="absolute inset-0 animate-ping rounded-full bg-[#25d366] opacity-25" aria-hidden />
        <WhatsAppIcon className="relative size-7" />
      </motion.button>
    </div>
  );
}
