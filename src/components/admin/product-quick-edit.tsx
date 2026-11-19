"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { handleFormError } from "@/lib/form";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { MoneyInput } from "./inputs";

export interface QuickEditProduct {
  id: string;
  name: string;
  priceCents: number;
  salePriceCents: number | null;
  stock: number;
}

const FORM_ID = "product-quick-edit-form";

/**
 * Formulário interno: o estado nasce das props e é recriado via `key`
 * quando outro produto é aberto (sem sincronização por efeito).
 */
function QuickEditForm({ product, onDone, onPendingChange }: { product: QuickEditProduct; onDone: () => void; onPendingChange: (p: boolean) => void }) {
  const qc = useQueryClient();
  const [price, setPrice] = useState<number | null>(product.priceCents);
  const [sale, setSale] = useState<number | null>(product.salePriceCents);
  const [stock, setStock] = useState(String(product.stock));
  const [error, setError] = useState<string>();

  const mutation = useMutation({
    mutationFn: async () => api.patch(`/admin/products/${product.id}`, { priceCents: price, salePriceCents: sale, stock: Number(stock) }),
    onMutate: () => onPendingChange(true),
    onSettled: () => onPendingChange(false),
    onSuccess: () => {
      toast.success("Produto atualizado.");
      qc.invalidateQueries({ queryKey: ["admin"] });
      onDone();
    },
    onError: (e) => handleFormError(e),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!price || price <= 0) return setError("Informe um preço válido.");
    if (sale !== null && sale >= price) return setError("O preço promocional deve ser menor que o preço normal.");
    if (!/^\d+$/.test(stock)) return setError("Estoque inválido.");
    setError(undefined);
    mutation.mutate();
  };

  return (
    <form id={FORM_ID} className="space-y-4" onSubmit={submit} noValidate>
      <MoneyInput label="Preço" required value={price} onChange={setPrice} />
      <MoneyInput label="Preço promocional" allowEmpty hint="Deixe vazio para remover a promoção." value={sale} onChange={setSale} />
      <Input label="Estoque" inputMode="numeric" value={stock} onChange={(e) => setStock(e.target.value.replace(/\D/g, ""))} />
      {error && <p role="alert" className="text-sm font-medium text-red-600">{error}</p>}
    </form>
  );
}

/** Atualização rápida de preço, preço promocional e estoque. */
export function ProductQuickEdit({ product, onClose }: { product: QuickEditProduct | null; onClose: () => void }) {
  const [pending, setPending] = useState(false);
  return (
    <Modal
      open={!!product}
      onClose={onClose}
      title="Edição rápida"
      description={product?.name}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form={FORM_ID} loading={pending}>Salvar</Button>
        </>
      }
    >
      {product && <QuickEditForm key={product.id} product={product} onDone={onClose} onPendingChange={setPending} />}
    </Modal>
  );
}
