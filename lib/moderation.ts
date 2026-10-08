"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { WorkshopCase } from "@/lib/types";

const STORAGE_KEY = "workshop:moderator-key";

/**
 * Toma ?admin=CLAVE de la URL (y la quita al instante para que no quede
 * visible en el proyector) o la recupera de esta pestaña.
 */
export function takeModeratorKey(): string | null {
  const url = new URL(window.location.href);
  const fromUrl = url.searchParams.get("admin");
  if (fromUrl) {
    url.searchParams.delete("admin");
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    try {
      sessionStorage.setItem(STORAGE_KEY, fromUrl);
    } catch {
      /* sin storage: vale solo para esta carga */
    }
    return fromUrl;
  }
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function forgetModeratorKey() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}

function friendly(error: { message?: string } | null, fallback: string) {
  const msg = error?.message ?? "";
  if (msg.includes("max_selected")) return "Máximo 3 casos seleccionados. Quitá uno primero.";
  if (msg.includes("not_authorized")) return "Clave de moderador inválida.";
  if (msg.includes("not_found")) return "Ese caso ya no existe.";
  return fallback;
}

export async function checkModerator(sb: SupabaseClient, key: string) {
  const { data, error } = await sb.rpc("workshop_is_moderator", { p_key: key });
  if (error) throw new Error(friendly(error, "No se pudo verificar la clave de moderador."));
  return data === true;
}

export async function listAllCases(sb: SupabaseClient, key: string, session: string) {
  const { data, error } = await sb.rpc("workshop_list_cases", { p_key: key, p_session: session });
  if (error) throw new Error(friendly(error, "No se pudieron cargar los casos."));
  return (data ?? []) as WorkshopCase[];
}

export async function updateCase(
  sb: SupabaseClient,
  key: string,
  id: string,
  patch: { is_selected?: boolean; is_hidden?: boolean },
) {
  const { data, error } = await sb.rpc("workshop_update_case", {
    p_key: key,
    p_id: id,
    p_selected: patch.is_selected ?? null,
    p_hidden: patch.is_hidden ?? null,
  });
  if (error) throw new Error(friendly(error, "No se pudo actualizar el caso."));
  return data as WorkshopCase;
}

export async function resetSession(sb: SupabaseClient, key: string, session: string) {
  const { data, error } = await sb.rpc("workshop_reset_session", { p_key: key, p_session: session });
  if (error) throw new Error(friendly(error, "No se pudo reiniciar la dinámica."));
  return Number(data ?? 0);
}
