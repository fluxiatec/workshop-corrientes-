"use client";

import { useEffect, useState } from "react";
import { qrSvg } from "@/lib/qr";

/** QR negro sobre blanco, generado en el navegador. */
export function QrCode({ text, className = "", label }: { text: string | null; className?: string; label?: string }) {
  const [svg, setSvg] = useState<{ text: string; markup: string } | null>(null);

  useEffect(() => {
    if (!text) return;
    let cancelled = false;
    qrSvg(text).then((markup) => !cancelled && setSvg({ text, markup }));
    return () => {
      cancelled = true;
    };
  }, [text]);

  const ready = svg && svg.text === text;
  return (
    <div
      role="img"
      aria-label={label ?? (text ? `Código QR hacia ${text}` : "Código QR")}
      className={`bg-white [&>svg]:size-full ${ready ? "animate-fade-in" : "animate-pulse bg-white/80"} ${className}`}
      dangerouslySetInnerHTML={ready ? { __html: svg.markup } : undefined}
    />
  );
}
