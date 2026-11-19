import { z } from "zod";
import { addressSchema, cleanText } from "./common";
import { detectBrand, isValidExpiry, luhnCheck, onlyDigits } from "@/lib/card";

/**
 * Schema do FORMULÁRIO de checkout (apenas no cliente).
 * Os dados completos do cartão são validados aqui e NUNCA enviados ao servidor.
 */
export const checkoutFormSchema = z
  .object({
    recipientName: cleanText(3, 120, "Destinatário"),
    address: addressSchema,
    saveAddress: z.boolean(),
    paymentMethod: z.enum(["PIX", "CARD"]),
    cardNumber: z.string().optional(),
    cardHolder: z.string().optional(),
    cardExpiry: z.string().optional(),
    cardCvv: z.string().optional(),
    installments: z.coerce.number().int().min(1).max(6),
  })
  .superRefine((d, ctx) => {
    if (d.paymentMethod !== "CARD") return;
    const number = onlyDigits(d.cardNumber ?? "");
    if (!luhnCheck(number)) ctx.addIssue({ code: "custom", path: ["cardNumber"], message: "Número de cartão inválido." });
    else if (detectBrand(number) === "desconhecida") ctx.addIssue({ code: "custom", path: ["cardNumber"], message: "Bandeira não suportada." });
    if (!d.cardHolder || d.cardHolder.trim().length < 3) ctx.addIssue({ code: "custom", path: ["cardHolder"], message: "Informe o nome impresso no cartão." });
    if (!isValidExpiry(d.cardExpiry ?? "")) ctx.addIssue({ code: "custom", path: ["cardExpiry"], message: "Validade inválida (MM/AA)." });
    const cvvLen = detectBrand(number) === "amex" ? 4 : 3;
    if (!new RegExp(`^\\d{${cvvLen}}$`).test(d.cardCvv ?? "")) ctx.addIssue({ code: "custom", path: ["cardCvv"], message: `CVV deve ter ${cvvLen} dígitos.` });
  });

export type CheckoutFormInput = z.input<typeof checkoutFormSchema>;
export type CheckoutFormOutput = z.output<typeof checkoutFormSchema>;
