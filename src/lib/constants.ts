import type { OrderStatus, PaymentMethod, PaymentStatus, PackagingType, CouponType } from "@/generated/prisma/enums";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Aguardando pagamento",
  PAID: "Pagamento aprovado",
  PROCESSING: "Em separação",
  SHIPPED: "Enviado",
  DELIVERED: "Entregue",
  CANCELED: "Cancelado",
};

export const ORDER_STATUS_TONE: Record<OrderStatus, "warning" | "success" | "info" | "neutral" | "danger"> = {
  PENDING_PAYMENT: "warning",
  PAID: "success",
  PROCESSING: "info",
  SHIPPED: "info",
  DELIVERED: "success",
  CANCELED: "danger",
};

/** Transições de status permitidas no painel administrativo. */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ["PAID", "CANCELED"],
  PAID: ["PROCESSING", "CANCELED"],
  PROCESSING: ["SHIPPED", "CANCELED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELED: [],
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = { PIX: "PIX", CARD: "Cartão de crédito" };
export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  PENDING: "Pendente",
  APPROVED: "Aprovado",
  DECLINED: "Recusado",
};

export const PACKAGING_LABEL: Record<PackagingType, string> = {
  BOX: "Caixa",
  BOTTLE: "Frasco",
  TUBE: "Bisnaga",
  BLISTER: "Cartela",
  JAR: "Pote",
  SPRAY: "Spray",
};

export const COUPON_TYPE_LABEL: Record<CouponType, string> = {
  PERCENT: "Percentual",
  FIXED: "Valor fixo",
  FREE_SHIPPING: "Frete grátis",
};

export const PRODUCT_SORTS = {
  relevance: "Mais relevantes",
  "best-sellers": "Mais vendidos",
  "price-asc": "Menor preço",
  "price-desc": "Maior preço",
  newest: "Lançamentos",
  "name-asc": "Nome (A–Z)",
} as const;
export type ProductSort = keyof typeof PRODUCT_SORTS;

export const PAGE_SIZE = 12;
export const LOW_STOCK_THRESHOLD = 10;
export const MAX_CART_QUANTITY = 10;
export const MAX_INSTALLMENTS = 6;

export const BR_STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
] as const;
