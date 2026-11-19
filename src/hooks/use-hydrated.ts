"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** true somente no cliente após a hidratação (evita mismatch com localStorage). */
export function useHydrated() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
