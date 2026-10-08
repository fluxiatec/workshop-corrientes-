"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getConfig } from "@/lib/config";

let client: SupabaseClient | null = null;

export function getBrowserSupabase(): SupabaseClient | null {
  if (client) return client;
  const { supabaseUrl, supabaseAnonKey, configured } = getConfig();
  if (!configured) return null;
  client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { params: { eventsPerSecond: 20 } },
  });
  return client;
}
