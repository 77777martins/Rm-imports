import type { Metadata } from "next";
import { OrdersList } from "@/components/account/orders-list";

export const metadata: Metadata = { title: "Meus pedidos" };

export default function MyOrdersPage() {
  return (
    <div>
      <h2 className="mb-4 text-lg font-bold text-slate-900">Histórico de pedidos</h2>
      <OrdersList />
    </div>
  );
}
