import { FlaskConical } from "lucide-react";

/** Identificação explícita de que o site é uma demonstração de portfólio. */
export function DemoBar() {
  return (
    <div role="note" className="bg-slate-900 text-slate-200">
      <p className="container-page flex items-center justify-center gap-2 py-2 text-center text-[11px] leading-snug sm:text-xs">
        <FlaskConical className="size-3.5 shrink-0 text-emerald-400" aria-hidden />
        <span>
          <strong className="text-white">Projeto de portfólio.</strong> Loja fictícia: produtos, preços e pagamentos são simulados. Nada é vendido de verdade.
        </span>
      </p>
    </div>
  );
}
