import { format } from "date-fns";
import { es } from "date-fns/locale";

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const fmtLongDate = (d: Date) => cap(format(d, "EEEE, d 'de' MMMM", { locale: es }));
/** Reloj en formato 12 horas con a. m. / p. m. (español). */
export const fmtTime = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  const h = d.getHours();
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${h < 12 ? "a. m." : "p. m."}`;
};
export const fmtMonthYear = (d: Date) => cap(format(d, "MMMM yyyy", { locale: es }));
export const fmtWeekday = (d: Date) => cap(format(d, "EEE", { locale: es }));
export const fmtDay = (d: Date) => format(d, "d");
export const pct = (v: number) => `${Math.round(v * 100)}%`;

export const FREQ_LABEL = (f: number) => `${f} ${f === 1 ? "día" : "días"}/sem`;

const DAY_SHORT = ["L", "M", "X", "J", "V", "S", "D"];

/** Etiqueta de programación: "L·X·V" para días fijos, "5 días/sem" para flexible. */
export const scheduleLabel = (h: { frequency: number; days?: number[] | null }) =>
  h.days && h.days.length > 0 ? h.days.map((d) => DAY_SHORT[d]).join("·") : FREQ_LABEL(h.frequency);
