export const NAME_MIN = 2;
export const NAME_MAX = 40;
export const TASK_MIN = 10;
export const TASK_MAX = 300;
export const OCCUPATION_MAX = 80;
export const DETAILS_MAX = 2000;

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

export type CaseInput = { name: string; occupation: string; task: string };
export type CaseErrors = Partial<Record<keyof CaseInput, string>>;

export function validateCase(raw: { name: unknown; occupation: unknown; task: unknown }): {
  data: CaseInput;
  errors: CaseErrors;
} {
  const name = sanitizeText(raw.name);
  const occupation = sanitizeText(raw.occupation);
  const task = sanitizeText(raw.task);
  const errors: CaseErrors = {};

  if (!name) errors.name = "Contanos tu nombre.";
  else if (name.length < NAME_MIN) errors.name = `Mínimo ${NAME_MIN} caracteres.`;
  else if (name.length > NAME_MAX) errors.name = `Máximo ${NAME_MAX} caracteres.`;

  if (!occupation) errors.occupation = "Contanos a qué te dedicás.";
  else if (occupation.length < 2) errors.occupation = "Mínimo 2 caracteres.";
  else if (occupation.length > OCCUPATION_MAX) errors.occupation = `Máximo ${OCCUPATION_MAX} caracteres.`;

  if (!task) errors.task = "Escribí la tarea que te gustaría delegar.";
  else if (task.length < TASK_MIN) errors.task = "Contanos un poquito más (mínimo 10 caracteres).";
  else if (task.length > TASK_MAX) errors.task = `Máximo ${TASK_MAX} caracteres.`;

  return { data: { name, occupation, task }, errors };
}

export type ContactInput = { name: string; phone: string; email: string; occupation: string; details: string };
export type ContactErrors = Partial<Record<keyof ContactInput, string>>;

const EMAIL_RE = /^[^@ ]+@[^@ ]+[.][^@ ]+$/;
const PHONE_RE = /^[0-9+(). -]{6,25}$/;
const LINE_BREAK = String.fromCharCode(10);

export function validateContact(raw: Record<keyof ContactInput, unknown>): {
  data: ContactInput;
  errors: ContactErrors;
} {
  const name = sanitizeText(raw.name);
  const phone = sanitizeText(raw.phone);
  const email = sanitizeText(raw.email).replace(/ /g, "").toLowerCase();
  const occupation = sanitizeText(raw.occupation);
  // La explicación conserva saltos de línea simples para que sea legible.
  const details =
    typeof raw.details === "string"
      ? raw.details
          .split(LINE_BREAK)
          .map((line) => sanitizeText(line))
          .filter(Boolean)
          .join(LINE_BREAK)
      : "";
  const errors: ContactErrors = {};

  if (!name || name.length < 2) errors.name = "Contanos tu nombre.";
  else if (name.length > 60) errors.name = "Máximo 60 caracteres.";

  const digits = phone.replace(/[^0-9]/g, "");
  if (!phone) errors.phone = "Dejanos un teléfono o WhatsApp.";
  else if (!PHONE_RE.test(phone) || digits.length < 6) errors.phone = "Revisá el número (solo números, +, espacios o guiones).";

  if (!email) errors.email = "Dejanos tu mail.";
  else if (!EMAIL_RE.test(email) || email.length > 120) errors.email = "Revisá el mail (ej: nombre@empresa.com).";

  if (occupation.length > 120) errors.occupation = "Máximo 120 caracteres.";

  if (details.length < 10) errors.details = "Contanos el caso con un poco más de detalle.";
  else if (details.length > DETAILS_MAX) errors.details = `Máximo ${DETAILS_MAX} caracteres.`;

  return { data: { name, phone, email, occupation, details }, errors };
}
