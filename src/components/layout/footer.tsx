import Link from "next/link";
import { Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { FacebookIcon, InstagramIcon } from "@/components/brand/social-icons";
import { listActiveCategories } from "@/server/services/category.service";
import { getSettings } from "@/server/services/settings.service";

const paymentBadges = ["PIX", "Visa", "Mastercard", "Elo", "Amex"];

export async function Footer() {
  const [categories, settings] = await Promise.all([listActiveCategories(), getSettings()]);
  const heading = "mb-4 text-sm font-bold uppercase tracking-wider text-white";
  const link = "text-sm text-slate-400 transition-colors hover:text-white";

  return (
    <footer className="mt-20 bg-slate-950 text-slate-300">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Logo storeName={settings.storeName} logoUrl={settings.logoUrl} light />
          <p className="text-sm leading-relaxed text-slate-400">{settings.tagline}. Projeto fictício de e-commerce farmacêutico criado para portfólio.</p>
          <div className="flex gap-2">
            {[
              { label: "Instagram (demonstração)", Icon: InstagramIcon },
              { label: "Facebook (demonstração)", Icon: FacebookIcon },
            ].map(({ label, Icon }) => (
              <span key={label} title={label} aria-label={label} className="grid size-10 place-items-center rounded-xl bg-white/5 text-slate-400">
                <Icon className="size-5" />
              </span>
            ))}
          </div>
        </div>

        <div>
          <h2 className={heading}>Categorias</h2>
          <ul className="space-y-2.5">
            {categories.map((c) => (
              <li key={c.id}>
                <Link href={`/produtos?categoria=${c.slug}`} className={link}>{c.name}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className={heading}>Minha conta</h2>
          <ul className="space-y-2.5">
            <li><Link href="/conta" className={link}>Meus dados</Link></li>
            <li><Link href="/conta/pedidos" className={link}>Meus pedidos</Link></li>
            <li><Link href="/carrinho" className={link}>Carrinho</Link></li>
            <li><Link href="/recuperar-senha" className={link}>Recuperar senha</Link></li>
            <li><Link href="/produtos?promo=1" className={link}>Ofertas</Link></li>
          </ul>
        </div>

        <div>
          <h2 className={heading}>Atendimento</h2>
          <ul className="space-y-3 text-sm text-slate-400">
            <li className="flex gap-2.5"><Phone className="size-4 shrink-0 text-primary-200" /> {settings.contactPhone}</li>
            <li className="flex gap-2.5"><Mail className="size-4 shrink-0 text-primary-200" /> {settings.contactEmail}</li>
            <li className="flex gap-2.5"><MapPin className="size-4 shrink-0 text-primary-200" /> {settings.address}</li>
          </ul>
          <h2 className={`${heading} mt-6`}>Pagamento (simulado)</h2>
          <div className="flex flex-wrap gap-1.5">
            {paymentBadges.map((b) => (
              <span key={b} className="rounded-md bg-white/10 px-2 py-1 text-[11px] font-bold text-slate-200">{b}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-3 py-6 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
          <p className="flex items-start gap-2 md:max-w-3xl">
            <ShieldCheck className="size-4 shrink-0 text-primary-200" />
            <span>
              <strong className="text-slate-300">Aviso:</strong> {settings.storeName} é uma demonstração técnica de portfólio. Os produtos, marcas, registros e informações técnicas são fictícios. Não há venda nem dispensação de medicamentos, e nenhum pagamento é processado. Em caso de dúvidas sobre saúde, procure um profissional.
            </span>
          </p>
          <p className="shrink-0">© {new Date().getFullYear()} {settings.storeName} · Projeto de portfólio</p>
        </div>
      </div>
    </footer>
  );
}
