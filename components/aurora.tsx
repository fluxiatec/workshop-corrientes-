/** Fondo con manchas de luz lila que se mueven lentamente. */
export function Aurora({ tone = "light" }: { tone?: "light" | "dark" }) {
  const dark = tone === "dark";
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
      <div
        className={`animate-drift-a absolute -top-[20%] -left-[15%] size-[70vmax] rounded-full blur-[90px] ${
          dark ? "bg-brand/35" : "bg-lilac/45"
        }`}
      />
      <div
        className={`animate-drift-b absolute -top-[10%] -right-[25%] size-[60vmax] rounded-full blur-[100px] ${
          dark ? "bg-periwinkle/20" : "bg-periwinkle/30"
        }`}
      />
      <div
        className={`animate-drift-c absolute -bottom-[35%] left-[20%] size-[65vmax] rounded-full blur-[110px] ${
          dark ? "bg-orchid/15" : "bg-orchid/50"
        }`}
      />
      {/* Grilla sutil para dar textura "tech" */}
      <div
        className={`absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_75%)] ${
          dark
            ? "bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)]"
            : "bg-[linear-gradient(rgba(75,42,155,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(75,42,155,0.05)_1px,transparent_1px)]"
        } bg-[size:56px_56px]`}
      />
    </div>
  );
}
