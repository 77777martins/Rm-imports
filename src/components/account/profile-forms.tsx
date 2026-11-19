"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Save } from "lucide-react";
import { toast } from "sonner";
import type { z } from "zod";
import { api } from "@/lib/api-client";
import { handleFormError } from "@/lib/form";
import { profileSchema } from "@/lib/validators/account";
import { changePasswordSchema } from "@/lib/validators/auth";
import { BR_STATES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { Card, Skeleton } from "@/components/ui/misc";
import { PasswordInput } from "@/components/auth/password-input";

interface Profile {
  name: string;
  email: string;
  phone: string | null;
  zipCode: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
  createdAt: string;
}

type ProfileValues = z.input<typeof profileSchema>;

export function ProfileForm() {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => (await api.get<{ user: Profile }>("/account/profile")).data.user,
  });
  const { register, handleSubmit, reset, formState, setError } = useForm<ProfileValues>({ resolver: zodResolver(profileSchema) });

  useEffect(() => {
    if (data)
      reset({
        name: data.name,
        phone: data.phone ?? "",
        zipCode: data.zipCode ?? "",
        street: data.street ?? "",
        number: data.number ?? "",
        complement: data.complement ?? "",
        district: data.district ?? "",
        city: data.city ?? "",
        state: (data.state ?? "") as ProfileValues["state"],
      });
  }, [data, reset]);

  const mutation = useMutation({
    mutationFn: async (values: ProfileValues) => (await api.patch<{ user: Profile }>("/account/profile", values)).data.user,
    onSuccess: (user) => {
      qc.setQueryData(["profile"], user);
      toast.success("Dados atualizados com sucesso!");
    },
    onError: (error) => handleFormError(error, setError),
  });

  if (isLoading) return <Card className="space-y-4 p-6">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-11" />)}</Card>;
  if (isError || !data)
    return (
      <Card className="p-6 text-sm text-slate-600">
        Não foi possível carregar seus dados. <Button size="sm" variant="outline" onClick={() => refetch()}>Tentar novamente</Button>
      </Card>
    );

  const e = formState.errors;
  return (
    <Card className="p-6">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-slate-900">Dados cadastrais</h2>
        <p className="text-sm text-slate-500">{data.email} · cliente desde {formatDate(data.createdAt)}</p>
      </div>
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="grid gap-4 sm:grid-cols-6" noValidate>
        <Input label="Nome completo" required wrapperClassName="sm:col-span-4" error={e.name?.message} {...register("name")} />
        <Input label="Celular" type="tel" placeholder="(11) 91234-5678" wrapperClassName="sm:col-span-2" error={e.phone?.message} {...register("phone")} />
        <p className="pt-2 text-sm font-bold text-slate-900 sm:col-span-6">Endereço padrão</p>
        <Input label="CEP" inputMode="numeric" wrapperClassName="sm:col-span-2" error={e.zipCode?.message} {...register("zipCode")} />
        <Input label="Rua" wrapperClassName="sm:col-span-4" error={e.street?.message} {...register("street")} />
        <Input label="Número" wrapperClassName="sm:col-span-2" error={e.number?.message} {...register("number")} />
        <Input label="Complemento" wrapperClassName="sm:col-span-4" error={e.complement?.message} {...register("complement")} />
        <Input label="Bairro" wrapperClassName="sm:col-span-2" error={e.district?.message} {...register("district")} />
        <Input label="Cidade" wrapperClassName="sm:col-span-3" error={e.city?.message} {...register("city")} />
        <Select label="UF" wrapperClassName="sm:col-span-1" error={e.state?.message} {...register("state")}>
          <option value="">—</option>
          {BR_STATES.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
        </Select>
        <div className="flex justify-end sm:col-span-6">
          <Button type="submit" loading={mutation.isPending} disabled={!formState.isDirty}>
            <Save className="size-4" /> Salvar alterações
          </Button>
        </div>
      </form>
    </Card>
  );
}

type PasswordValues = z.input<typeof changePasswordSchema>;

export function ChangePasswordForm() {
  const { register, handleSubmit, reset, formState, setError } = useForm<PasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });
  const mutation = useMutation({
    mutationFn: async (values: PasswordValues) => (await api.patch<{ message: string }>("/account/password", values)).data,
    onSuccess: (d) => {
      toast.success(d.message);
      reset();
    },
    onError: (error) => handleFormError(error, setError),
  });
  const e = formState.errors;
  return (
    <Card className="p-6">
      <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-slate-900"><KeyRound className="size-5 text-primary" /> Alterar senha</h2>
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="grid gap-4 sm:grid-cols-3" noValidate>
        <PasswordInput label="Senha atual" autoComplete="current-password" error={e.currentPassword?.message} {...register("currentPassword")} />
        <PasswordInput label="Nova senha" autoComplete="new-password" error={e.newPassword?.message} {...register("newPassword")} />
        <PasswordInput label="Confirmar nova senha" autoComplete="new-password" error={e.confirmPassword?.message} {...register("confirmPassword")} />
        <div className="flex justify-end sm:col-span-3">
          <Button type="submit" variant="secondary" loading={mutation.isPending}>Atualizar senha</Button>
        </div>
      </form>
    </Card>
  );
}
