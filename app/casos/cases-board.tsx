"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Aurora, Orb } from "@/components/aurora";
import { Odometer } from "@/components/odometer";
import { PillarMarquee } from "@/components/pillars";
import { QrCode } from "@/components/qr-code";
import { useConfig } from "@/components/use-config";
import { realtimeChannelName } from "@/lib/config";
import {
  checkModerator,
  forgetModeratorKey,
  listAllCases,
  resetSession,
  takeModeratorKey,
  updateCase,
} from "@/lib/moderation";
import { participateUrl } from "@/lib/qr";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { MAX_SELECTED, type WorkshopCase } from "@/lib/types";
import { CaseCard } from "./case-card";
import { Countdown, initialTimer, pauseTimer, playTimer, type TimerState } from "./countdown";

type LiveState = "connecting" | "live" | "reconnecting";
type LoadState = "loading" | "ready" | "error";

const FRESH_MS = 8000;

const byNewest = (a: WorkshopCase, b: WorkshopCase) =>
  b.created_at.localeCompare(a.created_at) || b.id.localeCompare(a.id);

export function CasesBoard() {
  const config = useConfig();
  const supabase = useMemo(() => (config?.configured ? getBrowserSupabase() : null), [config]);
  const sessionId = config?.sessionId ?? "";
  const qrTarget = config ? participateUrl(config.siteUrl) : null;

  const [modKey, setModKey] = useState<string | null>(null);
  const isModerator = modKey !== null;

  const [cases, setCases] = useState<WorkshopCase[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [live, setLive] = useState<LiveState>("connecting");
  const [view, setView] = useState<"all" | "selected">("all");
  const [fresh, setFresh] = useState<Map<string, number>>(() => new Map()); // id → vence
  const [unseen, setUnseen] = useState(0);
  const [pending, setPending] = useState<Set<string>>(() => new Set());
  const [toast, setToast] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [timer, setTimer] = useState<TimerState>(initialTimer);

  const knownIds = useRef<Set<string> | null>(null); // null hasta la primera carga
  const realtimeBuffer = useRef<Map<string, WorkshopCase> | null>(null);
  const loadSeq = useRef(0);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerRef = useRef<TimerState>(initialTimer);

  // Cronómetro: se aplica local y se replica al resto de las pantallas /casos.
  const changeTimer = useCallback((update: (t: TimerState) => TimerState) => {
    const next = update(timerRef.current);
    timerRef.current = next;
    setTimer(next);
    void channelRef.current?.send({ type: "broadcast", event: "timer", payload: next });
  }, []);

  const visibleForMe = useCallback(
    (c: WorkshopCase) => !c.archived_at && c.session_id === sessionId && (isModerator || !c.is_hidden),
    [isModerator, sessionId],
  );

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4200);
  }, []);

  const markFresh = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    const until = Date.now() + FRESH_MS;
    setFresh((prev) => new Map([...prev, ...ids.map((id) => [id, until] as const)]));
    if (window.scrollY > 240) setUnseen((n) => n + ids.length);
  }, [setUnseen]);

  // Quita la marca "Nuevo" cuando vence.
  useEffect(() => {
    if (fresh.size === 0) return;
    const nextExpiry = Math.min(...fresh.values());
    const t = setTimeout(() => {
      const now = Date.now();
      setFresh((prev) => new Map([...prev].filter(([, until]) => until > now)));
    }, Math.max(0, nextExpiry - Date.now()) + 50);
    return () => clearTimeout(t);
  }, [fresh]);

  /* ------------------------------ Moderador ------------------------------ */

  // /casos?admin=CLAVE → se verifica contra Supabase y se quita de la URL.
  useEffect(() => {
    if (!supabase) return;
    const key = takeModeratorKey();
    if (!key) return;
    let cancelled = false;
    checkModerator(supabase, key)
      .then((ok) => {
        if (cancelled) return;
        if (ok) setModKey(key);
        else {
          forgetModeratorKey();
          showToast("Clave de moderador inválida.");
        }
      })
      .catch((err) => !cancelled && showToast((err as Error).message));
    return () => {
      cancelled = true;
    };
  }, [supabase, showToast]);

  /* ---------------------------- Carga de datos ---------------------------- */

  const load = useCallback(async () => {
    if (!supabase || !sessionId) return;
    const seq = ++loadSeq.current;
    realtimeBuffer.current = new Map();
    try {
      let rows: WorkshopCase[];
      if (modKey) {
        rows = await listAllCases(supabase, modKey, sessionId);
      } else {
        const { data, error } = await supabase
          .from("workshop_cases")
          .select("*")
          .eq("session_id", sessionId)
          .is("archived_at", null)
          .order("created_at", { ascending: false })
          .limit(1000);
        if (error) throw error;
        rows = data as WorkshopCase[];
      }
      if (seq !== loadSeq.current) return;

      // Casos que llegaron por Realtime mientras esta carga estaba en vuelo.
      const ids = new Set(rows.map((r) => r.id));
      for (const row of realtimeBuffer.current?.values() ?? []) {
        if (!ids.has(row.id) && visibleForMe(row)) {
          rows.push(row);
          ids.add(row.id);
        }
      }
      realtimeBuffer.current = null;

      const known = knownIds.current;
      if (known) markFresh(rows.filter((r) => !known.has(r.id) && !r.is_hidden).map((r) => r.id));
      knownIds.current = ids;

      setCases(rows.filter(visibleForMe).sort(byNewest));
      setLoadState("ready");
    } catch (err) {
      if (seq !== loadSeq.current) return;
      console.error("[casos] load error", err);
      setLoadState((s) => (s === "ready" ? s : "error"));
    }
  }, [supabase, sessionId, modKey, visibleForMe, markFresh]);

  const handleRow = useCallback(
    (row: WorkshopCase, isInsert: boolean) => {
      realtimeBuffer.current?.set(row.id, row);
      setCases((prev) => {
        const rest = prev.filter((c) => c.id !== row.id);
        return visibleForMe(row) ? [...rest, row].sort(byNewest) : rest;
      });
      const known = knownIds.current;
      if (isInsert && known && !known.has(row.id)) {
        known.add(row.id);
        if (visibleForMe(row) && !row.is_hidden) markFresh([row.id]);
      }
    },
    [visibleForMe, markFresh],
  );

  useEffect(() => {
    void load();
  }, [load]);

  // Realtime: INSERT/UPDATE de la tabla + broadcast "sync" para cambios de moderación.
  useEffect(() => {
    if (!supabase || !sessionId) return;
    const filter = `session_id=eq.${sessionId}`;
    const channel = supabase
      .channel(realtimeChannelName(sessionId), { config: { broadcast: { self: false } } })
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "workshop_cases", filter },
        (payload) => handleRow(payload.new as WorkshopCase, true),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "workshop_cases", filter },
        (payload) => handleRow(payload.new as WorkshopCase, false),
      )
      .on("broadcast", { event: "sync" }, () => void load())
      .on("broadcast", { event: "timer" }, ({ payload }) => {
        timerRef.current = payload as TimerState;
        setTimer(payload as TimerState);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setLive("live");
          void load(); // recupera lo que haya llegado mientras no estábamos conectados
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          setLive("reconnecting");
        }
      });
    channelRef.current = channel;
    return () => {
      channelRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [supabase, sessionId, handleRow, load]);

  // Red de seguridad: polling liviano (más frecuente si se cayó Realtime).
  useEffect(() => {
    if (!supabase) return;
    const t = setInterval(() => void load(), live === "live" ? 45_000 : 6_000);
    return () => clearInterval(t);
  }, [supabase, live, load]);

  useEffect(() => {
    const onOnline = () => void load();
    const onVisible = () => document.visibilityState === "visible" && void load();
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  useEffect(() => {
    const onScroll = () => window.scrollY < 120 && setUnseen(0);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ------------------------------- Derivados ------------------------------ */

  const visible = useMemo(() => cases.filter((c) => !c.is_hidden), [cases]);
  const hidden = useMemo(() => cases.filter((c) => c.is_hidden), [cases]);
  const selected = useMemo(() => visible.filter((c) => c.is_selected).reverse(), [visible]);
  const numbers = useMemo(() => {
    const map = new Map<string, number>();
    visible.forEach((c, i) => map.set(c.id, visible.length - i));
    return map;
  }, [visible]);

  // Atajos: S = alternar seleccionados, Esc = volver / cerrar.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest("input, textarea, [contenteditable]")) return;
      if (e.key === "Escape") {
        setConfirmReset(false);
        setShowHidden(false);
        setView("all");
      } else if (e.key === " " && !(e.target instanceof HTMLButtonElement)) {
        e.preventDefault();
        changeTimer((t) => (t.status === "running" ? pauseTimer(t) : playTimer(t)));
      } else if ((e.key === "s" || e.key === "S") && !e.metaKey && !e.ctrlKey) {
        setView((v) => (v === "all" ? "selected" : "all"));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [changeTimer]);

  /* ------------------------ Animación de reordenamiento ------------------------ */

  const gridRef = useRef<HTMLDivElement>(null);
  const positions = useRef(new Map<string, { x: number; y: number }>());
  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid || view !== "all") {
      positions.current.clear();
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const next = new Map<string, { x: number; y: number }>();
    grid.querySelectorAll<HTMLElement>("[data-flip-id]").forEach((node) => {
      const id = node.dataset.flipId!;
      const pos = { x: node.offsetLeft, y: node.offsetTop };
      const prev = positions.current.get(id);
      next.set(id, pos);
      if (!prev || reduce) return;
      const dx = prev.x - pos.x;
      const dy = prev.y - pos.y;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      node.animate(
        [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "translate(0, 0)" }],
        { duration: 800, easing: "cubic-bezier(0.32, 0.72, 0, 1)" },
      );
    });
    positions.current = next;
  }, [visible, view]);

  /* ------------------------------ Acciones ------------------------------ */

  const broadcastSync = useCallback(() => {
    void channelRef.current?.send({ type: "broadcast", event: "sync", payload: {} });
  }, []);

  async function patchCase(c: WorkshopCase, patch: { is_selected?: boolean; is_hidden?: boolean }) {
    if (!supabase || !modKey) return;
    if (patch.is_selected && selected.length >= MAX_SELECTED) {
      showToast(`Máximo ${MAX_SELECTED} casos seleccionados. Quitá uno primero.`);
      return;
    }
    const optimistic = { ...patch, ...(patch.is_hidden ? { is_selected: false } : {}) };
    setPending((p) => new Set(p).add(c.id));
    setCases((prev) => prev.map((x) => (x.id === c.id ? { ...x, ...optimistic } : x)));
    try {
      const row = await updateCase(supabase, modKey, c.id, patch);
      setCases((prev) => prev.map((x) => (x.id === row.id ? row : x)));
      broadcastSync();
    } catch (err) {
      showToast((err as Error).message);
      void load();
    } finally {
      setPending((p) => {
        const next = new Set(p);
        next.delete(c.id);
        return next;
      });
    }
  }

  async function doReset() {
    if (!supabase || !modKey) return;
    setResetting(true);
    try {
      const archived = await resetSession(supabase, modKey, sessionId);
      knownIds.current = new Set();
      setCases([]);
      setView("all");
      setConfirmReset(false);
      broadcastSync();
      showToast(`Dinámica reiniciada · ${archived} casos archivados`);
    } catch (err) {
      showToast((err as Error).message);
    } finally {
      setResetting(false);
    }
  }

  function logout() {
    forgetModeratorKey();
    setModKey(null);
    setShowHidden(false);
    showToast("Saliste del modo moderador.");
  }

  /* -------------------------------- Render -------------------------------- */

  const count = visible.length;
  const shortUrl = qrTarget?.replace(/^https?:\/\//, "") ?? "";
  const configured = config ? config.configured : true;

  const showSidebar = view === "all";

  return (
    <div className="relative isolate min-h-dvh overflow-x-clip bg-ink text-white">
      <Aurora />

      <div
        className={`relative grid min-h-dvh ${
          showSidebar ? "lg:grid-cols-[minmax(24rem,31vw)_minmax(0,1fr)]" : ""
        }`}
      >
        {/* Columna fija: QR protagonista + cronómetro + contador */}
        {showSidebar && (
          <aside className="animate-fade-in relative flex flex-col gap-[clamp(1rem,2.2vh,2rem)] px-[clamp(1rem,2.4vw,3rem)] py-[clamp(1rem,3.5vh,2.5rem)] lg:sticky lg:top-0 lg:h-dvh lg:border-r lg:border-white/10 lg:bg-white/[0.02]">
            <LiveBadge state={configured ? live : "reconnecting"} />

            <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center">
              <Orb className="absolute -top-[4%] -right-[14%] w-[58%] opacity-80" />
              <div className="ring-rotating animate-pop relative w-full max-w-[min(100%,52vh)] rounded-[2rem] p-[clamp(0.5rem,0.9vw,1rem)] shadow-[0_30px_80px_-10px_rgba(0,0,0,0.65)]">
                <QrCode text={qrTarget} className="aspect-square w-full rounded-[1.4rem]" />
              </div>
              <p className="headline mt-[clamp(0.75rem,2.2vh,1.5rem)] text-center text-[clamp(1.5rem,2.1vw,2.5rem)]">
                Escaneá y <span className="text-gradient animate-gradient">contanos</span>
              </p>
              <p className="mt-1.5 text-center font-mono text-[clamp(0.8rem,0.95vw,1.1rem)] break-all text-rose">
                {shortUrl}
              </p>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-[28px] border border-white/10 bg-white/[0.04] p-[clamp(0.75rem,1.2vw,1.5rem)] backdrop-blur-md">
              <Countdown
                timer={timer}
                onPlay={() => changeTimer(playTimer)}
                onPause={() => changeTimer(pauseTimer)}
                onReset={() => changeTimer(() => initialTimer)}
              />
              <div className="text-right">
                <Odometer value={count} className="headline text-[clamp(3rem,4.6vw,5.5rem)] text-cream" />
                <div className="mt-2 text-[clamp(0.7rem,0.8vw,0.95rem)] leading-tight font-bold tracking-[0.18em] text-rose uppercase">
                  {count === 1 ? "Caso" : "Casos"}
                  <br />
                  recibidos
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Título + cinta + casos en vivo */}
        <section className="relative min-w-0 px-[clamp(1rem,2.8vw,3.5rem)] pt-[clamp(1rem,3.5vh,2.5rem)] pb-28">
          <header className="flex flex-wrap items-start justify-between gap-6">
            <h1 className="animate-rise headline max-w-[20ch] text-[clamp(2.25rem,3.9vw,4.75rem)]">
              ¿Qué tarea de tu trabajo te gustaría <span className="text-gradient animate-gradient">delegar?</span>
            </h1>
            {!showSidebar && <LiveBadge state={configured ? live : "reconnecting"} />}
          </header>

          <PillarMarquee className="-mx-[clamp(1rem,2.8vw,3.5rem)] mt-[clamp(1rem,2.4vh,2rem)] border-y border-white/10 py-[clamp(0.6rem,1.2vh,1rem)]" />

          {/* Barra de modo */}
          {(selected.length > 0 || isModerator) && count > 0 && (
            <div className="animate-fade-in mt-[clamp(1rem,2.4vh,2rem)] flex flex-wrap items-center gap-3">
              {view === "all" ? (
                <button
                  type="button"
                  onClick={() => setView("selected")}
                  disabled={selected.length === 0}
                  className="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-full bg-cream px-5 py-2.5 text-sm font-bold tracking-[0.1em] text-deep uppercase shadow-[0_10px_30px_-10px_rgba(223,182,178,0.8)] transition duration-500 ease-fluid hover:-translate-y-0.5 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40 disabled:shadow-none"
                >
                  <span aria-hidden className="transition-transform group-hover:rotate-[72deg]">⭐</span>
                  {selected.length === 0
                    ? `Seleccioná hasta ${MAX_SELECTED} casos`
                    : `Ver ${selected.length} ${selected.length === 1 ? "caso seleccionado" : "casos seleccionados"}`}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setView("all")}
                  className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/5 px-5 py-2.5 text-sm font-bold tracking-[0.1em] text-white uppercase backdrop-blur transition duration-500 ease-fluid hover:bg-white/10 active:scale-[0.98]"
                >
                  <span aria-hidden>←</span> Volver a todos los casos
                </button>
              )}
              {isModerator && view === "all" && (
                <span className="flex items-center gap-1.5 text-sm text-white/55">
                  {Array.from({ length: MAX_SELECTED }).map((_, i) => (
                    <span
                      key={i}
                      className={`size-2 rounded-full transition-colors ${i < selected.length ? "bg-rose" : "bg-white/15"}`}
                    />
                  ))}
                  <span className="ml-1">
                    {selected.length}/{MAX_SELECTED} seleccionados
                  </span>
                </span>
              )}
            </div>
          )}

          <main key={view} className="animate-slide-in mt-[clamp(1rem,2.4vh,2rem)]">
            {!configured ? (
              <NotConfigured />
            ) : loadState === "loading" ? (
              <SkeletonGrid />
            ) : loadState === "error" ? (
              <ErrorState onRetry={() => void load()} />
            ) : count === 0 ? (
              <EmptyState />
            ) : view === "selected" ? (
              <SelectedView
                cases={selected}
                numbers={numbers}
                isModerator={isModerator}
                pending={pending}
                onToggleSelect={(c) => patchCase(c, { is_selected: !c.is_selected })}
                onHide={(c) => patchCase(c, { is_hidden: true })}
                onBack={() => setView("all")}
              />
            ) : (
              <div
                ref={gridRef}
                className="relative grid grid-cols-1 items-stretch gap-[clamp(0.9rem,1.3vw,1.75rem)] md:grid-cols-2 min-[2400px]:grid-cols-3"
              >
                {visible.map((c, i) => (
                  <div key={c.id} data-flip-id={c.id} className="flex">
                    <CaseCard
                      c={c}
                      number={numbers.get(c.id) ?? 0}
                      isFresh={fresh.has(c.id)}
                      isModerator={isModerator}
                      isPending={pending.has(c.id)}
                      selectionFull={selected.length >= MAX_SELECTED}
                      enterDelay={fresh.has(c.id) ? 0 : Math.min(i, 12) * 45}
                      onToggleSelect={() => patchCase(c, { is_selected: !c.is_selected })}
                      onHide={() => patchCase(c, { is_hidden: true })}
                    />
                  </div>
                ))}
              </div>
            )}
          </main>
        </section>
      </div>

      {unseen > 0 && view === "all" && (
        <button
          type="button"
          onClick={() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
            setUnseen(0);
          }}
          className="animate-card-in fixed top-5 left-1/2 z-30 -translate-x-1/2 rounded-full bg-gradient-to-r from-mauve to-plum px-5 py-2.5 text-sm font-bold tracking-wide text-cream shadow-xl shadow-black/30"
        >
          ↑ {unseen} {unseen === 1 ? "caso nuevo" : "casos nuevos"}
        </button>
      )}

      {isModerator && (
        <div className="fixed right-4 bottom-4 z-30 flex items-center gap-1 rounded-full border border-white/10 bg-ink/80 p-1 text-xs text-white/70 opacity-50 shadow-lg backdrop-blur-md transition hover:opacity-100 focus-within:opacity-100">
          <span className="px-3 font-mono text-[0.68rem] tracking-wide text-white/45">MOD · {sessionId}</span>
          <ModButton onClick={() => setShowHidden(true)}>Ocultos ({hidden.length})</ModButton>
          <ModButton onClick={() => setConfirmReset(true)}>Reiniciar dinámica</ModButton>
          <ModButton onClick={logout}>Salir</ModButton>
        </div>
      )}

      {confirmReset && (
        <Dialog onClose={() => !resetting && setConfirmReset(false)}>
          <h2 className="headline text-2xl text-deep">
            ¿Seguro que querés borrar/reiniciar los casos del workshop?
          </h2>
          <p className="mt-2 text-[0.95rem] leading-snug text-deep/75">
            Se archivan los <strong>{cases.length}</strong> casos de la sesión{" "}
            <code className="rounded bg-rose/40 px-1.5 py-0.5 text-deep">{sessionId}</code>. No se borra nada de la
            base ni se tocan otros workshops.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmReset(false)}
              disabled={resetting}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-deep/70 hover:bg-rose/30"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={doReset}
              disabled={resetting}
              className="rounded-xl bg-gradient-to-r from-deep to-mauve px-4 py-2.5 text-sm font-bold text-cream hover:opacity-90 disabled:opacity-60"
            >
              {resetting ? "Reiniciando…" : "Sí, reiniciar"}
            </button>
          </div>
        </Dialog>
      )}

      {showHidden && (
        <Dialog onClose={() => setShowHidden(false)}>
          <h2 className="headline text-2xl text-deep">Casos ocultos</h2>
          <p className="mt-1 text-sm text-deep/60">No se muestran en pantalla. Pasá el mouse para leerlos.</p>
          <ul className="mt-4 grid max-h-[50vh] gap-2 overflow-y-auto">
            {hidden.length === 0 && <li className="text-sm text-deep/50">No hay casos ocultos.</li>}
            {hidden.map((c) => (
              <li key={c.id} className="flex items-start justify-between gap-3 rounded-xl bg-white/60 p-3">
                <div className="min-w-0 blur-sm transition hover:blur-none">
                  <p className="text-xs font-bold tracking-widest text-deep uppercase">{c.name}</p>
                  <p className="text-sm break-words text-deep/80">{c.task}</p>
                </div>
                <button
                  type="button"
                  disabled={pending.has(c.id)}
                  onClick={() => patchCase(c, { is_hidden: false })}
                  className="shrink-0 rounded-lg border border-mauve/50 px-3 py-1.5 text-xs font-semibold text-deep hover:bg-rose/30"
                >
                  Mostrar
                </button>
              </li>
            ))}
          </ul>
        </Dialog>
      )}

      {toast && (
        <div
          role="status"
          className="animate-card-in fixed bottom-5 left-1/2 z-40 -translate-x-1/2 rounded-full bg-cream px-5 py-2.5 text-sm font-semibold text-deep shadow-2xl shadow-black/40"
        >
          {toast}
        </div>
      )}
    </div>
  );
}

/* ------------------------------ Subcomponentes ------------------------------ */

function LiveBadge({ state }: { state: LiveState }) {
  const label = state === "live" ? "En vivo" : state === "connecting" ? "Conectando…" : "Reconectando…";
  const ok = state === "live";
  return (
    <div
      className={`animate-fade-in inline-flex w-max self-start items-center gap-2.5 rounded-full border px-3.5 py-1.5 text-[clamp(0.7rem,0.8vw,0.85rem)] font-bold tracking-[0.2em] uppercase backdrop-blur-md transition-colors ${
        ok ? "border-white/60 bg-white/[0.04] text-white" : "border-amber-300/40 bg-amber-300/10 text-amber-200"
      }`}
      aria-live="polite"
    >
      <span className="relative flex size-2">
        <span className={`animate-ping-soft absolute inset-0 rounded-full ${ok ? "bg-emerald-400" : "bg-amber-300"}`} />
        <span className={`relative size-2 rounded-full ${ok ? "bg-emerald-400" : "bg-amber-300"}`} />
      </span>
      {label}
    </div>
  );
}

function SelectedView({
  cases,
  numbers,
  isModerator,
  pending,
  onToggleSelect,
  onHide,
  onBack,
}: {
  cases: WorkshopCase[];
  numbers: Map<string, number>;
  isModerator: boolean;
  pending: Set<string>;
  onToggleSelect: (c: WorkshopCase) => void;
  onHide: (c: WorkshopCase) => void;
  onBack: () => void;
}) {
  if (cases.length === 0) {
    return (
      <div className="grid min-h-[50vh] place-items-center text-center">
        <div>
          <p className="headline text-[clamp(1.6rem,2.8vw,2.75rem)]">Todavía no hay casos seleccionados.</p>
          <button type="button" onClick={onBack} className="mt-4 text-white/75 underline underline-offset-4">
            Volver a todos los casos
          </button>
        </div>
      </div>
    );
  }
  const cols =
    cases.length === 1 ? "lg:max-w-5xl lg:mx-auto" : cases.length === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3";
  return (
    <div className={`grid grid-cols-1 gap-[clamp(1rem,1.6vw,2rem)] ${cols}`}>
      {cases.map((c, i) => (
        <div key={c.id} className="flex">
          <CaseCard
            c={c}
            number={numbers.get(c.id) ?? 0}
            size="xl"
            columns={cases.length}
            isFresh={false}
            isModerator={isModerator}
            isPending={pending.has(c.id)}
            selectionFull
            enterDelay={i * 120}
            onToggleSelect={() => onToggleSelect(c)}
            onHide={() => onHide(c)}
          />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="grid min-h-[55vh] content-center py-6">
      <p className="animate-rise headline flex flex-wrap items-center gap-x-4 text-[clamp(2.25rem,4.4vw,5.25rem)]">
        Esperando los primeros casos
        <span className="inline-flex gap-2" aria-hidden>
          {[0, 1, 2].map((d) => (
            <span key={d} className="animate-live size-[0.22em] rounded-full bg-rose" style={{ animationDelay: `${d * 0.25}s` }} />
          ))}
        </span>
      </p>
      <p
        style={{ animationDelay: "140ms" }}
        className="animate-rise mt-6 flex items-center gap-4 text-[clamp(1.25rem,2vw,2.25rem)] font-medium text-white/80"
      >
        <span aria-hidden className="hidden animate-[nudge_1.6s_var(--ease-fluid)_infinite] text-rose lg:inline">
          ←
        </span>
        Escaneá el QR y contanos una tarea de tu trabajo.
      </p>
    </div>
  );
}
function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-[clamp(0.9rem,1.3vw,1.75rem)] md:grid-cols-2 xl:grid-cols-3" aria-label="Cargando casos">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-48 animate-pulse rounded-[1.75rem] bg-white/[0.06]" style={{ animationDelay: `${i * 120}ms` }} />
      ))}
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="grid min-h-[50vh] place-items-center text-center">
      <div>
        <p className="headline text-[clamp(1.6rem,2.6vw,2.6rem)]">No pudimos cargar los casos.</p>
        <p className="mt-2 text-white/70">Seguimos intentando automáticamente…</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 rounded-full bg-cream px-5 py-2.5 text-sm font-bold text-deep hover:bg-rose"
        >
          Reintentar ahora
        </button>
      </div>
    </div>
  );
}

function NotConfigured() {
  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-md">
      <p className="headline text-2xl">Falta configurar Supabase</p>
      <p className="mt-2 text-white/75">
        Completá <code>supabaseUrl</code> y <code>supabaseAnonKey</code> en <code>config.js</code> (en la raíz del
        sitio publicado) y recargá la página. Ver <code>README.md</code>.
      </p>
    </div>
  );
}

function ModButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="rounded-full px-3 py-1.5 transition hover:bg-white/10 hover:text-white">
      {children}
    </button>
  );
}

function Dialog({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="animate-fade-in fixed inset-0 z-50 grid place-items-center bg-ink/70 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="animate-card-in w-full max-w-lg rounded-[28px] bg-cream p-6 text-deep shadow-2xl"
      >
        {children}
      </div>
    </div>
  );
}
