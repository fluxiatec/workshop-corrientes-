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


const ICON_TILE =
  "grid place-items-center rounded-full bg-gradient-to-br from-mauve to-plum text-cream shadow-[0_0_24px_-4px_rgba(133,79,108,0.9)]";

/** Variante compacta tipo "chips" para la pantalla proyectada. */
export function PillarChips({ className = "" }: { className?: string }) {
  return (
    <ul className={`flex flex-wrap gap-2.5 ${className}`}>
      {PILLARS.map((p, i) => (
        <li
          key={p.key}
          style={{ animationDelay: `${200 + i * 120}ms` }}
          className="animate-rise flex items-center gap-2.5 rounded-full border border-white/25 bg-white/[0.05] py-1.5 pr-4 pl-1.5 backdrop-blur-md"
        >
          <span className={`${ICON_TILE} size-8`}>
            <PillarIcon name={p.key} className="size-4.5" />
          </span>
          <span className="text-[clamp(0.75rem,0.85vw,1rem)] font-bold tracking-[0.14em] text-cream uppercase">
            {p.title}
          </span>
          <span className="hidden text-[clamp(0.75rem,0.85vw,1rem)] text-white/55 2xl:inline">{p.text}</span>
        </li>
      ))}
    </ul>
  );
}

/** Tarjetas crema grandes, como las de la slide "¿Qué tarea te gustaría poder delegar?". */
export function PillarCards() {
  return (
    <ul className="grid gap-[clamp(0.9rem,1.4vw,1.5rem)] sm:grid-cols-3">
      {PILLARS.map((p, i) => (
        <li
          key={p.key}
          style={{ animationDelay: `${300 + i * 140}ms` }}
          className="animate-rise group rounded-[28px] bg-cream p-[clamp(1.25rem,2vw,2rem)] text-deep shadow-[0_20px_60px_rgba(0,0,0,0.25)] transition duration-500 hover:-translate-y-1.5 hover:rotate-[-0.6deg]"
        >
          <span className={`${ICON_TILE} size-[clamp(2.75rem,3.2vw,3.5rem)] transition-transform duration-500 group-hover:scale-110`}>
            <PillarIcon name={p.key} className="size-[52%]" />
          </span>
          <p className="headline mt-5 text-[clamp(1.4rem,2vw,2.3rem)]">{p.title}</p>
          <p className="mt-1.5 text-[clamp(0.95rem,1.15vw,1.3rem)] leading-snug text-deep/75">{p.text}</p>
        </li>
      ))}
    </ul>
  );
}

const MARQUEE_ITEMS = ["Repetitivo", "Tedioso", "Digital"];

/** Cinta infinita con las tres ideas (movimiento continuo y sutil). */
export function PillarMarquee({ className = "" }: { className?: string }) {
  // Se repite para cubrir pantallas anchas sin huecos.
  const row = Array.from({ length: 4 }, () => MARQUEE_ITEMS).flat();
  return (
    <div
      aria-hidden
      className={`overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)] ${className}`}
    >
      <div className="animate-marquee flex w-max">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center">
            {row.map((t, i) => (
              <span key={`${copy}-${i}`} className="flex items-center">
                <span
                  className={`headline px-[clamp(1rem,2vw,2.25rem)] text-[clamp(1.1rem,2vw,2.25rem)] whitespace-nowrap ${
                    i % MARQUEE_ITEMS.length === 1 ? "text-gradient uppercase" : "text-cream/85 uppercase"
                  }`}
                >
                  {t}
                </span>
                <span className="size-2 rotate-45 rounded-[2px] bg-rose/70" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
