import type { Metadata } from "next";
import { CartView } from "@/components/cart/cart-view";

export const metadata: Metadata = { title: "Carrinho" };

export default function CartPage() {
  return (
    <div className="container-page py-8">
      <h1 className="mb-6 text-3xl font-extrabold tracking-tight text-slate-900">Meu carrinho</h1>
      <CartView />
    </div>
  );
}
