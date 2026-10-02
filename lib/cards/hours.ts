import { z } from "zod";

export const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type Day = (typeof DAYS)[number];

export const DAY_LABELS: Record<Day, string> = {
  mon: "Lunes", tue: "Martes", wed: "Miércoles", thu: "Jueves", fri: "Viernes", sat: "Sábado", sun: "Domingo",
};
const DAY_SHORT: Record<Day, string> = { mon: "Lun", tue: "Mar", wed: "Mié", thu: "Jue", fri: "Vie", sat: "Sáb", sun: "Dom" };

export type DayHours = { closed: boolean; open: string; close: string; open2?: string; close2?: string };
export type Hours = Record<Day, DayHours>;

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const time = z.string().regex(TIME, "Hora inválida");
const optionalTime = z.union([z.literal(""), time]).optional();

const dayHoursSchema = z.object({
  closed: z.boolean(),
  open: z.union([z.literal(""), time]),
  close: z.union([z.literal(""), time]),
  open2: optionalTime,
  close2: optionalTime,
});

export const hoursSchema = z
  .object({
    mon: dayHoursSchema, tue: dayHoursSchema, wed: dayHoursSchema, thu: dayHoursSchema,
    fri: dayHoursSchema, sat: dayHoursSchema, sun: dayHoursSchema,
  })
  .nullable();

export function defaultHours(): Hours {
  const open = (): DayHours => ({ closed: false, open: "09:00", close: "18:00" });
  return { mon: open(), tue: open(), wed: open(), thu: open(), fri: open(), sat: open(), sun: { closed: true, open: "", close: "" } };
}

/** Tolerante: cualquier dato corrupto (de la BD) produce null o días válidos, nunca una excepción. */
export function sanitizeHours(raw: unknown): Hours | null {
  const parsed = hoursSchema.safeParse(raw);
  return parsed.success ? (parsed.data as Hours | null) : null;
}

function rangeText(d: DayHours): string {
  if (d.closed || !d.open || !d.close) return "Cerrado";
  const first = `${d.open} - ${d.close}`;
  return d.open2 && d.close2 ? `${first} · ${d.open2} - ${d.close2}` : first;
}

export type HoursLine = { days: string; text: string };

/** Agrupa días consecutivos con el mismo horario: "Lun - Vie  10:00 - 20:00". */
export function formatHours(hours: Hours | null | undefined): HoursLine[] {
  if (!hours) return [];
  const rows = DAYS.map((day) => ({ day, text: rangeText(hours[day]) }));
  if (rows.every((r) => r.text === "Cerrado")) return [];
  const lines: HoursLine[] = [];
  let i = 0;
  while (i < rows.length) {
    let j = i;
    while (j + 1 < rows.length && rows[j + 1]!.text === rows[i]!.text) j++;
    const from = DAY_SHORT[rows[i]!.day];
    const to = DAY_SHORT[rows[j]!.day];
    lines.push({ days: i === j ? from : j === i + 1 ? `${from}, ${to}` : `${from} - ${to}`, text: rows[i]!.text });
    i = j + 1;
  }
  return lines;
}
