import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/server/auth/session";
import { getSettings } from "@/server/services/settings.service";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata: Metadata = { title: { default: "Painel", template: "%s | Admin MedFácil" }, robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Defesa em profundidade: além do proxy, o papel é revalidado no banco.
  const session = await requireAdmin().catch(() => null);
  if (!session) redirect("/entrar?next=/admin");
  const settings = await getSettings();
  return (
    <AdminShell user={{ name: session.name, email: session.email }} storeName={settings.storeName}>
      {children}
    </AdminShell>
  );
}
