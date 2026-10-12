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
      <Orb className="absolute -top-20 -right-28 w-48 opacity-35" />

      <main className="relative mx-auto flex w-full max-w-lg flex-col px-5 pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(2.5rem,env(safe-area-inset-bottom))]">
        <h1 className="animate-rise headline text-center text-[2.6rem] text-balance">
          ¿Qué tarea te gustaría <span className="text-gradient animate-gradient">delegar?</span>
        </h1>

        <ul className="mt-7 grid gap-2">
          {PILLARS.map((p, i) => (
            <li
              key={p.key}
              style={{ animationDelay: `${120 + i * 80}ms` }}
              className="animate-rise flex items-center gap-3.5 rounded-2xl border border-white/10 bg-white/[0.05] px-3.5 py-3 backdrop-blur-md"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-mauve to-plum text-cream">
                <PillarIcon name={p.key} className="size-4.5" />
              </span>
              <p className="text-[0.92rem] leading-snug text-white/65">
                <strong className="mr-1.5 font-bold text-cream">{p.title}.</strong>
                {p.text}
              </p>
            </li>
          ))}
        </ul>

        <ParticipateForm />
      </main>
    </div>
  );
}
