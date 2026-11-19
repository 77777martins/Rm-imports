import type { Metadata } from "next";
import { CheckoutView } from "@/components/checkout/checkout-view";

export const metadata: Metadata = { title: "Finalizar compra" };

export default function CheckoutPage() {
  return (
    <div className="container-page py-8">
      <h1 className="mb-6 text-3xl font-extrabold tracking-tight text-slate-900">Finalizar compra</h1>
      <CheckoutView />
    </div>
  );
}
