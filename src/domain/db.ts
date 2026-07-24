import Dexie, { type Table } from "dexie";
import type { Habit, Check, Task } from "./types";

export class HabitsDB extends Dexie {
  habits!: Table<Habit, string>;
  checks!: Table<Check, string>;
  tasks!: Table<Task, string>;

  constructor() {
    super("habitos-personales");
    this.version(1).stores({
      habits: "id, order, active",
      checks: "id, habitId, date, [habitId+date]",
      tasks: "id, dueDate, done",
    });
  }
}

export const db = new HabitsDB();

export const uid = () =>
  (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`);

/**
 * ID determinístico para una marca: mismo hábito + misma fecha => mismo id siempre.
 * Así `db.checks.put(...)` es un upsert atómico (sin leer antes de escribir),
 * eliminando la condición de carrera que producía duplicados con doble-toque.
 */
export const checkId = (habitId: string, date: string) => `${habitId}|${date}`;

const PALETTE = [
  "#b0ea81", "#7cd7ff", "#ffd479", "#ff9ec4", "#c4a5ff",
  "#8ce0c0", "#ffb27a", "#9fb6ff", "#f4a0a0", "#a0e6d0",
  "#e0c17c", "#7fe0a8", "#ff8fa3",
];

export function colorFor(i: number) {
  return PALETTE[i % PALETTE.length];
}

/** Hábitos reales importados de la plantilla "HÁBITOS PERSONALES INTERACTIVO" (pestaña ENERO). */
const SEED: Array<[string, string, number]> = [
  ["🌅", "Levantarse temprano", 1],
  ["🪥", "Cepillarme 3 veces al día", 5],
  ["💋", "Arreglarme", 3],
  ["📖", "Lectura", 5],
  ["📘", "Estudiar inglés", 7],
  ["🧸", "Hacer algo divertido", 2],
  ["💰", "Repasar finanzas", 6],
  ["📊", "Repasar estadística", 7],
  ["💪", "Ir al gym", 5],
  ["📚", "Leer", 7],
  ["🧠", "Estudiar un tema de interés", 5],
  ["💧", "Hidratarse", 7],
  ["📺", "Ver una serie", 5],
];

const INIT_KEY = "habitos-initialized";

export async function seedIfEmpty() {
  const count = await db.habits.count();
  if (count > 0) return;
  // Si el usuario ya usó la app antes (borró todos sus hábitos a propósito),
  // no reinsertamos el catálogo de ejemplo: quedaría "atascado" en el demo
  // cada vez que recarga, sin poder empezar realmente de cero.
  if (localStorage.getItem(INIT_KEY)) return;
  localStorage.setItem(INIT_KEY, "1");
  const now = Date.now();
  await db.habits.bulkAdd(
    SEED.map(([emoji, name, frequency], i) => ({
      id: uid(),
      name,
      emoji,
      frequency,
      color: colorFor(i),
      order: i,
      active: true,
      createdAt: now,
    }))
  );
}

/**
 * Migración única: fusiona marcas duplicadas (mismo hábito+fecha, de la condición
 * de carrera ya corregida en toggleCheck) en un solo registro con id determinístico.
 * Si alguna copia estaba marcada como hecha, la fusión queda como hecha.
 */
export async function dedupeChecks() {
  const KEY = "habitos-deduped-v1";
  if (localStorage.getItem(KEY)) return;
  const all = await db.checks.toArray();
  const groups = new Map<string, Check[]>();
  for (const c of all) {
    const k = `${c.habitId}|${c.date}`;
    const arr = groups.get(k) ?? [];
    arr.push(c);
    groups.set(k, arr);
  }
  const toDelete: string[] = [];
  const toPut: Check[] = [];
  for (const [key, rows] of groups) {
    if (rows.length <= 1 && rows[0]?.id === key) continue; // ya está sano
    const done = rows.some((r) => r.done);
    toPut.push({ id: key, habitId: rows[0].habitId, date: rows[0].date, done });
    for (const r of rows) if (r.id !== key) toDelete.push(r.id);
  }
  if (toPut.length || toDelete.length) {
    await db.transaction("rw", db.checks, async () => {
      if (toPut.length) await db.checks.bulkPut(toPut);
      if (toDelete.length) await db.checks.bulkDelete(toDelete);
    });
  }
  localStorage.setItem(KEY, "1");
}
