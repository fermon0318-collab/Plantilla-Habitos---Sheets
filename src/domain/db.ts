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

export async function seedIfEmpty() {
  const count = await db.habits.count();
  if (count > 0) return;
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
