import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSession } from "@/server/auth/session";
import { getMyOrder } from "@/server/services/order.service";
import { orderNumberSchema } from "@/lib/validators/checkout";
import { AppError } from "@/server/errors";
import { formatDate } from "@/lib/utils";
import { OrderDetail } from "@/components/order/order-detail";
import { PixPayment } from "@/components/order/pix-payment";

export async function generateMetadata({ params }: { params: Promise<{ number: string }> }): Promise<Metadata> {
  return { title: `Pedido ${(await params).number}` };
}

export default async function MyOrderPage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  if (!orderNumberSchema.safeParse(number).success) notFound();
  const session = await getSession();
  if (!session) redirect(`/entrar?next=/conta/pedidos/${number}`);
  const order = await getMyOrder(session.sub, number).catch((e) => {
    if (e instanceof AppError && e.status === 404) notFound();
    throw e;
  });
  const awaitingPix = order.status === "PENDING_PAYMENT" && order.paymentMethod === "PIX" && order.pixCode && order.pixExpiresAt;

  return (
    <div className="space-y-5">
      <Link href="/conta/pedidos" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
        <ArrowLeft className="size-4" /> Voltar para pedidos
      </Link>
      <div>
        <h2 className="font-mono text-xl font-bold text-slate-900">{order.number}</h2>
        <p className="text-sm text-slate-500">Realizado em {formatDate(order.createdAt, true)}</p>
      </div>
      {awaitingPix && <PixPayment orderNumber={order.number} pixCode={order.pixCode!} expiresAt={order.pixExpiresAt!.toISOString()} />}
      <OrderDetail order={order} />
    </div>
  );
}
