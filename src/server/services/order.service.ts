import "server-only";
import { randomBytes } from "node:crypto";
import type { z } from "zod";
import { type Prisma } from "@/generated/prisma/client";
import type { OrderStatus } from "@/generated/prisma/enums";
import type { cartQuoteSchema, checkoutSchema } from "@/lib/validators/checkout";
import { ORDER_STATUS_TRANSITIONS, ORDER_STATUS_LABEL, MAX_INSTALLMENTS } from "@/lib/constants";
import { checkCoupon, computeTotals, maxInstallmentsFor } from "@/lib/pricing";
import { prisma } from "../db";
import { Errors } from "../errors";
import { logger } from "../logger";
import { getSettings } from "./settings.service";

const PIX_TTL_MS = 30 * 60_000;

const cartProductSelect = {
  id: true,
  sku: true,
  name: true,
  slug: true,
  brand: true,
  priceCents: true,
  salePriceCents: true,
  finalPriceCents: true,
  stock: true,
  imageUrl: true,
  packaging: true,
  accentColor: true,
  isActive: true,
  category: { select: { isActive: true } },
} satisfies Prisma.ProductSelect;

type CartItemInput = { productId: string; quantity: number };

/** Agrupa itens duplicados e soma quantidades. */
function mergeItems(items: CartItemInput[]): CartItemInput[] {
  const map = new Map<string, number>();
  for (const it of items) map.set(it.productId, (map.get(it.productId) ?? 0) + it.quantity);
  return [...map.entries()].map(([productId, quantity]) => ({ productId, quantity }));
}

async function resolveCoupon(code: string | null | undefined, subtotalCents: number) {
  if (!code) return { coupon: null, info: null };
  const coupon = await prisma.coupon.findUnique({ where: { code } });
  if (!coupon) return { coupon: null, info: { code, valid: false, message: "Cupom não encontrado." } };
  const check = checkCoupon(coupon, subtotalCents);
  if (!check.ok) return { coupon: null, info: { code, valid: false, message: check.reason } };
  return { coupon, info: { code, valid: true, message: coupon.description ?? "Cupom aplicado.", type: coupon.type } };
}

/**
 * Orçamento autoritativo do carrinho: preços e estoque vêm do banco,
 * nunca do cliente. Itens indisponíveis são sinalizados.
 */
export async function quoteCart(input: z.output<typeof cartQuoteSchema>) {
  const items = mergeItems(input.items);
  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.productId) } },
    select: cartProductSelect,
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  const lines = items.flatMap((item) => {
    const p = byId.get(item.productId);
    if (!p) return [];
    const available = p.isActive && p.category.isActive && p.stock > 0;
    const quantity = available ? Math.min(item.quantity, p.stock) : item.quantity;
    const { category: _category, isActive: _isActive, ...product } = p;
    return [
      {
        ...product,
        productId: p.id,
        quantity,
        requestedQuantity: item.quantity,
        available,
        unitPriceCents: p.finalPriceCents,
        lineTotalCents: available ? p.finalPriceCents * quantity : 0,
      },
    ];
  });
  const missing = items.filter((i) => !byId.has(i.productId)).map((i) => i.productId);

  const subtotalCents = lines.reduce((sum, l) => sum + l.lineTotalCents, 0);
  const settings = await getSettings();
  const { coupon, info } = await resolveCoupon(input.couponCode, subtotalCents);
  const totals = computeTotals({
    subtotalCents,
    zip: input.zipCode,
    coupon,
    freeShippingMinCents: settings.freeShippingMinCents,
  });

  return {
    lines,
    missing,
    coupon: info,
    totals,
    freeShippingMinCents: settings.freeShippingMinCents,
    maxInstallments: maxInstallmentsFor(totals.totalCents, MAX_INSTALLMENTS),
  };
}

function generateOrderNumber(): string {
  const d = new Date();
  const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(6);
  const suffix = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
  return `MF-${date}-${suffix}`;
}

/** Código "copia e cola" FICTÍCIO — não é um BR Code válido e não movimenta dinheiro. */
function generateDemoPixCode(orderNumber: string, totalCents: number): string {
  const amount = (totalCents / 100).toFixed(2);
  return `00020126580014BR.GOV.BCB.PIX.DEMO0136MEDFACIL-DEMONSTRACAO-SEM-VALOR52040000530398654${String(amount.length).padStart(2, "0")}${amount}5802BR5917MEDFACIL PORTFOLIO6009SAO PAULO62${String(orderNumber.length + 4).padStart(2, "0")}05${String(orderNumber.length).padStart(2, "0")}${orderNumber}6304DEMO`;
}

/**
 * Finaliza a compra de forma transacional:
 * revalida preços/estoque/cupom no servidor, simula o pagamento,
 * baixa o estoque com update condicional (sem condição de corrida)
 * e registra o histórico de status.
 */
export async function createOrder(userId: string, input: z.output<typeof checkoutSchema>) {
  const items = mergeItems(input.items);
  const settings = await getSettings();

  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.productId) } },
    select: cartProductSelect,
  });
  const byId = new Map(products.map((p) => [p.id, p]));
  for (const item of items) {
    const p = byId.get(item.productId);
    if (!p || !p.isActive || !p.category.isActive) throw Errors.conflict("Um dos produtos do carrinho não está mais disponível.");
    if (p.stock < item.quantity) throw Errors.conflict(`Estoque insuficiente para "${p.name}". Disponível: ${p.stock}.`);
  }

  const subtotalCents = items.reduce((sum, i) => sum + byId.get(i.productId)!.finalPriceCents * i.quantity, 0);
  const { coupon, info } = await resolveCoupon(input.couponCode, subtotalCents);
  if (input.couponCode && !coupon) throw Errors.badRequest(info?.message ?? "Cupom inválido.");

  const totals = computeTotals({ subtotalCents, zip: input.address.zipCode, coupon, freeShippingMinCents: settings.freeShippingMinCents });
  if (totals.shippingCents === null || totals.shippingDays === null) throw Errors.badRequest("CEP inválido para entrega.");

  // ---- Pagamento simulado (nenhuma instituição financeira é contatada) ----
  const payment = input.payment;
  let status: OrderStatus = "PENDING_PAYMENT";
  if (payment.method === "CARD") {
    if (payment.installments > maxInstallmentsFor(totals.totalCents, MAX_INSTALLMENTS))
      throw Errors.badRequest("Número de parcelas indisponível para este valor.");
    if (payment.last4 === "0002") throw Errors.paymentDeclined("Cartão recusado pela operadora (simulação: cartões com final 0002 são recusados).");
    status = "PAID";
  }

  const number = generateOrderNumber();
  const now = new Date();

  const order = await prisma.$transaction(async (tx) => {
    for (const item of items) {
      const updated = await tx.product.updateMany({
        where: { id: item.productId, isActive: true, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity }, soldCount: { increment: item.quantity } },
      });
      if (updated.count === 0) {
        const p = byId.get(item.productId)!;
        throw Errors.conflict(`Estoque insuficiente para "${p.name}". Atualize o carrinho.`);
      }
    }

    if (coupon) {
      const used = await tx.coupon.updateMany({
        where: { id: coupon.id, isActive: true, OR: [{ maxUses: null }, { usedCount: { lt: tx.coupon.fields.maxUses } }] },
        data: { usedCount: { increment: 1 } },
      });
      if (used.count === 0) throw Errors.conflict("Este cupom acabou de esgotar.");
    }

    const created = await tx.order.create({
      data: {
        number,
        userId,
        status,
        subtotalCents: totals.subtotalCents,
        discountCents: totals.discountCents,
        shippingCents: totals.shippingCents!,
        totalCents: totals.totalCents,
        couponId: coupon?.id ?? null,
        couponCode: coupon?.code ?? null,
        paymentMethod: payment.method,
        paymentStatus: payment.method === "CARD" ? "APPROVED" : "PENDING",
        cardBrand: payment.method === "CARD" ? payment.brand : null,
        cardLast4: payment.method === "CARD" ? payment.last4 : null,
        installments: payment.method === "CARD" ? payment.installments : 1,
        pixCode: payment.method === "PIX" ? generateDemoPixCode(number, totals.totalCents) : null,
        pixExpiresAt: payment.method === "PIX" ? new Date(now.getTime() + PIX_TTL_MS) : null,
        paidAt: status === "PAID" ? now : null,
        shippingName: input.recipientName,
        shippingZipCode: input.address.zipCode,
        shippingStreet: input.address.street,
        shippingNumber: input.address.number,
        shippingComplement: input.address.complement,
        shippingDistrict: input.address.district,
        shippingCity: input.address.city,
        shippingState: input.address.state,
        shippingDays: totals.shippingDays!,
        items: {
          create: items.map((item) => {
            const p = byId.get(item.productId)!;
            return {
              productId: p.id,
              productName: p.name,
              productSku: p.sku,
              unitPriceCents: p.finalPriceCents,
              quantity: item.quantity,
              totalCents: p.finalPriceCents * item.quantity,
            };
          }),
        },
        statusHistory: {
          create: [
            { toStatus: "PENDING_PAYMENT", note: "Pedido criado.", changedById: userId, createdAt: now },
            ...(status === "PAID"
              ? [{ fromStatus: "PENDING_PAYMENT" as const, toStatus: "PAID" as const, note: "Pagamento com cartão aprovado (simulação).", changedById: userId, createdAt: new Date(now.getTime() + 1) }]
              : []),
          ],
        },
      },
      select: { id: true, number: true, status: true, totalCents: true, paymentMethod: true },
    });

    if (input.saveAddress) {
      await tx.user.update({ where: { id: userId }, data: { ...input.address } });
    }
    return created;
  });

  logger.info("Pedido criado", { orderNumber: order.number, userId, method: order.paymentMethod });
  return order;
}

const orderDetailInclude = {
  items: { include: { product: { select: { slug: true, packaging: true, accentColor: true, imageUrl: true } } } },
  statusHistory: { orderBy: { createdAt: "asc" as const }, include: { changedBy: { select: { name: true, role: true } } } },
} satisfies Prisma.OrderInclude;

export async function listMyOrders(userId: string, page: number, pageSize: number) {
  const [total, items] = await prisma.$transaction([
    prisma.order.count({ where: { userId } }),
    prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        number: true,
        status: true,
        totalCents: true,
        paymentMethod: true,
        createdAt: true,
        _count: { select: { items: true } },
      },
    }),
  ]);
  return { total, page, pageSize, items };
}

/** Busca o pedido sempre filtrando pelo dono (evita IDOR). */
export async function getMyOrder(userId: string, number: string) {
  const order = await prisma.order.findFirst({ where: { number, userId }, include: orderDetailInclude });
  if (!order) throw Errors.notFound("Pedido não encontrado.");
  return order;
}

export async function simulatePixPayment(userId: string, number: string) {
  const order = await prisma.order.findFirst({ where: { number, userId } });
  if (!order) throw Errors.notFound("Pedido não encontrado.");
  if (order.paymentMethod !== "PIX") throw Errors.badRequest("Este pedido não é pago via PIX.");
  if (order.status !== "PENDING_PAYMENT") throw Errors.conflict("Este pedido não está aguardando pagamento.");
  if (order.pixExpiresAt && order.pixExpiresAt.getTime() < Date.now()) {
    await changeStatus(order.id, "CANCELED", null, "PIX expirado (simulação).");
    throw Errors.conflict("O código PIX expirou e o pedido foi cancelado.");
  }
  await changeStatus(order.id, "PAID", userId, "Pagamento PIX confirmado (simulação).");
  return getMyOrder(userId, number);
}

/**
 * Altera status aplicando efeitos colaterais:
 * cancelamento devolve o estoque; pagamento marca paidAt.
 */
async function changeStatus(orderId: string, to: OrderStatus, changedById: string | null, note: string | null) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) throw Errors.notFound("Pedido não encontrado.");
    if (!ORDER_STATUS_TRANSITIONS[order.status].includes(to))
      throw Errors.badRequest(`Não é possível alterar de "${ORDER_STATUS_LABEL[order.status]}" para "${ORDER_STATUS_LABEL[to]}".`);

    // Update condicional pelo status atual: evita duas alterações concorrentes.
    const updated = await tx.order.updateMany({
      where: { id: orderId, status: order.status },
      data: {
        status: to,
        ...(to === "PAID" ? { paidAt: new Date(), paymentStatus: "APPROVED" as const } : {}),
        ...(to === "CANCELED" && order.paymentStatus === "PENDING" ? { paymentStatus: "DECLINED" as const } : {}),
      },
    });
    if (updated.count === 0) throw Errors.conflict("O pedido foi alterado por outra operação. Recarregue a página.");

    if (to === "CANCELED") {
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity }, soldCount: { decrement: item.quantity } },
        });
      }
      if (order.couponId) {
        await tx.coupon.updateMany({ where: { id: order.couponId, usedCount: { gt: 0 } }, data: { usedCount: { decrement: 1 } } });
      }
    }

    await tx.orderStatusHistory.create({ data: { orderId, fromStatus: order.status, toStatus: to, note, changedById } });
  });
}

// ------------------------------- ADMIN -------------------------------------

export async function listOrdersAdmin(params: { page: number; pageSize: number; status?: OrderStatus; q?: string }) {
  const where: Prisma.OrderWhereInput = {
    ...(params.status ? { status: params.status } : {}),
    ...(params.q
      ? {
          OR: [
            { number: { contains: params.q, mode: "insensitive" } },
            { user: { name: { contains: params.q, mode: "insensitive" } } },
            { user: { email: { contains: params.q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };
  const [total, items] = await prisma.$transaction([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
      select: {
        id: true,
        number: true,
        status: true,
        totalCents: true,
        paymentMethod: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
        _count: { select: { items: true } },
      },
    }),
  ]);
  return { total, page: params.page, pageSize: params.pageSize, items };
}

export async function getOrderAdmin(id: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: { ...orderDetailInclude, user: { select: { id: true, name: true, email: true, phone: true } } },
  });
  if (!order) throw Errors.notFound("Pedido não encontrado.");
  return order;
}

export async function updateOrderStatusAdmin(adminId: string, id: string, status: OrderStatus, note: string | null) {
  await changeStatus(id, status, adminId, note);
  return getOrderAdmin(id);
}
