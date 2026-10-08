import type { Metadata } from "next";
import { Aurora } from "@/components/aurora";
import { PILLARS, PillarIcon } from "@/components/pillars";
import { ParticipateForm } from "./participate-form";

export const metadata: Metadata = {
  title: "¿Qué tarea te gustaría delegar?",
};

export default function ParticiparPage() {
  return (
    <div className="relative isolate min-h-dvh overflow-x-clip">
      <Aurora />
      <main className="relative mx-auto flex w-full max-w-lg flex-col px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(2.5rem,env(safe-area-inset-bottom))]">
        <div className="animate-rise mb-5 inline-flex items-center gap-2 self-start rounded-full border border-white/70 bg-white/60 px-3 py-1.5 text-[0.7rem] font-bold tracking-[0.16em] text-deep uppercase shadow-sm backdrop-blur-md">
          <span className="relative flex size-2">
            <span className="animate-ping-soft absolute inset-0 rounded-full bg-brand" />
            <span className="relative size-2 rounded-full bg-brand" />
          </span>
          Dinámica en vivo
        </div>

        <h1
          style={{ animationDelay: "80ms" }}
          className="animate-rise font-display text-[2.35rem] leading-[0.98] font-extrabold tracking-tight text-balance text-ink uppercase"
        >
          ¿Qué tarea te gustaría{" "}
          <span className="text-shimmer animate-gradient inline-block pr-1">delegar?</span>
        </h1>

        <p style={{ animationDelay: "120ms" }} className="animate-rise mt-3 text-[1.05rem] leading-snug text-ink/70">
          Pensá en algo que hacés habitualmente en tu trabajo. Podés guiarte por estas tres ideas:
        </p>

        <ul className="mt-5 grid gap-2.5">
          {PILLARS.map((p, i) => (
            <li
              key={p.key}
              style={{ animationDelay: `${160 + i * 70}ms` }}
              className="animate-rise flex items-center gap-3.5 rounded-2xl border border-white/80 bg-white/70 p-3 pr-4 shadow-[0_8px_30px_-18px_rgba(75,42,155,0.5)] backdrop-blur-md"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand to-periwinkle text-white shadow-[0_8px_20px_-8px_rgba(139,92,246,0.9)]">
                <PillarIcon name={p.key} className="size-5.5" />
              </span>
              <p className="text-[0.95rem] leading-snug text-ink/70">
                <strong className="font-display block text-[0.95rem] font-bold tracking-[0.12em] text-deep uppercase">
                  {p.title}
                </strong>
                {p.text}
              </p>
            </li>
          ))}
        </ul>

        <blockquote
          style={{ animationDelay: "360ms" }}
          className="animate-rise relative mt-5 overflow-hidden rounded-2xl bg-gradient-to-br from-deep to-brand px-5 py-4 text-white shadow-[0_14px_40px_-18px_rgba(75,42,155,0.9)]"
        >
          <span aria-hidden className="font-display absolute -top-3 right-3 text-7xl text-white/15">
            ”
          </span>
          <p className="relative text-[1.05rem] leading-snug font-medium">
            Esto lo hago todo el tiempo… <span className="text-orchid">¿por qué sigo haciéndolo yo?</span>
          </p>
        </blockquote>

        <ParticipateForm />
      </main>
    </div>
  );
}
