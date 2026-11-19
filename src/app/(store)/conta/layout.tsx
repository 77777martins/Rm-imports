import { AccountNav } from "@/components/account/account-nav";
import { requireUser } from "@/server/auth/session";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  // Defesa em profundidade: o proxy já protege, mas o layout também valida.
  const session = await requireUser().catch(() => null);
  return (
    <div className="container-page py-8">
      <div className="mb-6">
        <p className="text-sm text-slate-500">Minha conta</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Olá, {session?.name.split(" ")[0] ?? "cliente"}!</h1>
      </div>
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside><AccountNav /></aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
