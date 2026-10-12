"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import { DictateButton } from "@/components/dictate-button";
import { getConfig } from "@/lib/config";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import {
  DETAILS_MAX,
  NAME_MAX,
  OCCUPATION_MAX,
  TASK_MAX,
  validateCase,
  validateContact,
  type CaseErrors,
  type ContactErrors,
} from "@/lib/validation";

type SentCase = {
  name: string;
  occupation: string;
  task: string;
  at: string;
  caseId: string | null;
  contact?: "sent" | "skipped";
};

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

const NETWORK_ERROR = "Parece que no hay conexión. Revisá tu internet y probá de nuevo.";
const isNetworkError = (err: unknown) =>
  err instanceof TypeError || (err instanceof Error && /fetch|network/i.test(err.message));

/** Guarda el caso. Si la base todavía no tiene la columna "occupation", reintenta sin ella. */
async function insertCase(data: { name: string; occupation: string; task: string }): Promise<string | null> {
  const supabase = getBrowserSupabase();
  if (!supabase) throw new Error("La dinámica todavía no está configurada.");
  const sessionId = getConfig().sessionId;

  let { data: row, error } = await supabase
    .from("workshop_cases")
    .insert({ session_id: sessionId, name: data.name, occupation: data.occupation, task: data.task })
    .select("id")
    .maybeSingle();

  if (error && (error.code === "PGRST204" || /occupation/i.test(error.message))) {
    ({ data: row, error } = await supabase
      .from("workshop_cases")
      .insert({ session_id: sessionId, name: data.name, task: data.task })
      .select("id")
      .maybeSingle());
  }
  // 23505 = duplicado exacto (doble envío): lo tratamos como éxito.
  if (error && error.code !== "23505") {
    console.error("[participar] insert error", error);
    throw new Error(
      /fetch|network/i.test(error.message) ? NETWORK_ERROR : "No pudimos guardar tu caso. Probá de nuevo en unos segundos.",
    );
  }
  return (row as { id: string } | null)?.id ?? null;
}

const CONFETTI = ["#854f6c", "#dfb6b2", "#fbe4d8", "#522b5b", "#2b124c", "#ffffff"];

const inputClass =
  "w-full scroll-mt-24 rounded-2xl border border-rose bg-white text-[1.0625rem] text-ink placeholder:text-deep/35 transition duration-300 ease-fluid outline-none focus:border-mauve focus:shadow-[0_0_0_4px_rgba(133,79,108,0.22)] aria-invalid:border-red-500";

/* ------------------------------------------------------------------ */

type FieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
  maxLength: number;
  multiline?: boolean;
  rows?: number;
  type?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  dictation?: boolean;
  counter?: boolean;
  onHint: (m: string) => void;
};

function Field({
  id,
  label,
  value,
  onChange,
  error,
  placeholder,
  maxLength,
  multiline,
  rows = 4,
  type = "text",
  autoComplete,
  inputMode,
  dictation = true,
  counter,
  onHint,
}: FieldProps) {
  const common = {
    id,
    name: id,
    value,
    maxLength,
    placeholder,
    "aria-invalid": Boolean(error),
    "aria-describedby": error ? `${id}-error` : undefined,
  };
  const append = (text: string) => {
    const next = value.trim() ? `${value.trimEnd()} ${text}` : text;
    onChange(next.slice(0, maxLength));
  };
  const len = value.trim().length;

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[0.95rem] font-bold text-deep">
        {label}
      </label>
      <div className="relative">
        {multiline ? (
          <textarea
            {...common}
            rows={rows}
            onChange={(e) => onChange(e.target.value)}
            className={`${inputClass} block min-h-32 resize-y px-4 py-3.5 leading-snug ${dictation ? "pr-14" : ""}`}
          />
        ) : (
          <input
            {...common}
            type={type}
            autoComplete={autoComplete}
            inputMode={inputMode}
            enterKeyHint="next"
            onChange={(e) => onChange(e.target.value)}
            className={`${inputClass} h-14 px-4 ${dictation ? "pr-14" : ""}`}
          />
        )}
        {dictation && (
          <div className={`absolute right-2 ${multiline ? "top-2" : "top-1/2 -translate-y-1/2"}`}>
            <DictateButton targetId={id} onText={append} onHint={onHint} />
          </div>
        )}
      </div>
      {(error || counter) && (
        <div className="mt-1.5 flex items-start justify-between gap-3 text-sm">
          <p id={`${id}-error`} className="animate-fade-in font-medium text-red-700">
            {error}
          </p>
          {counter && (
            <span className={`shrink-0 font-mono tabular-nums ${len > maxLength - 30 ? "text-deep" : "text-deep/45"}`}>
              {len}/{maxLength}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function SubmitButton({ busy, children }: { busy: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="animate-gradient group relative flex h-15 w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-[linear-gradient(110deg,#2b124c,#522b5b,#854f6c,#522b5b,#2b124c)] bg-[length:220%_100%] text-[1.05rem] font-bold tracking-[0.06em] text-cream uppercase shadow-[0_14px_30px_-12px_rgba(43,18,76,0.9)] transition duration-300 ease-fluid active:scale-[0.98] disabled:cursor-wait disabled:opacity-85"
    >
      <span aria-hidden className="animate-shine absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
      {busy ? (
        <>
          <span className="size-5 animate-spin rounded-full border-[2.5px] border-white/30 border-t-white" aria-hidden />
          Enviando…
        </>
      ) : (
        children
      )}
    </button>
  );
}

const Arrow = () => (
  <svg viewBox="0 0 24 24" className="size-5 transition-transform duration-500 ease-fluid group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

/* ------------------------------------------------------------------ */

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
  const [occupation, setOccupation] = useState("");
  const [task, setTask] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [errors, setErrors] = useState<CaseErrors>({});
  const [attempted, setAttempted] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [serverError, setServerError] = useState("");
  const [hint, setHint] = useState("");
  const sendingRef = useRef(false);

  function update(next: SentCase | null) {
    setMemorySent(next);
    writeStored(next);
  }

  function revalidate(next: { name: string; occupation: string; task: string }) {
    if (attempted) setErrors(validateCase(next).errors);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sendingRef.current) return;

    setAttempted(true);
    const { data, errors: found } = validateCase({ name, occupation, task });
    setErrors(found);
    if (Object.keys(found).length > 0) {
      const first = (["name", "occupation", "task"] as const).find((k) => found[k]);
      if (first) document.getElementById(first)?.focus();
      return;
    }

    sendingRef.current = true;
    setStatus("sending");
    setServerError("");
    try {
      const caseId = website ? null : await insertCase(data);
      update({ ...data, at: new Date().toISOString(), caseId });
      setStatus("idle");
      setTask("");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setStatus("error");
      setServerError(isNetworkError(err) ? NETWORK_ERROR : (err as Error).message);
    } finally {
      sendingRef.current = false;
    }
  }

  function sendAnother() {
    if (sent) {
      setName(sent.name);
      setOccupation(sent.occupation ?? "");
    }
    update(null);
    setAttempted(false);
    setErrors({});
    setStatus("idle");
    requestAnimationFrame(() => document.getElementById("task")?.focus());
  }

  if (sent) {
    return (
      <>
        <SuccessCard />
        {sent.contact ? (
          <ContactDone choice={sent.contact} name={sent.name} />
        ) : (
          <ContactForm sent={sent} onDone={(choice) => update({ ...sent, contact: choice })} />
        )}
        <button
          type="button"
          onClick={sendAnother}
          className="mx-auto mt-6 block text-sm font-medium text-white/60 underline decoration-rose/60 underline-offset-4 transition hover:text-white"
        >
          Enviar otro caso
        </button>
      </>
    );
  }

  const sending = status === "sending";

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      style={{ animationDelay: "300ms" }}
      className="animate-rise mt-8 rounded-[28px] bg-cream p-5 text-deep shadow-[0_24px_60px_-20px_rgba(0,0,0,0.6)]"
    >
      <fieldset disabled={sending} className="grid gap-5">
        <Field
          id="name"
          label="Nombre"
          value={name}
          onChange={(v) => {
            setName(v);
            revalidate({ name: v, occupation, task });
          }}
          error={errors.name}
          placeholder="Ej: Juan"
          maxLength={NAME_MAX}
          autoComplete="given-name"
          onHint={setHint}
        />
        <Field
          id="occupation"
          label="¿A qué te dedicás?"
          value={occupation}
          onChange={(v) => {
            setOccupation(v);
            revalidate({ name, occupation: v, task });
          }}
          error={errors.occupation}
          placeholder="Ej: contadora en un estudio, inmobiliaria, agro…"
          maxLength={OCCUPATION_MAX}
          autoComplete="organization-title"
          onHint={setHint}
        />
        <Field
          id="task"
          label="¿Qué tarea te gustaría delegar?"
          value={task}
          onChange={(v) => {
            setTask(v);
            revalidate({ name, occupation, task: v });
          }}
          error={errors.task}
          placeholder="Todas las semanas reviso mails de clientes y paso la información importante a una planilla."
          maxLength={TASK_MAX}
          multiline
          rows={5}
          counter
          onHint={setHint}
        />

        {/* Honeypot anti-bots */}
        <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>
            No completar
            <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
          </label>
        </div>

        {hint && (
          <p className="animate-fade-in rounded-2xl bg-white/70 px-4 py-2.5 text-sm text-deep/80" role="status">
            {hint}
          </p>
        )}

        {status === "error" && serverError && (
          <div role="alert" className="animate-fade-in rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[0.95rem] text-red-700">
            {serverError}
          </div>
        )}

        <SubmitButton busy={sending}>
          {status === "error" ? (
            "Reintentar envío"
          ) : (
            <>
              Enviar mi caso
              <Arrow />
            </>
          )}
        </SubmitButton>
      </fieldset>
    </form>
  );
}

/* ------------------------------------------------------------------ */

function SuccessCard() {
  return (
    <section
      aria-live="polite"
      className="animate-card-in relative mt-8 overflow-hidden rounded-[28px] bg-cream p-6 text-center text-deep shadow-[0_24px_60px_-20px_rgba(0,0,0,0.6)]"
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
        <span className="animate-ping-soft absolute inset-0 rounded-full bg-mauve/40" />
        <span className="animate-pop relative grid size-18 place-items-center rounded-full bg-gradient-to-br from-mauve to-deep text-cream shadow-[0_10px_30px_-8px_rgba(133,79,108,0.9)]">
          <svg viewBox="0 0 24 24" className="size-9" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M5 12.5l4.5 4.5L19 7.5" strokeDasharray="30" className="animate-draw" />
          </svg>
        </span>
      </div>
      <h2 className="headline animate-rise mt-5 text-5xl">¡Listo!</h2>
      <p style={{ animationDelay: "120ms" }} className="animate-rise mt-2 text-lg font-medium text-deep/80">
        Tu caso ya está participando.
      </p>
      <p style={{ animationDelay: "220ms" }} className="animate-rise mt-2 text-base text-deep/60">
        En unos segundos puede aparecer en pantalla <span className="animate-float inline-block">👀</span>
      </p>
      <style>{`@keyframes confetti{0%{opacity:0;transform:translate(0,0) scale(.4) rotate(0)}15%{opacity:1}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(1) rotate(220deg)}}`}</style>
    </section>
  );
}

function ContactDone({ choice, name }: { choice: "sent" | "skipped"; name: string }) {
  if (choice === "skipped") return null;
  return (
    <section className="animate-card-in mt-4 rounded-[28px] border border-white/15 bg-white/[0.06] p-5 text-center backdrop-blur-md">
      <p className="text-lg font-bold text-cream">Gracias, {name.split(" ")[0]} 🙌</p>
      <p className="mt-1 text-[0.95rem] text-white/70">Te vamos a escribir por privado con la solución para tu caso.</p>
    </section>
  );
}

const CONTACT_ORDER = ["name", "phone", "email", "occupation", "details"] as const;

function ContactForm({ sent, onDone }: { sent: SentCase; onDone: (choice: "sent" | "skipped") => void }) {
  const [form, setForm] = useState({
    name: sent.name,
    phone: "",
    email: "",
    occupation: sent.occupation ?? "",
    details: sent.task,
  });
  const [errors, setErrors] = useState<ContactErrors>({});
  const [attempted, setAttempted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState("");
  const [hint, setHint] = useState("");

  function set(key: keyof typeof form, value: string) {
    const next = { ...form, [key]: value };
    setForm(next);
    if (attempted) setErrors(validateContact(next).errors);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setAttempted(true);
    const { data, errors: found } = validateContact(form);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      const first = CONTACT_ORDER.find((k) => found[k]);
      if (first) document.getElementById(`c-${first}`)?.focus();
      return;
    }
    setBusy(true);
    setServerError("");
    try {
      const supabase = getBrowserSupabase();
      if (!supabase) throw new Error("La dinámica todavía no está configurada.");
      const { error } = await supabase.from("workshop_contacts").insert({
        session_id: getConfig().sessionId,
        case_id: sent.caseId,
        name: data.name,
        phone: data.phone,
        email: data.email,
        occupation: data.occupation || null,
        details: data.details,
      });
      if (error) {
        console.error("[participar] contact error", error);
        throw new Error("No pudimos guardar tus datos. Probá de nuevo en unos segundos.");
      }
      onDone("sent");
    } catch (err) {
      setServerError(isNetworkError(err) ? NETWORK_ERROR : (err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      style={{ animationDelay: "450ms" }}
      className="animate-rise mt-4 rounded-[28px] bg-cream p-5 text-deep shadow-[0_24px_60px_-20px_rgba(0,0,0,0.6)]"
    >
      <h3 className="headline text-[1.6rem] leading-tight">
        ¿Querés que analicemos <span className="text-gradient-deep">tu caso?</span>
      </h3>
      <p className="mt-2 text-[0.98rem] leading-snug text-deep/70">
        Dejanos tu contacto y te mandamos la solución por privado.
      </p>

      <fieldset disabled={busy} className="mt-5 grid gap-5">
        <Field
          id="c-name"
          label="Nombre"
          value={form.name}
          onChange={(v) => set("name", v)}
          error={errors.name}
          maxLength={60}
          autoComplete="name"
          onHint={setHint}
        />
        <Field
          id="c-phone"
          label="Teléfono / WhatsApp"
          value={form.phone}
          onChange={(v) => set("phone", v)}
          error={errors.phone}
          placeholder="Ej: 379 412 3456"
          maxLength={25}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          dictation={false}
          onHint={setHint}
        />
        <Field
          id="c-email"
          label="Mail"
          value={form.email}
          onChange={(v) => set("email", v)}
          error={errors.email}
          placeholder="nombre@empresa.com"
          maxLength={120}
          type="email"
          inputMode="email"
          autoComplete="email"
          dictation={false}
          onHint={setHint}
        />
        <Field
          id="c-occupation"
          label="¿A qué te dedicás?"
          value={form.occupation}
          onChange={(v) => set("occupation", v)}
          error={errors.occupation}
          placeholder="Rubro, tipo de empresa, tu rol…"
          maxLength={120}
          onHint={setHint}
        />
        <Field
          id="c-details"
          label="Contanos el caso en detalle"
          value={form.details}
          onChange={(v) => set("details", v)}
          error={errors.details}
          placeholder="¿Cómo lo hacés hoy? ¿Qué herramientas usás? ¿Cuánto tiempo te lleva?"
          maxLength={DETAILS_MAX}
          multiline
          rows={6}
          onHint={setHint}
        />

        {hint && (
          <p className="animate-fade-in rounded-2xl bg-white/70 px-4 py-2.5 text-sm text-deep/80" role="status">
            {hint}
          </p>
        )}
        {serverError && (
          <div role="alert" className="animate-fade-in rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[0.95rem] text-red-700">
            {serverError}
          </div>
        )}

        <SubmitButton busy={busy}>
          Quiero la solución
          <Arrow />
        </SubmitButton>
        <button
          type="button"
          onClick={() => onDone("skipped")}
          className="-mt-1 text-sm font-medium text-deep/55 underline decoration-deep/25 underline-offset-4 transition hover:text-deep"
        >
          No, gracias
        </button>
      </fieldset>
    </form>
  );
}
