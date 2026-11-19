"use client";

import { TriangleAlert } from "lucide-react";
import { createContext, useCallback, useContext, useRef, useState } from "react";
import { Button } from "./button";
import { Modal } from "./modal";

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  tone?: "danger" | "primary";
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;
const ConfirmContext = createContext<ConfirmFn | null>(null);

/** Confirmação baseada em Promise: `if (await confirm({...})) excluir()`. */
export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<(v: boolean) => void>(undefined);

  const confirm = useCallback<ConfirmFn>((opts) => {
    setOptions(opts);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = (value: boolean) => {
    resolver.current?.(value);
    setOptions(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        open={!!options}
        onClose={() => close(false)}
        title={options?.title ?? ""}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => close(false)}>Cancelar</Button>
            <Button variant={options?.tone === "primary" ? "primary" : "danger"} onClick={() => close(true)}>
              {options?.confirmLabel ?? "Confirmar"}
            </Button>
          </>
        }
      >
        <div className="flex gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-amber-50 text-amber-600">
            <TriangleAlert className="size-5" />
          </div>
          <p className="text-sm leading-relaxed text-slate-600">{options?.description ?? "Esta ação não pode ser desfeita."}</p>
        </div>
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm deve ser usado dentro de ConfirmProvider");
  return ctx;
}
