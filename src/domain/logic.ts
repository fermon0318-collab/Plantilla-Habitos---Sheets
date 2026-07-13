import {
  differenceInCalendarDays,
  getDaysInMonth,
  parseISO,
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  subDays,
} from "date-fns";
import type { Habit, Check, HabitStats, Level, Achievement } from "./types";

/** Formatea una fecha local a YYYY-MM-DD (nunca UTC, para respetar la hora del dispositivo). */
export function dateKey(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

/** Día de la semana con lunes=0 … domingo=6 (convención de la app). */
export function dow(d: Date): number {
  return (getDay(d) + 6) % 7;
}

/** ¿Este hábito toca hoy? Flexible = toca todos los días; programado = solo sus días. */
export function isScheduled(habit: Habit, d: Date): boolean {
  if (!habit.days || habit.days.length === 0) return true;
  return habit.days.includes(dow(d));
}

/** Meta semanal efectiva: días fijos si los hay, si no la frecuencia. */
export function weeklyTarget(habit: Habit): number {
  return habit.days && habit.days.length > 0 ? habit.days.length : habit.frequency;
}

/** Umbrales de nivel del Sheet original (AE3): <0.2 / ≤0.39 / ≤0.59 / ≤0.84 / resto. */
export const LEVEL_THRESHOLDS = [0.2, 0.4, 0.6, 0.85] as const;

export function levelFor(rate: number): Level {
  if (rate < LEVEL_THRESHOLDS[0]) return 1;
  if (rate < LEVEL_THRESHOLDS[1]) return 2;
  if (rate < LEVEL_THRESHOLDS[2]) return 3;
  if (rate < LEVEL_THRESHOLDS[3]) return 4;
  return 5;
}

export const LEVEL_META: Record<Level, { name: string; tree: string; blurb: string }> = {
  1: { name: "Semilla", tree: "🌱", blurb: "Empezando a echar raíces" },
  2: { name: "Brote", tree: "🌿", blurb: "Creciendo con constancia" },
  3: { name: "Arbusto", tree: "🪴", blurb: "Ganando fuerza" },
  4: { name: "Árbol", tree: "🌳", blurb: "Firme y consistente" },
  5: { name: "Bosque", tree: "🌲", blurb: "¡Hábito dominado!" },
};

/** Progreso hacia el siguiente nivel (0–1). En nivel 5 devuelve 1. */
export function progressToNextLevel(rate: number): number {
  const bounds = [0, ...LEVEL_THRESHOLDS, 1];
  const lvl = levelFor(rate);
  const lo = bounds[lvl - 1];
  const hi = bounds[lvl];
  if (lvl === 5) return 1;
  return Math.min(1, Math.max(0, (rate - lo) / (hi - lo)));
}

/**
 * Meta mensual de un hábito. Con días programados cuenta las ocurrencias reales
 * de esos días en el mes; flexible prorratea la frecuencia semanal.
 */
export function monthlyTargetFor(habit: Habit, monthDate: Date): number {
  if (habit.days && habit.days.length > 0) {
    const all = eachDayOfInterval({ start: startOfMonth(monthDate), end: endOfMonth(monthDate) });
    return Math.max(1, all.filter((d) => habit.days!.includes(dow(d))).length);
  }
  const days = getDaysInMonth(monthDate);
  return Math.max(1, Math.round((habit.frequency / 7) * days));
}

function checkSet(checks: Check[]): Set<string> {
  const s = new Set<string>();
  for (const c of checks) if (c.done) s.add(`${c.habitId}|${c.date}`);
  return s;
}

/** Días cumplidos de un hábito dentro de un mes concreto. */
export function completedInMonth(habit: Habit, monthDate: Date, done: Set<string>): number {
  const days = eachDayOfInterval({ start: startOfMonth(monthDate), end: endOfMonth(monthDate) });
  let n = 0;
  for (const d of days) if (done.has(`${habit.id}|${dateKey(d)}`)) n++;
  return n;
}

/**
 * Racha actual contando hacia atrás desde hoy, consciente del calendario del hábito:
 * los días NO programados no rompen la racha ni la suman (como Streaks/Loop).
 * Si hoy toca y aún no está marcado, no rompe: empieza desde el día programado anterior.
 * Límite de 1000 días para acotar el cómputo.
 */
export function currentStreak(habit: Habit, today: Date, done: Set<string>): number {
  let streak = 0;
  let cursor = new Date(today);
  let first = true;
  for (let i = 0; i < 1000; i++) {
    if (isScheduled(habit, cursor)) {
      const isDone = done.has(`${habit.id}|${dateKey(cursor)}`);
      if (isDone) {
        streak++;
      } else if (first) {
        // hoy (o el primer día programado) todavía puede marcarse
      } else {
        break;
      }
      first = false;
    }
    cursor = subDays(cursor, 1);
  }
  return streak;
}

/** Mejor racha histórica, también sobre días programados solamente. */
export function bestStreak(habit: Habit, today: Date, done: Set<string>): number {
  const dates = [...done]
    .filter((k) => k.startsWith(`${habit.id}|`))
    .map((k) => k.split("|")[1])
    .sort();
  if (dates.length === 0) return 0;
  if (!habit.days || habit.days.length === 0) {
    // Flexible: días de calendario consecutivos.
    let best = 0, run = 0;
    let prev: string | null = null;
    for (const d of dates) {
      run = prev && differenceInCalendarDays(parseISO(d), parseISO(prev)) === 1 ? run + 1 : 1;
      best = Math.max(best, run);
      prev = d;
    }
    return best;
  }
  // Programado: recorre del primer check a hoy solo por los días del hábito.
  const start = parseISO(dates[0]);
  const span = eachDayOfInterval({ start, end: today }).filter((d) => isScheduled(habit, d));
  let best = 0, run = 0;
  for (const d of span) {
    if (done.has(`${habit.id}|${dateKey(d)}`)) {
      run++;
      best = Math.max(best, run);
    } else if (dateKey(d) !== dateKey(today)) {
      run = 0; // hoy pendiente no corta
    }
  }
  return best;
}

export function habitStats(
  habits: Habit[],
  checks: Check[],
  monthDate: Date,
  today: Date
): HabitStats[] {
  const done = checkSet(checks);
  return habits.map((habit) => {
    const completed = completedInMonth(habit, monthDate, done);
    const target = monthlyTargetFor(habit, monthDate);
    return {
      habit,
      completed,
      monthlyTarget: target,
      rate: target === 0 ? 0 : Math.min(1, completed / target),
      currentStreak: currentStreak(habit, today, done),
      bestStreak: bestStreak(habit, today, done),
    };
  });
}

export interface MonthSummary {
  monthlyRate: number; // "Porcentaje Mensual" ponderado por meta
  level: Level;
  totalHabits: number;
  mostConstant: HabitStats | null;
  leastConstant: HabitStats | null;
  averageConstancy: number;
  perHabit: HabitStats[];
}

/**
 * Resumen mensual. "Porcentaje mensual" = Σ min(completado, meta) / Σ meta
 * (respeta la frecuencia semanal — decisión confirmada por el usuario).
 */
export function monthSummary(
  habits: Habit[],
  checks: Check[],
  monthDate: Date,
  today: Date
): MonthSummary {
  const perHabit = habitStats(habits, checks, monthDate, today);
  const totalTarget = perHabit.reduce((a, h) => a + h.monthlyTarget, 0);
  const totalDone = perHabit.reduce((a, h) => a + Math.min(h.completed, h.monthlyTarget), 0);
  const monthlyRate = totalTarget === 0 ? 0 : totalDone / totalTarget;
  const sorted = [...perHabit].sort((a, b) => b.rate - a.rate);
  const average =
    perHabit.length === 0 ? 0 : perHabit.reduce((a, h) => a + h.rate, 0) / perHabit.length;
  return {
    monthlyRate,
    level: levelFor(monthlyRate),
    totalHabits: habits.length,
    mostConstant: sorted[0] ?? null,
    leastConstant: sorted.length ? sorted[sorted.length - 1] : null,
    averageConstancy: average,
    perHabit,
  };
}

/**
 * % de cumplimiento de un día concreto (arregla el #REF! roto del Sheet en G35:AS37).
 * Solo cuenta los hábitos programados para ese día — no castiga por lo que no tocaba.
 */
export function dailyRate(habits: Habit[], done: Set<string>, day: Date): number {
  const scheduled = habits.filter((h) => isScheduled(h, day));
  if (scheduled.length === 0) return 0;
  const k = dateKey(day);
  let n = 0;
  for (const h of scheduled) if (done.has(`${h.id}|${k}`)) n++;
  return n / scheduled.length;
}

/** Día perfecto: todos los hábitos que tocaban ese día están cumplidos (y había al menos uno). */
export function isPerfectDay(habits: Habit[], done: Set<string>, day: Date): boolean {
  const scheduled = habits.filter((h) => isScheduled(h, day));
  if (scheduled.length === 0) return false;
  const k = dateKey(day);
  return scheduled.every((h) => done.has(`${h.id}|${k}`));
}

/** Días perfectos dentro de un mes (hasta `today` si el mes es el actual). */
export function perfectDaysInMonth(
  habits: Habit[],
  done: Set<string>,
  monthDate: Date,
  today: Date
): number {
  const end = endOfMonth(monthDate) < today ? endOfMonth(monthDate) : today;
  if (startOfMonth(monthDate) > end) return 0;
  const days = eachDayOfInterval({ start: startOfMonth(monthDate), end });
  return days.filter((d) => isPerfectDay(habits, done, d)).length;
}

/** Logros computados sobre el historial (máx. ~400 días hacia atrás para acotar). */
export function achievements(habits: Habit[], checks: Check[], today: Date): Achievement[] {
  const done = checkSet(checks);
  const totalChecks = checks.filter((c) => c.done).length;
  const stats = habitStats(habits, checks, today, today);
  const maxBest = Math.max(0, ...stats.map((s) => s.bestStreak));

  const doneDates = checks.filter((c) => c.done).map((c) => c.date).sort();
  let perfectCount = 0;
  let bestPerfectRun = 0;
  if (doneDates.length > 0) {
    const firstDate = parseISO(doneDates[0]);
    const start = differenceInCalendarDays(today, firstDate) > 400 ? subDays(today, 400) : firstDate;
    let run = 0;
    for (const d of eachDayOfInterval({ start, end: today })) {
      if (isPerfectDay(habits, done, d)) {
        perfectCount++;
        run++;
        bestPerfectRun = Math.max(bestPerfectRun, run);
      } else if (dateKey(d) !== dateKey(today)) {
        run = 0;
      }
    }
  }

  return [
    { id: "primer-paso", emoji: "👟", name: "Primer paso", desc: "Marca tu primer hábito", unlocked: totalChecks >= 1 },
    { id: "dia-perfecto", emoji: "⭐", name: "Día perfecto", desc: "Completa todo lo de un día", unlocked: perfectCount >= 1 },
    { id: "racha-3", emoji: "🔥", name: "En llamas", desc: "Racha de 3 en un hábito", unlocked: maxBest >= 3 },
    { id: "racha-7", emoji: "⚡", name: "Imparable", desc: "Racha de 7 en un hábito", unlocked: maxBest >= 7 },
    { id: "semana-perfecta", emoji: "🏆", name: "Semana perfecta", desc: "7 días perfectos seguidos", unlocked: bestPerfectRun >= 7 },
    { id: "racha-30", emoji: "💎", name: "De acero", desc: "Racha de 30 en un hábito", unlocked: maxBest >= 30 },
    { id: "cien", emoji: "💯", name: "Centenario", desc: "100 marcas en total", unlocked: totalChecks >= 100 },
    { id: "bosque", emoji: "🌲", name: "Bosque", desc: "Nivel 5 en un mes", unlocked: monthSummary(habits, checks, today, today).monthlyRate >= LEVEL_THRESHOLDS[3] },
  ];
}

export function toDoneSet(checks: Check[]): Set<string> {
  return checkSet(checks);
}

// ——————————————————— JARDÍN ———————————————————

/**
 * Umbral para "ganar" el árbol del mes. Se mide sobre el % mensual ponderado
 * por meta, así que da igual tener 3 o 7 hábitos o la frecuencia semanal:
 * siempre es el mismo criterio de completitud del mes.
 */
export const WIN_THRESHOLD = 0.8;

export type TreeStage = "seed" | "sprout" | "plant" | "tree";

/** Etapa del árbol según el progreso del mes (0–1). */
export function treeStage(rate: number): TreeStage {
  if (rate >= WIN_THRESHOLD) return "tree";
  if (rate >= 0.5) return "plant";
  if (rate >= 0.2) return "sprout";
  return "seed";
}

export interface GardenMonth {
  key: string; // "YYYY-MM"
  date: Date; // primer día del mes
  rate: number;
  won: boolean;
  isCurrent: boolean;
  stage: TreeStage;
}

/**
 * Un registro por mes desde la primera actividad hasta el mes actual.
 * - Mes pasado con rate ≥ umbral → árbol ganado.
 * - Mes pasado por debajo → solo tronco.
 * - Mes actual → en progreso (crece según el rate hasta hoy).
 */
export function garden(habits: Habit[], checks: Check[], today: Date): GardenMonth[] {
  const dates = checks.filter((c) => c.done).map((c) => c.date).sort();
  const firstMonth = dates.length > 0 ? startOfMonth(parseISO(dates[0])) : startOfMonth(today);
  const curMonth = startOfMonth(today);
  const months: GardenMonth[] = [];
  let cursor = firstMonth;
  for (let i = 0; i < 600 && cursor <= curMonth; i++) {
    const isCurrent = dateKey(cursor) === dateKey(curMonth);
    const rate = monthSummary(habits, checks, cursor, today).monthlyRate;
    months.push({
      key: format(cursor, "yyyy-MM"),
      date: cursor,
      rate,
      won: !isCurrent && rate >= WIN_THRESHOLD,
      isCurrent,
      stage: treeStage(rate),
    });
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }
  return months;
}
