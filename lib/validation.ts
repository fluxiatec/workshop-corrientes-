export const NAME_MIN = 2;
export const NAME_MAX = 40;
export const TASK_MIN = 10;
export const TASK_MAX = 300;

// Caracteres de control e invisibles (zero-width, bidi, separadores de línea, BOM).
const INVISIBLE_RANGES: [number, number][] = [
  [0x00, 0x1f], [0x7f, 0x9f], [0x200b, 0x200f], [0x2028, 0x202e], [0x2060, 0x206f], [0xfeff, 0xfeff],
];
const INVISIBLE_CHARS = new RegExp(
  "[" + INVISIBLE_RANGES.map(([a, b]) => String.fromCharCode(a) + "-" + String.fromCharCode(b)).join("") + "]",
  "g",
);

/**
 * Limpia texto ingresado por participantes: quita etiquetas HTML,
 * caracteres de control / invisibles y espacios repetidos.
 * (React ya escapa al renderizar; esto mantiene la base prolija.)
 */
export function sanitizeText(input: unknown): string {
  if (typeof input !== "string") return "";
  return input
    .normalize("NFC")
    .replace(/<[^>]*>/g, " ")
    .replace(/[<>]/g, "")
    .replace(INVISIBLE_CHARS, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export type CaseInput = { name: string; task: string };
export type CaseErrors = Partial<Record<keyof CaseInput, string>>;

export function validateCase(raw: { name: unknown; task: unknown }): {
  data: CaseInput;
  errors: CaseErrors;
} {
  const name = sanitizeText(raw.name);
  const task = sanitizeText(raw.task);
  const errors: CaseErrors = {};

  if (!name) errors.name = "Contanos tu nombre.";
  else if (name.length < NAME_MIN) errors.name = `Mínimo ${NAME_MIN} caracteres.`;
  else if (name.length > NAME_MAX) errors.name = `Máximo ${NAME_MAX} caracteres.`;

  if (!task) errors.task = "Escribí la tarea que te gustaría delegar.";
  else if (task.length < TASK_MIN) errors.task = "Contanos un poquito más (mínimo 10 caracteres).";
  else if (task.length > TASK_MAX) errors.task = `Máximo ${TASK_MAX} caracteres.`;

  return { data: { name, task }, errors };
}
