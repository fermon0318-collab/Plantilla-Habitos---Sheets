/** Programación vigente de un hábito a partir de una fecha (YYYY-MM-DD) dada. */
export interface ScheduleEntry {
  since: string; // YYYY-MM-DD
  frequency: number;
  days: number[] | null;
}

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  /** Meta semanal vigente ahora: 1–7 días por semana (columna "Frecuencia" del Sheet). */
  frequency: number;
  /**
   * Días fijos de la semana (0=Lun … 6=Dom). Si está definido y no vacío,
   * el hábito es de "días programados": la racha y el % solo miran esos días.
   * null/undefined = flexible (N días por semana, cualquier día).
   */
  days?: number[] | null;
  /**
   * Historial de programación: cada vez que cambian frecuencia/días se agrega una
   * entrada con la fecha desde la que rige. Así, editar hoy no reescribe el pasado
   * (los meses ya cerrados siguen midiéndose con la programación que tenían entonces),
   * y un hábito creado a mitad de mes prorratea su meta solo desde que existe.
   * Si falta (hábitos previos a esta funcionalidad), se sintetiza una única entrada
   * con `frequency`/`days` actuales desde `createdAt`.
   */
  schedule?: ScheduleEntry[];
  color: string;
  order: number;
  active: boolean;
  createdAt: number;
}

/** Una marca de cumplimiento. La clave natural es `${habitId}|${date}` (date = YYYY-MM-DD). */
export interface Check {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD en hora local del dispositivo
  done: boolean;
}

/** Tareas por hacer con fecha objetivo (sección "TAREAS POR HACER" del Sheet). */
export interface Task {
  id: string;
  name: string;
  dueDate: string | null; // YYYY-MM-DD
  done: boolean;
  createdAt: number;
}

export interface HabitStats {
  habit: Habit;
  /** Días cumplidos en el mes. */
  completed: number;
  /** Meta del mes según frecuencia semanal o días programados. */
  monthlyTarget: number;
  /** completed / monthlyTarget (0–1, capado a 1). */
  rate: number;
  currentStreak: number;
  bestStreak: number;
}

export interface Achievement {
  id: string;
  emoji: string;
  name: string;
  desc: string;
  unlocked: boolean;
}

export type Level = 1 | 2 | 3 | 4 | 5;
