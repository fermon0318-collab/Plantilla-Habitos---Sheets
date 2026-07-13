import { useState } from "react";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameDay,
  isSameMonth,
  addMonths,
  format,
} from "date-fns";
import { es } from "date-fns/locale";
import type { Habit, Check } from "../domain/types";
import {
  dateKey,
  toDoneSet,
  dailyRate,
  monthSummary,
  treeStage,
  monthlyDailyCounts,
  LEVEL_META,
} from "../domain/logic";
import { toggleCheck } from "../domain/actions";
import { Ring } from "../ui/Ring";
import { Checkbox } from "../ui/Checkbox";
import { BottomSheet } from "../ui/Sheet";
import { LottieTree } from "../ui/LottieTree";
import { ActivityChart } from "../ui/ActivityChart";
import { fmtMonthYear, fmtLongDate, pct, cap } from "../ui/format";
import { useUI } from "../ui/uiContext";
import { THEMES } from "../hooks/useTheme";
import { IconChevron } from "../ui/icons";

interface Props {
  habits: Habit[];
  checks: Check[];
  now: Date;
}

const WD = ["L", "M", "X", "J", "V", "S", "D"];

export function Month({ habits, checks, now }: Props) {
  const { theme } = useUI();
  const t = THEMES.find((x) => x.id === theme)!;
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<Date | null>(null);
  const month = addMonths(now, offset);
  const done = toDoneSet(checks);
  const summary = monthSummary(habits, checks, month, now);
  const lvl = LEVEL_META[summary.level];
  const dailyCounts = monthlyDailyCounts(checks, month);

  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  const lead = (getDay(startOfMonth(month)) + 6) % 7; // lunes = 0

  return (
    <div className="screen">
      <div className="eyebrow">Vista mensual</div>
      <div className="row between">
        <h1 className="h1">{fmtMonthYear(month)}</h1>
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

      <div className="card mt16 row gap12 between" style={{ padding: 18, alignItems: "center" }}>
        <Ring value={summary.monthlyRate} size={96} stroke={9}>
          <div>
            <div style={{ fontSize: 21, fontWeight: 800 }}>{pct(summary.monthlyRate)}</div>
            <div className="dim" style={{ fontSize: 10, fontWeight: 600 }}>
              mensual
            </div>
          </div>
        </Ring>
        <div className="grow stack" style={{ gap: 3, alignItems: "flex-end", textAlign: "right" }}>
          <LottieTree
            key={`${theme}-${offset}-${treeStage(summary.monthlyRate)}`}
            stage={treeStage(summary.monthlyRate)}
            size={64}
            accent={t.accent}
            accentDeep={t.accentDeep}
            ink={t.ink}
          />
          <div style={{ fontWeight: 800 }}>
            Nivel {summary.level} · {lvl.name}
          </div>
          <div className="dim" style={{ fontSize: 12 }}>
            Constancia media {pct(summary.averageConstancy)}
          </div>
        </div>
      </div>

      {/* Calendario */}
      <div className="card mt16" style={{ padding: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6, marginBottom: 6 }}>
          {WD.map((d) => (
            <div key={d} className="dim" style={{ textAlign: "center", fontSize: 11, fontWeight: 700 }}>
              {d}
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6 }}>
          {Array.from({ length: lead }).map((_, i) => (
            <div key={"b" + i} />
          ))}
          {days.map((d) => {
            const rate = dailyRate(habits, done, d);
            const today = isSameDay(d, now);
            const strong = rate >= 0.6;
            return (
              <button
                key={d.toISOString()}
                onClick={() => setSelected(d)}
                style={{
                  aspectRatio: "1",
                  borderRadius: 11,
                  fontSize: 13,
                  fontWeight: 700,
                  color: strong ? "var(--accent-ink)" : today ? "var(--accent)" : "var(--text-2)",
                  background:
                    rate > 0
                      ? `color-mix(in srgb, var(--accent) ${Math.round((0.14 + rate * 0.86) * 100)}%, var(--surface-2))`
                      : "var(--surface-2)",
                  border: today ? "1.5px solid var(--accent)" : "1px solid var(--border)",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                {format(d, "d")}
              </button>
            );
          })}
        </div>
        <div className="row gap8 mt16" style={{ justifyContent: "center" }}>
          <span className="dim" style={{ fontSize: 11 }}>
            Menos
          </span>
          {[0.1, 0.35, 0.6, 0.85, 1].map((a) => (
            <span
              key={a}
              style={{
                width: 16,
                height: 16,
                borderRadius: 5,
                background: `color-mix(in srgb, var(--accent) ${Math.round((0.14 + a * 0.86) * 100)}%, var(--surface-2))`,
              }}
            />
          ))}
          <span className="dim" style={{ fontSize: 11 }}>
            Más
          </span>
        </div>
      </div>

      {/* Flujo de actividad diaria */}
      <div className="card mt16" style={{ padding: "16px 14px 10px" }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>
          Flujo de actividad diaria
        </div>
        <ActivityChart values={dailyCounts} />
      </div>

      <div style={{ height: 12 }} />

      <BottomSheet open={!!selected} onClose={() => setSelected(null)}>
        {selected && (
          <>
            <h2 className="h2" style={{ marginBottom: 2 }}>
              {fmtLongDate(selected)}
            </h2>
            <div className="dim" style={{ fontSize: 13, marginBottom: 12 }}>
              {isSameMonth(selected, month) ? "" : cap(format(selected, "MMMM", { locale: es }))}{" "}
              {pct(dailyRate(habits, done, selected))} cumplido
            </div>
            <div className="stack" style={{ gap: 8, maxHeight: 360, overflowY: "auto" }}>
              {habits.map((h) => {
                const k = dateKey(selected);
                const isDone = done.has(`${h.id}|${k}`);
                return (
                  <div key={h.id} className="card row gap12" style={{ padding: "11px 14px" }}>
                    <span style={{ fontSize: 20 }}>{h.emoji}</span>
                    <span className="grow ellipsis" style={{ fontWeight: 600, fontSize: 14 }}>
                      {h.name}
                    </span>
                    <Checkbox done={isDone} color={h.color} size={27} onToggle={() => toggleCheck(h.id, k)} />
                  </div>
                );
              })}
            </div>
          </>
        )}
      </BottomSheet>
    </div>
  );
}
