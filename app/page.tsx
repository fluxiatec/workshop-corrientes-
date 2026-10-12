import { Aurora, Orb } from "@/components/aurora";

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
      <Orb className="absolute top-[14vh] right-[6vw] w-[min(34vw,430px)] opacity-90 max-md:opacity-30 max-md:w-[70vw]" />
      <main className="relative mx-auto flex min-h-dvh max-w-5xl flex-col justify-center px-6 py-12">
        <span className="kicker animate-rise">Workshop</span>
        <h1 style={{ animationDelay: "80ms" }} className="animate-rise headline mt-6 text-[clamp(3rem,7vw,6.5rem)]">
          <span className="text-gradient animate-gradient">IA en</span>
          <br />
          <span className="text-gradient animate-gradient">la práctica</span>
        </h1>
        <p style={{ animationDelay: "160ms" }} className="animate-rise mt-5 max-w-xl text-[clamp(1.1rem,1.6vw,1.5rem)] text-white/75">
          ¿Qué tarea te gustaría delegar? Dinámica en vivo.
        </p>
        <ul className="mt-10 grid max-w-2xl gap-3">
          {LINKS.map((l, i) => (
            <li key={l.href} style={{ animationDelay: `${240 + i * 90}ms` }} className="animate-rise">
              <a
                href={BASE + l.href}
                className="group flex items-center justify-between gap-4 rounded-[22px] bg-cream px-6 py-4 text-deep shadow-[0_20px_60px_rgba(0,0,0,0.25)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_70px_-10px_rgba(0,0,0,0.45)]"
              >
                <span>
                  <span className="block text-xl font-extrabold tracking-[-0.03em]">{l.title}</span>
                  <span className="text-sm text-deep/65">{l.text}</span>
                </span>
                <span className="font-mono text-sm text-mauve transition-transform group-hover:translate-x-1.5">
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
