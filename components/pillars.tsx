export const PILLARS = [
  { key: "repetitivo", title: "Repetitivo", text: "Lo hacés constantemente." },
  { key: "tedioso", title: "Tedioso", text: "Es necesario, pero te consume tiempo." },
  {
    key: "digital",
    title: "Digital",
    text: "Trabajás con mails, documentos, planillas, sistemas, archivos o internet.",
  },
] as const;

type PillarKey = (typeof PILLARS)[number]["key"];

/** Íconos con movimiento sutil: flechas que giran, reloj de arena que se da vuelta, cursor que titila. */
export function PillarIcon({ name, className = "size-6" }: { name: PillarKey; className?: string }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (name === "repetitivo") {
    return (
      <svg {...common} className={`${className} animate-spin-slow`}>
        <path d="M20 11a8 8 0 0 0-14.9-3.9" />
        <path d="M4 4v4h4" />
        <path d="M4 13a8 8 0 0 0 14.9 3.9" />
        <path d="M20 20v-4h-4" />
      </svg>
    );
  }
  if (name === "tedioso") {
    return (
      <svg {...common} className={`${className} animate-hourglass`}>
        <path d="M6 3h12M6 21h12" />
        <path d="M7 3c0 5 5 6 5 9s-5 4-5 9" />
        <path d="M17 3c0 5-5 6-5 9s5 4 5 9" />
        <path d="M9.5 18.5h5" />
      </svg>
    );
  }
  return (
    <svg {...common} className={className}>
      <rect x="3" y="4" width="18" height="13" rx="2.5" />
      <path d="M8 21h8M12 17v4" />
      <path d="M7.5 10.5l2 1.5-2 1.5" />
      <path d="M12 13.5h3" className="animate-blink" />
    </svg>
  );
}

/** Variante compacta tipo "chips" para la pantalla proyectada. */
export function PillarChips({ className = "" }: { className?: string }) {
  return (
    <ul className={`flex flex-wrap gap-2.5 ${className}`}>
      {PILLARS.map((p, i) => (
        <li
          key={p.key}
          style={{ animationDelay: `${200 + i * 120}ms` }}
          className="animate-rise group/pill relative flex items-center gap-2.5 rounded-full border border-white/12 bg-white/[0.06] py-1.5 pr-4 pl-1.5 backdrop-blur-md"
        >
          <span className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-brand to-periwinkle text-white shadow-[0_0_20px_-4px_rgba(139,92,246,0.9)]">
            <PillarIcon name={p.key} className="size-4.5" />
          </span>
          <span className="text-[clamp(0.75rem,0.85vw,1rem)] font-bold tracking-[0.16em] text-white uppercase">
            {p.title}
          </span>
          <span className="hidden text-[clamp(0.75rem,0.85vw,1rem)] text-lavender/60 2xl:inline">{p.text}</span>
        </li>
      ))}
    </ul>
  );
}

/** Variante tarjetas grandes (estado vacío de la pantalla proyectada). */
export function PillarCards({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const dark = tone === "dark";
  return (
    <ul className="grid gap-[clamp(0.75rem,1.2vw,1.25rem)] sm:grid-cols-3">
      {PILLARS.map((p, i) => (
        <li
          key={p.key}
          style={{ animationDelay: `${300 + i * 140}ms` }}
          className={`animate-rise rounded-3xl border p-[clamp(1rem,1.5vw,1.75rem)] backdrop-blur-md ${
            dark ? "border-white/10 bg-white/[0.05]" : "border-lilac/50 bg-white/80"
          }`}
        >
          <span className="grid size-[clamp(2.5rem,3vw,3.25rem)] place-items-center rounded-2xl bg-gradient-to-br from-brand to-periwinkle text-white shadow-[0_8px_30px_-8px_rgba(139,92,246,0.9)]">
            <PillarIcon name={p.key} className="size-[55%]" />
          </span>
          <p
            className={`font-display mt-4 text-[clamp(1.1rem,1.6vw,1.9rem)] font-bold tracking-wide uppercase ${
              dark ? "text-white" : "text-ink"
            }`}
          >
            {p.title}
          </p>
          <p className={`mt-1 text-[clamp(0.9rem,1.1vw,1.25rem)] leading-snug ${dark ? "text-lavender/70" : "text-ink/65"}`}>
            {p.text}
          </p>
        </li>
      ))}
    </ul>
  );
}
