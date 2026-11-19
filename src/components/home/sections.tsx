import Link from "next/link";
import { ArrowRight, CreditCard, Headphones, QrCode, ShieldCheck, Truck } from "lucide-react";
import type { ProductCardData } from "@/server/services/product.service";
import { ProductCard } from "@/components/product/product-card";
import { CategoryIcon } from "@/components/layout/category-icon";
import { formatCents } from "@/lib/utils";

export function SectionHeader({ title, subtitle, href, extra }: { title: string; subtitle?: string; href?: string; extra?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-4">
        {extra}
        {href && (
          <Link href={href} className="group flex items-center gap-1 text-sm font-bold text-primary hover:text-primary-800">
            Ver todos <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>
    </div>
  );
}

/** Vitrine com rolagem horizontal no mobile e grade no desktop. */
export function ProductShelf({ products }: { products: ProductCardData[] }) {
  return (
    <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 scrollbar-none sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-4">
      {products.map((p) => (
        <div key={p.id} className="w-[62%] shrink-0 snap-start sm:w-auto">
          <ProductCard product={p} />
        </div>
      ))}
    </div>
  );
}

export function Benefits({ freeShippingMinCents }: { freeShippingMinCents: number }) {
  const items = [
    { icon: Truck, title: "Frete grátis", text: `Acima de ${formatCents(freeShippingMinCents)} (simulado)` },
    { icon: QrCode, title: "PIX instantâneo", text: "Aprovação simulada na hora" },
    { icon: CreditCard, title: "Até 6x sem juros", text: "Parcelamento demonstrativo" },
    { icon: ShieldCheck, title: "Compra segura", text: "Dados protegidos e criptografia" },
    { icon: Headphones, title: "Atendimento", text: "Suporte demonstrativo 7 dias" },
  ];
  return (
    <section aria-label="Benefícios" className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
      {items.map(({ icon: Icon, title, text }, i) => (
        <div key={title} className={`flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-card ${i === 4 ? "col-span-2 md:col-span-1" : ""}`}>
          <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary">
            <Icon className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900">{title}</p>
            <p className="text-xs text-slate-500">{text}</p>
          </div>
        </div>
      ))}
    </section>
  );
}

const CATEGORY_TINTS = ["#0284c7", "#e11d48", "#f59e0b", "#7c3aed", "#ec4899", "#16a34a", "#dc2626", "#0ea5e9"];

export function CategoriesGrid({ categories }: { categories: { id: string; name: string; slug: string; icon: string; description: string | null }[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
      {categories.map((c, i) => {
        const tint = CATEGORY_TINTS[i % CATEGORY_TINTS.length];
        return (
          <Link
            key={c.id}
            href={`/produtos?categoria=${c.slug}`}
            className="group flex flex-col items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 text-center shadow-card transition-all hover:-translate-y-1 hover:shadow-lift"
          >
            <span className="grid size-16 place-items-center rounded-2xl transition-transform group-hover:scale-110" style={{ background: `${tint}14`, color: tint }}>
              <CategoryIcon name={c.icon} className="size-8" />
            </span>
            <span className="text-sm font-semibold leading-tight text-slate-800">{c.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
