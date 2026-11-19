"use client";

import { ShoppingCart, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useCartStore, type CartItem } from "@/stores/cart-store";
import { Button, type ButtonSize } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  product: Omit<CartItem, "quantity">;
  quantity?: number;
  size?: ButtonSize;
  className?: string;
  label?: string;
}

export function AddToCartButton({ product, quantity = 1, size = "md", className, label = "Adicionar" }: Props) {
  const add = useCartStore((s) => s.add);
  const [added, setAdded] = useState(false);
  const outOfStock = product.stock <= 0;

  const onClick = () => {
    const before = useCartStore.getState().items.find((i) => i.productId === product.productId)?.quantity ?? 0;
    const after = add(product, quantity);
    if (after === before) {
      toast.warning("Quantidade máxima disponível já está no carrinho.");
      return;
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
    toast.success(`${product.name} adicionado ao carrinho`, {
      action: { label: "Ver carrinho", onClick: () => (window.location.href = "/carrinho") },
    });
  };

  return (
    <Button size={size} className={cn("w-full", className)} disabled={outOfStock} onClick={onClick} variant={added ? "secondary" : "primary"}>
      {outOfStock ? (
        "Indisponível"
      ) : added ? (
        <>
          <Check className="size-4" /> Adicionado
        </>
      ) : (
        <>
          <ShoppingCart className="size-4" /> {label}
        </>
      )}
    </Button>
  );
}
