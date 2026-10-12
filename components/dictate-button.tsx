"use client";

import { useEffect, useRef, useState } from "react";

// Tipos mínimos de la Web Speech API (no todos los navegadores la traen tipada).
type RecognitionResult = { 0: { transcript: string }; isFinal: boolean };
type RecognitionEvent = { resultIndex: number; results: ArrayLike<RecognitionResult> };
type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type RecognitionCtor = new () => Recognition;

function getRecognition(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

type Props = {
  /** id del campo al que se le agrega lo dictado */
  targetId: string;
  onText: (text: string) => void;
  onHint?: (message: string) => void;
};

/** Micrófono para dictar dentro de un campo. Si el navegador no lo soporta, sugiere el dictado del teclado. */
export function DictateButton({ targetId, onText, onHint }: Props) {
  const [listening, setListening] = useState(false);
  const recRef = useRef<Recognition | null>(null);

  useEffect(() => () => recRef.current?.stop(), []);

  function toggle() {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const Ctor = getRecognition();
    if (!Ctor) {
      document.getElementById(targetId)?.focus();
      onHint?.("Tocá el micrófono 🎤 de tu teclado para dictar.");
      return;
    }
    const rec = new Ctor();
    rec.lang = "es-AR";
    rec.interimResults = false;
    rec.continuous = false;
    rec.onresult = (e) => {
      let text = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) text += e.results[i][0].transcript;
      }
      if (text.trim()) onText(text.trim());
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        onHint?.("Permití el micrófono en el navegador, o usá el dictado del teclado 🎤.");
      }
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={listening ? "Dejar de dictar" : "Dictar con la voz"}
      aria-pressed={listening}
      title={listening ? "Escuchando… tocá para terminar" : "Dictar con la voz"}
      className={`relative grid size-10 shrink-0 place-items-center rounded-full transition duration-500 ease-fluid active:scale-95 ${
        listening ? "bg-mauve text-cream" : "bg-rose/40 text-plum hover:bg-rose/70"
      }`}
    >
      {listening && <span aria-hidden className="animate-ping-soft absolute inset-0 rounded-full bg-mauve/50" />}
      <svg viewBox="0 0 24 24" className="relative size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="9" y="3" width="6" height="11" rx="3" />
        <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
      </svg>
    </button>
  );
}
