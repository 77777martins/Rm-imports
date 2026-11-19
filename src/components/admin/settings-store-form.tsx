"use client";

import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { toast } from "sonner";
import type { z } from "zod";
import { api } from "@/lib/api-client";
import { handleFormError } from "@/lib/form";
import { settingsSchema } from "@/lib/validators/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Card, Skeleton } from "@/components/ui/misc";
import { LogoMark } from "@/components/brand/logo";
import { ColorInput, MoneyInput } from "./inputs";

type FormIn = z.input<typeof settingsSchema>;
type FormOut = z.output<typeof settingsSchema>;

export function SettingsStoreForm() {
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: async () => (await api.get<{ settings: FormIn }>("/admin/settings")).data.settings,
  });
  const { register, handleSubmit, control, formState, setError, watch } = useForm<FormIn, unknown, FormOut>({
    resolver: zodResolver(settingsSchema),
    values: data ? { ...data, logoUrl: data.logoUrl ?? "" } : undefined,
  });
  const mutation = useMutation({
    mutationFn: async (v: FormOut) => api.put("/admin/settings", v),
    onSuccess: () => {
      toast.success("Configurações salvas. A loja já reflete as alterações.");
      router.refresh();
    },
    onError: (e) => handleFormError(e, setError),
  });

  if (isLoading || !data) return <Skeleton className="h-[560px] rounded-2xl" />;
  const e = formState.errors;
  const primary = watch("primaryColor");
  const secondary = watch("secondaryColor");

  return (
    <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate className="grid items-start gap-6 xl:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <Card className="p-6">
          <h2 className="mb-4 font-bold text-slate-900">Identidade</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Nome da loja" required error={e.storeName?.message} {...register("storeName")} />
            <Input label="Slogan" required error={e.tagline?.message} {...register("tagline")} />
            <Input label="URL do logotipo (opcional)" placeholder="https://..." hint="Somente https. Vazio = logotipo padrão." wrapperClassName="sm:col-span-2" error={e.logoUrl?.message} {...register("logoUrl")} />
            <Controller control={control} name="primaryColor" render={({ field }) => <ColorInput label="Cor primária" value={field.value} onChange={field.onChange} error={e.primaryColor?.message} />} />
            <Controller control={control} name="secondaryColor" render={({ field }) => <ColorInput label="Cor secundária" value={field.value} onChange={field.onChange} error={e.secondaryColor?.message} />} />
          </div>
        </Card>
        <Card className="p-6">
          <h2 className="mb-4 font-bold text-slate-900">Contato e entrega</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="E-mail de contato" type="email" required error={e.contactEmail?.message} {...register("contactEmail")} />
            <Input label="Telefone" required error={e.contactPhone?.message} {...register("contactPhone")} />
            <Input label="WhatsApp (DDI+DDD+número)" required placeholder="5511912345678" error={e.whatsapp?.message} {...register("whatsapp")} />
            <Controller control={control} name="freeShippingMinCents" render={({ field }) => <MoneyInput label="Frete grátis a partir de" required value={field.value as number} onChange={field.onChange} error={e.freeShippingMinCents?.message} />} />
            <Input label="Endereço" required wrapperClassName="sm:col-span-2" error={e.address?.message} {...register("address")} />
          </div>
        </Card>
      </div>
      <Card className="p-6 xl:sticky xl:top-24">
        <h2 className="mb-4 font-bold text-slate-900">Pré-visualização</h2>
        <div className="space-y-3" style={{ "--primary": /^#[0-9a-f]{6}$/i.test(primary) ? primary : undefined, "--secondary": /^#[0-9a-f]{6}$/i.test(secondary) ? secondary : undefined } as React.CSSProperties}>
          <div className="flex items-center gap-2"><LogoMark /><span className="text-lg font-extrabold">{watch("storeName")}</span></div>
          <div className="rounded-2xl bg-gradient-to-br from-primary to-secondary p-4 text-sm font-semibold text-white">{watch("tagline")}</div>
          <div className="flex gap-2">
            <span className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white">Primária</span>
            <span className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-bold text-white">Secundária</span>
          </div>
        </div>
        <Button type="submit" className="mt-6 w-full" loading={mutation.isPending}><Save className="size-4" /> Salvar configurações</Button>
      </Card>
    </form>
  );
}
