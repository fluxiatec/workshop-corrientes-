"use client";

import { useEffect, useState } from "react";

export const TIMER_SECONDS = 120;

export type TimerState = {
  status: "idle" | "running" | "paused";
  endsAt: number | null; // epoch ms, solo cuando corre
  remainingMs: number; // cuando está pausado / sin iniciar
};

export const initialTimer: TimerState = { status: "idle", endsAt: null, remainingMs: TIMER_SECONDS * 1000 };

export function playTimer(t: TimerState): TimerState {
  const remaining = t.remainingMs > 0 ? t.remainingMs : TIMER_SECONDS * 1000;
  return { status: "running", endsAt: Date.now() + remaining, remainingMs: remaining };
}

export function pauseTimer(t: TimerState): TimerState {
  if (t.status !== "running" || !t.endsAt) return t;
  return { status: "paused", endsAt: null, remainingMs: Math.max(0, t.endsAt - Date.now()) };
}

const fmt = (ms: number) => {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

type Props = {
  timer: TimerState;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
};

/** Cronómetro circular de la dinámica (2 minutos). */
export function Countdown({ timer, onPlay, onPause, onReset }: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (timer.status !== "running") return;
    const t = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(t);
  }, [timer.status]);

  const total = TIMER_SECONDS * 1000;
  const remaining =
    timer.status === "running" && timer.endsAt ? Math.max(0, timer.endsAt - now) : timer.remainingMs;
  const done = timer.status === "running" && remaining === 0;
  const urgent = timer.status === "running" && !done && remaining <= 15_000;
  const progress = remaining / total;

  const R = 46;
  const C = 2 * Math.PI * R;

  return (
    <div className="flex items-center gap-3">
      <div
        className={`relative grid size-[clamp(5.5rem,8vw,9rem)] shrink-0 place-items-center ${
          done ? "animate-pop" : urgent ? "animate-[live_1s_ease-in-out_infinite]" : ""
        }`}
      >
        <svg viewBox="0 0 100 100" className="absolute inset-0 size-full -rotate-90" aria-hidden>
          <defs>
            <linearGradient id="timer-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#c4b5fd" />
              <stop offset="100%" stopColor="#a5b4fc" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r={R} fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)" strokeWidth="6" />
          <circle
            cx="50"
            cy="50"
            r={R}
            fill="none"
            stroke={done ? "#e2c6ff" : urgent ? "#fcd34d" : "url(#timer-grad)"}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={done ? 0 : C * (1 - progress)}
            className="transition-[stroke-dashoffset] duration-200 ease-linear"
          />
        </svg>
        <div className="relative text-center">
          {done ? (
            <span className="font-display text-[clamp(0.95rem,1.4vw,1.6rem)] leading-none font-extrabold text-orchid uppercase">
              ¡Tiempo!
            </span>
          ) : (
            <span
              className={`font-display text-[clamp(1.5rem,2.4vw,2.75rem)] leading-none font-extrabold tabular-nums ${
                urgent ? "text-amber-200" : "text-white"
              }`}
            >
              {fmt(remaining)}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        {timer.status === "running" && !done ? (
          <TimerButton onClick={onPause} label="Pausar">
            <path d="M8 5v14M16 5v14" />
          </TimerButton>
        ) : (
          <TimerButton onClick={done ? onReset : onPlay} label={done ? "Reiniciar" : "Iniciar"} primary={!done}>
            {done ? <path d="M4 12a8 8 0 1 0 2.3-5.7M4 4v4h4" /> : <path d="M8 5l11 7-11 7z" fill="currentColor" />}
          </TimerButton>
        )}
        {timer.status !== "idle" && !done && (
          <TimerButton onClick={onReset} label="Reiniciar">
            <path d="M4 12a8 8 0 1 0 2.3-5.7M4 4v4h4" />
          </TimerButton>
        )}
      </div>
    </div>
  );
}

function TimerButton({
  children,
  onClick,
  label,
  primary = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`grid size-10 place-items-center rounded-full transition hover:scale-110 ${
        primary
          ? "bg-gradient-to-br from-brand to-periwinkle text-white shadow-[0_0_24px_-4px_rgba(139,92,246,0.9)]"
          : "border border-white/15 bg-white/[0.06] text-lavender hover:bg-white/15"
      }`}
    >
      <svg viewBox="0 0 24 24" className="size-4.5" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {children}
      </svg>
    </button>
  );
}
