"use client";

import { useEffect, useState } from "react";
import { Timer } from "lucide-react";

function untilMidnight() {
  const now = new Date();
  const end = new Date(now);
  end.setHours(24, 0, 0, 0);
  const diff = Math.max(0, end.getTime() - now.getTime());
  return [Math.floor(diff / 3_600_000), Math.floor((diff / 60_000) % 60), Math.floor((diff / 1000) % 60)];
}

/** Contador fictício das "ofertas do dia" (reinicia à meia-noite). */
export function Countdown() {
  const [time, setTime] = useState<number[] | null>(null);
  useEffect(() => {
    // Atualiza apenas em callbacks de timer (o 1º tick ocorre logo após montar).
    const tick = () => setTime(untilMidnight());
    const first = setTimeout(tick, 0);
    const t = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, []);
  return (
    <div className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-1.5 text-red-600" aria-label="Tempo restante das ofertas do dia">
      <Timer className="size-4" />
      <span className="text-xs font-semibold">Termina em</span>
      <span className="font-mono text-sm font-bold tabular-nums">
        {time ? time.map((n) => String(n).padStart(2, "0")).join(":") : "--:--:--"}
      </span>
    </div>
  );
}
