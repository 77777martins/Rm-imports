"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";

/**
 * Executa `onChange` quando a rota muda, ajustando o estado durante o render
 * (padrão recomendado pelo React em vez de setState dentro de useEffect).
 */
export function useOnPathnameChange(onChange: () => void) {
  const pathname = usePathname();
  const [previous, setPrevious] = useState(pathname);
  if (pathname !== previous) {
    setPrevious(pathname);
    onChange();
  }
  return pathname;
}
