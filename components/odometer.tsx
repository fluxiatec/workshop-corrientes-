const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

/** Número que "rueda" dígito a dígito cuando cambia (estilo odómetro). */
export function Odometer({ value, className = "" }: { value: number; className?: string }) {
  const digits = String(Math.max(0, value)).split("").map(Number);
  return (
    <span className={`inline-flex leading-none tabular-nums ${className}`} data-count={value} aria-label={String(value)} role="img">
      {digits.map((d, i) => (
        // La key cuenta desde la derecha: las unidades conservan su columna cuando aparece una decena.
        <span key={digits.length - i} aria-hidden className="relative inline-block h-[1em] overflow-hidden">
          <span
            className="flex flex-col transition-transform duration-1000 ease-fluid"
            style={{ transform: `translateY(-${d * 10}%)` }}
          >
            {DIGITS.map((n) => (
              <span key={n} className="h-[1em]">
                {n}
              </span>
            ))}
          </span>
        </span>
      ))}
    </span>
  );
}
