"use client";

import { useSyncExternalStore } from "react";
import { getConfig, type WorkshopConfig } from "@/lib/config";

let cached: WorkshopConfig | null = null;
const noop = () => () => {};

/** Configuración del navegador; `null` durante el prerender estático. */
export function useConfig(): WorkshopConfig | null {
  return useSyncExternalStore(
    noop,
    () => (cached ??= getConfig()),
    () => null,
  );
}
