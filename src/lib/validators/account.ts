import { z } from "zod";
import { BR_STATES } from "@/lib/constants";
import { cleanText, optionalText, phoneSchema } from "./common";

const optionalZip = z
  .string()
  .trim()
  .regex(/^(\d{5}-?\d{3})?$/, "CEP inválido.")
  .optional()
  .nullable()
  .transform((v) => (v ? v.replace(/\D/g, "").replace(/^(\d{5})(\d{3})$/, "$1-$2") : null));

export const profileSchema = z.object({
  name: cleanText(3, 120, "Nome"),
  phone: phoneSchema,
  zipCode: optionalZip,
  street: optionalText(160, "Rua"),
  number: optionalText(20, "Número"),
  complement: optionalText(80, "Complemento"),
  district: optionalText(80, "Bairro"),
  city: optionalText(80, "Cidade"),
  state: z
    .enum(BR_STATES)
    .optional()
    .nullable()
    .or(z.literal("").transform(() => null)),
});
export type ProfileInput = z.input<typeof profileSchema>;
