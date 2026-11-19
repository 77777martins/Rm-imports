import Link from "next/link";
import { Suspense } from "react";
import { BadgePercent, Headphones, Truck } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { getSession } from "@/server/auth/session";
import { listActiveCategories } from "@/server/services/category.service";
import { getSettings } from "@/server/services/settings.service";
import { formatCents } from "@/lib/utils";
import { SearchBar } from "./search-bar";
import { CartButton } from "./cart-button";
import { UserMenu } from "./user-menu";
import { MobileMenu } from "./mobile-menu";
import { CategoryIcon } from "./category-icon";

export async function Header() {
  const [session, categories, settings] = await Promise.all([getSession(), listActiveCategories(), getSettings()]);
  const user = session ? { name: session.name, email: session.email, role: session.role } : null;

  return (
    <header className="sticky top-0 z-40">
      <div className="hidden bg-primary-900 text-primary-50 md:block">
        <div className="container-page flex h-9 items-center justify-between text-xs">
          <span className="flex items-center gap-2">
            <Truck className="size-3.5" /> Frete grátis (simulado) acima de {formatCents(settings.freeShippingMinCents)}
          </span>
          <span className="flex items-center gap-5">
            <span className="flex items-center gap-1.5">
              <Headphones className="size-3.5" /> {settings.contactPhone}
            </span>
            <Link href="/produtos?promo=1" className="font-semibold hover:text-white">Ofertas da semana</Link>
          </span>
        </div>
      </div>

      <div className="border-b border-slate-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
        <div className="container-page flex h-[72px] items-center gap-3 md:gap-6">
          <MobileMenu categories={categories} user={user} storeName={settings.storeName} />
          <Logo storeName={settings.storeName} logoUrl={settings.logoUrl} className="shrink-0" />
          <Suspense fallback={<div className="hidden h-12 flex-1 rounded-2xl bg-slate-50 md:block" />}>
            <SearchBar className="hidden flex-1 md:block" />
          </Suspense>
          <div className="ml-auto flex items-center gap-1 md:ml-0">
            <UserMenu user={user} />
            <CartButton />
          </div>
        </div>
        <div className="container-page pb-3 md:hidden">
          <Suspense fallback={<div className="h-12 rounded-2xl bg-slate-50" />}>
            <SearchBar />
          </Suspense>
        </div>
      </div>

      <nav aria-label="Categorias" className="hidden border-b border-slate-100 bg-white lg:block">
        <ul className="container-page flex h-12 items-center justify-between gap-0.5 overflow-x-auto scrollbar-none">
          <li>
            <Link href="/produtos?promo=1" className="flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-2 text-[13px] font-bold text-red-600 2xl:px-3 2xl:text-sm hover:bg-red-50">
              <BadgePercent className="size-4" /> Ofertas
            </Link>
          </li>
          {categories.map((c) => (
            <li key={c.id}>
              <Link
                href={`/produtos?categoria=${c.slug}`}
                className="flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-2 text-[13px] font-medium text-slate-600 2xl:px-3 2xl:text-sm transition-colors hover:bg-primary-50 hover:text-primary"
              >
                <CategoryIcon name={c.icon} className="size-4" /> {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
