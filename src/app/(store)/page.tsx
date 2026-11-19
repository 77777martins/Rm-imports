import Link from "next/link";
import { ArrowRight, BadgePercent, Sparkles } from "lucide-react";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { Benefits, CategoriesGrid, ProductShelf, SectionHeader } from "@/components/home/sections";
import { Countdown } from "@/components/home/countdown";
import { listShowcase } from "@/server/services/product.service";
import { listActiveCategories } from "@/server/services/category.service";
import { getSettings, listActiveBanners } from "@/server/services/settings.service";

export default async function HomePage() {
  const [banners, categories, offers, featured, bestSellers, settings] = await Promise.all([
    listActiveBanners(),
    listActiveCategories(),
    listShowcase("offers", 8),
    listShowcase("featured", 8),
    listShowcase("best-sellers", 8),
    getSettings(),
  ]);

  return (
    <div className="container-page space-y-16 py-6 md:py-8">
      <div className="space-y-6">
        <HeroCarousel banners={banners} />
        <Benefits freeShippingMinCents={settings.freeShippingMinCents} />
      </div>

      <section aria-labelledby="cat-title">
        <SectionHeader title="Navegue por categorias" subtitle="Encontre o que precisa em poucos cliques" href="/produtos" />
        <h2 id="cat-title" className="sr-only">Categorias</h2>
        <CategoriesGrid categories={categories} />
      </section>

      {offers.length > 0 && (
        <section>
          <SectionHeader title="Ofertas do dia" subtitle="Descontos fictícios por tempo limitado" href="/produtos?promo=1" extra={<Countdown />} />
          <ProductShelf products={offers} />
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2">
        <Link href="/produtos?categoria=suplementos" className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-secondary to-secondary-700 p-8 text-white">
          <Sparkles className="absolute -right-6 -top-6 size-40 text-white/10" aria-hidden />
          <p className="text-sm font-semibold text-white/80">Suplementos</p>
          <p className="mt-1 max-w-xs text-2xl font-extrabold">Energia e performance para sua rotina</p>
          <span className="mt-5 inline-flex items-center gap-1 text-sm font-bold">Conferir <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span>
        </Link>
        <Link href="/produtos?promo=1" className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary-800 p-8 text-white">
          <BadgePercent className="absolute -right-6 -top-6 size-40 text-white/10" aria-hidden />
          <p className="text-sm font-semibold text-white/80">Cupom BEMVINDO10</p>
          <p className="mt-1 max-w-xs text-2xl font-extrabold">10% OFF na sua primeira compra demonstrativa</p>
          <span className="mt-5 inline-flex items-center gap-1 text-sm font-bold">Ver ofertas <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span>
        </Link>
      </section>

      {featured.length > 0 && (
        <section>
          <SectionHeader title="Destaques" subtitle="Seleção especial da nossa equipe" href="/produtos" />
          <ProductShelf products={featured} />
        </section>
      )}

      <section>
        <SectionHeader title="Mais vendidos" subtitle="Os favoritos dos clientes (dados fictícios)" href="/produtos?ordem=best-sellers" />
        <ProductShelf products={bestSellers} />
      </section>
    </div>
  );
}
