import { z } from "zod";
import { MAX_CART_QUANTITY, MAX_INSTALLMENTS } from "@/lib/constants";
import { addressSchema, cleanText, idSchema } from "./common";

export const cartItemSchema = z.object({
  productId: idSchema,
  quantity: z.coerce.number().int().min(1).max(MAX_CART_QUANTITY),
});

export const couponCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9_-]{3,30}$/, "Cupom inválido.");

export const cartQuoteSchema = z.object({
  items: z.array(cartItemSchema).max(50),
  couponCode: couponCodeSchema.optional().nullable().or(z.literal("").transform(() => null)),
  zipCode: z.string().trim().regex(/^(\d{5}-?\d{3})?$/).optional().nullable(),
});
export type CartQuoteInput = z.input<typeof cartQuoteSchema>;

const pixPayment = z.object({ method: z.literal("PIX") });

/** Dados do cartão "tokenizado" no cliente — nunca o número completo/CVV. */
const cardPayment = z.object({
  method: z.literal("CARD"),
  holderName: cleanText(3, 80, "Nome impresso"),
  brand: z.enum(["visa", "mastercard", "elo", "amex", "hipercard"], { error: "Bandeira não suportada." }),
  last4: z.string().regex(/^\d{4}$/),
  token: z.string().regex(/^tok_demo_[A-Za-z0-9]{16,64}$/, "Token de cartão inválido."),
  installments: z.coerce.number().int().min(1).max(MAX_INSTALLMENTS),
});

export const checkoutSchema = z.object({
  items: z.array(cartItemSchema).min(1, "Carrinho vazio.").max(50),
  couponCode: couponCodeSchema.optional().nullable().or(z.literal("").transform(() => null)),
  recipientName: cleanText(3, 120, "Destinatário"),
  address: addressSchema,
  saveAddress: z.boolean().optional().default(false),
  payment: z.discriminatedUnion("method", [pixPayment, cardPayment]),
});
export type CheckoutInput = z.input<typeof checkoutSchema>;

export const orderNumberSchema = z.string().regex(/^MF-\d{8}-[A-Z0-9]{6}$/);
