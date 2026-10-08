const DEFAULT_SESSION_ID = "workshop-corrientes-2026";

type RuntimeConfig = {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  sessionId?: string;
  siteUrl?: string;
};

declare global {
  interface Window {
    __WORKSHOP_CONFIG__?: RuntimeConfig;
  }
}

export type WorkshopConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  sessionId: string;
  siteUrl: string;
  configured: boolean;
};

const pick = (...values: (string | undefined)[]) => values.map((v) => v?.trim()).find(Boolean) ?? "";

/**
 * Configuración resuelta en el navegador: /config.js (editable después del build)
 * y, como respaldo, variables NEXT_PUBLIC_* definidas al compilar.
 */
export function getConfig(): WorkshopConfig {
  const rt = (typeof window !== "undefined" && window.__WORKSHOP_CONFIG__) || {};
  const supabaseUrl = pick(rt.supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_URL).replace(/\/+$/, "");
  const supabaseAnonKey = pick(rt.supabaseAnonKey, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const sessionId = pick(rt.sessionId, process.env.NEXT_PUBLIC_WORKSHOP_SESSION_ID, DEFAULT_SESSION_ID).toLowerCase();
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const origin = typeof window !== "undefined" ? window.location.origin + basePath : "";
  const siteUrl = pick(rt.siteUrl, process.env.NEXT_PUBLIC_SITE_URL, origin).replace(/\/+$/, "");
  return { supabaseUrl, supabaseAnonKey, sessionId, siteUrl, configured: Boolean(supabaseUrl && supabaseAnonKey) };
}

export const realtimeChannelName = (sessionId: string) => `workshop-cases:${sessionId}`;

export function isLocalUrl(url: string) {
  return /\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:|\/|$)/.test(url);
}
