import type { Metadata } from "next";
import { Aurora, Orb } from "@/components/aurora";
import { PILLARS, PillarIcon } from "@/components/pillars";
import { ParticipateForm } from "./participate-form";

export const metadata: Metadata = {
  title: "¿Qué tarea te gustaría delegar?",
};

export default function ParticiparPage() {
  return (
    <div className="relative isolate min-h-dvh overflow-x-clip">
      <Aurora />
      <Orb className="absolute -top-16 -right-28 w-52 opacity-45" />

      <main className="relative mx-auto flex w-full max-w-lg flex-col px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(2.5rem,env(safe-area-inset-bottom))]">
        <span className="kicker animate-rise mb-5">
          <span className="relative flex size-2">
            <span className="animate-ping-soft absolute inset-0 rounded-full bg-rose" />
            <span className="relative size-2 rounded-full bg-rose" />
          </span>
          Dinámica en vivo
        </span>

        <h1 style={{ animationDelay: "80ms" }} className="animate-rise headline text-[2.7rem] text-balance">
          ¿Qué tarea te gustaría <span className="text-gradient animate-gradient pr-1">delegar?</span>
        </h1>

        <p style={{ animationDelay: "120ms" }} className="animate-rise mt-4 text-[1.07rem] leading-snug text-white/75">
          Pensá en algo que hacés habitualmente en tu trabajo. Podés guiarte por estas tres ideas:
        </p>

        <ul className="mt-5 grid gap-2.5">
          {PILLARS.map((p, i) => (
            <li
              key={p.key}
              style={{ animationDelay: `${160 + i * 80}ms` }}
              className="animate-rise flex items-center gap-3.5 rounded-[22px] bg-cream p-3 pr-4 text-deep shadow-[0_16px_40px_-20px_rgba(0,0,0,0.6)]"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-mauve to-plum text-cream">
                <PillarIcon name={p.key} className="size-5.5" />
              </span>
              <p className="text-[0.95rem] leading-snug text-deep/75">
                <strong className="block text-[1.05rem] font-extrabold tracking-[-0.02em] text-deep">{p.title}</strong>
                {p.text}
              </p>
            </li>
          ))}
        </ul>

        <blockquote
          style={{ animationDelay: "420ms" }}
          className="animate-rise mt-5 border-l-[3px] border-rose py-1 pl-4 text-[1.1rem] leading-snug font-medium text-white/90"
        >
          “Esto lo hago todo el tiempo… <span className="text-gradient font-bold">¿por qué sigo haciéndolo yo?</span>”
        </blockquote>

        <ParticipateForm />
      </main>
    </div>
  );
}
