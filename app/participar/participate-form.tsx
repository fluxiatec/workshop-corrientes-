"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import { getConfig } from "@/lib/config";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { NAME_MAX, TASK_MAX, validateCase, type CaseErrors } from "@/lib/validation";

type SentCase = { name: string; task: string; at: string };

const STORAGE_EVENT = "workshop-sent-change";
const storageKey = () => `workshop:${getConfig().sessionId}:sent`;

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(STORAGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(STORAGE_EVENT, onChange);
  };
}

function readStored(): string | null {
  try {
    return window.localStorage.getItem(storageKey());
  } catch {
    return null;
  }
}

function writeStored(value: SentCase | null) {
  try {
    if (value) window.localStorage.setItem(storageKey(), JSON.stringify(value));
    else window.localStorage.removeItem(storageKey());
  } catch {
    /* modo privado / storage bloqueado: seguimos igual */
  }
  window.dispatchEvent(new Event(STORAGE_EVENT));
}

const CONFETTI = ["#8b5cf6", "#c4b5fd", "#a5b4fc", "#e2c6ff", "#4b2a9b", "#c084fc"];

export function ParticipateForm() {
  const storedRaw = useSyncExternalStore(subscribe, readStored, () => null);
  // Respaldo en memoria por si localStorage no está disponible.
  const [memorySent, setMemorySent] = useState<SentCase | null>(null);

  const sent = useMemo<SentCase | null>(() => {
    if (memorySent) return memorySent;
    if (!storedRaw) return null;
    try {
      return JSON.parse(storedRaw) as SentCase;
    } catch {
      return null;
    }
  }, [storedRaw, memorySent]);

  const [name, setName] = useState("");
  const [task, setTask] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [errors, setErrors] = useState<CaseErrors>({});
  const [attempted, setAttempted] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [serverError, setServerError] = useState("");
  const sendingRef = useRef(false);

  function revalidate(next: { name: string; task: string }) {
    if (attempted) setErrors(validateCase(next).errors);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sendingRef.current) return;

    setAttempted(true);
    const { data, errors: found } = validateCase({ name, task });
    setErrors(found);
    if (Object.keys(found).length > 0) {
      document.getElementById(found.name ? "name" : "task")?.focus();
      return;
    }

    sendingRef.current = true;
    setStatus("sending");
    setServerError("");

    try {
      if (!website) {
        const supabase = getBrowserSupabase();
        if (!supabase) throw new Error("La dinámica todavía no está configurada.");
        const { error } = await supabase
          .from("workshop_cases")
          .insert({ session_id: getConfig().sessionId, name: data.name, task: data.task });
        // 23505 = duplicado exacto (doble envío): lo tratamos como éxito.
        if (error && error.code !== "23505") {
          console.error("[participar] insert error", error);
          throw new Error(
            /fetch|network/i.test(error.message)
              ? "Parece que no hay conexión. Revisá tu internet y probá de nuevo."
              : "No pudimos guardar tu caso. Probá de nuevo en unos segundos.",
          );
        }
      }
      const record = { ...data, at: new Date().toISOString() };
      setMemorySent(record);
      writeStored(record);
      setStatus("idle");
      setTask("");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setStatus("error");
      setServerError(
        err instanceof TypeError
          ? "Parece que no hay conexión. Revisá tu internet y probá de nuevo."
          : (err as Error).message,
      );
    } finally {
      sendingRef.current = false;
    }
  }

  function sendAnother() {
    if (sent) setName(sent.name);
    setMemorySent(null);
    writeStored(null);
    setAttempted(false);
    setErrors({});
    setStatus("idle");
    requestAnimationFrame(() => document.getElementById("task")?.focus());
  }

  if (sent) {
    return (
      <section
        aria-live="polite"
        className="animate-card-in relative mt-6 overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/85 p-6 text-center shadow-[0_20px_60px_-24px_rgba(75,42,155,0.55)] backdrop-blur-xl"
      >
        {/* Confetti */}
        <div aria-hidden className="pointer-events-none absolute top-[4.5rem] left-1/2">
          {CONFETTI.concat(CONFETTI).map((color, i) => {
            const angle = (i / 12) * Math.PI * 2;
            return (
              <span
                key={i}
                className="absolute size-2 rounded-[3px]"
                style={{
                  background: color,
                  animation: `confetti 900ms ${120 + (i % 4) * 40}ms cubic-bezier(0.2, 0.8, 0.2, 1) both`,
                  ["--dx" as string]: `${Math.cos(angle) * 110}px`,
                  ["--dy" as string]: `${Math.sin(angle) * 80}px`,
                }}
              />
            );
          })}
        </div>

        <div className="relative mx-auto grid size-18 place-items-center">
          <span className="animate-ping-soft absolute inset-0 rounded-full bg-brand/40" />
          <span className="animate-pop relative grid size-18 place-items-center rounded-full bg-gradient-to-br from-brand to-deep text-white shadow-[0_10px_30px_-8px_rgba(139,92,246,0.9)]">
            <svg viewBox="0 0 24 24" className="size-9" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 12.5l4.5 4.5L19 7.5" strokeDasharray="30" className="animate-draw" />
            </svg>
          </span>
        </div>
        <h2 className="font-display animate-rise mt-5 text-4xl font-extrabold tracking-tight text-ink">¡Listo!</h2>
        <p style={{ animationDelay: "120ms" }} className="animate-rise mt-1 text-lg font-medium text-ink/80">
          Tu caso ya está participando.
        </p>
        <p style={{ animationDelay: "220ms" }} className="animate-rise mt-3 text-base text-ink/60">
          En unos segundos puede aparecer en pantalla <span className="animate-float inline-block">👀</span>
        </p>

        <div
          style={{ animationDelay: "320ms" }}
          className="animate-rise mt-6 rounded-2xl border border-lavender bg-gradient-to-br from-lavender/70 to-white p-4 text-left"
        >
          <p className="text-xs font-bold tracking-[0.16em] text-deep uppercase">{sent.name}</p>
          <p className="mt-1 text-[0.95rem] leading-snug text-ink/80">“{sent.task}”</p>
        </div>

        <button
          type="button"
          onClick={sendAnother}
          className="mt-6 text-sm font-medium text-deep/70 underline decoration-lilac underline-offset-4 hover:text-deep"
        >
          Enviar otro caso
        </button>
        <style>{`@keyframes confetti{0%{opacity:0;transform:translate(0,0) scale(.4) rotate(0)}15%{opacity:1}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(1) rotate(220deg)}}`}</style>
      </section>
    );
  }

  const sending = status === "sending";
  const taskLen = task.trim().length;
  const inputClass =
    "w-full scroll-mt-24 rounded-2xl border border-lilac/60 bg-white/70 text-[1.0625rem] text-ink placeholder:text-ink/35 transition duration-200 outline-none focus:border-brand focus:bg-white focus:shadow-[0_0_0_4px_rgba(196,181,253,0.45)] aria-invalid:border-rose-400";

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      style={{ animationDelay: "420ms" }}
      className="animate-rise mt-6 rounded-[1.75rem] border border-white/80 bg-white/75 p-5 shadow-[0_20px_60px_-28px_rgba(75,42,155,0.55)] backdrop-blur-xl"
    >
      <fieldset disabled={sending} className="grid gap-5">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-[0.95rem] font-semibold text-ink">
            Nombre
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="given-name"
            enterKeyHint="next"
            maxLength={NAME_MAX}
            placeholder="Ej: Juan"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              revalidate({ name: e.target.value, task });
            }}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "name-error" : undefined}
            className={`${inputClass} h-14 px-4`}
          />
          {errors.name && (
            <p id="name-error" className="animate-fade-in mt-1.5 text-sm font-medium text-rose-600">
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="task" className="mb-1.5 block text-[0.95rem] font-semibold text-ink">
            ¿Qué tarea te gustaría delegar?
          </label>
          <textarea
            id="task"
            name="task"
            rows={5}
            maxLength={TASK_MAX}
            placeholder="Todas las semanas reviso mails de clientes y paso la información importante a una planilla."
            value={task}
            onChange={(e) => {
              setTask(e.target.value);
              revalidate({ name, task: e.target.value });
            }}
            aria-invalid={Boolean(errors.task)}
            aria-describedby="task-hint"
            className={`${inputClass} block min-h-36 resize-y px-4 py-3.5 leading-snug`}
          />
          <div id="task-hint" className="mt-1.5 flex items-start justify-between gap-3 text-sm">
            <p className="font-medium text-rose-600">{errors.task}</p>
            <span className={`shrink-0 font-mono tabular-nums ${taskLen > TASK_MAX - 30 ? "text-deep" : "text-ink/40"}`}>
              {taskLen}/{TASK_MAX}
            </span>
          </div>
          {/* Barra de progreso sutil del texto */}
          <div className="mt-1 h-1 overflow-hidden rounded-full bg-lavender">
            <div
              className="h-full rounded-full bg-gradient-to-r from-lilac via-brand to-periwinkle transition-[width] duration-300"
              style={{ width: `${Math.min(100, (taskLen / TASK_MAX) * 100)}%` }}
            />
          </div>
        </div>

        {/* Honeypot anti-bots */}
        <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>
            No completar
            <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
          </label>
        </div>

        {status === "error" && serverError && (
          <div role="alert" className="animate-fade-in rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-[0.95rem] text-rose-700">
            {serverError}
          </div>
        )}

        <button
          type="submit"
          className="animate-gradient group relative flex h-15 w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-[linear-gradient(110deg,#4b2a9b,#8b5cf6,#a78bfa,#8b5cf6,#4b2a9b)] bg-[length:220%_100%] text-[1.05rem] font-bold tracking-[0.1em] text-white uppercase shadow-[0_14px_30px_-12px_rgba(139,92,246,0.9)] transition active:scale-[0.98] disabled:cursor-wait disabled:opacity-85"
        >
          <span aria-hidden className="animate-shine absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/35 to-transparent" />
          {sending ? (
            <>
              <span className="size-5 animate-spin rounded-full border-[2.5px] border-white/30 border-t-white" aria-hidden />
              Enviando…
            </>
          ) : status === "error" ? (
            "Reintentar envío"
          ) : (
            <>
              Enviar mi caso
              <svg viewBox="0 0 24 24" className="size-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </>
          )}
        </button>
      </fieldset>
    </form>
  );
}
