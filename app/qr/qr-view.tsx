"use client";

import { useState } from "react";
import { Aurora } from "@/components/aurora";
import { PILLARS, PillarIcon } from "@/components/pillars";
import { QrCode } from "@/components/qr-code";
import { useConfig } from "@/components/use-config";
import { isLocalUrl } from "@/lib/config";
import { participateUrl, qrPngDataUrl, qrSvg } from "@/lib/qr";

function download(href: string, filename: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function QrView() {
  const config = useConfig();
  const url = config ? participateUrl(config.siteUrl) : null;
  const local = config ? isLocalUrl(config.siteUrl) : false;
  const [copied, setCopied] = useState(false);

  const buttonBase = "rounded-xl px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5 disabled:opacity-50";

  return (
    <div className="relative isolate min-h-dvh overflow-x-clip">
      <Aurora />
      <main className="relative flex min-h-dvh flex-col items-center justify-center gap-6 px-4 py-8">
        {local && (
          <div className="w-full max-w-xl rounded-2xl border border-amber-300 bg-amber-50/90 px-4 py-3 text-sm text-amber-900">
            <strong>Ojo:</strong> este QR apunta a <code>{config?.siteUrl}</code>, que solo funciona en esta
            computadora. Abrí <code>/qr</code> desde la URL publicada (o completá <code>siteUrl</code> en{" "}
            <code>config.js</code>).
          </div>
        )}

        {/* Tarjeta lista para capturar o proyectar */}
        <section className="animate-card-in flex w-full max-w-[min(34rem,92vw)] flex-col items-center rounded-[2rem] border border-white bg-white px-[clamp(1.25rem,4vw,2.75rem)] pt-[clamp(1.25rem,4vw,2.5rem)] pb-[clamp(1.5rem,4vw,2.5rem)] text-center shadow-[0_30px_80px_-30px_rgba(75,42,155,0.55)]">
          <QrCode text={url} className="aspect-square w-full max-w-[min(26rem,58vh)]" />
          <p className="mt-4 text-[clamp(0.85rem,2.4vw,1rem)] font-bold tracking-[0.24em] text-brand uppercase">
            Escaneá y contanos
          </p>
          <h1 className="font-display mt-1.5 text-[clamp(1.6rem,5vw,2.4rem)] leading-[1] font-extrabold tracking-tight text-balance text-ink uppercase">
            ¿Qué tarea te gustaría <span className="text-shimmer animate-gradient">delegar?</span>
          </h1>
          <ul className="mt-4 flex flex-wrap justify-center gap-2">
            {PILLARS.map((p) => (
              <li
                key={p.key}
                className="flex items-center gap-1.5 rounded-full bg-lavender py-1 pr-3 pl-1 text-xs font-bold tracking-[0.14em] text-deep uppercase"
              >
                <span className="grid size-6 place-items-center rounded-full bg-gradient-to-br from-brand to-periwinkle text-white">
                  <PillarIcon name={p.key} className="size-3.5" />
                </span>
                {p.title}
              </li>
            ))}
          </ul>
          <p className="mt-4 font-mono text-sm break-all text-deep/60">{url?.replace(/^https?:\/\//, "")}</p>
        </section>

        <div style={{ animationDelay: "200ms" }} className="animate-rise flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            disabled={!url}
            onClick={async () => url && download(await qrPngDataUrl(url), "qr-participar.png")}
            className={`${buttonBase} bg-gradient-to-r from-deep to-brand font-bold text-white shadow-[0_10px_24px_-10px_rgba(139,92,246,0.9)]`}
          >
            Descargar PNG
          </button>
          <button
            type="button"
            disabled={!url}
            onClick={async () => {
              if (!url) return;
              const blob = new Blob([await qrSvg(url)], { type: "image/svg+xml" });
              const href = URL.createObjectURL(blob);
              download(href, "qr-participar.svg");
              setTimeout(() => URL.revokeObjectURL(href), 1000);
            }}
            className={`${buttonBase} border border-lilac/70 bg-white/80 text-deep backdrop-blur hover:bg-white`}
          >
            Descargar SVG
          </button>
          <button
            type="button"
            disabled={!url}
            onClick={async () => {
              if (!url) return;
              try {
                await navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 1800);
              } catch {
                window.prompt("Copiá el link:", url);
              }
            }}
            className={`${buttonBase} border border-lilac/70 bg-white/80 text-deep backdrop-blur hover:bg-white`}
          >
            {copied ? "¡Copiado!" : "Copiar link"}
          </button>
        </div>
      </main>
    </div>
  );
}
