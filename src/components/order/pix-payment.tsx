"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Copy, QrCode, Timer } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { handleFormError } from "@/lib/form";
import { Button } from "@/components/ui/button";

function useRemaining(expiresAt: string) {
  const [ms, setMs] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setMs(Math.max(0, new Date(expiresAt).getTime() - Date.now()));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [expiresAt]);
  return ms;
}

/** Painel de pagamento PIX FICTÍCIO com confirmação simulada. */
export function PixPayment({ orderNumber, pixCode, expiresAt }: { orderNumber: string; pixCode: string; expiresAt: string }) {
  const router = useRouter();
  const [qr, setQr] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const remaining = useRemaining(expiresAt);

  useEffect(() => {
    QRCode.toDataURL(pixCode, { margin: 1, width: 240, color: { dark: "#0f172a", light: "#ffffff" } }).then(setQr).catch(() => setQr(null));
  }, [pixCode]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(pixCode);
      toast.success("Código PIX copiado!");
    } catch {
      toast.error("Não foi possível copiar. Selecione o código manualmente.");
    }
  };

  const simulate = async () => {
    setPaying(true);
    try {
      await api.post(`/orders/${orderNumber}/pix`);
      toast.success("Pagamento PIX confirmado (simulação)!");
      router.refresh();
    } catch (error) {
      handleFormError(error);
    } finally {
      setPaying(false);
    }
  };

  const expired = remaining === 0;
  const mm = remaining !== null ? String(Math.floor(remaining / 60_000)).padStart(2, "0") : "--";
  const ss = remaining !== null ? String(Math.floor((remaining / 1000) % 60)).padStart(2, "0") : "--";

  return (
    <div className="rounded-3xl border-2 border-primary-200 bg-white p-6 shadow-card">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <QrCode className="size-5 text-primary" /> Pague com PIX
        </h2>
        <span className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-semibold ${expired ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"}`}>
          <Timer className="size-4" /> {expired ? "Expirado" : `Expira em ${mm}:${ss}`}
        </span>
      </div>
      <div className="grid items-center gap-6 sm:grid-cols-[200px_1fr]">
        <div className="mx-auto grid size-48 place-items-center rounded-2xl border border-slate-100 bg-white p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {qr ? <img src={qr} alt="QR Code PIX fictício" className="size-full" /> : <div className="size-full animate-pulse rounded-xl bg-slate-100" />}
        </div>
        <div className="space-y-3">
          <p className="text-sm text-slate-600">Este QR Code é <strong>fictício</strong> e não pode ser pago em bancos reais. Use o botão abaixo para simular a confirmação.</p>
          <div className="flex gap-2">
            <input readOnly value={pixCode} aria-label="Código PIX copia e cola" className="h-10 min-w-0 flex-1 truncate rounded-xl border border-slate-200 bg-slate-50 px-3 font-mono text-xs text-slate-600" onFocus={(e) => e.target.select()} />
            <Button variant="outline" size="sm" className="h-10" onClick={copy}>
              <Copy className="size-4" /> Copiar
            </Button>
          </div>
          <Button size="lg" className="w-full" onClick={simulate} loading={paying} disabled={expired}>
            Simular pagamento confirmado
          </Button>
        </div>
      </div>
    </div>
  );
}
