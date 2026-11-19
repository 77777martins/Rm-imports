"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import type { PackagingType } from "@/generated/prisma/enums";
import { ProductVisual } from "@/components/product/product-visual";

export interface HeroBanner {
  id: string;
  title: string;
  subtitle: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  imageUrl: string | null;
  colorFrom: string;
  colorTo: string;
}

const DECOR: { packaging: PackagingType; color: string; name: string }[][] = [
  [{ packaging: "BOTTLE", color: "#f97316", name: "VitaC" }, { packaging: "BOX", color: "#eab308", name: "SolarD" }, { packaging: "JAR", color: "#16a34a", name: "Multivita" }],
  [{ packaging: "BOX", color: "#0ea5e9", name: "Analgex" }, { packaging: "SPRAY", color: "#dc2626", name: "Antisséptico" }, { packaging: "TUBE", color: "#7c3aed", name: "Musculin" }],
  [{ packaging: "TUBE", color: "#f59e0b", name: "Protetor" }, { packaging: "BOTTLE", color: "#ec4899", name: "Micelar" }, { packaging: "JAR", color: "#0ea5e9", name: "Hidratante" }],
];

export function HeroCarousel({ banners }: { banners: HeroBanner[] }) {
  const [[index, direction], setState] = useState<[number, number]>([0, 0]);
  const [paused, setPaused] = useState(false);
  const count = banners.length;

  const go = useCallback((dir: number) => setState(([i]) => [(i + dir + count) % count, dir]), [count]);

  useEffect(() => {
    if (paused || count <= 1) return;
    const t = setInterval(() => go(1), 6000);
    return () => clearInterval(t);
  }, [paused, count, go]);

  if (!count) return null;
  const banner = banners[index];
  const decor = DECOR[index % DECOR.length];

  return (
    <section
      aria-roledescription="carrossel"
      aria-label="Promoções"
      className="relative overflow-hidden rounded-3xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={banner.id}
          custom={direction}
          initial={{ opacity: 0, x: direction >= 0 ? 60 : -60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction >= 0 ? -60 : 60 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative grid min-h-[340px] items-center gap-6 px-6 py-10 sm:px-16 md:min-h-[380px] lg:px-20 md:grid-cols-[1.2fr_1fr]"
          style={{ background: `linear-gradient(120deg, ${banner.colorFrom}, ${banner.colorTo})` }}
          aria-roledescription="slide"
          aria-label={`${index + 1} de ${count}`}
        >
          <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-white/10" aria-hidden />
          <div className="pointer-events-none absolute -bottom-32 left-1/3 size-80 rounded-full bg-white/5" aria-hidden />
          <div className="relative z-10 max-w-xl text-white">
            <span className="mb-4 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">Oferta demonstrativa</span>
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">{banner.title}</h1>
            {banner.subtitle && <p className="mt-4 max-w-md text-base text-white/85 sm:text-lg">{banner.subtitle}</p>}
            {banner.ctaHref && (
              <Link href={banner.ctaHref} className="mt-7 inline-flex h-12 items-center gap-2 rounded-xl bg-white px-6 text-sm font-bold text-slate-900 shadow-lg transition-transform hover:-translate-y-0.5">
                {banner.ctaLabel ?? "Saiba mais"} <ArrowRight className="size-4" />
              </Link>
            )}
          </div>
          <div className="relative z-10 hidden h-full items-center justify-center md:flex">
            {banner.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={banner.imageUrl} alt="" className="max-h-72 object-contain drop-shadow-2xl" referrerPolicy="no-referrer" />
            ) : (
              <div className="relative h-72 w-full max-w-sm">
                {decor.map((d, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: [0, -8, 0] }}
                    transition={{ opacity: { delay: 0.15 * i }, y: { duration: 4 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 } }}
                    className="absolute"
                    style={{
                      left: `${[4, 34, 62][i]}%`,
                      top: `${[22, 0, 26][i]}%`,
                      width: `${[42, 48, 40][i]}%`,
                      zIndex: i === 1 ? 2 : 1,
                    }}
                  >
                    <div className="rounded-3xl bg-white/90 p-2 shadow-2xl backdrop-blur">
                      <ProductVisual name={d.name} packaging={d.packaging} accentColor={d.color} className="rounded-2xl bg-transparent" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {count > 1 && (
        <>
          <button onClick={() => go(-1)} aria-label="Banner anterior" className="absolute left-3 top-1/2 z-20 hidden size-10 -translate-y-1/2 place-items-center rounded-full bg-white/20 text-white backdrop-blur transition-colors hover:bg-white/35 sm:grid">
            <ChevronLeft className="size-5" />
          </button>
          <button onClick={() => go(1)} aria-label="Próximo banner" className="absolute right-3 top-1/2 z-20 hidden size-10 -translate-y-1/2 place-items-center rounded-full bg-white/20 text-white backdrop-blur transition-colors hover:bg-white/35 sm:grid">
            <ChevronRight className="size-5" />
          </button>
          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {banners.map((b, i) => (
              <button
                key={b.id}
                onClick={() => setState([i, i > index ? 1 : -1])}
                aria-label={`Ir para o banner ${i + 1}`}
                aria-current={i === index}
                className={`h-2 rounded-full transition-all ${i === index ? "w-8 bg-white" : "w-2 bg-white/50 hover:bg-white/80"}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
