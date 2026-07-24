import { useState } from "react";
import { motion } from "framer-motion";
import { startOfWeek, addDays, addWeeks, isSameDay, format } from "date-fns";
import { es } from "date-fns/locale";
import type { Habit, Check } from "../domain/types";
import { dateKey, toDoneSet, periodTarget, isScheduled, scheduleAt } from "../domain/logic";
import { toggleCheck } from "../domain/actions";
import { cap, pct } from "../ui/format";
import { IconChevron, IconCheck } from "../ui/icons";
import { RadarChart } from "../ui/RadarChart";

interface Props {
  habits: Habit[];
  checks: Check[];
  now: Date;
}

export function Week({ habits, checks, now }: Props) {
  const [offset, setOffset] = useState(0);
  const done = toDoneSet(checks);
  const weekStart = startOfWeek(addWeeks(now, offset), { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Cada hábito aporta como máximo su meta (no más), para que no aparezca 6/5.
  // La meta se prorratea si el hábito no existía toda la semana (recién creado).
  const weekDone = habits.reduce((acc, h) => {
    const c = days.filter((d) => done.has(`${h.id}|${dateKey(d)}`)).length;
    return acc + Math.min(c, periodTarget(h, days));
  }, 0);
  const weekTarget = habits.reduce((a, h) => a + periodTarget(h, days), 0);
  // Ritmo DE la semana seleccionada: hábitos completados por cada día.
  const rhythm = days.map((d) => habits.filter((h) => done.has(`${h.id}|${dateKey(d)}`)).length);
  const rhythmLabels = days.map((d) => cap(format(d, "EEE", { locale: es })));

  return (
    <div className="screen">
      <div className="eyebrow">Vista semanal</div>
      <div className="row between">
        <h1 className="h1">Semana</h1>
        <div className="row gap8">
          <button className="chip" onClick={() => setOffset((o) => o - 1)}>
            <IconChevron size={16} className="dim" style={{ transform: "rotate(180deg)" }} />
          </button>
          <button className="chip" onClick={() => setOffset(0)}>
            Hoy
          </button>
          <button className="chip" onClick={() => setOffset((o) => o + 1)}>
            <IconChevron size={16} className="dim" />
          </button>
        </div>
      </div>
      <div className="muted mt8" style={{ fontSize: 13, fontWeight: 600 }}>
        {cap(format(weekStart, "d 'de' MMM", { locale: es }))} –{" "}
        {cap(format(days[6], "d 'de' MMM", { locale: es }))}
      </div>

      <div className="card mt16" style={{ padding: 16 }}>
        <div className="row between" style={{ marginBottom: 8 }}>
          <span className="eyebrow">Meta semanal</span>
          <span style={{ fontWeight: 800 }}>
            {weekDone}/{weekTarget} · {pct(weekTarget ? weekDone / weekTarget : 0)}
          </span>
        </div>
        <div className="bar">
          <motion.i
            initial={{ width: 0 }}
            animate={{ width: `${weekTarget ? Math.min(1, weekDone / weekTarget) * 100 : 0}%` }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>

      {/* Cabecera de días */}
      <div
        className="mt16"
        style={{ display: "grid", gridTemplateColumns: "34px repeat(7, 1fr)", gap: 6, alignItems: "center" }}
      >
        <span />
        {days.map((d) => {
          const today = isSameDay(d, now);
          return (
            <div key={d.toISOString()} className="stack" style={{ alignItems: "center", gap: 2 }}>
              <span className="dim" style={{ fontSize: 10, fontWeight: 700 }}>
                {cap(format(d, "EEEEE", { locale: es }))}
              </span>
              <span
                style={{
                  fontSize: 12.5,
                  fontWeight: 700,
                  width: 22,
                  height: 22,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: 8,
                  background: today ? "var(--accent)" : "transparent",
                  color: today ? "var(--accent-ink)" : "var(--text-2)",
                }}
              >
                {format(d, "d")}
              </span>
            </div>
          );
        })}
      </div>

      {/* Filas de hábitos */}
      <div className="stack mt8" style={{ gap: 6 }}>
        {habits.map((h) => {
          const count = days.filter((d) => done.has(`${h.id}|${dateKey(d)}`)).length;
          const target = periodTarget(h, days);
          const met = target > 0 && count >= target;
          const shown = Math.min(count, target); // no mostrar 6/5
          return (
            <div key={h.id} className="stack" style={{ gap: 4 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "34px repeat(7, 1fr)",
                  gap: 6,
                  alignItems: "center",
                }}
              >
                <div style={{ fontSize: 19, textAlign: "center" }} title={h.name}>
                  {h.emoji}
                </div>
                {days.map((d) => {
                  const k = `${h.id}|${dateKey(d)}`;
                  const on = done.has(k);
                  const existed = scheduleAt(h, d) !== null;
                  // El hábito todavía no existía ese día: celda vacía, no clickeable
                  // (antes se veía igual que "no programado hoy", como si hubiera
                  // existido siempre e incumplido esos días).
                  if (!existed) {
                    return (
                      <div key={k} style={{ display: "grid", placeItems: "center" }}>
                        <div
                          aria-hidden
                          style={{ width: 30, height: 30, borderRadius: "50%", opacity: 0.12, background: "var(--border)" }}
                        />
                      </div>
                    );
                  }
                  const sched = isScheduled(h, d);
                  return (
                    <div key={k} style={{ display: "grid", placeItems: "center" }}>
                      <motion.button
                        whileTap={{ scale: 0.8 }}
                        onClick={() => toggleCheck(h.id, dateKey(d))}
                        aria-label={`${h.name} · ${cap(format(d, "EEE d", { locale: es }))}`}
                        aria-pressed={on}
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: "50%",
                          display: "grid",
                          placeItems: "center",
                          background: on ? h.color : "var(--surface-2)",
                          border: sched
                            ? `1.5px solid ${on ? "transparent" : "var(--border-hi)"}`
                            : `1.5px dashed ${on ? "transparent" : "var(--border)"}`,
                          opacity: sched || on ? 1 : 0.4,
                          transition: "background 0.18s var(--ease), border-color 0.18s var(--ease)",
                        }}
                      >
                        {on && <IconCheck size={16} style={{ color: "var(--accent-ink)" }} />}
                      </motion.button>
                    </div>
                  );
                })}
              </div>
              <div className="row between" style={{ paddingLeft: 40, paddingRight: 2 }}>
                <span className="dim ellipsis" style={{ fontSize: 11.5 }}>
                  {h.name}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: met ? "var(--accent)" : "var(--text-3)",
                  }}
                >
                  {shown}/{target}
                  {count > target && (
                    <span className="dim" style={{ fontWeight: 700 }}>
                      {" "}
                      +{count - target}
                    </span>
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ritmo de la semana */}
      <div className="card mt24" style={{ padding: "18px 12px 12px" }}>
        <div className="eyebrow" style={{ paddingLeft: 6, marginBottom: 4 }}>
          Ritmo de la semana
        </div>
        {rhythm.some((v) => v > 0) ? (
          <RadarChart values={rhythm} labels={rhythmLabels} />
        ) : (
          <div className="dim" style={{ fontSize: 13, textAlign: "center", padding: "24px 0" }}>
            Marcá hábitos esta semana para ver tu ritmo por día.
          </div>
        )}
      </div>

      <div style={{ height: 12 }} />
    </div>
  );
}
