import { Aurora } from "@/components/aurora";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const LINKS = [
  { href: "/participar", title: "Participar", text: "Formulario para el celular (destino del QR)." },
  { href: "/casos", title: "Casos en vivo", text: "Pantalla para proyectar durante el workshop." },
  { href: "/qr", title: "QR", text: "Código para la presentación, descargable." },
];

export default function Home() {
  return (
    <div className="relative isolate min-h-dvh overflow-x-clip">
      <Aurora />
      <main className="relative mx-auto flex min-h-dvh max-w-2xl flex-col justify-center px-5 py-12">
        <p className="animate-rise text-xs font-bold tracking-[0.22em] text-brand uppercase">Workshop · IA</p>
        <h1
          style={{ animationDelay: "80ms" }}
          className="animate-rise font-display mt-2 text-5xl leading-[0.95] font-extrabold tracking-tight text-ink uppercase"
        >
          ¿Qué tarea te gustaría <span className="text-shimmer animate-gradient">delegar?</span>
        </h1>
        <ul className="mt-8 grid gap-3">
          {LINKS.map((l, i) => (
            <li key={l.href} style={{ animationDelay: `${180 + i * 90}ms` }} className="animate-rise">
              <a
                href={BASE + l.href}
                className="group flex items-center justify-between gap-4 rounded-2xl border border-white/80 bg-white/70 px-5 py-4 backdrop-blur-md transition hover:-translate-y-0.5 hover:border-lilac hover:shadow-[0_16px_40px_-20px_rgba(139,92,246,0.7)]"
              >
                <span>
                  <span className="font-display block text-lg font-bold text-ink">{l.title}</span>
                  <span className="text-sm text-ink/60">{l.text}</span>
                </span>
                <span className="font-mono text-sm text-brand transition-transform group-hover:translate-x-1">
                  {l.href} →
                </span>
              </a>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
