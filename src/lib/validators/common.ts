import { z } from "zod";
import { BR_STATES } from "@/lib/constants";

/** Remove caracteres de controle e espaços extras. Defesa em profundidade contra XSS/log injection. */
export const cleanText = (min: number, max: number, label = "Campo") =>
  z
    .string({ error: `${label} é obrigatório.` })
    .transform((v) => v.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim())
    .pipe(z.string().min(min, min === 1 ? `${label} não pode ficar vazio.` : `${label} deve ter ao menos ${min} caracteres.`).max(max, `${label} deve ter no máximo ${max} caracteres.`));

export const optionalText = (max: number, label = "Campo") =>
  z
    .string()
    .max(max, `${label} deve ter no máximo ${max} caracteres.`)
    .transform((v) => v.replace(/[\u0000-\u001F\u007F]/g, " ").trim())
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));

export const emailSchema = z
  .string({ error: "E-mail é obrigatório." })
  .trim()
  .toLowerCase()
  .pipe(z.email("E-mail inválido.").max(160));

export const passwordSchema = z
  .string({ error: "Senha é obrigatória." })
  .min(8, "A senha deve ter ao menos 8 caracteres.")
  .max(72, "A senha deve ter no máximo 72 caracteres.") // limite do bcrypt
  .regex(/[a-z]/, "Inclua ao menos uma letra minúscula.")
  .regex(/[A-Z]/, "Inclua ao menos uma letra maiúscula.")
  .regex(/\d/, "Inclua ao menos um número.");

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\(?\d{2}\)?\s?9?\d{4}-?\d{4}$/, "Telefone inválido. Ex.: (11) 91234-5678")
  .optional()
  .nullable()
  .or(z.literal("").transform(() => null));

export const zipSchema = z
  .string({ error: "CEP é obrigatório." })
  .trim()
  .regex(/^\d{5}-?\d{3}$/, "CEP inválido. Ex.: 01310-100")
  .transform((v) => v.replace(/\D/g, "").replace(/^(\d{5})(\d{3})$/, "$1-$2"));

export const stateSchema = z.enum(BR_STATES, { error: "UF inválida." });

export const hexColorSchema = z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "Cor deve estar no formato #RRGGBB.");

/** Aceita apenas URLs https (ou caminhos internos) — evita javascript:, data: etc. */
export const imageUrlSchema = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || v.startsWith("/") && !v.startsWith("//") || /^https:\/\/[^\s"'<>]+$/i.test(v), "Use uma URL https:// ou um caminho interno.")
  .optional()
  .nullable()
  .transform((v) => (v ? v : null));

export const internalHrefSchema = z
  .string()
  .trim()
  .max(200)
  .refine((v) => v === "" || (v.startsWith("/") && !v.startsWith("//")), "Use um caminho interno, ex.: /produtos?categoria=vitaminas")
  .optional()
  .nullable()
  .transform((v) => (v ? v : null));

export const idSchema = z.string().min(1).max(40).regex(/^[a-z0-9]+$/i, "Identificador inválido.");

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).catch(1),
  pageSize: z.coerce.number().int().min(1).max(100).catch(20),
});

export const addressSchema = z.object({
  zipCode: zipSchema,
  street: cleanText(3, 160, "Rua"),
  number: cleanText(1, 20, "Número"),
  complement: optionalText(80, "Complemento"),
  district: cleanText(2, 80, "Bairro"),
  city: cleanText(2, 80, "Cidade"),
  state: stateSchema,
});
export type AddressInput = z.input<typeof addressSchema>;
