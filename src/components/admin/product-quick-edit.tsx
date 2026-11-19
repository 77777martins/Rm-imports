"use client";

import { useEffect, useState } from "react";
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

/** Atualização rápida de preço, preço promocional e estoque. */
export function ProductQuickEdit({ product, onClose }: { product: QuickEditProduct | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [price, setPrice] = useState<number | null>(0);
  const [sale, setSale] = useState<number | null>(null);
  const [stock, setStock] = useState("0");
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!product) return;
    setPrice(product.priceCents);
    setSale(product.salePriceCents);
    setStock(String(product.stock));
    setError(undefined);
  }, [product]);

  const mutation = useMutation({
    mutationFn: async () =>
      api.patch(`/admin/products/${product!.id}`, { priceCents: price, salePriceCents: sale, stock: Number(stock) }),
    onSuccess: () => {
      toast.success("Produto atualizado.");
      qc.invalidateQueries({ queryKey: ["admin"] });
      onClose();
    },
    onError: (e) => handleFormError(e),
  });

  const submit = () => {
    if (!price || price <= 0) return setError("Informe um preço válido.");
    if (sale !== null && sale >= price) return setError("O preço promocional deve ser menor que o preço normal.");
    if (!/^\d+$/.test(stock)) return setError("Estoque inválido.");
    setError(undefined);
    mutation.mutate();
  };

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
          <Button onClick={submit} loading={mutation.isPending}>Salvar</Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <MoneyInput label="Preço" required value={price} onChange={setPrice} />
        <MoneyInput label="Preço promocional" allowEmpty hint="Deixe vazio para remover a promoção." value={sale} onChange={setSale} />
        <Input label="Estoque" inputMode="numeric" value={stock} onChange={(e) => setStock(e.target.value.replace(/\D/g, ""))} />
        {error && <p role="alert" className="text-sm font-medium text-red-600">{error}</p>}
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
