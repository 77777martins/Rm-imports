import Link from "next/link";
import { CreditCard, MapPin, QrCode, CircleCheck, Circle } from "lucide-react";
import type { getMyOrder } from "@/server/services/order.service";
import { ORDER_STATUS_LABEL, PAYMENT_METHOD_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/constants";
import { formatCents, formatDate } from "@/lib/utils";
import { ProductVisual } from "@/components/product/product-visual";
import { Card } from "@/components/ui/misc";
import { OrderStatusBadge } from "./order-status-badge";

export type OrderWithDetails = Awaited<ReturnType<typeof getMyOrder>>;

export function OrderTimeline({ history }: { history: OrderWithDetails["statusHistory"] }) {
  return (
    <ol className="relative space-y-5 border-l-2 border-slate-100 pl-6">
      {history.map((h, i) => {
        const last = i === history.length - 1;
        return (
          <li key={h.id} className="relative">
            <span className={`absolute -left-[33px] top-0 grid size-5 place-items-center rounded-full bg-white ${h.toStatus === "CANCELED" ? "text-red-500" : last ? "text-primary" : "text-slate-400"}`}>
              {last ? <CircleCheck className="size-5" /> : <Circle className="size-4" />}
            </span>
            <p className="text-sm font-semibold text-slate-800">{ORDER_STATUS_LABEL[h.toStatus]}</p>
            <p className="text-xs text-slate-500">
              {formatDate(h.createdAt, true)}
              {h.changedBy && <> · por {h.changedBy.role === "ADMIN" ? "equipe da loja" : h.changedBy.name}</>}
            </p>
            {h.note && <p className="mt-1 text-xs text-slate-600">{h.note}</p>}
          </li>
        );
      })}
    </ol>
  );
}

export function OrderDetail({ order, productLinks = true }: { order: OrderWithDetails; productLinks?: boolean }) {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <Card className="p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-slate-900">Itens do pedido</h2>
            <OrderStatusBadge status={order.status} />
          </div>
          <ul className="divide-y divide-slate-100">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center gap-4 py-3">
                <ProductVisual name={item.productName} packaging={item.product.packaging} accentColor={item.product.accentColor} imageUrl={item.product.imageUrl} className="size-14 shrink-0 rounded-xl" compact />
                <div className="min-w-0 flex-1">
                  {productLinks ? (
                    <Link href={`/produtos/${item.product.slug}`} className="line-clamp-1 text-sm font-semibold text-slate-800 hover:text-primary">{item.productName}</Link>
                  ) : (
                    <p className="line-clamp-1 text-sm font-semibold text-slate-800">{item.productName}</p>
                  )}
                  <p className="text-xs text-slate-500">Cód. {item.productSku} · {item.quantity} × {formatCents(item.unitPriceCents)}</p>
                </div>
                <span className="text-sm font-bold text-slate-900">{formatCents(item.totalCents)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Subtotal</dt><dd>{formatCents(order.subtotalCents)}</dd></div>
            {order.discountCents > 0 && (
              <div className="flex justify-between"><dt className="text-slate-500">Desconto {order.couponCode && `(${order.couponCode})`}</dt><dd className="text-emerald-600">- {formatCents(order.discountCents)}</dd></div>
            )}
            <div className="flex justify-between"><dt className="text-slate-500">Frete</dt><dd>{order.shippingCents === 0 ? "Grátis" : formatCents(order.shippingCents)}</dd></div>
            <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-bold"><dt>Total</dt><dd>{formatCents(order.totalCents)}</dd></div>
          </dl>
        </Card>

        <div className="grid gap-6 sm:grid-cols-2">
          <Card className="p-6">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900"><MapPin className="size-4 text-primary" /> Entrega</h3>
            <address className="text-sm not-italic leading-relaxed text-slate-600">
              {order.shippingName}<br />
              {order.shippingStreet}, {order.shippingNumber}{order.shippingComplement && ` — ${order.shippingComplement}`}<br />
              {order.shippingDistrict} · {order.shippingCity}/{order.shippingState}<br />
              CEP {order.shippingZipCode}
            </address>
            <p className="mt-2 text-xs text-slate-400">Prazo simulado: até {order.shippingDays} dias úteis</p>
          </Card>
          <Card className="p-6">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
              {order.paymentMethod === "PIX" ? <QrCode className="size-4 text-primary" /> : <CreditCard className="size-4 text-primary" />} Pagamento
            </h3>
            <p className="text-sm text-slate-600">{PAYMENT_METHOD_LABEL[order.paymentMethod]}</p>
            {order.cardLast4 && (
              <p className="text-sm text-slate-600">
                <span className="uppercase">{order.cardBrand}</span> •••• {order.cardLast4} · {order.installments}x
              </p>
            )}
            <p className="mt-1 text-xs text-slate-500">Status: {PAYMENT_STATUS_LABEL[order.paymentStatus]}{order.paidAt && ` em ${formatDate(order.paidAt, true)}`}</p>
          </Card>
        </div>
      </div>

      <Card className="p-6">
        <h2 className="mb-5 text-sm font-bold text-slate-900">Acompanhamento</h2>
        <OrderTimeline history={order.statusHistory} />
      </Card>
    </div>
  );
}
