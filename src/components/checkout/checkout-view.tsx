"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { CreditCard, Lock, MapPin, QrCode, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { handleFormError } from "@/lib/form";
import { checkoutFormSchema, type CheckoutFormInput, type CheckoutFormOutput } from "@/lib/validators/checkout-form";
import { createDemoCardToken, detectBrand, formatCardNumber, onlyDigits, DEMO_CARDS } from "@/lib/card";
import { BR_STATES } from "@/lib/constants";
import { formatCents, cn } from "@/lib/utils";
import { isValidZip } from "@/lib/pricing";
import { useCartStore } from "@/stores/cart-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { useCartQuote } from "@/hooks/use-cart-quote";
import { Button, ButtonLink } from "@/components/ui/button";
import { Checkbox, Input, Select } from "@/components/ui/field";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { ProductVisual } from "@/components/product/product-visual";
import { OrderSummary } from "@/components/cart/order-summary";

interface Profile {
  name: string;
  zipCode: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
}

function Section({ step, title, icon, children }: { step: number; title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
      <h2 className="mb-5 flex items-center gap-3 text-lg font-bold text-slate-900">
        <span className="grid size-8 place-items-center rounded-full bg-primary text-sm text-white">{step}</span>
        {icon} {title}
      </h2>
      {children}
    </section>
  );
}

export function CheckoutView() {
  const router = useRouter();
  const hydrated = useHydrated();
  const items = useCartStore((s) => s.items);
  const couponCode = useCartStore((s) => s.couponCode);
  const clear = useCartStore((s) => s.clear);
  const setZip = useCartStore((s) => s.setZip);
  const [placing, setPlacing] = useState(false);

  const profile = useQuery({
    queryKey: ["profile"],
    queryFn: async () => (await api.get<{ user: Profile }>("/account/profile")).data.user,
  });

  const form = useForm<CheckoutFormInput, unknown, CheckoutFormOutput>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      recipientName: "",
      address: { zipCode: "", street: "", number: "", complement: "", district: "", city: "", state: "SP" },
      saveAddress: true,
      paymentMethod: "PIX",
      installments: 1,
    },
  });
  const { register, handleSubmit, formState, setValue, reset, control, setError } = form;
  const e = formState.errors;

  // Pré-preenche com os dados do perfil.
  useEffect(() => {
    const p = profile.data;
    if (!p) return;
    reset((current) => ({
      ...current,
      recipientName: p.name,
      address: {
        zipCode: p.zipCode ?? "",
        street: p.street ?? "",
        number: p.number ?? "",
        complement: p.complement ?? "",
        district: p.district ?? "",
        city: p.city ?? "",
        state: (p.state as CheckoutFormInput["address"]["state"]) ?? "SP",
      },
    }));
  }, [profile.data, reset]);

  const zip = useWatch({ control, name: "address.zipCode" });
  const method = useWatch({ control, name: "paymentMethod" });
  const cardNumber = useWatch({ control, name: "cardNumber" }) ?? "";
  const effectiveZip = zip && isValidZip(zip) ? zip : null;
  const { data: quote, isFetching } = useCartQuote(effectiveZip);
  const brand = detectBrand(cardNumber);

  useEffect(() => {
    if (effectiveZip) setZip(effectiveZip);
  }, [effectiveZip, setZip]);

  if (!hydrated) return <Skeleton className="h-[600px] rounded-3xl" />;
  if (items.length === 0 && !placing) {
    return (
      <EmptyState
        icon={<ShoppingBag className="size-7" />}
        title="Não há itens para finalizar"
        description="Adicione produtos ao carrinho para continuar."
        action={<ButtonLink href="/produtos">Ver produtos</ButtonLink>}
      />
    );
  }

  const onSubmit = handleSubmit(async (values) => {
    setPlacing(true);
    try {
      const payment =
        values.paymentMethod === "PIX"
          ? { method: "PIX" as const }
          : {
              method: "CARD" as const,
              holderName: values.cardHolder!.toUpperCase(),
              brand: detectBrand(values.cardNumber!),
              last4: onlyDigits(values.cardNumber!).slice(-4),
              token: createDemoCardToken(),
              installments: values.installments,
            };
      const { data } = await api.post<{ order: { number: string; status: string } }>("/orders", {
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        couponCode: quote?.coupon?.valid ? couponCode : null,
        recipientName: values.recipientName,
        address: values.address,
        saveAddress: values.saveAddress,
        payment,
      });
      clear();
      toast.success(data.order.status === "PAID" ? "Pagamento aprovado! Pedido confirmado." : "Pedido criado! Finalize o pagamento via PIX.");
      router.replace(`/pedido/${data.order.number}`);
    } catch (error) {
      setPlacing(false);
      handleFormError(error, setError);
    }
  });

  const installmentsMax = quote?.maxInstallments ?? 1;

  return (
    <form onSubmit={onSubmit} noValidate className="grid items-start gap-6 lg:grid-cols-[1fr_400px]">
      <div className="space-y-6">
        <Section step={1} title="Endereço de entrega" icon={<MapPin className="size-5 text-primary" />}>
          {profile.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-11" />)}</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-6">
              <Input label="Destinatário" required wrapperClassName="sm:col-span-6" error={e.recipientName?.message} {...register("recipientName")} />
              <Input
                label="CEP"
                required
                inputMode="numeric"
                placeholder="00000-000"
                wrapperClassName="sm:col-span-2"
                error={e.address?.zipCode?.message}
                {...register("address.zipCode", {
                  onChange: (ev) => setValue("address.zipCode", ev.target.value.replace(/[^\d-]/g, "").slice(0, 9)),
                })}
              />
              <Input label="Rua / Avenida" required wrapperClassName="sm:col-span-4" error={e.address?.street?.message} {...register("address.street")} />
              <Input label="Número" required wrapperClassName="sm:col-span-2" error={e.address?.number?.message} {...register("address.number")} />
              <Input label="Complemento" wrapperClassName="sm:col-span-4" error={e.address?.complement?.message} {...register("address.complement")} />
              <Input label="Bairro" required wrapperClassName="sm:col-span-2" error={e.address?.district?.message} {...register("address.district")} />
              <Input label="Cidade" required wrapperClassName="sm:col-span-3" error={e.address?.city?.message} {...register("address.city")} />
              <Select label="UF" required wrapperClassName="sm:col-span-1" error={e.address?.state?.message} {...register("address.state")}>
                {BR_STATES.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
              </Select>
              <div className="sm:col-span-6">
                <Checkbox label="Salvar este endereço no meu perfil" {...register("saveAddress")} />
              </div>
            </div>
          )}
        </Section>

        <Section step={2} title="Pagamento" icon={<Lock className="size-5 text-primary" />}>
          <div className="mb-5 grid grid-cols-2 gap-3" role="radiogroup" aria-label="Forma de pagamento">
            {[
              { value: "PIX" as const, label: "PIX", desc: "Aprovação imediata", icon: QrCode },
              { value: "CARD" as const, label: "Cartão de crédito", desc: installmentsMax > 1 ? `Até ${installmentsMax}x sem juros` : "À vista", icon: CreditCard },
            ].map((opt) => (
              <label
                key={opt.value}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-4 transition-colors",
                  method === opt.value ? "border-primary bg-primary-50" : "border-slate-100 hover:border-slate-200",
                )}
              >
                <input type="radio" value={opt.value} className="sr-only" {...register("paymentMethod")} />
                <opt.icon className={cn("size-6", method === opt.value ? "text-primary" : "text-slate-400")} />
                <span>
                  <span className="block text-sm font-bold text-slate-900">{opt.label}</span>
                  <span className="block text-xs text-slate-500">{opt.desc}</span>
                </span>
              </label>
            ))}
          </div>

          {method === "PIX" ? (
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              Após confirmar, você verá um <strong>QR Code PIX fictício</strong> e um botão para <strong>simular a confirmação do pagamento</strong>. O código expira em 30 minutos.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
                <strong>Não digite dados reais.</strong> Use um cartão de teste:{" "}
                {DEMO_CARDS.map((c) => (
                  <button
                    key={c.number}
                    type="button"
                    onClick={() => {
                      setValue("cardNumber", c.number, { shouldValidate: true });
                      setValue("cardHolder", "CLIENTE DEMO");
                      setValue("cardExpiry", "12/30");
                      setValue("cardCvv", "123");
                    }}
                    className="font-semibold underline underline-offset-2 hover:text-amber-700"
                  >
                    {c.label}
                  </button>
                )).flatMap((el, i) => (i === 0 ? [el] : [<span key={`sep-${i}`}>, </span>, el]))}
                . O número completo nunca é enviado ao servidor.
              </div>
              <div className="grid gap-4 sm:grid-cols-4">
                <Input
                  label="Número do cartão"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  placeholder="0000 0000 0000 0000"
                  wrapperClassName="sm:col-span-4"
                  rightSlot={cardNumber ? <span className="mr-2 text-[11px] font-bold uppercase text-slate-500">{brand !== "desconhecida" ? brand : ""}</span> : null}
                  error={e.cardNumber?.message}
                  {...register("cardNumber", { onChange: (ev) => setValue("cardNumber", formatCardNumber(ev.target.value)) })}
                />
                <Input label="Nome impresso" autoComplete="cc-name" wrapperClassName="sm:col-span-4" error={e.cardHolder?.message} {...register("cardHolder")} />
                <Input
                  label="Validade"
                  placeholder="MM/AA"
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  wrapperClassName="sm:col-span-1"
                  error={e.cardExpiry?.message}
                  {...register("cardExpiry", {
                    onChange: (ev) => {
                      const d = onlyDigits(ev.target.value).slice(0, 4);
                      setValue("cardExpiry", d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d);
                    },
                  })}
                />
                <Input
                  label="CVV"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  type="password"
                  maxLength={4}
                  wrapperClassName="sm:col-span-1"
                  error={e.cardCvv?.message}
                  {...register("cardCvv")}
                />
                <Select label="Parcelas" wrapperClassName="sm:col-span-2" {...register("installments")}>
                  {Array.from({ length: installmentsMax }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}x de {formatCents(Math.floor((quote?.totals.totalCents ?? 0) / n))} sem juros
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          )}
        </Section>
      </div>

      <div className="space-y-4 lg:sticky lg:top-44">
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-card">
          <h2 className="mb-3 text-sm font-bold text-slate-900">Itens ({items.reduce((s, i) => s + i.quantity, 0)})</h2>
          <ul className="max-h-60 space-y-3 overflow-y-auto pr-1">
            {items.map((i) => (
              <li key={i.productId} className="flex items-center gap-3">
                <ProductVisual name={i.name} packaging={i.packaging} accentColor={i.accentColor} imageUrl={i.imageUrl} className="size-12 shrink-0 rounded-lg" compact />
                <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{i.quantity}× {i.name}</span>
                <span className="text-sm font-semibold">{formatCents(i.unitPriceCents * i.quantity)}</span>
              </li>
            ))}
          </ul>
        </div>
        {quote ? (
          <OrderSummary totals={quote.totals} freeShippingMinCents={quote.freeShippingMinCents} couponCode={quote.coupon?.valid ? couponCode : null} loading={isFetching}>
            <Button type="submit" size="lg" className="w-full" loading={placing || formState.isSubmitting}>
              <Lock className="size-4" /> {method === "PIX" ? "Gerar PIX e confirmar pedido" : "Pagar e confirmar pedido"}
            </Button>
            <p className="text-center text-xs text-slate-400">Pagamento 100% simulado. Nenhum valor será cobrado.</p>
          </OrderSummary>
        ) : (
          <Skeleton className="h-72 rounded-3xl" />
        )}
      </div>
    </form>
  );
}
