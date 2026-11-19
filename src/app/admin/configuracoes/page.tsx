"use client";

import { useState } from "react";
import { Image as ImageIcon, Store, Ticket } from "lucide-react";
import { PageTitle } from "@/components/ui/misc";
import { SettingsStoreForm } from "@/components/admin/settings-store-form";
import { BannersManager } from "@/components/admin/banners-manager";
import { CouponsManager } from "@/components/admin/coupons-manager";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "loja", label: "Loja", icon: Store },
  { id: "banners", label: "Banners", icon: ImageIcon },
  { id: "cupons", label: "Cupons", icon: Ticket },
] as const;

export default function AdminSettingsPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("loja");
  return (
    <div>
      <PageTitle title="Configurações" description="Identidade visual, contato, banners e cupons demonstrativos." />
      <div role="tablist" aria-label="Seções de configuração" className="mb-6 inline-flex gap-1 rounded-2xl bg-white p-1 shadow-card">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn("flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors", tab === id ? "bg-primary text-white" : "text-slate-600 hover:bg-slate-50")}
          >
            <Icon className="size-4" /> {label}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        {tab === "loja" && <SettingsStoreForm />}
        {tab === "banners" && <BannersManager />}
        {tab === "cupons" && <CouponsManager />}
      </div>
    </div>
  );
}
