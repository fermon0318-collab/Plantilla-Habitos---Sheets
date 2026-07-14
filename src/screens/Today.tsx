import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { differenceInCalendarDays, parseISO } from "date-fns";
import type { Habit, Check, Task } from "../domain/types";
import {
  dateKey,
  monthSummary,
  toDoneSet,
  dailyRate,
  dayRoster,
  currentStreak,
  globalStreak,
  isScheduled,
  isPerfectDay,
  treeStage,
  LEVEL_META,
  progressToNextLevel,
} from "../domain/logic";
import { Ring } from "../ui/Ring";
import { Checkbox } from "../ui/Checkbox";
import { Confetti } from "../ui/Confetti";
import { LottieTree } from "../ui/LottieTree";
import { LiveClock } from "../ui/LiveClock";
import { toggleCheck, addTask, toggleTask, deleteTask, haptic } from "../domain/actions";
import { fmtLongDate, pct, scheduleLabel } from "../ui/format";
import { useUI } from "../ui/uiContext";
import { THEMES } from "../hooks/useTheme";
import { IconBolt, IconFlame, IconPlus, IconClose, IconCheck, IconChevron } from "../ui/icons";

interface Props {
  habits: Habit[];
  checks: Check[];
  tasks: Task[];
  now: Date;
}

export function Today({ habits, checks, tasks, now }: Props) {
  const ui = useUI();
  const t = THEMES.find((x) => x.id === ui.theme)!;
  const done = toDoneSet(checks);
  const today = dateKey(now);
  const summary = monthSummary(habits, checks, now, now);
  const daily = dailyRate(habits, done, now);
  const lvl = LEVEL_META[summary.level];
  const nextPct = progressToNextLevel(summary.monthlyRate);
  const streak = globalStreak(habits, checks, now);
  const roster = dayRoster(habits, done, now);

  const scheduled = habits.filter((h) => isScheduled(h, now));
  const unscheduledDone = habits.filter((h) => !isScheduled(h, now) && done.has(`${h.id}|${today}`));
  const unscheduledPending = habits.filter((h) => !isScheduled(h, now) && !done.has(`${h.id}|${today}`));
  // Lista principal: lo de hoy + cualquier hábito de día libre que igual completaste.
  const mainList = [...scheduled, ...unscheduledDone];
  // Cuenta TODAS las marcas de hoy (programadas o no) para reproducir la animación del árbol.
  const doneTodayCount = habits.filter((h) => done.has(`${h.id}|${today}`)).length;
  const perfect = isPerfectDay(habits, done, now);

  // Confetti al pasar a día perfecto (solo en la transición, no al montar).
  const [celebrate, setCelebrate] = useState(false);
  const prevPerfect = useRef<boolean | null>(null);
  useEffect(() => {
    if (prevPerfect.current === false && perfect) {
      setCelebrate(true);
      haptic(40);
    }
    prevPerfect.current = perfect;
  }, [perfect]);

  const [showUnscheduled, setShowUnscheduled] = useState(false);

  return (
    <div className="screen">
      {celebrate && <Confetti onDone={() => setCelebrate(false)} />}

      <div className="row between" style={{ alignItems: "flex-start" }}>
        <div className="grow">
          <div className="eyebrow">Hábitos personales</div>
          <h1 className="h1">{fmtLongDate(now)}</h1>
        </div>
        <div className="row gap8" style={{ flex: "none" }}>
          {streak > 0 && (
            <motion.div
              className="streak-pill"
              animate={{ scale: [1, 1.12, 1] }}
              transition={{ duration: 0.4 }}
              key={streak}
              aria-label={`Racha de ${streak} días`}
            >
              <IconFlame size={15} />
              {streak}
            </motion.div>
          )}
          <button className="chip" onClick={ui.openCommands} aria-label="Comandos" style={{ padding: "6px 10px" }}>
            <IconBolt size={15} className="streak" />
          </button>
        </div>
      </div>
      <div className="row gap8 mt8">
        <LiveClock />
        <AnimatePresence>
          {perfect && (
            <motion.div
              className="chip perfect"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              ⭐ ¡Día perfecto!
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hero: progreso del día + árbol de nivel */}
      <div className="card mt16" style={{ padding: 20 }}>
        <div className="row gap12 between">
          <Ring value={daily} size={120} stroke={11}>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em" }}>{pct(daily)}</div>
              <div className="dim" style={{ fontSize: 11, fontWeight: 600 }}>
                hoy
              </div>
            </div>
          </Ring>
          <div className="grow stack" style={{ gap: 4, alignItems: "flex-end", textAlign: "right" }}>
            <LottieTree
              stage={treeStage(summary.monthlyRate)}
              size={72}
              accent={t.accent}
              accentDeep={t.accentDeep}
              ink={t.ink}
              replayKey={doneTodayCount}
            />
            <div style={{ fontWeight: 800, fontSize: 16 }}>
              Nivel {summary.level} · {lvl.name}
            </div>
            <div className="dim" style={{ fontSize: 12 }}>
              {summary.level === 5 ? "¡Completado!" : `Siguiente nivel en ${pct(1 - nextPct)}`}
            </div>
            <div className="bar" style={{ width: 120, marginTop: 4 }}>
              <motion.i
                initial={{ width: 0 }}
                animate={{ width: `${(summary.level === 5 ? 1 : nextPct) * 100}%` }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>
        </div>

        <div className="row between mt16" style={{ paddingTop: 14, borderTop: "1px solid var(--border)" }}>
          <Stat label="Hoy" value={`${roster.completed}/${roster.total}`} />
          <Stat label="Mes" value={pct(summary.monthlyRate)} />
          <Stat label="Hábitos" value={String(habits.length)} />
        </div>
      </div>

      {/* Hábitos de hoy */}
      <div className="row between mt24" style={{ marginBottom: 12 }}>
        <h2 className="h2">Para hoy</h2>
        <span className="dim" style={{ fontSize: 13, fontWeight: 600 }}>
          {roster.completed} de {roster.total}
        </span>
      </div>

      <TodayList habits={mainList} now={now} done={done} today={today} />

      {/* No programados hoy (pendientes) */}
      {unscheduledPending.length > 0 && (
        <>
          <button
            className="row gap8 mt16 pressable"
            style={{ padding: "4px 2px" }}
            onClick={() => setShowUnscheduled((v) => !v)}
          >
            <IconChevron
              size={15}
              className="dim"
              style={{
                transform: showUnscheduled ? "rotate(90deg)" : "none",
                transition: "transform 0.2s",
              }}
            />
            <span className="dim" style={{ fontSize: 13, fontWeight: 700 }}>
              No programados hoy ({unscheduledPending.length})
            </span>
          </button>
          <AnimatePresence initial={false}>
            {showUnscheduled && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                style={{ overflow: "hidden" }}
              >
                <div className="stack mt8" style={{ gap: 10, opacity: 0.65 }}>
                  {unscheduledPending.map((h) => (
                    <HabitRow key={h.id} habit={h} now={now} done={done} today={today} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Tareas por hacer */}
      <TaskSection tasks={tasks} now={now} />

      {/* Espacio para que el botón flotante nunca tape la última tarea */}
      <div style={{ height: 88 }} aria-hidden />

      <motion.button
        className="fab"
        onClick={ui.addHabit}
        aria-label="Agregar hábito"
        whileTap={{ scale: 0.88, rotate: -8 }}
      >
        <IconPlus size={26} />
      </motion.button>
    </div>
  );
}

/**
 * Lista del día con mecánica de "hundirse al completar": los pendientes suben,
 * los cumplidos bajan a su propia sección con animación de resorte (layout).
 */
function TodayList({
  habits,
  now,
  done,
  today,
}: {
  habits: Habit[];
  now: Date;
  done: Set<string>;
  today: string;
}) {
  const isDone = (h: Habit) => done.has(`${h.id}|${today}`);
  const pending = habits.filter((h) => !isDone(h)).sort((a, b) => a.order - b.order);
  const completed = habits.filter(isDone).sort((a, b) => a.order - b.order);

  return (
    <div className="stack" style={{ gap: 10 }}>
      {pending.map((h) => (
        <HabitRow key={h.id} habit={h} now={now} done={done} today={today} />
      ))}
      {habits.length === 0 && (
        <div className="dim" style={{ fontSize: 13, padding: "4px 2px" }}>
          Nada programado para hoy. 🎉
        </div>
      )}
      <AnimatePresence>
        {completed.length > 0 && (
          <motion.div
            layout
            key="divider"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="row gap8"
            style={{ padding: "6px 2px 0" }}
          >
            <span className="dim" style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: "0.08em" }}>
              COMPLETADOS · {completed.length}
            </span>
            <span style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </motion.div>
        )}
      </AnimatePresence>
      {completed.map((h) => (
        <HabitRow key={h.id} habit={h} now={now} done={done} today={today} />
      ))}
    </div>
  );
}

function HabitRow({
  habit: h,
  now,
  done,
  today,
}: {
  habit: Habit;
  now: Date;
  done: Set<string>;
  today: string;
}) {
  const ui = useUI();
  const isDone = done.has(`${h.id}|${today}`);
  const streak = currentStreak(h, now, done);
  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 420, damping: 34 }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: isDone ? 0.62 : 1, y: 0 }}
      className="card row gap12"
      style={{ padding: "13px 15px", alignItems: "center" }}
      onClick={() => ui.editHabit(h)}
    >
      <motion.div
        animate={isDone ? { scale: [1, 0.88, 1] } : {}}
        transition={{ duration: 0.35 }}
        style={{
          width: 42,
          height: 42,
          borderRadius: 13,
          display: "grid",
          placeItems: "center",
          fontSize: 22,
          background: "var(--surface-2)",
          border: `1px solid ${h.color}33`,
          filter: isDone ? "saturate(0.7)" : "none",
        }}
      >
        {h.emoji}
      </motion.div>
      <div className="grow" style={{ minWidth: 0 }}>
        <div
          className="ellipsis"
          style={{
            fontWeight: 600,
            fontSize: 15,
            color: isDone ? "var(--text-2)" : "var(--text)",
          }}
        >
          {h.name}
        </div>
        <div className="row gap8" style={{ marginTop: 3 }}>
          <span className="dim" style={{ fontSize: 12 }}>
            {scheduleLabel(h)}
          </span>
          {streak > 0 && (
            <motion.span
              className="row streak"
              style={{ gap: 3, fontSize: 12, fontWeight: 700 }}
              animate={isDone ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <IconFlame size={13} /> {streak}
            </motion.span>
          )}
        </div>
      </div>
      <div onClick={(e) => e.stopPropagation()}>
        <Checkbox done={isDone} color={h.color} onToggle={() => toggleCheck(h.id, today)} />
      </div>
    </motion.div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stack" style={{ gap: 2 }}>
      <div style={{ fontWeight: 800, fontSize: 18 }}>{value}</div>
      <div className="dim" style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em" }}>
        {label.toUpperCase()}
      </div>
    </div>
  );
}

function TaskSection({ tasks, now }: { tasks: Task[]; now: Date }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [due, setDue] = useState("");
  const sorted = [...tasks].sort(
    (a, b) => Number(a.done) - Number(b.done) || (a.dueDate ?? "z").localeCompare(b.dueDate ?? "z")
  );

  const submit = async () => {
    if (!name.trim()) return;
    await addTask(name, due || null);
    setName("");
    setDue("");
    setAdding(false);
  };

  const countdown = (t: Task) => {
    if (t.done) return "Completado";
    if (!t.dueDate) return "";
    const d = differenceInCalendarDays(parseISO(t.dueDate), now);
    if (d < 0) return "Fecha pasada";
    if (d === 0) return "Hoy";
    return `Faltan ${d} ${d === 1 ? "día" : "días"}`;
  };

  return (
    <>
      <div className="row between mt24" style={{ marginBottom: 12 }}>
        <h2 className="h2">Tareas por hacer</h2>
        <button className="chip" onClick={() => setAdding((v) => !v)}>
          <IconPlus size={14} /> Tarea
        </button>
      </div>

      {adding && (
        <div className="card" style={{ padding: 12, marginBottom: 10 }}>
          <input
            className="field"
            placeholder="Nueva tarea"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <div className="row gap8 mt8">
            <input className="field" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
            <button className="btn primary" onClick={submit} style={{ padding: "0 18px" }}>
              <IconCheck size={18} />
            </button>
          </div>
        </div>
      )}

      <div className="stack" style={{ gap: 8 }}>
        {sorted.length === 0 && !adding && (
          <div className="dim" style={{ fontSize: 13, padding: "4px 2px" }}>
            Sin tareas pendientes.
          </div>
        )}
        {sorted.map((t) => (
          <div
            key={t.id}
            className="card row gap12"
            style={{ padding: "12px 14px", opacity: t.done ? 0.55 : 1 }}
          >
            <Checkbox done={t.done} onToggle={() => toggleTask(t)} size={26} />
            <div className="grow" style={{ minWidth: 0 }}>
              <div
                className="ellipsis"
                style={{
                  fontWeight: 600,
                  fontSize: 14,
                  textDecoration: t.done ? "line-through" : "none",
                }}
              >
                {t.name}
              </div>
              {countdown(t) && (
                <div
                  className="dim"
                  style={{
                    fontSize: 12,
                    color: countdown(t) === "Fecha pasada" ? "var(--danger)" : undefined,
                  }}
                >
                  {countdown(t)}
                </div>
              )}
            </div>
            <button className="btn ghost dim" style={{ padding: 6 }} onClick={() => deleteTask(t.id)}>
              <IconClose size={16} />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
