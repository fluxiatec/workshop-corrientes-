const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

/** Fondo como el de la presentación: base #190019 con luces ciruela que se mueven lento. */
export function Aurora() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-0 overflow-hidden bg-ink">
      <div className="animate-drift-a absolute -top-[25%] -left-[20%] size-[70vmax] rounded-full bg-mauve/45 blur-[110px]" />
      <div className="animate-drift-b absolute -right-[25%] -bottom-[30%] size-[70vmax] rounded-full bg-deep blur-[100px]" />
      <div className="animate-drift-c absolute top-[30%] left-[35%] size-[45vmax] rounded-full bg-plum/40 blur-[120px]" />
      {/* Grano sutil para que el degradé no se vea plano en el proyector */}
      <div className="absolute inset-0 opacity-[0.07] mix-blend-overlay" style={{ backgroundImage: GRAIN }} />
    </div>
  );
}

/** Esfera cónica flotante (elemento de marca de la portada). */
export function Orb({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`animate-orb pointer-events-none aspect-square ${className}`}>
      <div className="orb relative size-full">
        {/* Anillo interior: grosor proporcional al tamaño de la esfera */}
        <div
          className="absolute inset-[20%] rounded-full opacity-60"
          style={{ background: "radial-gradient(closest-side, transparent 68%, #190019 69%)" }}
        />
      </div>
    </div>
  );
}
