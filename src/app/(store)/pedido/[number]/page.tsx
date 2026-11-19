import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CircleCheck, Clock } from "lucide-react";
import { getSession } from "@/server/auth/session";
import { getMyOrder } from "@/server/services/order.service";
import { orderNumberSchema } from "@/lib/validators/checkout";
import { AppError } from "@/server/errors";
import { formatDate } from "@/lib/utils";
import { OrderDetail } from "@/components/order/order-detail";
import { PixPayment } from "@/components/order/pix-payment";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Pedido confirmado" };

export default async function OrderConfirmationPage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  if (!orderNumberSchema.safeParse(number).success) notFound();
  const session = await getSession();
  if (!session) redirect(`/entrar?next=/pedido/${number}`);
  const order = await getMyOrder(session.sub, number).catch((e) => {
    if (e instanceof AppError && e.status === 404) notFound();
    throw e;
  });

  const awaitingPix = order.status === "PENDING_PAYMENT" && order.paymentMethod === "PIX" && order.pixCode && order.pixExpiresAt;

  return (
    <div className="container-page space-y-6 py-8">
      <div className="flex flex-col items-center rounded-3xl bg-gradient-to-br from-primary to-secondary px-6 py-10 text-center text-white">
        {awaitingPix ? <Clock className="mb-3 size-14" /> : <CircleCheck className="mb-3 size-14" />}
        <h1 className="text-2xl font-extrabold sm:text-3xl">{awaitingPix ? "Pedido recebido! Falta só o pagamento." : "Pedido confirmado!"}</h1>
        <p className="mt-2 text-white/85">
          Número do pedido <strong className="font-mono">{order.number}</strong> · {formatDate(order.createdAt, true)}
        </p>
        <p className="mt-1 text-xs text-white/70">Compra demonstrativa: nenhum produto será enviado.</p>
      </div>

      {awaitingPix && <PixPayment orderNumber={order.number} pixCode={order.pixCode!} expiresAt={order.pixExpiresAt!.toISOString()} />}

      <OrderDetail order={order} />

      <div className="flex flex-wrap justify-center gap-3">
        <ButtonLink href="/conta/pedidos" variant="outline">Ver meus pedidos</ButtonLink>
        <ButtonLink href="/produtos">Continuar comprando</ButtonLink>
      </div>
    </div>
  );
}
