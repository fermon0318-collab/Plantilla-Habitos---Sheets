import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  subMonths,
  isSameMonth,
} from "date-fns";
import { db, uid, colorFor } from "./db";
import { dateKey } from "./logic";
import type { Habit, Task } from "./types";

/** Vibración háptica sutil (si el dispositivo la soporta). */
export function haptic(ms = 12) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* sin soporte */
  }
}

/** Alterna la marca de un hábito en una fecha (checkbox custom). Los comandos del Sheet se vuelven acciones reales. */
export async function toggleCheck(habitId: string, date: string) {
  haptic();
  const existing = await db.checks.where({ habitId, date }).first();
  if (existing) {
    await db.checks.put({ ...existing, done: !existing.done });
  } else {
    await db.checks.add({ id: uid(), habitId, date, done: true });
  }
}

export async function setCheck(habitId: string, date: string, done: boolean) {
  const existing = await db.checks.where({ habitId, date }).first();
  if (existing) await db.checks.put({ ...existing, done });
  else await db.checks.add({ id: uid(), habitId, date, done });
}

// ——— Comando: agregar hábito ———
export async function addHabit(data: {
  name: string;
  emoji: string;
  frequency: number;
  days?: number[] | null;
}) {
  const count = await db.habits.count();
  await db.habits.add({
    id: uid(),
    name: data.name.trim(),
    emoji: data.emoji || "✨",
    frequency: Math.min(7, Math.max(1, data.frequency)),
    days: data.days && data.days.length > 0 ? [...data.days].sort() : null,
    color: colorFor(count),
    order: count,
    active: true,
    createdAt: Date.now(),
  });
}

// ——— Comando: editar hábito ———
export async function updateHabit(id: string, patch: Partial<Habit>) {
  await db.habits.update(id, patch);
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
// Upsert por (habitId, fecha): ejecutarlo dos veces NO duplica filas.
export async function copyPreviousMonth(month: Date) {
  const prev = subMonths(month, 1);
  const prevDays = eachDayOfInterval({ start: startOfMonth(prev), end: endOfMonth(prev) });
  const curDays = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  const allRows = await db.checks.toArray();
  const prevSet = new Set(allRows.filter((r) => r.done).map((r) => `${r.habitId}|${r.date}`));
  const existingId = new Map(allRows.map((r) => [`${r.habitId}|${r.date}`, r.id]));
  const habits = await db.habits.toArray();
  const upserts: Array<{ id: string; habitId: string; date: string; done: boolean }> = [];
  for (const h of habits) {
    for (let i = 0; i < curDays.length; i++) {
      const src = prevDays[i];
      if (!src) continue;
      if (prevSet.has(`${h.id}|${dateKey(src)}`)) {
        const date = dateKey(curDays[i]);
        const id = existingId.get(`${h.id}|${date}`) ?? uid();
        upserts.push({ id, habitId: h.id, date, done: true });
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
