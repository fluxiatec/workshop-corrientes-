"use client";

import { useState } from "react";
import type { WorkshopCase } from "@/lib/types";

const timeFormat = new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

type Props = {
  c: WorkshopCase;
  number: number;
  isFresh: boolean;
  isModerator: boolean;
  isPending: boolean;
  selectionFull: boolean;
  enterDelay?: number;
  size?: "md" | "xl";
  columns?: number;
  onToggleSelect: () => void;
  onHide: () => void;
};

/** Tamaño del texto en la vista de seleccionados según columnas y largo de la tarea. */
function xlTaskSize(columns: number, length: number) {
  if (columns <= 1) return length > 180 ? "text-[clamp(1.6rem,3vw,3.25rem)]" : "text-[clamp(1.9rem,3.6vw,4rem)]";
  if (columns === 2) return length > 180 ? "text-[clamp(1.4rem,2.1vw,2.5rem)]" : "text-[clamp(1.6rem,2.6vw,3rem)]";
  return length > 180 ? "text-[clamp(1.25rem,1.6vw,2rem)]" : "text-[clamp(1.4rem,2vw,2.5rem)]";
}

export function CaseCard({
  c,
  number,
  isFresh,
  isModerator,
  isPending,
  selectionFull,
  enterDelay = 0,
  size = "md",
  columns = 3,
  onToggleSelect,
  onHide,
}: Props) {
  const [delay] = useState(enterDelay); // fijo al montar: reordenar no re-dispara la entrada
  const xl = size === "xl";
  const selected = c.is_selected;

  const surface = selected
    ? "bg-gradient-to-br from-mauve via-plum to-deep text-cream ring-2 ring-rose/80 shadow-[0_30px_80px_-20px_rgba(133,79,108,0.95)]"
    : isFresh
      ? "bg-white text-deep ring-[3px] ring-rose animate-glow shadow-[0_24px_60px_-20px_rgba(223,182,178,0.9)]"
      : "bg-cream text-deep shadow-[0_20px_60px_rgba(0,0,0,0.3)] hover:-translate-y-1.5 hover:rotate-[-0.4deg] hover:shadow-[0_30px_70px_-10px_rgba(0,0,0,0.45)]";

  return (
    <article
      style={{ animationDelay: `${delay}ms` }}
      className={`group animate-card-in relative flex w-full flex-col overflow-hidden rounded-[1.75rem] transition-[background-color,box-shadow,color,transform] duration-700 ease-fluid ${surface} ${
        xl ? "p-[clamp(1.5rem,2.6vw,3.25rem)]" : "p-[clamp(1.15rem,1.5vw,1.9rem)]"
      } ${isPending ? "opacity-70" : ""}`}
    >
      {/* Haz de luz al llegar un caso nuevo */}
      {isFresh && !selected && (
        <span
          aria-hidden
          className="animate-sweep pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-rose/45 to-transparent"
        />
      )}

      {/* Comilla decorativa */}
      <span
        aria-hidden
        className={`headline pointer-events-none absolute -right-1 -bottom-12 select-none ${
          selected ? "text-cream/10" : "text-rose/45"
        } ${xl ? "text-[clamp(10rem,14vw,16rem)]" : "text-[clamp(7rem,9vw,10rem)]"}`}
      >
        ”
      </span>

      <header className="relative flex items-center justify-between gap-3">
        <h3
          className={`min-w-0 truncate font-extrabold tracking-[0.08em] uppercase ${
            selected ? "text-cream" : "text-mauve"
          } ${xl ? "text-[clamp(1.25rem,1.8vw,2.2rem)]" : "text-[clamp(1.05rem,1.2vw,1.4rem)]"}`}
        >
          {c.name}
        </h3>
        <div className="flex shrink-0 items-center gap-2">
          {isFresh && !selected && (
            <span className="animate-pop relative overflow-hidden rounded-full bg-gradient-to-r from-mauve to-plum px-2.5 py-0.5 text-[0.68rem] font-bold tracking-[0.14em] text-cream uppercase">
              <span aria-hidden className="animate-shine absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/50 to-transparent" />
              Nuevo
            </span>
          )}
          <span
            className={`rounded-full px-2 py-0.5 font-mono font-semibold tabular-nums ${
              selected ? "bg-cream/15 text-cream/85" : "bg-rose/40 text-plum"
            } ${xl ? "text-[clamp(0.95rem,1.2vw,1.5rem)]" : "text-[clamp(0.78rem,0.9vw,1rem)]"}`}
          >
            #{number}
          </span>
        </div>
      </header>

      {selected && (
        <span
          className={`animate-pop relative mt-3 inline-flex items-center gap-1.5 self-start rounded-full bg-cream font-bold tracking-[0.14em] text-deep uppercase shadow-[0_6px_20px_-6px_rgba(255,255,255,0.6)] ${
            xl ? "px-3.5 py-1 text-[clamp(0.75rem,0.9vw,1rem)]" : "px-2.5 py-0.5 text-[0.7rem]"
          }`}
        >
          ⭐ Seleccionada
        </span>
      )}

      <p
        className={`relative mt-3 leading-snug font-semibold tracking-[-0.015em] text-pretty break-words ${
          xl ? xlTaskSize(columns, c.task.length) : "text-[clamp(1.1rem,1.4vw,1.7rem)]"
        }`}
      >
        “{c.task}”
      </p>

      <footer className="relative mt-auto flex items-end justify-between gap-3 pt-4">
        <time
          dateTime={c.created_at}
          className={`font-mono text-[0.75rem] tabular-nums ${selected ? "text-cream/60" : "text-deep/45"}`}
        >
          {timeFormat.format(new Date(c.created_at))}
        </time>

        {isModerator && (
          <div className="flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100">
            <button
              type="button"
              disabled={isPending}
              onClick={onToggleSelect}
              title={!selected && selectionFull ? "Ya hay 3 seleccionados" : undefined}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                selected
                  ? "bg-white/15 text-white hover:bg-white/25"
                  : selectionFull
                    ? "bg-deep/5 text-deep/40"
                    : "bg-gradient-to-r from-mauve to-deep text-cream hover:opacity-90"
              }`}
            >
              {selected ? "Quitar ⭐" : "⭐ Seleccionar"}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={onHide}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                selected ? "text-white/70 hover:bg-white/15" : "text-deep/55 hover:bg-deep/5 hover:text-deep"
              }`}
            >
              Ocultar
            </button>
          </div>
        )}
      </footer>
    </article>
  );
}
