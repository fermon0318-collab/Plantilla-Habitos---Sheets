import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  subMonths,
  isSameMonth,
} from "date-fns";
import { db, uid, colorFor, checkId } from "./db";
import { dateKey } from "./logic";
import type { Habit, Task, ScheduleEntry } from "./types";

/** Vibración háptica sutil (si el dispositivo la soporta). */
export function haptic(ms = 12) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* sin soporte */
  }
}

/**
 * Alterna la marca de un hábito en una fecha (checkbox custom).
 * Usa un id determinístico (`checkId`) y `put` (upsert) en vez de leer-y-luego-escribir:
 * dos toques rápidos sobre el mismo checkbox ya no pueden crear dos filas para el mismo
 * hábito+fecha (el bug que dejaba un hábito atascado en "completado" para siempre).
 */
export async function toggleCheck(habitId: string, date: string) {
  haptic();
  const id = checkId(habitId, date);
  const existing = await db.checks.get(id);
  await db.checks.put({ id, habitId, date, done: !existing?.done });
}

export async function setCheck(habitId: string, date: string, done: boolean) {
  await db.checks.put({ id: checkId(habitId, date), habitId, date, done });
}

// ——— Comando: agregar hábito ———
export async function addHabit(data: {
  name: string;
  emoji: string;
  frequency: number;
  days?: number[] | null;
}) {
  const count = await db.habits.count();
  const now = Date.now();
  const frequency = Math.min(7, Math.max(1, data.frequency));
  const days = data.days && data.days.length > 0 ? [...data.days].sort() : null;
  await db.habits.add({
    id: uid(),
    name: data.name.trim(),
    emoji: data.emoji || "✨",
    frequency,
    days,
    // Primera entrada del historial: rige desde el día de creación, no desde
    // el 1º del mes — así su meta mensual se prorratea justo desde que existe.
    schedule: [{ since: dateKey(new Date(now)), frequency, days }],
    color: colorFor(count),
    order: count,
    active: true,
    createdAt: now,
  });
}

/**
 * Edita un hábito. Si `patch` cambia frecuencia o días, se agrega una entrada nueva
 * al historial de programación con fecha de hoy, sin tocar las entradas anteriores:
 * así los meses ya cerrados conservan la meta que tenían en su momento, en vez de
 * recalcularse con la configuración actual.
 */
export async function updateHabit(id: string, patch: Partial<Habit>) {
  const scheduleChanged = "frequency" in patch || "days" in patch;
  if (!scheduleChanged) {
    await db.habits.update(id, patch);
    return;
  }
  const existing = await db.habits.get(id);
  if (!existing) return;
  const frequency = patch.frequency ?? existing.frequency;
  const days = patch.days !== undefined ? patch.days : existing.days ?? null;
  const history: ScheduleEntry[] =
    existing.schedule && existing.schedule.length > 0
      ? existing.schedule
      : [{ since: dateKey(new Date(existing.createdAt)), frequency: existing.frequency, days: existing.days ?? null }];
  const today = dateKey(new Date());
  const last = history[history.length - 1];
  const sameAsLast = last.frequency === frequency && JSON.stringify(last.days) === JSON.stringify(days);
  const nextHistory = sameAsLast
    ? history
    : last.since === today
      ? [...history.slice(0, -1), { since: today, frequency, days }] // ya se editó hoy: reemplaza, no apila
      : [...history, { since: today, frequency, days }];
  await db.habits.update(id, { ...patch, schedule: nextHistory });
}

// ——— Comando: eliminar hábito específico ———
export async function deleteHabit(id: string) {
  await db.transaction("rw", db.habits, db.checks, async () => {
    await db.habits.delete(id);
    await db.checks.where({ habitId: id }).delete();
  });
}

// ——— Comando: desmarcar las casillas de un hábito (en un mes) ———
export async function clearHabitMonth(habitId: string, month: Date) {
  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) }).map(dateKey);
  const set = new Set(days);
  const rows = await db.checks.where({ habitId }).toArray();
  await db.checks.bulkDelete(rows.filter((r) => set.has(r.date)).map((r) => r.id));
}

// ——— Comando: limpiar toda la plantilla (mes actual) ———
export async function clearMonth(month: Date) {
  const all = await db.checks.toArray();
  const toDelete = all.filter((c) => isSameMonth(new Date(c.date + "T00:00:00"), month));
  await db.checks.bulkDelete(toDelete.map((c) => c.id));
}

// ——— Comando: copiar datos del mes anterior ———
// Upsert por id determinístico: ejecutarlo dos veces NO duplica filas.
export async function copyPreviousMonth(month: Date) {
  const prev = subMonths(month, 1);
  const prevDays = eachDayOfInterval({ start: startOfMonth(prev), end: endOfMonth(prev) });
  const curDays = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  const allRows = await db.checks.toArray();
  const prevSet = new Set(allRows.filter((r) => r.done).map((r) => `${r.habitId}|${r.date}`));
  const habits = await db.habits.toArray();
  const upserts: Array<{ id: string; habitId: string; date: string; done: boolean }> = [];
  for (const h of habits) {
    for (let i = 0; i < curDays.length; i++) {
      const src = prevDays[i];
      if (!src) continue;
      if (prevSet.has(`${h.id}|${dateKey(src)}`)) {
        const date = dateKey(curDays[i]);
        upserts.push({ id: checkId(h.id, date), habitId: h.id, date, done: true });
      }
    }
  }
  if (upserts.length) await db.checks.bulkPut(upserts);
}

// ——— Reordenar ———
export async function reorderHabits(ordered: Habit[]) {
  await db.transaction("rw", db.habits, async () => {
    for (let i = 0; i < ordered.length; i++) await db.habits.update(ordered[i].id, { order: i });
  });
}

// ——— Tareas ———
export async function addTask(name: string, dueDate: string | null) {
  await db.tasks.add({ id: uid(), name: name.trim(), dueDate, done: false, createdAt: Date.now() });
}
export async function toggleTask(task: Task) {
  await db.tasks.update(task.id, { done: !task.done });
}
export async function updateTask(id: string, name: string, dueDate: string | null) {
  await db.tasks.update(id, { name: name.trim(), dueDate });
}
export async function deleteTask(id: string) {
  await db.tasks.delete(id);
}

// ——— Export / Import (respaldo, el Sheet queda como copia) ———
export async function exportData() {
  const [habits, checks, tasks] = await Promise.all([
    db.habits.toArray(),
    db.checks.toArray(),
    db.tasks.toArray(),
  ]);
  return { version: 1, exportedAt: Date.now(), habits, checks, tasks };
}
